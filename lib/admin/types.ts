import "server-only";

export type PlatformRole =
  | "super_admin"
  | "platform_admin"
  | "support_admin"
  | "billing_admin"
  | "viewer";

export type PlatformAdminStatus = "active" | "deactivated";

export interface PlatformAdminRecord {
  id: string;
  user_id: string;
  role: PlatformRole;
  status: PlatformAdminStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformAdminUser extends PlatformAdminRecord {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface PlatformAdminContext {
  recordId: string;
  userId: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: PlatformRole;
  permissions: string[];
}

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string | null;
  country: string | null;
  timezone: string | null;
  default_currency: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface OrgWithMeta extends OrganizationRow {
  ownerName: string | null;
  ownerEmail: string | null;
  memberCount: number;
  planName: string | null;
  planCode: string | null;
  status: "active" | "trial" | "paid" | "suspended";
  subscriptionStatus: string | null;
  lastActiveAt: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}