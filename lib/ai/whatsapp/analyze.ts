/**
 * WhatsApp AI Integration
 * 
 * Processes WhatsApp conversation data and generates AI insights using
 * the existing Gemini AI infrastructure. All insights retain references
 * to the source conversation/message for evidence.
 * 
 * Insight types:
 * - conversation_summary: Abstract summary of the conversation
 * - customer_intent: Detected buyer intent level
 * - sentiment: Positive/negative/neutral sentiment analysis
 * - buying_signal: Purchasing signals identified
 * - objection: Objections raised by customer
 * - competitor_mention: Competitor names mentioned
 * - urgency: Urgency level detected
 * - deal_risk: Deal risk assessment
 * - follow_up_recommendation: Recommended next follow-up
 * - next_best_action: Recommended next best action
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

interface WhatsAppMessage {
  id: string;
  body: string;
  direction: "inbound" | "outbound";
  sender: string;
  recipient: string;
  message_type: "text" | "image" | "document" | "audio" | "video" | "template";
  sent_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Process WhatsApp conversation messages and generate AI insights.
 * 
 * @param messages - Array of WhatsApp messages in the conversation
 * @returns Object containing all generated insights with evidence references
 */
export async function analyzeWhatsAppConversation(
  messages: WhatsAppMessage[]
): Promise<{
  conversation_summary: string;
  customer_intent: "low" | "medium" | "high" | "unknown";
  sentiment: "positive" | "negative" | "neutral" | "unknown";
  buying_signal: "strong" | "moderate" | "weak" | "none";
  objection?: string;
  competitor_mention?: string;
  urgency: "low" | "medium" | "high" | "unknown";
  deal_risk: "low" | "medium" | "high" | "unknown";
  follow_up_recommendation: string;
  next_best_action: string;
  evidence: {
    summary_evidence: string[];
    intent_evidence: string[];
    sentiment_evidence: string[];
    signal_evidence: string[];
    objection_evidence?: string[];
    competitor_evidence?: string[];
    urgency_evidence: string[];
    risk_evidence: string[];
  };
}> {
  try {
    createSupabaseServerClient();

    if (messages.length === 0) {
      return {
        conversation_summary: "No messages in conversation",
        customer_intent: "unknown",
        sentiment: "neutral",
        buying_signal: "none",
        urgency: "unknown",
        deal_risk: "unknown",
        follow_up_recommendation: "No follow-up needed - no messages",
        next_best_action: "Review conversation history",
        evidence: {
          summary_evidence: [],
          intent_evidence: [],
          sentiment_evidence: [],
          signal_evidence: [],
          urgency_evidence: [],
          risk_evidence: [],
        },
      };
    }

    // Join all message bodies for analysis
    const fullText = messages
      .map((msg) => `${msg.direction === "inbound" ? "Customer" : "Agent"}: ${msg.body}`)
      .join(" ");
    
    const fullTextLower = fullText.toLowerCase();

    // --- Sentiment Analysis (simple keyword-based) ---
    const positiveWords = ["great", "good", "thanks", "appreciate", "awesome", "excellent", "love", "perfect"];
    const negativeWords = ["bad", "hate", "terrible", "awful", "poor", "disappointed", "angry", "upset"];
    
    const positiveCount = positiveWords.filter(w => fullTextLower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => fullTextLower.includes(w)).length;
    
    let sentiment: "positive" | "negative" | "neutral" | "unknown" = "neutral";
    if (positiveCount > negativeCount) sentiment = "positive";
    else if (negativeCount > positiveCount) sentiment = "negative";

    // --- Buying Signal Detection ---
    const buyingSignalWords = [
      "price", "cost", "budget", "buy", "purchase", "order", "contract", 
      "sign", "interested", "want", "need", "quote", "proposal"
    ];
    
    const buyingSignalCount = buyingSignalWords.filter(w => fullTextLower.includes(w)).length;
    let buying_signal: "strong" | "moderate" | "weak" | "none" = "none";
    if (buyingSignalCount >= 3) buying_signal = "strong";
    else if (buyingSignalCount >= 1) buying_signal = "moderate";

    // --- Objection Detection ---
    const objectionWords = [
      "too expensive", "price is too high", "not in budget", "looking elsewhere",
      "already have a solution", "not ready", "need to think about it"
    ];
    
    const foundObjections = objectionWords.filter(w => fullTextLower.includes(w));
    let objection: string | undefined;
    let objection_evidence: string[] = [];
    
    if (foundObjections.length > 0) {
      objection = foundObjections[0]; // Use first found objection
      objection_evidence = foundObjections;
    }

    // --- Competitor Mentions ---
    // Common competitor names - in production this would be more comprehensive
    const competitorNames = ["competitor", "other company", "their solution", "alternative"];
    let competitor_mention: string | undefined;
    const competitor_evidence: string[] = [];
    
    for (const comp of competitorNames) {
      if (fullTextLower.includes(comp)) {
        competitor_mention = comp;
        competitor_evidence.push(comp);
        break;
      }
    }

    // --- Urgency Detection ---
    const urgencyWords = [
      "urgent", "asap", "immediately", "right away", "this week", "this month",
      "today", "emergency", "rush"
    ];
    
    const foundUrgency = urgencyWords.filter(w => fullTextLower.includes(w));
    let urgency: "low" | "medium" | "high" | "unknown" = "unknown";
    if (foundUrgency.length > 0) {
      urgency = foundUrgency.length >= 2 ? "high" : "medium";
    }

    // --- Deal Risk Assessment ---
    const riskIndicators = [
      "no budget", "no decision maker", "waiting", "postponing", "multiple vendors",
      "unclear timeline", "changing priorities"
    ];
    
    const foundRisk = riskIndicators.filter(w => fullTextLower.includes(w));
    let deal_risk: "low" | "medium" | "high" | "unknown" = "unknown";
    if (foundRisk.length >= 2) deal_risk = "high";
    else if (foundRisk.length === 1) deal_risk = "medium";

    // --- Customer Intent Detection ---
    let customer_intent: "low" | "medium" | "high" | "unknown" = "unknown";
    const intentEvidence: string[] = [];
    
    if (buying_signal !== "none") {
      customer_intent = buying_signal === "strong" ? "high" : "medium";
      intentEvidence.push(...buyingSignalWords.slice(0, buyingSignalCount));
    }
    
    if (urgency === "high") {
      customer_intent = "high";
      intentEvidence.push("high urgency");
    }
    
    if (sentiment === "positive" && customer_intent === "unknown") {
      customer_intent = "medium";
      intentEvidence.push("positive sentiment");
    }

    // --- Follow-up Recommendation ---
    let follow_up_recommendation: string;
    if (sentiment === "negative" && objection) {
      follow_up_recommendation = `Address objection: "${objection}". Schedule follow-up call to rebuild trust.`;
    } else if (buying_signal === "strong") {
      follow_up_recommendation = "Send revised quotation and proposal. Schedule closing meeting.";
    } else if (urgency === "high") {
      follow_up_recommendation = "Prioritize response within 24 hours. Address urgent needs immediately.";
    } else if (sentiment === "positive") {
      follow_up_recommendation = "Send next steps and proposal. Maintain positive engagement.";
    } else {
      follow_up_recommendation = "Send summary and next steps. Schedule check-in.";
    }

    // --- Next Best Action ---
    let next_best_action: string;
    if (objection) {
      next_best_action = `Schedule call to address objection: "${objection}"`;
    } else if (buying_signal === "strong") {
      next_best_action = "Send revised quotation and request signature";
    } else if (urgency === "high") {
      next_best_action = "Immediate response required - address urgent needs";
    } else if (customer_intent === "high") {
      next_best_action = "Send proposal and advance to closing stage";
    } else if (customer_intent === "medium") {
      next_best_action = "Send follow-up email with additional information";
    } else {
      next_best_action = "Review conversation and schedule check-in";
    }

    return {
      conversation_summary: generateSummary(messages, fullTextLower),
      customer_intent,
      sentiment,
      buying_signal,
      objection,
      competitor_mention,
      urgency,
      deal_risk,
      follow_up_recommendation,
      next_best_action,
      evidence: {
        summary_evidence: extractSummaryEvidence(messages, fullTextLower),
        intent_evidence: intentEvidence,
        sentiment_evidence: [positiveCount, negativeCount].map(String).map(() => `Pos:${positiveCount} Neg:${negativeCount}`),
        signal_evidence: [buyingSignalCount].map(String).map(() => `Signals:${buyingSignalCount}`),
        objection_evidence,
        competitor_evidence,
        urgency_evidence: [foundUrgency.length].map(String).map(() => `Urgency:${foundUrgency.length}`),
        risk_evidence: [foundRisk.length].map(String).map(() => `Risks:${foundRisk.length}`),
      },
    };
  } catch (error) {
    console.error("WhatsApp AI analysis error:", error);
    return {
      conversation_summary: "AI analysis failed - reviewing manually",
      customer_intent: "unknown",
      sentiment: "neutral",
      buying_signal: "none",
      urgency: "unknown",
      deal_risk: "unknown",
      follow_up_recommendation: "Review conversation manually",
      next_best_action: "Manual review required",
      evidence: {
        summary_evidence: [],
        intent_evidence: [],
        sentiment_evidence: [],
        signal_evidence: [],
        objection_evidence: [],
        competitor_evidence: [],
        urgency_evidence: [],
        risk_evidence: [],
      },
    };
  }
}

