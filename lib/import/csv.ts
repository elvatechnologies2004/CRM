import "server-only";

import { getActiveOrgId } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Lead / contact CSV import (Phase 8).
 *
 * Accepts a CSV string (client uploads raw text or file→text), parses
 * headers, maps to DB columns, validates required fields, and inserts
 * in batches. Returns a structured import report. Errors are per-row and
 * never abort the whole file.
 */

export type CsvImportRow = Record<string, string>;

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
  total: number;
}

/** Parse CSV with quoted-field support (RFC-compatible subset). */
export function parseCsv(text: string): CsvImportRow[] {
  const rows: CsvImportRow[] = [];
  const [headerLine, ...dataLines] = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (!headerLine) return rows;
  const headers = tokenizeCsvLine(headerLine).map((h) => h.trim().toLowerCase());

  for (const line of dataLines) {
    const values = tokenizeCsvLine(line);
    if (values.length === 0) continue;
    const row: CsvImportRow = {};
    headers.forEach((header, i) => {
      row[header] = (values[i] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

/** Tokenize one CSV line honoring double-quote wrapping and escaped quotes. */
function tokenizeCsvLine(line: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      tokens.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  tokens.push(current);
  return tokens;
}

// Acceptable header aliases -> canonical lead column.
const HEADER_ALIASES: Record<string, keyof LeadImportValues> = {
  firstname: "first_name",
  "first name": "first_name",
  first: "first_name",
  lastname: "last_name",
  "last name": "last_name",
  last: "last_name",
  name: "full_name",
  "full name": "full_name",
  email: "email",
  "phone number": "phone",
  phone: "phone",
  whatsapp: "whatsapp",
  company: "company_name",
  "company name": "company_name",
  organization: "company_name",
  "job title": "job_title",
  title: "job_title",
  country: "country",
  city: "city",
  source: "source",
  score: "score",
  "expected value": "expected_value",
  budget: "budget",
  "interested product": "interested_product",
  tags: "tags",
  owner: "owner_email",
  "owner email": "owner_email",
  notes: "notes",
};

interface LeadImportValues {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  company_name?: string;
  job_title?: string;
  country?: string;
  city?: string;
  source?: string;
  score?: string;
  expected_value?: string;
  budget?: string;
  interested_product?: string;
  tags?: string;
  owner_email?: string;
  notes?: string;
}

const KNOWN_SOURCES = [
  "Web", "Referral", "Social Media", "Cold Call", "Email Campaign", "Partner", "Event", "Other",
];
const DEFAULT_SOURCE = "Other";

export interface ImportLeadsParams {
  csv: string;
  /** Optional: assign leads to a specific email's user instead of self. */
  importOwnerEmail?: string;
}

export async function importLeads(params: ImportLeadsParams): Promise<CsvImportResult> {
  const result: CsvImportResult = { imported: 0, skipped: 0, errors: [], total: 0 };
  if (!isSupabaseConfigured()) {
    return { imported: 0, skipped: 0, errors: [{ row: 0, reason: "Supabase is not configured" }], total: 0 };
  }

  const supabase = await createSupabaseServerClient();
  const orgId = await getActiveOrgId(supabase);
  if (!orgId) return { ...result, errors: [{ row: 0, reason: "No active workspace" }] };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...result, errors: [{ row: 0, reason: "Not authenticated" }] };

  // Owner resolution: default to the importing user; allow a specific email.
  const ownerId = await resolveOwnerId(supabase, orgId, params.importOwnerEmail ?? user.email ?? "");
  if (!ownerId) {
    return { ...result, errors: [{ row: 0, reason: "Could not resolve the importing owner" }] };
  }

  const rows = parseCsv(params.csv);
  result.total = rows.length;

  // Validate known headers up-front once.
  const unknownHeaders = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!(normalizeHeader(key) in HEADER_ALIASES) && !(key in HEADER_ALIASES)) {
        unknownHeaders.add(key);
      }
    }
  }
  if (unknownHeaders.size > 0) {
    // Accept unknown columns but ignore them; include one warning.
    result.errors.push({ row: 0, reason: `Ignored unknown column(s): ${Array.from(unknownHeaders).slice(0, 5).join(", ")}` });
  }

  const BATCH = 50;
  for (let start = 0; start < rows.length; start += BATCH) {
    const batch = rows.slice(start, start + BATCH);
    const inserts: Record<string, unknown>[] = [];
    let rowIndex = start;

    for (const row of batch) {
      rowIndex += 1;
      const mapped = mapRow(row, orgId, ownerId);
      const errors = validateRow(mapped, rowIndex);
      if (errors.length > 0) {
        result.errors.push(...errors.map((reason) => ({ row: rowIndex, reason })));
        result.skipped += 1;
        continue;
      }
      inserts.push(mapped);
    }

    if (inserts.length === 0) continue;
    const { error } = await supabase.from("leads").insert(inserts).select("id");
    if (error) {
      result.errors.push({ row: rowIndex - batch.length + 1, reason: error.message });
      result.skipped += batch.length;
    } else {
      result.imported += inserts.length;
    }
  }

  return result;
}

function normalizeHeader(key: string): string {
  return key.trim().toLowerCase().replace(/_/g, " ");
}

function mapRow(row: CsvImportRow, orgId: string, ownerId: string): Record<string, unknown> {
  const mapped: Partial<LeadImportValues> = {};
  for (const [rawKey, value] of Object.entries(row)) {
    const key = normalizeHeader(rawKey);
    const canonical = HEADER_ALIASES[key] ?? HEADER_ALIASES[rawKey.toLowerCase()];
    if (canonical && value !== "") {
      (mapped as Record<string, string>)[canonical] = value;
    }
  }

  const firstName = mapped.first_name ?? "";
  const lastName = mapped.last_name ?? "";
  const fullName = mapped.full_name ?? `${firstName} ${lastName}`.trim();

  return {
    organization_id: orgId,
    first_name: firstName || null,
    last_name: lastName || null,
    full_name: fullName || null,
    email: mapped.email || null,
    phone: mapped.phone || null,
    whatsapp: mapped.whatsapp || null,
    company_name: mapped.company_name || null,
    job_title: mapped.job_title || null,
    country: mapped.country || null,
    city: mapped.city || null,
    source: KNOWN_SOURCES.includes(mapped.source ?? "") ? mapped.source : DEFAULT_SOURCE,
    score: mapped.score && !Number.isNaN(Number(mapped.score)) ? Math.max(0, Math.min(100, Number(mapped.score))) : 0,
    expected_value:
      mapped.expected_value && !Number.isNaN(Number(mapped.expected_value))
        ? Math.max(0, Number(mapped.expected_value))
        : null,
    budget: mapped.budget || null,
    interested_product: mapped.interested_product || null,
    tags: mapped.tags ? mapped.tags.split(";").map((t) => t.trim()).filter(Boolean) : null,
    owner_id: ownerId,
    status: "new",
  };
}

function validateRow(mapped: Record<string, unknown>, rowIndex: number): string[] {
  void rowIndex;
  const errors: string[] = [];
  const name = (mapped.full_name as string) ?? "";
  const email = (mapped.email as string | null) ?? "";
  if (!name && !email) errors.push("Missing name or email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(`Invalid email: ${email}`);
  if (email && email.length > 254) errors.push("Email too long");
  return errors;
}

/** Resolve owner id from email; falls back to importing user. */
async function resolveOwnerId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, orgId: string, email: string): Promise<string | null> {
  const { data } = await supabase
    .from("organization_members")
    .select("user_id, profiles(email)")
    .eq("organization_id", orgId)
    .eq("status", "active");

  type MemberRow = { user_id: string; profiles: { email?: string | null } | Array<{ email?: string | null }> | null };
  const members: MemberRow[] = (data ?? []) as MemberRow[];

  const memberEmail = (m: MemberRow): string | null => {
    if (!m.profiles) return null;
    if (Array.isArray(m.profiles)) return m.profiles[0]?.email ?? null;
    return m.profiles.email ?? null;
  };

  const target = email.toLowerCase();
  const match = members.find((m) => memberEmail(m)?.toLowerCase() === target);
  return match?.user_id ?? members[0]?.user_id ?? null;
}