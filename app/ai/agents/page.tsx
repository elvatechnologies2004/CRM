import { AIAgentsPageClient } from "@/components/ai/agents-page-client";
import { getAiAgents } from "@/lib/crm/ai-agents";
import { isSupabaseConfigured } from "@/lib/env";

export default async function AIAgentsPage() {
  const view = await getAiAgents();
  // Always use real Supabase data; fall back to mocks only if Supabase
  // is not configured or there's no organization.  Show a helpful message
  // when no agents exist rather than silently showing demo data.
  const usesLiveData = isSupabaseConfigured() && view.agents.length > 0;
  const agents = view.agents.length > 0 ? view.agents : [];

  return <AIAgentsPageClient agents={agents} usesLiveData={usesLiveData} />;
}