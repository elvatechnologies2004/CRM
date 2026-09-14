/**
 * STEP 123 — Shared routing types and constants.
 * Client-safe (no server-only imports) so client components can use them.
 */

export type RoutingStrategy =
  | "round_robin"
  | "least_loaded"
  | "territory"
  | "source_based"
  | "product_based"
  | "enterprise_account"
  | "weighted"
  | "vip";

export interface RoutingCondition {
  field: string;
  operator: "=" | "!=" | "in" | "not in" | ">" | "<" | ">=" | "<=";
  value: string;
}

export interface RoutingRuleRecord {
  id: string;
  name: string;
  strategy: RoutingStrategy;
  description: string | null;
  priority: number;
  is_active: boolean;
  conditions: RoutingCondition[];
  target_type: "team" | "user" | "territory" | "all";
  target_id: string | null;
  weight: number;
}

export interface RouterLead {
  id: string;
  organization_id: string;
  source: string | null;
  country: string | null;
  city: string | null;
  industry: string | null;
  company_size: string | null;
  account_type: string | null;
  interested_product: string | null;
  expected_value: number | null;
  score: number | null;
  owner_id: string | null;
  company_name: string | null;
}

const STRATEGY_LABELS: Record<RoutingStrategy, string> = {
  round_robin: "Round Robin",
  least_loaded: "Least Loaded",
  territory: "Territory",
  source_based: "Source Based",
  product_based: "Product Based",
  enterprise_account: "Enterprise Account",
  weighted: "Weighted Distribution",
  vip: "VIP Routing",
};

export const ROUTING_STRATEGIES = Object.entries(STRATEGY_LABELS).map(([value, label]) => ({ value, label }));
