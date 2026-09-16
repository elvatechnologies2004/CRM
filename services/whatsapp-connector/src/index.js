/**
 * FinloNexa WhatsApp Web Connector Service
 * 
 * An always-on Node.js service that manages WhatsApp Web connections
 * via QR code linking. Separate from Vercel serverless functions.
 * 
 * Architecture:
 *  - Express REST API for FinloNexa app consumption
 *   - whatsapp-web.js for QR-based WhatsApp Web connection
 *   - Supabase for persistent state storage
 *   - JSON Web Tokens for API authentication between services
 */

import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import qrcode from "qrcode";
import waPkg from "whatsapp-web.js";
const { Client, LocalAuth } = waPkg;
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// ============================================================
// Supabase client for state persistence
// ============================================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required");
  process.exit(1);
}

const supa = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================
// WhatsApp Client management
// ============================================================
// One WhatsApp client per organization, stored in session directories.
// The client uses whatsapp-web.js with built-in browser support.
// Session state is persisted to Supabase.

let whatsappClient = null;
let qrCode = null;
let qrTimeout = null;
// Monotonic generation counter so a stale (previous) client's QR event can
// never overwrite the QR produced by the most recent connect request.
let qrGeneration = 0;

// Session directory for whatsapp-web.js
const SESSION_DIR = "./.tmp/whatsapp-sessions";

// ============================================================
// Helper: Resolve the persisted connection row for an org
// (id + the WhatsApp account phone number configured on connect).
// ============================================================
async function getConnectionRow(organizationId) {
  const { data, error } = await supa
    .from("whatsapp_web_connections")
    .select("id, phone_number")
    .eq("organization_id", organizationId)
    .limit(1);
  if (error) {
    console.error("Error reading connection row:", error);
    return null;
  }
  return data && data.length ? data[0] : null;
}