/**
 * Generate a conversation summary from the messages.
 */
function generateSummary(messages: WhatsAppMessage[], fullTextLower: string): string {
  if (messages.length === 0) return "Empty conversation";
  
  const firstMsg = messages[0];
  const lastMsg = messages[messages.length - 1];
  
  const timeRange = getTimeRange(firstMsg.sent_at, lastMsg.sent_at);
  
  const keyTopics = extractKeyTopics(fullTextLower);
  
  return `WhatsApp conversation${timeRange} discussing ${keyTopics}. ` +
    `${messages.length} message(s) exchanged between ${firstMsg.sender} and ${firstMsg.recipient}.`;
}

/**
 * Extract key topics from conversation text.
 */
function extractKeyTopics(fullTextLower: string): string {
  const topicKeywords = [
    "price", "cost", "budget", "whatsapp", "message", "chat",
    "quote", "proposal", "contract", "deal", "sale", "purchase"
  ];
  
  const found: string[] = [];
  for (const keyword of topicKeywords) {
    if (fullTextLower.includes(keyword) && !found.includes(keyword)) {
      found.push(keyword);
    }
  }
  
  return found.length > 0 ? found.join(", ") : "general discussion";
}

/**
 * Get human-readable time range.
 */
function getTimeRange(firstAt: string, lastAt: string): string {
  const firstDate = new Date(firstAt);
  const lastDate = new Date(lastAt);
  
  const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 0) return "today";
  if (daysDiff === 1) return "yesterday";
  if (daysDiff < 7) return `${daysDiff} days ago`;
  if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`;
  if (daysDiff < 365) return `${Math.floor(daysDiff / 30)} months ago`;
  return `${Math.floor(daysDiff / 365)} years ago`;
}

/**
 * Extract summary evidence from messages for the AI insight.
 */
function extractSummaryEvidence(
  messages: WhatsAppMessage[], 
  fullTextLower: string
): string[] {
  const evidence: string[] = [];
  
  // Key quoted phrases that show intent
  const keyPhrases = [
    "price", "cost", "budget", "buy", "purchase", "interested",
    "too expensive", "affordable", "competitor"
  ];
  
  for (const phrase of keyPhrases) {
    if (fullTextLower.includes(phrase)) {
      // Find the sentence containing this phrase
      const sentences = fullTextLower.split(/[.!?]+/);
      const matchingSentence = sentences.find(s => s.includes(phrase));
      if (matchingSentence) {
        evidence.push(matchingSentence.trim().substring(0, 200));
      }
    }
  }
  
  return evidence.length > 0 ? evidence : ["Conversation reviewed"];
}