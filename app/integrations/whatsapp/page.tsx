"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/crm/toast";
import { Loader2, CheckCircle, XCircle, RefreshCw, Phone } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const WHATSAPP_CONNECTOR_API = process.env.WHATSAPP_CONNECTOR_URL || "http://localhost:3001";

type ConnectionState =
  | "disconnected"
  | "connecting"
  | "qr_ready"
  | "connected"
  | "error";

type StatusState = {
  state: ConnectionState;
  phoneNumber?: string;
  qrDataUrl?: string;
  expiration?: string;
  error?: string;
};

type WhatsAppHookReturn = {
  status: StatusState;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  loadingQr: boolean;
  fetching: boolean;
  connectWhatsApp: () => Promise<void>;
  disconnectWhatsApp: () => Promise<void>;
  refreshQr: () => Promise<void>;
};

function useWhatsAppConnection(): WhatsAppHookReturn {
  const currentUser = useCurrentUser();
  const orgId = currentUser?.organizationId;
  const [status, setStatus] = useState<StatusState>({
    state: "disconnected",
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchConnectionStatus = async () => {
    try {
      const res = await fetch(
        `${WHATSAPP_CONNECTOR_API}/api/integrations/whatsapp/connection?organizationId=${orgId ?? ""}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch connection status");
      const data = await res.json();
      setStatus({
        state:
          data.status === "connected"
            ? "connected"
            : data.qr_required
              ? "qr_ready"
              : "disconnected",
        phoneNumber: data.phone_number,
        qrDataUrl: data.qr_data_url,
        expiration: data.expiration,
        error: data.error,
      });
    } catch (err) {
      console.error("Failed to fetch connection status:", err);
      setStatus({
        state: "error",
        error: "Unable to reach WhatsApp connector service",
      });
      setToastMessage("Unable to reach WhatsApp connector service");
    }
  };

  const connectWhatsApp = async () => {
    setStatus((prev) => ({ ...prev, state: "connecting" }));
    setFetching(true);
    try {
      const res = await fetch(`${WHATSAPP_CONNECTOR_API}/api/integrations/whatsapp/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          credentials: "include",
        },
        body: JSON.stringify({ organizationId: orgId || undefined }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to start connection");
      }
      const data = await res.json();
      setStatus({
        state: "qr_ready",
        qrDataUrl: data.qr_data_url,
        expiration: data.expiration,
        phoneNumber: data.phone_number,
      });
    } catch (err) {
      console.error("Connection error:", err);
      setStatus({
        state: "error",
        error: err instanceof Error ? err.message : "Failed to start WhatsApp connection",
      });
      setToastMessage(err instanceof Error ? err.message : "Failed to start connection");
    } finally {
      setFetching(false);
    }
  };

  const disconnectWhatsApp = async () => {
    setStatus((prev) => ({ ...prev, state: "disconnected" }));
    try {
      await fetch(`${WHATSAPP_CONNECTOR_API}/api/integrations/whatsapp/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          credentials: "include",
        },
        body: JSON.stringify({ organizationId: orgId || undefined }),
      });
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      fetchConnectionStatus();
    }
  };

  const refreshQr = async () => {
    setLoadingQr(true);
    setFetching(true);
    try {
      const res = await fetch(`${WHATSAPP_CONNECTOR_API}/api/integrations/whatsapp/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          credentials: "include",
        },
        body: JSON.stringify({ organizationId: orgId || undefined }),
      });
      if (!res.ok) throw new Error("Failed to refresh QR");
      const data = await res.json();
      setStatus({
        state: "qr_ready",
        qrDataUrl: data.qr_data_url,
        expiration: data.expiration,
      });
    } catch (err) {
      console.error("QR refresh error:", err);
      setStatus({
        state: "error",
        error: "Failed to refresh QR code",
      });
      setToastMessage("Failed to refresh QR code");
    } finally {
      setLoadingQr(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  // Poll while connecting or waiting for/scanned QR so status stays fresh
  useEffect(() => {
    if (status.state !== "connecting" && status.state !== "qr_ready") return;
    const id = setInterval(async () => {
      await fetchConnectionStatus();
    }, 5000);
    return () => clearInterval(id);
  }, [status.state]);

  return {
    status,
    toastMessage,
    setToastMessage,
    loadingQr,
    fetching,
    connectWhatsApp,
    disconnectWhatsApp,
    refreshQr,
  } as WhatsAppHookReturn;
}

export default function WhatsAppSettingsPage() {
  const {
    status,
    toastMessage,
    setToastMessage,
    loadingQr,
    fetching,
    connectWhatsApp,
    disconnectWhatsApp,
    refreshQr,
  } = useWhatsAppConnection() as WhatsAppHookReturn;
  const router = useRouter();

  // Error state
  if (status.state === "error") {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">WhatsApp Connection Error</h2>
        <p className="text-muted-foreground mb-4">
          {status.error || "Unknown error occurred"}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            router.push("/integrations/whatsapp");
          }}
        >
          Retry Connection
        </Button>
      </Card>
    );
  }

  // Connected state
  if (status.state === "connected") {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">WhatsApp Connected</h2>
        <div className="flex items-center mb-4">
          <Phone className="h-5 w-5 text-green-600 mr-3" />
          <span className="font-medium text-ink">
            {status.phoneNumber || "WhatsApp Account"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Phone Number</p>
            <p className="font-medium">{status.phoneNumber || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">Connected</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Last Synced</p>
          <p className="font-medium">Just now</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Disconnect WhatsApp
            </Button>
          </DialogTrigger>
          <DialogContent>
            <p>Are you sure you want to disconnect WhatsApp?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This will stop message synchronization. Conversation history will be preserved.
            </p>
            <DialogFooter className="justify-end">
              <Button variant="secondary" onClick={() => router.push("/integrations/whatsapp")}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  disconnectWhatsApp();
                  router.push("/integrations/whatsapp");
                }}
                variant="destructive"
              >
                Disconnect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  // QR READY state
  if (status.state === "qr_ready") {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Connect WhatsApp</h2>
        <p className="text-muted-foreground mb-6">
          Link your WhatsApp account to FinloNexa.
        </p>

        <div className="mb-6 flex justify-center">
          <div
            className={cn(
              "relative",
              "rounded-lg",
              "border",
              "border-border",
              "bg-card",
              "overflow-hidden",
              status.qrDataUrl ? { backgroundImage: `url('${status.qrDataUrl}')` } : undefined
            )}
            style={{ width: 1000, height: 1000, maxWidth: "100%" }}
          >
            {status.qrDataUrl ? (
              <img
                src={status.qrDataUrl}
                alt="WhatsApp QR Code"
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: "contain" }}
              />
            ) : (
              <div
                className="flex h-64 w-64 items-center justify-center rounded-lg border-dashed border-border border-opacity-50 flex-col text-muted-foreground"
              >
                <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                <span>QR Code will appear here</span>
              </div>
            )}
          </div>

          {status.expiration && (
            <p className="mt-2 text-xs text-danger">
              Expires in: {status.expiration}
            </p>
          )}
        </div>

        <div className="mb-6 p-4 rounded-lg border border-border bg-muted/50">
          <Phone className="h-5 w-5 text-green-500 mb-2 flex-shrink-0" />
          <div>
            <p className="font-medium text-ink">Scan QR code with WhatsApp</p>
            <p className="text-sm text-muted-foreground">
              1. Open WhatsApp on your phone<br />
              2. Go to Linked Devices<br />
              3. Tap "Link a Device"<br />
              4. Scan the QR code above
            </p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/integrations/whatsapp")}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={() => connectWhatsApp()}
            disabled={fetching}
            size="sm"
          >
            Connect WhatsApp
          </Button>
        </div>

        {toastMessage && (
          <Toast message={toastMessage} />
        )}
        {status.error && <p className="mt-2 text-sm text-danger">{status.error}</p>}
      </Card>
    );
  }

  // NOT CONNECTED state
  if (status.state === "disconnected") {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Connect WhatsApp</h2>
        <p className="text-muted-foreground mb-6">
          Connect your WhatsApp account to FinloNexa to enable two-way messaging,
          customer 360 integration, and AI-powered insights.
        </p>

        <div className="text-center">
          <Phone className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <Button
            onClick={() => connectWhatsApp()}
            size="lg"
            variant="default"
          >
            Connect WhatsApp
          </Button>
        </div>

        <div className="mt-6 p-4 rounded-lg border border-border bg-muted/50">
          <p className="text-sm text-muted-foreground">
            WhatsApp Web integration (experimental). Your WhatsApp data is stored
            securely and tied to your organization. No messages are sent automatically
            — human approval is required for AI-generated replies.
          </p>
        </div>
      </Card>
    );
  }

  return null;
}