// ============================================================
// Helper: Find an existing conversation by external chat id,
// or create it on first contact.
// ============================================================
async function findOrCreateConversation(organizationId, connectionId, externalChatId, displayName) {
  const { data: existing, error: exErr } = await supa
    .from("whatsapp_conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("connection_id", connectionId)
    .eq("external_chat_id", externalChatId)
    .limit(1);
  if (exErr) {
    console.error("Error reading conversation:", exErr);
    return null;
  }
  if (existing && existing.length) return existing[0].id;

  const { data: ins, error: insErr } = await supa
    .from("whatsapp_conversations")
    .insert({
      organization_id: organizationId,
      connection_id: connectionId,
      external_chat_id: externalChatId,
      display_name: displayName || externalChatId,
      phone_number: externalChatId,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .limit(1);
  if (insErr) {
    console.error("Error creating conversation:", insErr);
    return null;
  }
  return ins && ins.length ? ins[0].id : null;
}

// ============================================================
// Helper: Persist a message, deduping on external_message_id.
// ============================================================
async function upsertMessage({
  organizationId,
  connectionId,
  conversationId,
  externalMessageId,
  direction,
  sender,
  recipient,
  messageType,
  body,
  mediaReference,
  sentAt,
  status,
}) {
  // Dedup: skip if this WhatsApp message id was already stored
  const { data: existing, error: exErr } = await supa
    .from("whatsapp_messages")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("external_message_id", externalMessageId)
    .limit(1);
  if (exErr) {
    console.error("Error dedup-checking message:", exErr);
    return null;
  }
  if (existing && existing.length) return existing[0].id;

  const { data: ins, error: insErr } = await supa
    .from("whatsapp_messages")
    .insert({
      organization_id: organizationId,
      connection_id: connectionId,
      conversation_id: conversationId,
      external_message_id: externalMessageId,
      direction,
      sender,
      recipient,
      message_type: messageType,
      body,
      media_reference: mediaReference || null,
      sent_at: sentAt || new Date().toISOString(),
      status: status || "sent",
    })
    .select("id")
    .limit(1);
  if (insErr) {
    console.error("Error inserting message:", insErr);
    return null;
  }

  // Touch the conversation so inbox ordering reflects latest activity
  try {
    await supa
      .from("whatsapp_conversations")
      .update({ last_message_at: sentAt || new Date().toISOString() })
      .eq("id", conversationId);
  } catch (err) {
    console.error("Error touching conversation:", err);
  }

  return ins && ins.length ? ins[0].id : null;
}

// Ensure session directory exists (handled by the library)

// ============================================================
// Helper: Generate a unique session ID per connection request
// ============================================================
function generateSessionId() {
  return `wa_${Math.random().toString(36).substring(2, 9)}`;
}

// Stable per-org session identifier so restarts reuse the authenticated profile
function getSessionId(organizationId) {
  return `wa_${organizationId.split("-")[0]}`;
}

// Wipe the locally-persisted LocalAuth session for a session id.
// This forces wwwjs to generate a factory-fresh QR next connect,
// even if the previous session was still authenticated.
function clearLocalAuthSession(clientId) {
  const sessionPath = path.join(SESSION_DIR, clientId);
  try {
    if (sessionPath.startsWith(path.resolve(SESSION_DIR))) {
      rmSync(sessionPath, { recursive: true, force: true });
      console.log(`[SESSION] Cleared LocalAuth session folder for ${clientId}`);
    }
  } catch (err) {
    console.error("Error clearing LocalAuth session folder:", err);
  }
}

// ============================================================
// Helper: Save connection state to Supabase
// ============================================================
async function saveConnectionState(organizationId, state, data = {}) {
  try {
    const { error } = await supa
      .from("whatsapp_web_connections")
      .upsert(
        {
          organization_id: organizationId,
          status: state.status,
          phone_number: state.phone_number || "",
          display_name: state.display_name || "",
          connection_type: state.connection_type || "WHATSAPP_WEB",
          session_reference: state.session_reference || "",
          last_connected_at: state.last_connected_at,
          last_disconnected_at: state.last_disconnected_at,
          last_sync_at: state.last_sync_at,
          ...data,
        },
        { onConflict: "organization_id" }
      );

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error saving connection state:", err);
    return null;
  }
}

// ============================================================
// Helper: Clear connection state for an organization
// ============================================================
async function clearConnectionState(organizationId) {
  try {
    const { error } = await supa
      .from("whatsapp_web_connections")
      .delete()
      .eq("organization_id", organizationId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error clearing connection state:", err);
    return false;
  }
}

// Resolve which organization this connector instance serves.
// Precedence: explicit body/query orgId > DEFAULT_ORGANIZATION_ID env > latest DB row.
async function resolveOrganizationId(requested) {
  if (requested) return requested;
  if (process.env.DEFAULT_ORGANIZATION_ID) return process.env.DEFAULT_ORGANIZATION_ID;

  const { data, error } = await supa
    .from("whatsapp_web_connections")
    .select("organization_id")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? data[0].organization_id : null;
}

// ==========================================================//
// API Routes
// ============================================================

// GET /api/health - Health check
app.get("/api/health", async (req, res) => {
  try {
    // Verify Supabase connectivity
    const { error } = await supa.from("whatsapp_web_connections").select("count").limit(1);

    if (error) {
      return res.status(503).json({
        status: "error",
        message: "Supabase connectivity check failed",
      });
    }

    // Check current connection state
    const { data: connections, error: connError } = await supa
      .from("whatsapp_web_connections")
      .select("*")
      .limit(1);

    if (connError) {
      return res.status(200).json({
        status: "ok",
        connected: false,
        qrRequired: true,
        message: "Service operational, no active connection",
      });
    }

    if (connections && connections.length > 0) {
      const conn = connections[0];
      return res.status(200).json({
        status: conn.status || "disconnected",
        connected: conn.status === "connected",
        qrRequired: false,
        phone_number: conn.phone_number,
        last_connected_at: conn.last_connected_at,
        last_sync_at: conn.last_sync_at,
        session_reference: conn.session_reference,
        message: conn.status === "connected" ? "WhatsApp is connected" : "No active connection",
      });
    }

    return res.status(200).json({
      status: "ok",
      connected: false,
      qrRequired: true,
      message: "Service operational, no active connection",
    });
  } catch (err) {
    console.error("Health check error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// GET /api/integrations/whatsapp/connection - Get connection status
app.get("/api/integrations/whatsapp/connection", async (req, res) => {
  try {
    let organizationId = await resolveOrganizationId(req.query.organizationId);
    if (!organizationId) {
      return res.json({
        status: "disconnected",
        connected: false,
        qr_required: true,
        qr_data_url: qrCode ? qrCode.image : undefined,
        expiration: qrCode ? qrCode.expiresAt : undefined,
      });
    }

    const { data: connections, error } = await supa
      .from("whatsapp_web_connections")
      .select("*")
      .eq("organization_id", organizationId)
      .limit(1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (connections && connections.length > 0) {
      const conn = connections[0];
      return res.json({
        status: conn.status || "disconnected",
        connected: conn.status === "connected",
        phone_number: conn.phone_number,
        display_name: conn.display_name,
        last_connected_at: conn.last_connected_at,
        last_sync_at: conn.last_sync_at,
        qr_required: conn.status !== "connected",
        qr_data_url: qrCode ? qrCode.image : undefined,
        expiration: qrCode ? qrCode.expiresAt : undefined,
      });
    }

    res.json({
      status: "disconnected",
      connected: false,
      qr_required: true,
      qr_data_url: qrCode ? qrCode.image : undefined,
      expiration: qrCode ? qrCode.expiresAt : undefined,
    });
  } catch (err) {
    console.error("Get connection error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/integrations/whatsapp/connect - Request QR code generation
app.post("/api/integrations/whatsapp/connect", async (req, res) => {
  try {
    const organizationId = await resolveOrganizationId(req.body.organizationId || req.query.organizationId);

    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" });
    }

    // If there's an existing connection, clear it first
    await clearConnectionState(organizationId);

    // Immediately invalidate any stale QR in memory so the frontend
    // never sees a leftover QR while a fresh one is being generated.
    qrCode = null;

    // Bump the generation token: QR/authenticated events fired by an older,
    // destroyed client must never overwrite the state produced by this one.
    const generation = ++qrGeneration;

    // Generate a unique session ID
    const sessionId = getSessionId(organizationId);

    // Immediately record a "connecting" state so callers can poll for progress
    await saveConnectionState(organizationId, {
      status: "connecting",
      connection_type: "WHATSAPP_WEB",
      session_reference: sessionId,
      last_sync_at: new Date().toISOString(),
    });

    // Create a new WhatsApp Web client for this session
    // If a client already exists, destroy it first
    if (whatsappClient) {
      await whatsappClient.destroy();
      whatsappClient = null;
    }

    // Create new client with local auth (QR-based)
    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionId,
        dataPath: `${SESSION_DIR}/${sessionId}`,
      }),
      authTimeoutMs: 90000,
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
        executablePath: process.env.CHROME_EXECUTABLE_PATH || undefined,
      },
      // Configure the client to use a headless browser via Puppeteer
      // In production, ensure Puppeteer is available or use a browser instance
      // skipAuth: true, // For testing only - removes QR requirement
    });

    // Event: QR code generated
    whatsappClient.on("qr", async (qr) => {
      try {
        // Ignore QR events produced by a destroyed/stale client from an
        // older connect request — only the latest generation may publish.
        if (generation !== qrGeneration) return;
        // Generate QR code image from the base64 string
        const qrImage = await qrcode.toDataURL(qr, { scale: 8 });
        qrCode = {
          image: qrImage,
          sessionId,
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
        };

        // Save QR session reference
        await saveConnectionState(organizationId, {
          status: "connecting",
          connection_type: "WHATSAPP_WEB",
          session_reference: sessionId,
          last_sync_at: new Date().toISOString(),
        });

        console.log(`QR generated for organization ${organizationId}, session ${sessionId}`);
      } catch (err) {
        console.error("Error generating QR:", err);
      }
    });

    // Event: Authentication successful (user scanned QR)
    whatsappClient.on("authenticated", async () => {
      try {
        // Ignore events from a stale (previous) client of an older generation.
        if (generation !== qrGeneration) return;

        console.log(`WhatsApp authenticated for organization ${organizationId}`);

        const user = whatsappClient.info?.user || {};
        const phoneNumber = user.phoneNumber || whatsappClient.info?.wid?.user || "";

        // Save the session state
        await saveConnectionState(organizationId, {
          status: "connected",
          phone_number: String(phoneNumber || ""),
          display_name: whatsappClient.info?.pushname || whatsappClient.info?.user?.name || "WhatsApp User",
          connection_type: "WHATSAPP_WEB",
          session_reference: sessionId,
          last_connected_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        });

        // Fetch or create conversation data
        // ... (will be handled on message events)

        console.log(`WhatsApp connected for organization ${organizationId}: ${phoneNumber}`);
      } catch (err) {
        console.error("Error handling authentication:", err);
      }
    });

    // Event: New message created (inbound or outbound echo)
    whatsappClient.on("message_create", async (msg) => {
      try {
        // Ignore events from a stale superseded client — only the latest
        // generation may write messages (see generation-token guard above).
        if (generation !== qrGeneration) return;

        // Resolve the persisted connection row (connection id + registered
        // WhatsApp number) used for direction and conversation mapping.
        const conn = await getConnectionRow(organizationId);
        if (!conn) return;

        // Determine the remote (peer) party and direction.
        const isOutboundEcho = !!msg.fromMe;
        const remoteJid = isOutboundEcho ? msg.to : msg.from;
        if (!remoteJid) return;
        const remotePhone = String(remoteJid).replace(/@[^@]*$/, "").trim();
        const localPhone = String(conn.phone_number || "").replace(/@[^@]*$/, "").trim();

        // Map whatsapp-web.js message type -> our message_type vocabulary.
        const typeMap = {
          chat: "text", text: "text", image: "image", document: "document",
          audio: "audio", video: "video", ptt: "audio", sticker: "image",
          template: "template",
        };
        const messageType = typeMap[msg.type] || "text";

        // Body: plain text for chat/text; placeholder for media attachments.
        const body = msg.type === "chat" || msg.type === "text"
          ? (msg.body || "")
          : `[${msg.type || "media"}]`;

        const conversationId = await findOrCreateConversation(
          organizationId,
          conn.id,
          remotePhone,
          msg.chat?.name || msg.notifyName || remotePhone
        );
        if (!conversationId) return;

        // Dedup by external message id -> persist (or skip if already stored)
        await upsertMessage({
          organizationId,
          connectionId: conn.id,
          conversationId,
          externalMessageId: msg.id._serialized || msg.id.id || `wa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          direction: isOutboundEcho ? "outbound" : "inbound",
          sender: isOutboundEcho ? localPhone : remotePhone,
          recipient: isOutboundEcho ? remotePhone : localPhone,
          messageType,
          body,
          mediaReference: msg.hasMedia ? `wa-media:${msg.id._serialized}` : null,
          sentAt: new Date((msg.timestamp || Date.now() / 1000) * 1000).toISOString(),
          status: isOutboundEcho ? "sent" : "delivered",
        });
      } catch (err) {
        console.error("Error syncing inbound message:", err);
      }
    });

    // Event: Client is ready (connection established)
    whatsappClient.on("ready", async () => {
      try {
        // Ignore a stale client that was superseded by a newer generation —
        // its "ready" must never mark the fresh session as connected.
        if (generation !== qrGeneration) return;

        console.log(`WhatsApp client ready for organization ${organizationId}`);

        // Update status to connected
        await saveConnectionState(organizationId, {
          status: "connected",
          connection_type: "WHATSAPP_WEB",
          session_reference: sessionId,
          last_connected_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error handling ready event:", err);
      }
    });

    // Event: Phone-side logout (user unlinked the device or logged out remotely)
    whatsappClient.on("logout", async () => {
      console.log(`WhatsApp logged out from phone for organization ${organizationId}`);

      // Wipe the persisted session so the next connect forces a fresh QR.
      // Defer it: whatsapp-web.js's own LocalAuth.logout() is unlinking these
      // same files in THIS tick — wiping synchronously here races the library
      // on Windows and aborts the process with EBUSY (resource busy/locked).
      setTimeout(() => {
        try {
          clearLocalAuthSession(sessionId);
        } catch (err) {
          console.error("Error wiping session folder after logout:", err);
        }
      }, 2000);

      // Clear QR display
      qrCode = null;

      // Update DB to disconnected
      await saveConnectionState(organizationId, {
        status: "disconnected",
        last_disconnected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      });
    });

    // Event: Client closed (connection lost or destroyed)
    whatsappClient.on("closed", async () => {
      try {
        await saveConnectionState(organizationId, {
          status: "disconnected",
          last_disconnected_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error handling closed event:", err);
      }
    });

    // Event: Error handling
    whatsappClient.on("error", (error) => {
      console.error(`WhatsApp error for organization ${organizationId}:`, error);

      // Update status to error
      if (whatsappClient && whatsappClient.info && whatsappClient.info.isConnected === false) {
        saveConnectionState(organizationId, {
          status: "error",
          last_disconnected_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        }).catch(e => console.error("Error saving error state:", e));
      }
    });

    // Event: Timeout (QR code expired)
    whatsappClient.on("timeout", (time) => {
      console.log(`WhatsApp QR timeout for organization ${organizationId} after ${time}ms`);
      qrCode = null; // Clear the QR code
      // Update status to show QR expired
      saveConnectionState(organizationId, {
        status: "error",
        message: "QR code expired",
        last_disconnected_at: new Date().toISOString(),
      }).catch(e => console.error("Error saving timeout state:", e));
    });

    // Start the WhatsApp client (initiates QR generation)
    console.log(`[DEBUG] Calling whatsappClient.initialize() for org ${organizationId}...`);
    whatsappClient.on("loading_screen", (percent, message) => console.log(`[DEBUG] loading_screen ${percent}% ${message}`));
    whatsappClient.on("authenticated", () => console.log(`[DEBUG] AUTHENTICATED for org ${organizationId}`));
    whatsappClient.on("ready", () => console.log(`[DEBUG] READY for org ${organizationId}`));
    whatsappClient.initialize()
      .then(() => console.log(`[DEBUG] whatsappClient.initialize() resolved for org ${organizationId}`))
      .catch((err) => console.error(`Client initialize error for organization ${organizationId}:`, err?.message || err));
    console.log(`[DEBUG] initialize() fired, waiting 3s...`);

    // Wait for the client to initialize and emit events
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // The client will start scanning for the QR code automatically
    // when it connects to the WhatsApp network

    // Return the QR code to the caller
    if (qrCode) {
      return res.json({
        status: "generating",
        qr_code: qrCode.qr_source || qrCode.image,
        qr_data_url: qrCode.image,
        expiration: qrCode.expiresAt,
        phone_number: "",
        message: "QR code generated. Scan with WhatsApp.",
      });
    }

    // If we get here, the client is initializing - return acceptance
    return res.json({
      status: "pending",
      qr_data_url: qrCode ? qrCode.image : undefined,
      expiration: qrCode ? qrCode.expiresAt : undefined,
      message: "WhatsApp connection request accepted. QR code will be generated shortly.",
    });

  } catch (err) {
    console.error("Error in connect endpoint:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/integrations/whatsapp/qr - Get QR code image
app.get("/api/integrations/whatsapp/qr", async (req, res) => {
  try {
    if (!qrCode) {
      return res.status(404).json({ error: "No QR code available. Request a connection first." });
    }

    // Return the QR code as a decoded PNG image
    const base64 = qrCode.image.replace(/^data:image\/png;base64,/, "");
    res.set("Content-Type", "image/png");
    res.send(Buffer.from(base64, "base64"));
  } catch (err) {
    console.error("Get QR error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/integrations/whatsapp/disconnect - Disconnect WhatsApp
app.post("/api/integrations/whatsapp/disconnect", async (req, res) => {
  try {
    const organizationId = await resolveOrganizationId(req.body.organizationId || req.query.organizationId);

    if (!organizationId) {
      return res.status(400).json({ error: "organizationId is required" });
    }

    // Leave the QR flow if in progress
    if (qrCode) {
      qrCode = null;
    }

    // Destroy the client if it exists
    if (whatsappClient) {
      await whatsappClient.destroy();
      whatsappClient = null;
    }

    // Wipe the persisted session folder so the next connect forces a fresh QR
    const sessionIdToWipe = getSessionId(organizationId);
    if (sessionIdToWipe) {
      clearLocalAuthSession(sessionIdToWipe);
    }

    // Clear connection state
    await clearConnectionState(organizationId);

    res.json({
      status: "success",
      message: "WhatsApp disconnected successfully",
    });
  } catch (err) {
    console.error("Error disconnecting WhatsApp:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Start the server
// ============================================================

// Outbound message route — send a WhatsApp text/media message on behalf
// of an organization via its active connection, then mirror the message
// back to the CRM store (dedup-safe on external_message_id).
app.post("/api/integrations/whatsapp/messages", async (req, res) => {
  try {
    const organizationId = await resolveOrganizationId(req.body.organizationId || req.query.organizationId);
    if (!organizationId) return res.status(400).json({ error: "organizationId is required" });

    const conn = await getConnectionRow(organizationId);
    if (!conn || !whatsappClient) {
      return res.status(409).json({ error: "WhatsApp is not connected. Start /connect first." });
    }

    const { phone, text, mediaUrl, messageType } = req.body || {};
    if (!phone) return res.status(400).json({ error: "phone is required (E.164)" });

    const targetPhone = String(phone).replace(/[^+\d]/g, "");
    const jid = `${targetPhone}@c.us`;

    const sent = await whatsappClient.sendMessage(jid, text || "");
    if (!sent) throw new Error("sendMessage returned no receipt");

    const externalMessageId =
      sent.id?._serialized ||
      sent.id?.id ||
      `wa_out_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const recipientPhone = getLocalPhone(conn);

    const conversationId = await findOrCreateConversation(
      organizationId,
      conn.id,
      targetPhone,
      targetPhone,
      targetPhone
    );
    if (conversationId) {
      await upsertMessage({
        organizationId,
        connectionId: conn.id,
        conversationId,
        externalMessageId,
        direction: "outbound",
        sender: recipientPhone,
        recipient: targetPhone,
        messageType: messageType || "text",
        body: text || "",
        mediaReference: mediaUrl || "",
        sentAt: new Date().toISOString(),
        status: "sent",
      });
    }

    res.json({
      status: "sent",
      external_message_id: externalMessageId,
      to: targetPhone,
      message: "Message sent successfully",
    });
  } catch (err) {
    console.error("Error sending WhatsApp message:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`WhatsApp Connector Service running on port ${PORT}`);

  // Initialize the WhatsApp client if not already running
  // This allows the service to be ready to accept connection requests
  if (!whatsappClient) {
    console.log("WhatsApp client not yet initialized - will be created on first connect request");
  }

  // Verify Supabase connectivity
  try {
    const { error } = await supa.from("whatsapp_web_connections").select("count").limit(1);
    if (error) {
      console.warn("Warning: Supabase connectivity issue:", error.message);
    } else {
      console.log("Supabase connectivity verified");
    }
  } catch (err) {
    console.error("Supabase connection error:", err);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  if (whatsappClient) {
    await whatsappClient.destroy();
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received. Shutting down gracefully...");
  if (whatsappClient) {
    await whatsappClient.destroy();
  }
  process.exit(0);
});

// Crash resilience: log instead of silently dying on unhandled errors
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});