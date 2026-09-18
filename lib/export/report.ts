/* eslint-disable @typescript-eslint/no-explicit-any */

import "server-only";

import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

import { fetchOwnerIndex, getActiveOrgId } from "@/lib/crm/base";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ExportScope = "leads" | "opportunities" | "sales_report" | "lead" | "opportunity";
export type ExportFormat = "pdf" | "xlsx";
export interface ExportRequest {
  scope: ExportScope;
  format: ExportFormat;
  id?: string;
  from?: string;
  to?: string;
  ownerId?: string;
  stage?: string;
  source?: string;
  outcome?: string;
}

export interface ExportBundle {
  filename: string;
  buffer: Buffer;
  contentType: string;
}

function safeText(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "undefined" || trimmed === "null" || trimmed === "Invalid Date") return "—";
    return trimmed;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "—";
    return String(value);
  }
  return String(value);
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "finlonexa-export";
}

function formatCurrency(value: number | null | undefined, currency = "PKR") {
  const amount = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatDateTime(value: string | null | undefined, timeZone = "UTC") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

function localDayBoundary(value: string | undefined, timeZone: string, endExclusive = false) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return undefined;

  const wallClock = Date.UTC(year, month - 1, day + (endExclusive ? 1 : 0), 0, 0, 0, 0);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(wallClock));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const offset = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute), Number(values.second)) - wallClock;
  return new Date(wallClock - offset).toISOString();
}

function normalizeStageName(value: string | null | undefined) {
  const stage = value?.trim();
  if (!stage || stage.toLowerCase() === "new") return "New Opportunity";
  return stage;
}

function isClosedWon(deal: any) {
  return Boolean(deal.won_at) || normalizeStageName(deal.pipeline_stages?.name ?? deal.stage_name) === "Closed Won";
}

function isClosedLost(deal: any) {
  return Boolean(deal.lost_at) || normalizeStageName(deal.pipeline_stages?.name ?? deal.stage_name) === "Closed Lost";
}

function finalizePdf(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

async function fetchLeadsForExport(supabase: any, orgId: string, filters: Pick<ExportRequest, "ownerId" | "source" | "from" | "to">, timeZone: string) {
  let query = supabase
    .from("leads")
    .select("id, full_name, company_name, source, owner_id, status, created_at, expected_value, score, email, phone, last_activity_at")
    .eq("organization_id", orgId)
    .is("archived_at", null);

  if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.from) query = query.gte("created_at", localDayBoundary(filters.from, timeZone)!);
  if (filters.to) query = query.lt("created_at", localDayBoundary(filters.to, timeZone, true)!);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchDealsForExport(supabase: any, orgId: string, filters: Pick<ExportRequest, "ownerId" | "stage" | "from" | "to" | "outcome">, timeZone: string) {
  let query = supabase
    .from("deals")
    .select("id, name, company_id, primary_contact_id, owner_id, value, currency, expected_close_date, created_at, won_at, lost_at, lost_reason, competitor, source, stage_id, pipeline_stages(name), companies(name), contacts(full_name)")
    .eq("organization_id", orgId)
    .is("archived_at", null);

  if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
  if (filters.from) query = query.gte("created_at", localDayBoundary(filters.from, timeZone)!);
  if (filters.to) query = query.lt("created_at", localDayBoundary(filters.to, timeZone, true)!);
  if (filters.outcome === "won") query = query.not("won_at", "is", null);
  if (filters.outcome === "lost") query = query.not("lost_at", "is", null);
  if (filters.outcome === "active") query = query.is("won_at", null).is("lost_at", null);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchMeetingsForExport(supabase: any, orgId: string, filters: Pick<ExportRequest, "ownerId" | "from" | "to">, timeZone: string) {
  let query = supabase
    .from("meetings")
    .select("id, title, meeting_type, start_at, end_at, status, owner_id, notes, outcome")
    .eq("organization_id", orgId);

  if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
  if (filters.from) query = query.gte("start_at", localDayBoundary(filters.from, timeZone)!);
  if (filters.to) query = query.lt("start_at", localDayBoundary(filters.to, timeZone, true)!);

  const { data, error } = await query.order("start_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchTasksForExport(supabase: any, orgId: string, filters: Pick<ExportRequest, "ownerId" | "from" | "to">, timeZone: string) {
  let query = supabase
    .from("tasks")
    .select("id, title, description, type, status, due_at, owner_id, priority")
    .eq("organization_id", orgId)
    .eq("type", "Follow-up");

  if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
  if (filters.from) query = query.gte("due_at", localDayBoundary(filters.from, timeZone)!);
  if (filters.to) query = query.lt("due_at", localDayBoundary(filters.to, timeZone, true)!);

  const { data, error } = await query.order("due_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchNegotiationsForExport(supabase: any, orgId: string, filters: Pick<ExportRequest, "ownerId" | "from" | "to">, timeZone: string) {
  let query = supabase
    .from("activities")
    .select("id, title, description, activity_type, occurred_at, metadata")
    .eq("organization_id", orgId)
    .in("activity_type", ["negotiation_recorded", "negotiation_logged", "proposal_approved"]);

  if (filters.ownerId) query = query.eq("actor_user_id", filters.ownerId);
  if (filters.from) query = query.gte("occurred_at", localDayBoundary(filters.from, timeZone)!);
  if (filters.to) query = query.lt("occurred_at", localDayBoundary(filters.to, timeZone, true)!);

  const { data, error } = await query.order("occurred_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchQuotesForExport(supabase: any, orgId: string, filters: Pick<ExportRequest, "ownerId" | "from" | "to">, timeZone: string) {
  let query = supabase
    .from("quotes")
    .select("id, quote_number, deal_id, total, status, issue_date, created_at, created_by")
    .eq("organization_id", orgId);

  if (filters.ownerId) query = query.eq("created_by", filters.ownerId);
  if (filters.from) query = query.gte("created_at", localDayBoundary(filters.from, timeZone)!);
  if (filters.to) query = query.lt("created_at", localDayBoundary(filters.to, timeZone, true)!);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function renderPdfSalesReport({ leads, opportunities, meetings, proposals, followUps, negotiations, won, lost, generatedBy, periodLabel, organizationName, timeZone }: {
  leads: any[];
  opportunities: any[];
  meetings: any[];
  proposals: any[];
  followUps: any[];
  negotiations: any[];
  won: any[];
  lost: any[];
  generatedBy: string;
  periodLabel: string;
  organizationName: string;
  timeZone: string;
}) {
  const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pageBottom = () => doc.page.height - doc.page.margins.bottom - 28;
  const navy = "#12233f";
  const blue = "#3b82f6";
  const purple = "#7c3aed";
  const border = "#dbe5f0";
  const muted = "#64748b";

  const stageNames = ["New Opportunity", "Meeting Done", "Proposal Submitted", "Negotiation"];
  const stageRows = stageNames.map((stage) => {
    const stageDeals = opportunities.filter((deal) => normalizeStageName(deal.stage_name) === stage && !isClosedWon(deal) && !isClosedLost(deal));
    return { stage, count: stageDeals.length, value: stageDeals.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0) };
  });
  const active = opportunities.filter((deal) => !isClosedWon(deal) && !isClosedLost(deal));
  const pipelineValue = active.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0);
  const wonRevenue = won.reduce((sum, deal) => sum + Number(deal.value ?? 0), 0);
  const summaryRows = [
    ["Total Leads", String(leads.length)],
    ["Qualified Leads", String(leads.filter((lead) => String(lead.status).toLowerCase() === "qualified").length)],
    ["Unqualified Leads", String(leads.filter((lead) => String(lead.status).toLowerCase() === "unqualified").length)],
    ["Total Opportunities", String(opportunities.length)],
    ["Active Opportunities", String(active.length)],
    ["Pipeline Value", formatCurrency(pipelineValue)],
    ["Closed Won", String(won.length)],
    ["Closed Lost", String(lost.length)],
    ["Won Revenue", formatCurrency(wonRevenue)],
  ];

  const drawHeader = (section?: string) => {
    doc.fillColor(navy).font("Helvetica-Bold").fontSize(10).text("FINLONEXA CRM", doc.page.margins.left, doc.y, { width: pageWidth, lineBreak: false });
    doc.fillColor(muted).font("Helvetica").fontSize(8).text(`Sales Performance Report  |  ${periodLabel}`, doc.page.margins.left, doc.y, { width: pageWidth, lineBreak: false });
    if (section) doc.moveDown(0.8).fillColor(navy).font("Helvetica-Bold").fontSize(16).text(section, doc.page.margins.left, doc.y, { width: pageWidth, lineBreak: false });
    doc.moveDown(0.45);
  };

  const drawSection = (number: string, title: string) => {
    doc.fillColor(navy).font("Helvetica-Bold").fontSize(13).text(`${number}  ${title}`, doc.page.margins.left, doc.y, { width: pageWidth, lineBreak: false });
    doc.moveDown(0.45);
  };

  const drawNoRecords = () => {
    doc.fillColor(muted).font("Helvetica-Oblique").fontSize(9).text("No records available for the selected period.");
    doc.font("Helvetica").moveDown(0.8);
  };

  const drawKpiCards = (rows: string[][]) => {
    const columns = 4;
    const gap = 6;
    const width = (pageWidth - gap * (columns - 1)) / columns;
    rows.forEach((row, index) => {
      const x = doc.page.margins.left + (index % columns) * (width + gap);
      const y = doc.y + Math.floor(index / columns) * 50;
      doc.roundedRect(x, y, width, 42, 5).fillAndStroke(index % columns === 1 ? "#f1f5ff" : "#f8fbff", border);
      doc.fillColor(muted).font("Helvetica-Bold").fontSize(6.5).text(row[0], x + 7, y + 7, { width: width - 14, lineBreak: false, ellipsis: true });
      doc.fillColor(navy).font("Helvetica-Bold").fontSize(10.5).text(row[1], x + 7, y + 21, { width: width - 14, lineBreak: false, ellipsis: true });
    });
    doc.y += Math.ceil(rows.length / columns) * 50;
  };

  const drawChart = (rows: Array<{ stage: string; count: number; value: number }>) => {
    if (!rows.some((row) => row.count > 0 || row.value > 0)) {
      drawNoRecords();
      return;
    }
    const max = Math.max(...rows.map((row) => row.value), 1);
    const chartHeight = 112;
    const rowHeight = chartHeight / rows.length;
    const barX = doc.page.margins.left + 132;
    const barWidth = pageWidth - 210;
    rows.forEach((row, index) => {
      const y = doc.y + index * rowHeight;
      const width = Math.max(2, (row.value / max) * barWidth);
      doc.fillColor(navy).font("Helvetica").fontSize(8).text(row.stage, doc.page.margins.left, y + 5, { width: 122 });
      doc.roundedRect(barX, y + 4, barWidth, 14, 3).fill("#eef4fb");
      doc.roundedRect(barX, y + 4, width, 14, 3).fill(index % 2 === 0 ? blue : purple);
      doc.fillColor(muted).fontSize(8).text(`${row.count}  |  ${formatCurrency(row.value)}`, barX + barWidth + 8, y + 5, { width: 70 });
    });
    doc.y += chartHeight + 8;
  };

  const drawTable = (headers: string[], rows: string[][], widths: number[], statusColumn?: number) => {
    if (!rows.length) {
      drawNoRecords();
      return;
    }
    const headerHeight = 23;
    const drawTableHeader = () => {
      let x = doc.page.margins.left;
      const y = doc.y;
      headers.forEach((header, index) => {
        doc.rect(x, y, widths[index], headerHeight).fillAndStroke("#eaf2fb", border);
        const headerWidth = widths[index] - 10;
        doc.font("Helvetica-Bold").fontSize(7.5);
        const headerTextHeight = doc.heightOfString(header, { width: headerWidth });
        doc.fillColor(navy).font("Helvetica-Bold").fontSize(7.5).text(header, x + 5, y + Math.max(4, (headerHeight - headerTextHeight) / 2), { width: headerWidth, height: headerHeight - 8, align: "center", ellipsis: true });
        x += widths[index];
      });
      doc.y = y + headerHeight;
    };
    drawTableHeader();
    rows.forEach((row, rowIndex) => {
      doc.font("Helvetica").fontSize(7.5);
      const heights = row.map((cell, index) => Math.min(42, Math.max(22, doc.heightOfString(safeText(cell), { width: widths[index] - 10 }) + 10)));
      const rowHeight = Math.max(...heights);
      if (doc.y + rowHeight > pageBottom()) {
        doc.addPage();
        drawHeader();
        drawTableHeader();
      }
      let x = doc.page.margins.left;
      const y = doc.y;
      row.forEach((cell, index) => {
        doc.rect(x, y, widths[index], rowHeight).fillAndStroke(rowIndex % 2 ? "#fbfdff" : "#ffffff", border);
        doc.fillColor(statusColumn === index ? (cell === "Closed Won" || cell === "Qualified" ? "#16805c" : cell === "Closed Lost" || cell === "Unqualified" ? "#c2414b" : cell === "Negotiation" || cell === "Proposal Submitted" ? "#b45309" : blue) : navy);
        const cellWidth = widths[index] - 10;
        const cellText = safeText(cell);
        doc.font("Helvetica").fontSize(7.5);
        const cellTextHeight = doc.heightOfString(cellText, { width: cellWidth });
        doc.text(cellText, x + 5, y + Math.max(4, (rowHeight - cellTextHeight) / 2), { width: cellWidth, height: rowHeight - 8, align: "center", ellipsis: true });
        x += widths[index];
      });
      doc.y = y + rowHeight;
    });
    doc.moveDown(0.8);
  };

  const ensureSectionSpace = (minimumHeight: number, section: string) => {
    if (doc.y + minimumHeight > pageBottom()) {
      doc.addPage();
      drawHeader(section);
    }
  };

  const drawSubsection = (title: string, minimumHeight = 78) => {
    ensureSectionSpace(minimumHeight, title);
    doc.fillColor(navy).font("Helvetica-Bold").fontSize(10).text(title, doc.page.margins.left, doc.y, { width: pageWidth, lineBreak: false });
    doc.moveDown(0.35);
  };

  const renderSection = (number: string, title: string, minimumHeight: number, render: () => void) => {
    ensureSectionSpace(minimumHeight, title);
    drawSection(number, title);
    render();
  };

  const hasDetails = leads.length > 0 || opportunities.length > 0 || meetings.length > 0 || proposals.length > 0 || followUps.length > 0 || negotiations.length > 0 || won.length > 0 || lost.length > 0;

  if (!hasDetails) {
    const left = doc.page.margins.left;
    const contentWidth = pageWidth;
    const footerY = doc.page.height - doc.page.margins.bottom - 10;

    doc.fillColor("#eff6ff").roundedRect(doc.page.width - 205, 36, 145, 115, 24).fill();
    doc.fillColor("#f3e8ff").roundedRect(doc.page.width - 130, 92, 90, 74, 18).fill();
    doc.fillColor(blue).font("Helvetica-Bold").fontSize(20).text("FinloNexa CRM", left, 52, { width: contentWidth, lineBreak: false });
    doc.fillColor(purple).font("Helvetica-Bold").fontSize(7.5).text("AI-FIRST WORKSPACE", left, 78, { width: contentWidth, lineBreak: false });
    doc.fillColor(muted).font("Helvetica-Bold").fontSize(8).text("SALES PERFORMANCE REPORT", left, 112, { width: contentWidth, align: "right", lineBreak: false });
    doc.fillColor(navy).font("Helvetica-Bold").fontSize(23).text("Sales Performance Report", left, 145, { width: contentWidth, lineBreak: false });
    doc.fillColor(muted).font("Helvetica").fontSize(8.5).text(`Report Period: ${periodLabel}`, left, 184, { width: contentWidth, lineBreak: false });
    doc.text(`Generated: ${formatDateTime(new Date().toISOString(), timeZone)}`, left, 199, { width: contentWidth, lineBreak: false });
    doc.text(`Generated By: ${safeText(generatedBy)}`, left, 214, { width: contentWidth, lineBreak: false });
    doc.text(`Organization: ${safeText(organizationName)}`, left, 229, { width: contentWidth, lineBreak: false });
    doc.fillColor(navy).font("Helvetica-Bold").fontSize(13).text("EXECUTIVE SUMMARY", left, 260, { width: contentWidth, lineBreak: false });
    doc.y = 282;
    drawKpiCards([
      ["Total Leads", "0"],
      ["Qualified Leads", "0"],
      ["Total Opportunities", "0"],
      ["Active Opportunities", "0"],
      ["Closed Won", "0"],
      ["Closed Lost", "0"],
      ["Pipeline Value", formatCurrency(0)],
      ["Won Revenue", formatCurrency(0)],
    ]);

    const cardX = left + 12;
    const cardY = doc.y + 8;
    const cardWidth = contentWidth - 24;
    const cardHeight = 96;
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 8).fillAndStroke("#f8fbff", border);
    doc.fillColor(purple).font("Helvetica-Bold").fontSize(11).text("NO SALES RECORDS", cardX + 10, cardY + 15, { width: cardWidth - 20, align: "center", lineBreak: false });
    doc.fillColor(navy).font("Helvetica").fontSize(9).text("No sales records were found for the selected report period.", cardX + 10, cardY + 38, { width: cardWidth - 20, align: "center", lineBreak: false });
    doc.fillColor(muted).fontSize(8).text(periodLabel, cardX + 10, cardY + 57, { width: cardWidth - 20, align: "center", lineBreak: false });
    doc.fillColor(muted).font("Helvetica-Oblique").fontSize(8).text("Try another date range or select All Time.", cardX + 10, cardY + 76, { width: cardWidth - 20, align: "center", lineBreak: false });
    doc.fillColor(muted).font("Helvetica").fontSize(7).text("FinloNexa CRM | Confidential Sales Report   |   Page 1 of 1", left, footerY, { width: contentWidth, align: "center", lineBreak: false });
    return finalizePdf(doc);
  }

  // Page 1: branded executive cover.
  doc.fillColor("#eff6ff").roundedRect(doc.page.width - 205, 36, 145, 145, 28).fill();
  doc.fillColor("#f3e8ff").roundedRect(doc.page.width - 130, 108, 90, 90, 20).fill();
  doc.fillColor(blue).font("Helvetica-Bold").fontSize(22).text("FinloNexa CRM");
  doc.fillColor(purple).font("Helvetica-Bold").fontSize(8).text("AI-FIRST WORKSPACE");
  doc.moveDown(4.5);
  doc.fillColor(muted).font("Helvetica-Bold").fontSize(9).text("SALES PERFORMANCE REPORT");
  doc.moveDown(0.35);
  doc.fillColor(navy).font("Helvetica-Bold").fontSize(27).text("Sales Performance\nReport");
  doc.moveDown(0.8);
  doc.fillColor(muted).font("Helvetica").fontSize(9).text(`Report Period: ${periodLabel}`);
  doc.text(`Generated: ${formatDateTime(new Date().toISOString(), timeZone)}`);
  doc.text(`Generated By: ${safeText(generatedBy)}`);
  doc.text(`Organization: ${safeText(organizationName)}`);
  doc.moveDown(1.8);
  drawSection("", "EXECUTIVE SUMMARY");
  drawKpiCards([
    ["Total Leads", String(leads.length)],
    ["Qualified Leads", String(leads.filter((lead) => String(lead.status).toLowerCase() === "qualified").length)],
    ["Total Opportunities", String(opportunities.length)],
    ["Active Opportunities", String(active.length)],
    ["Closed Won", String(won.length)],
    ["Closed Lost", String(lost.length)],
    ["Pipeline Value", formatCurrency(pipelineValue)],
    ["Won Revenue", formatCurrency(wonRevenue)],
  ]);

  doc.moveDown(0.5);
  drawSection("", "SALES PIPELINE OVERVIEW");
  drawChart(stageRows);

  const sourceCounts = Array.from(new Set(leads.map((lead) => safeText(lead.source)))).map((source) => [source, String(leads.filter((lead) => safeText(lead.source) === source).length)]);
  if (leads.length > 0) {
    renderSection("3.", "Leads Summary", 70, () => {
      drawTable(["Customer", "Company", "Source", "Stage", "Created Date"], leads.map((lead) => [
        safeText(lead.full_name ?? lead.email ?? "Customer"), safeText(lead.company_name), safeText(lead.source), safeText(lead.status), formatDate(lead.created_at),
      ]), [140, 125, 78, 78, pageWidth - 421], 3);
      if (sourceCounts.length > 0) {
        drawSection("4.", "Lead Sources");
        drawTable(["Source", "Lead Count"], sourceCounts, [pageWidth - 100, 100]);
      }
    });
  }

  if (opportunities.length > 0) {
    renderSection("5.", "Opportunities", 70, () => {
      drawTable(["Opportunity", "Customer", "Stage", "Value", "Owner"], opportunities.map((deal) => [
        safeText(deal.name), safeText(deal.customer_name), safeText(deal.stage_name), formatCurrency(Number(deal.value ?? 0), deal.currency ?? "PKR"), safeText(deal.owner_name),
      ]), [150, 125, 105, 75, pageWidth - 455], 2);
      if (stageRows.some((row) => row.count > 0 || row.value > 0)) {
        drawSection("6.", "Opportunity Value by Stage");
        drawTable(["Stage", "Opportunity Count", "Pipeline Value"], stageRows.map((row) => [row.stage, String(row.count), formatCurrency(row.value)]), [220, 130, pageWidth - 350]);
      }
    });
  }

  const dealIndex = new Map(opportunities.map((deal) => [deal.id, deal]));
  if (meetings.length > 0 || proposals.length > 0 || followUps.length > 0 || negotiations.length > 0) {
    renderSection("7.", "Sales Activities", 65, () => {
      if (meetings.length > 0) {
        drawSubsection("RECENT MEETINGS");
        drawTable(["Customer", "Opportunity", "Date", "Outcome"], meetings.map((meeting) => {
          const deal = dealIndex.get(meeting.related_id);
          return [safeText(deal?.customer_name ?? meeting.title), safeText(deal?.name), formatDateTime(meeting.start_at, timeZone), safeText(meeting.outcome)];
        }), [130, 150, 125, pageWidth - 405]);
      }
      if (proposals.length > 0) {
        drawSubsection("RECENT PROPOSALS");
        drawTable(["Opportunity", "Customer", "Status", "Total", "Sent Date"], proposals.map((proposal) => {
          const deal = dealIndex.get(proposal.deal_id);
          return [safeText(deal?.name), safeText(deal?.customer_name), safeText(proposal.status), formatCurrency(Number(proposal.total ?? 0)), formatDate(proposal.issue_date ?? proposal.created_at)];
        }), [145, 125, 80, 80, pageWidth - 430]);
      }
      if (followUps.length > 0) {
        drawSubsection("RECENT FOLLOW-UPS");
        drawTable(["Customer", "Date", "Response", "Next Follow-Up"], followUps.map((task) => {
          const response = /Customer response:\s*([^\n]+)/i.exec(task.description ?? "")?.[1];
          return [safeText(task.title?.replace(/^Follow-up:\s*/i, "")), formatDate(task.due_at), safeText(response), "—"];
        }), [180, 100, 135, pageWidth - 415]);
      }
      if (negotiations.length > 0) {
        drawSubsection("RECENT NEGOTIATIONS");
        drawTable(["Activity", "Type", "Date", "Details"], negotiations.map((item) => [safeText(item.title), safeText(item.activity_type), formatDate(item.occurred_at), safeText(item.description)]), [145, 105, 100, pageWidth - 350]);
      }
    });
  }

  if (won.length > 0 || lost.length > 0) {
    renderSection("8.", "Closing Results", 65, () => {
      if (won.length > 0) {
        drawSubsection("CLOSED WON OPPORTUNITIES");
        drawTable(["Customer", "Opportunity", "Final Value", "Close Date"], won.map((deal) => [safeText(deal.customer_name), safeText(deal.name), formatCurrency(Number(deal.value ?? 0), deal.currency ?? "PKR"), formatDate(deal.won_at ?? deal.updated_at)]), [150, 175, 100, pageWidth - 425]);
      }
      if (lost.length > 0) {
        drawSubsection("CLOSED LOST OPPORTUNITIES");
        drawTable(["Customer", "Opportunity", "Lost Reason", "Competitor", "Close Date"], lost.map((deal) => [safeText(deal.customer_name), safeText(deal.name), safeText(deal.lost_reason), safeText(deal.competitor), formatDate(deal.lost_at ?? deal.updated_at)]), [115, 145, 105, 80, pageWidth - 445]);
      }
    });
  }

  const pages = doc.bufferedPageRange();
  for (let index = 0; index < pages.count; index += 1) {
    doc.switchToPage(pages.start + index);
    const footerY = doc.page.height - doc.page.margins.bottom - 10;
    doc.fillColor(muted).font("Helvetica").fontSize(7).text(`FinloNexa CRM | Confidential Sales Report   |   Page ${index + 1} of ${pages.count}`, doc.page.margins.left, footerY, { width: pageWidth, align: "center", lineBreak: false });
  }
  return finalizePdf(doc);
}

function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], options: { rowHeight: number; widths: number[] }) {
  const headerHeight = 22;
  const pageBottom = doc.page.height - doc.page.margins.bottom - 20;
  const drawHeader = () => {
    let x = doc.page.margins.left;
    const y = doc.y;
    headers.forEach((header, index) => {
      doc.rect(x, y, options.widths[index], headerHeight).fillAndStroke("#eaf2fb", "#dbe5f0");
      const headerWidth = options.widths[index] - 10;
      doc.font("Helvetica-Bold").fontSize(7.5);
      const headerHeightText = doc.heightOfString(header, { width: headerWidth });
      doc.fillColor("#12233f").font("Helvetica-Bold").fontSize(7.5).text(header, x + 5, y + Math.max(4, (headerHeight - headerHeightText) / 2), { width: headerWidth, height: headerHeight - 8, align: "center", ellipsis: true });
      x += options.widths[index];
    });
    doc.y = y + headerHeight;
  };

  drawHeader();
  rows.forEach((row, rowIndex) => {
    if (doc.y + options.rowHeight > pageBottom) {
      doc.addPage();
      drawHeader();
    }
    let x = doc.page.margins.left;
    const y = doc.y;
    row.forEach((cell, cellIndex) => {
      doc.rect(x, y, options.widths[cellIndex], options.rowHeight).fillAndStroke(rowIndex % 2 ? "#fbfdff" : "#ffffff", "#dbe5f0");
        const cellWidth = options.widths[cellIndex] - 10;
        const cellText = safeText(cell);
        doc.font("Helvetica").fontSize(7.5);
        const cellHeight = doc.heightOfString(cellText, { width: cellWidth });
        doc.fillColor("#12233f").font("Helvetica").fontSize(7.5).text(cellText, x + 5, y + Math.max(4, (options.rowHeight - cellHeight) / 2), { width: cellWidth, height: options.rowHeight - 8, align: "center", ellipsis: true });
      x += options.widths[cellIndex];
    });
    doc.y = y + options.rowHeight;
  });
  doc.moveDown(0.8);
}

async function renderSingleOpportunityPdf({ deal, lead, meetings, proposals, followUps, activities, generatedBy, timeZone }: {
  deal: any;
  lead: any;
  meetings: any[];
  proposals: any[];
  followUps: any[];
  activities: any[];
  generatedBy: string;
  timeZone: string;
}) {
  const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pageBottom = () => doc.page.height - doc.page.margins.bottom - 28;
  const navy = "#12233f";
  const blue = "#3b82f6";
  const purple = "#7c3aed";
  const green = "#16805c";
  const red = "#c2414b";
  const muted = "#64748b";
  const border = "#dbe5f0";
  const stage = normalizeStageName(deal.stage_name ?? deal.pipeline_stages?.name);
  const closedWon = isClosedWon(deal);
  const closedLost = isClosedLost(deal);
  const customer = safeText(lead?.full_name ?? deal.customer_name ?? deal.contacts?.full_name);
  const company = safeText(lead?.company_name ?? deal.company_name ?? deal.companies?.name);
  const owner = safeText(deal.owner_name || "—");

  const pageHeader = (section?: string) => {
    doc.fillColor(navy).font("Helvetica-Bold").fontSize(10).text("FINLONEXA CRM", doc.page.margins.left, doc.y, { width: pageWidth, lineBreak: false });
    doc.fillColor(purple).font("Helvetica-Bold").fontSize(7).text("AI-FIRST WORKSPACE", doc.page.margins.left, doc.y, { width: pageWidth, lineBreak: false });
    if (section) doc.fillColor(muted).font("Helvetica-Bold").fontSize(8).text(section, doc.page.margins.left, doc.y, { width: pageWidth, align: "right", lineBreak: false });
    doc.moveDown(0.8);
  };

  const footer = () => {
    const pages = doc.bufferedPageRange();
    for (let index = 0; index < pages.count; index += 1) {
      doc.switchToPage(pages.start + index);
      doc.fillColor(muted).font("Helvetica").fontSize(7).text(`FinloNexa CRM | Confidential Opportunity Report   |   Page ${index + 1} of ${pages.count}`, doc.page.margins.left, doc.page.height - doc.page.margins.bottom - 10, { width: pageWidth, align: "center", lineBreak: false });
    }
  };

  const section = (title: string, minimumHeight = 58) => {
    if (doc.y + minimumHeight > pageBottom()) {
      doc.addPage();
      pageHeader(title);
    }
    doc.fillColor(navy).font("Helvetica-Bold").fontSize(14).text(title, doc.page.margins.left, doc.y, { width: pageWidth, lineBreak: false });
    doc.moveDown(0.45);
  };

  const subheading = (title: string, minimumHeight = 45) => {
    if (doc.y + minimumHeight > pageBottom()) {
      doc.addPage();
      pageHeader(title);
    }
    doc.fillColor(navy).font("Helvetica-Bold").fontSize(10).text(title, doc.page.margins.left, doc.y, { width: pageWidth, lineBreak: false });
    doc.moveDown(0.3);
  };

  const infoGrid = (items: Array<[string, string]>) => {
    const gap = 8;
    const width = (pageWidth - gap) / 2;
    items.forEach((item, index) => {
      if (doc.y + 38 > pageBottom()) {
        doc.addPage();
        pageHeader("Opportunity Report");
      }
      const x = doc.page.margins.left + (index % 2) * (width + gap);
      const y = doc.y + Math.floor(index / 2) * 40;
      doc.roundedRect(x, y, width, 32, 4).fillAndStroke(index % 2 ? "#fbfdff" : "#f8fbff", border);
      doc.fillColor(muted).font("Helvetica-Bold").fontSize(6.5).text(item[0], x + 7, y + 6, { width: width - 14, lineBreak: false });
      doc.fillColor(navy).font("Helvetica").fontSize(8.5).text(safeText(item[1]), x + 7, y + 17, { width: width - 14, ellipsis: true, lineBreak: false });
      if (index % 2 === 1 || index === items.length - 1) doc.y = y + 40;
    });
  };

  const table = (headers: string[], rows: string[][], widths: number[]) => {
    if (!rows.length) return;
    const headerHeight = 21;
    const header = () => {
      let x = doc.page.margins.left;
      const y = doc.y;
      headers.forEach((item, index) => {
        doc.rect(x, y, widths[index], headerHeight).fillAndStroke("#eaf2fb", border);
        const headerWidth = widths[index] - 10;
        doc.font("Helvetica-Bold").fontSize(7);
        const headerTextHeight = doc.heightOfString(item, { width: headerWidth });
        doc.fillColor(navy).font("Helvetica-Bold").fontSize(7).text(item, x + 5, y + Math.max(4, (headerHeight - headerTextHeight) / 2), { width: headerWidth, height: headerHeight - 8, align: "center", ellipsis: true, lineBreak: false });
        x += widths[index];
      });
      doc.y = y + headerHeight;
    };
    header();
    rows.forEach((row, rowIndex) => {
      doc.font("Helvetica").fontSize(7.5);
      const rowHeight = Math.max(21, ...row.map((value, index) => Math.min(44, doc.heightOfString(safeText(value), { width: widths[index] - 10 }) + 8)));
      if (doc.y + rowHeight > pageBottom()) {
        doc.addPage();
        pageHeader("Opportunity Report");
        header();
      }
      let x = doc.page.margins.left;
      const y = doc.y;
      row.forEach((value, index) => {
        doc.rect(x, y, widths[index], rowHeight).fillAndStroke(rowIndex % 2 ? "#fbfdff" : "#ffffff", border);
        const cellWidth = widths[index] - 10;
        const cellText = safeText(value);
        doc.font("Helvetica").fontSize(7.5);
        const cellTextHeight = doc.heightOfString(cellText, { width: cellWidth });
        doc.fillColor(navy).font("Helvetica").fontSize(7.5).text(cellText, x + 5, y + Math.max(4, (rowHeight - cellTextHeight) / 2), { width: cellWidth, height: rowHeight - 8, align: "center", ellipsis: true });
        x += widths[index];
      });
      doc.y = y + rowHeight;
    });
    doc.moveDown(0.65);
  };

  pageHeader("OPPORTUNITY REPORT");
  doc.fillColor(navy).font("Helvetica-Bold").fontSize(23).text("Opportunity Report", doc.page.margins.left, doc.y, { width: pageWidth, lineBreak: false });
  doc.fillColor(muted).font("Helvetica").fontSize(8).text(`Generated: ${formatDateTime(new Date().toISOString(), timeZone)}`, doc.page.margins.left, doc.y + 10, { width: pageWidth, align: "right", lineBreak: false });
  doc.moveDown(0.8);
  section("OPPORTUNITY OVERVIEW", 170);
  doc.fillColor(navy).font("Helvetica-Bold").fontSize(17).text(safeText(deal.name), doc.page.margins.left, doc.y, { width: pageWidth - 105, lineBreak: false });
  doc.fillColor(closedWon ? green : closedLost ? red : blue).font("Helvetica-Bold").fontSize(8).text(stage.toUpperCase(), doc.page.margins.left, doc.y + 8, { width: pageWidth, align: "right", lineBreak: false });
  doc.moveDown(0.9);
  infoGrid([
    ["CUSTOMER", customer], ["COMPANY", company], ["EMAIL", safeText(lead?.email)], ["PHONE", safeText(lead?.phone)],
    ["OWNER", owner], ["OPPORTUNITY VALUE", formatCurrency(Number(deal.value ?? 0), deal.currency ?? "PKR")], ["EXPECTED CLOSE", formatDate(deal.expected_close_date)], ["ACTUAL CLOSE DATE", formatDate(deal.won_at ?? deal.lost_at)],
    ["SOURCE LEAD", safeText(lead?.source)], ["CREATED DATE", formatDate(deal.created_at)],
  ]);

  section("SALES JOURNEY", 90);
  const activityTypes = new Set(activities.map((item) => String(item.activity_type)));
  const journey = [
    ["Lead", Boolean(lead)], ["Contacted", Boolean(lead?.last_activity_at) || activityTypes.has("lead_contacted")], ["Qualified", String(lead?.status).toLowerCase() === "qualified" || stage !== "New Opportunity"],
    ["Opportunity Created", Boolean(deal.created_at)], ["Meeting Done", activityTypes.has("meeting_completed") || meetings.some((item) => item.status === "completed")], ["Proposal Submitted", activityTypes.has("proposal_submitted") || proposals.some((item) => ["Sent", "Viewed", "Accepted"].includes(item.status))], ["Negotiation", activityTypes.has("negotiation_activity_recorded") || ["Negotiation", "Closed Won", "Closed Lost"].includes(stage)], [closedLost ? "Closed Lost" : "Closed Won", closedWon || closedLost],
  ] as Array<[string, boolean]>;
  const journeyWidth = pageWidth / journey.length;
  journey.forEach((item, index) => {
    const x = doc.page.margins.left + index * journeyWidth;
    doc.circle(x + 10, doc.y + 8, 8).fillAndStroke(item[1] ? (closedLost && index === journey.length - 1 ? red : green) : "#e2e8f0", border);
    doc.fillColor(navy).font("Helvetica").fontSize(6.5).text(item[1] ? "✓" : "—", x + 6, doc.y + 4, { width: 8, align: "center", lineBreak: false });
    doc.text(item[0], x + 22, doc.y + 4, { width: journeyWidth - 24, lineBreak: false, ellipsis: true });
  });
  doc.y += 25;

  section(closedWon ? "CLOSED WON" : closedLost ? "CLOSED LOST" : "CLOSING SUMMARY", 80);
  const closeRows: Array<[string, string]> = [["Final Value", formatCurrency(Number(deal.value ?? 0), deal.currency ?? "PKR")], ["Close Date", formatDate(deal.won_at ?? deal.lost_at)], ["Closing Notes", safeText(deal.win_reason ?? deal.lost_reason ?? deal.description)]];
  if (closedLost) closeRows.splice(1, 0, ["Lost Reason", safeText(deal.lost_reason)], ["Competitor", safeText(deal.competitor)]);
  infoGrid(closeRows);

  if (lead?.budget || lead?.interested_product || lead?.description || lead?.expected_value) {
    section("QUALIFICATION", 75);
    table(["Budget", "Authority", "Need / Requirements", "Expected Value"], [[safeText(lead.budget), "—", safeText(lead.interested_product ?? lead.description), formatCurrency(Number(lead.expected_value ?? deal.value ?? 0))]], [120, 100, 210, pageWidth - 430]);
  }
  if (meetings.length > 0) {
    section("MEETING", 75);
    table(["Meeting Date", "Type", "Status", "Outcome", "Notes"], meetings.map((item) => [formatDateTime(item.start_at, timeZone), safeText(item.meeting_type), safeText(item.status), safeText(item.outcome), safeText(item.notes)]), [105, 85, 75, 95, pageWidth - 360]);
  }
  if (proposals.length > 0) {
    section("PROPOSAL", 75);
    table(["Proposal Number", "Status", "Created Date", "Sent Date", "Value"], proposals.map((item) => [safeText(item.quote_number), safeText(item.status), formatDate(item.created_at), formatDate(item.issue_date), formatCurrency(Number(item.total ?? 0))]), [105, 80, 100, 100, pageWidth - 385]);
  }
  if (followUps.length > 0) {
    section("FOLLOW-UP HISTORY", 65);
    table(["Date", "Channel", "Customer Response", "Notes"], followUps.map((item) => {
      const response = /Customer response:\s*([^\n]+)/i.exec(item.description ?? "")?.[1];
      return [formatDate(item.due_at), safeText(item.title?.split(":")[0]), safeText(response), safeText(item.description)];
    }), [85, 85, 150, pageWidth - 320]);
  }
  const negotiationActivities = activities.filter((item) => ["negotiation_activity_recorded", "negotiation_recorded", "negotiation_logged"].includes(item.activity_type));
  if (negotiationActivities.length > 0) {
    section("NEGOTIATION", 70);
    table(["Date", "Type", "Customer Request / Objection", "Our Response / Notes"], negotiationActivities.map((item) => [formatDate(item.occurred_at), safeText(item.metadata?.negotiation_type ?? item.activity_type), safeText(item.metadata?.customer_request ?? item.description), safeText(item.metadata?.our_response ?? item.metadata?.notes)]), [80, 105, 160, pageWidth - 345]);
  }
  if (activities.length > 0) {
    section("ACTIVITY TIMELINE", 70);
    const seen = new Set<string>();
    const timeline = activities.slice().sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()).filter((item) => {
      const key = `${item.activity_type}|${item.occurred_at}|${item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    table(["Date / Time", "Event", "Description"], timeline.map((item) => [formatDateTime(item.occurred_at, timeZone), safeText(item.title ?? String(item.activity_type).replaceAll("_", " ")), safeText(item.description)]), [115, 145, pageWidth - 260]);
  }

  footer();
  return finalizePdf(doc);
}

async function buildXlsxWorkbook({ leads, opportunities, meetings, proposals, followUps, negotiations, won, lost, generatedBy, periodLabel }: {
  leads: any[];
  opportunities: any[];
  meetings: any[];
  proposals: any[];
  followUps: any[];
  negotiations: any[];
  won: any[];
  lost: any[];
  generatedBy: string;
  periodLabel: string;
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = generatedBy;
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Report Period", key: "label", width: 28 },
    { header: "Value", key: "value", width: 38 },
  ];
  const summaryRows = [
    ["Report Period", periodLabel],
    ["Generated Date", new Date().toLocaleString()],
    ["Generated By", generatedBy],
    ["Total Leads", String(leads.length)],
    ["Qualified Leads", String(leads.filter((lead) => String(lead.status).toLowerCase() === "qualified").length)],
    ["Unqualified Leads", String(leads.filter((lead) => String(lead.status).toLowerCase() === "unqualified").length)],
    ["Total Opportunities", String(opportunities.length)],
    ["Active Opportunities", String(opportunities.filter((item) => !item.won_at && !item.lost_at).length)],
    ["Pipeline Value", String(opportunities.reduce((sum, item) => sum + Number(item.value ?? 0), 0))],
    ["Closed Won", String(won.length)],
    ["Closed Lost", String(lost.length)],
    ["Won Revenue", String(won.reduce((sum, item) => sum + Number(item.value ?? 0), 0))],
  ];
  summaryRows.forEach((row) => summary.addRow(row));
  summary.getRow(1).font = { bold: true };
  summary.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
  summary.autoFilter = { from: "A1", to: "B12" };

  const leadSheet = workbook.addWorksheet("Leads");
  leadSheet.columns = [
    { header: "Customer", key: "customer", width: 24 },
    { header: "Company", key: "company", width: 24 },
    { header: "Source", key: "source", width: 18 },
    { header: "Owner", key: "owner", width: 18 },
    { header: "Stage", key: "stage", width: 18 },
    { header: "Created Date", key: "created_at", width: 20 },
  ];
  leads.forEach((lead) => leadSheet.addRow({
    customer: safeText(lead.full_name ?? lead.email ?? "Customer"),
    company: safeText(lead.company_name),
    source: safeText(lead.source),
    owner: safeText(lead.owner_id ? "Owner" : "—"),
    stage: safeText(lead.status),
    created_at: lead.created_at ? new Date(lead.created_at) : null,
  }));
  leadSheet.getRow(1).font = { bold: true };
  leadSheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
  leadSheet.autoFilter = { from: "A1", to: "F1" };

  const opportunitySheet = workbook.addWorksheet("Opportunities");
  opportunitySheet.columns = [
    { header: "Opportunity", key: "name", width: 26 },
    { header: "Customer", key: "customer", width: 24 },
    { header: "Company", key: "company", width: 24 },
    { header: "Stage", key: "stage", width: 18 },
    { header: "Value", key: "value", width: 18 },
    { header: "Owner", key: "owner", width: 18 },
    { header: "Expected Close", key: "expected_close", width: 18 },
    { header: "Created Date", key: "created_at", width: 20 },
  ];
  opportunities.forEach((deal) => opportunitySheet.addRow({
    name: safeText(deal.name),
    customer: safeText(deal.primary_contact_name ?? deal.customer_name ?? "Customer"),
    company: safeText(deal.companies?.name ?? deal.company_name),
    stage: safeText(deal.pipeline_stages?.name ?? deal.stage_name),
    value: Number(deal.value ?? 0),
    owner: safeText(deal.owner_id ? "Owner" : "—"),
    expected_close: deal.expected_close_date ? new Date(deal.expected_close_date) : null,
    created_at: deal.created_at ? new Date(deal.created_at) : null,
  }));
  opportunitySheet.getRow(1).font = { bold: true };
  opportunitySheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
  opportunitySheet.autoFilter = { from: "A1", to: "H1" };

  const meetingSheet = workbook.addWorksheet("Meetings");
  meetingSheet.columns = [
    { header: "Title", key: "title", width: 30 },
    { header: "Type", key: "type", width: 18 },
    { header: "Start", key: "start", width: 20 },
    { header: "End", key: "end", width: 20 },
    { header: "Status", key: "status", width: 16 },
    { header: "Notes", key: "notes", width: 32 },
  ];
  meetings.forEach((meeting) => meetingSheet.addRow({
    title: safeText(meeting.title),
    type: safeText(meeting.meeting_type),
    start: meeting.start_at ? new Date(meeting.start_at) : null,
    end: meeting.end_at ? new Date(meeting.end_at) : null,
    status: safeText(meeting.status),
    notes: safeText(meeting.notes),
  }));
  meetingSheet.getRow(1).font = { bold: true };
  meetingSheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
  meetingSheet.autoFilter = { from: "A1", to: "F1" };

  const proposalSheet = workbook.addWorksheet("Proposals");
  proposalSheet.columns = [
    { header: "Quote #", key: "quote_number", width: 22 },
    { header: "Deal", key: "deal", width: 26 },
    { header: "Status", key: "status", width: 20 },
    { header: "Total", key: "total", width: 18 },
    { header: "Created", key: "created_at", width: 20 },
  ];
  proposals.forEach((item) => proposalSheet.addRow({
    quote_number: safeText(item.quote_number),
    deal: safeText(item.deal_id),
    status: safeText(item.status),
    total: Number(item.total ?? 0),
    created_at: item.created_at ? new Date(item.created_at) : null,
  }));
  proposalSheet.getRow(1).font = { bold: true };
  proposalSheet.autoFilter = { from: "A1", to: "E1" };

  const followUpSheet = workbook.addWorksheet("Follow-Ups");
  followUpSheet.columns = [
    { header: "Title", key: "title", width: 30 },
    { header: "Status", key: "status", width: 16 },
    { header: "Due", key: "due_at", width: 20 },
    { header: "Priority", key: "priority", width: 16 },
    { header: "Description", key: "description", width: 32 },
  ];
  followUps.forEach((item) => followUpSheet.addRow({
    title: safeText(item.title),
    status: safeText(item.status),
    due_at: item.due_at ? new Date(item.due_at) : null,
    priority: safeText(item.priority),
    description: safeText(item.description),
  }));
  followUpSheet.getRow(1).font = { bold: true };
  followUpSheet.autoFilter = { from: "A1", to: "E1" };

  const negotiationSheet = workbook.addWorksheet("Negotiations");
  negotiationSheet.columns = [
    { header: "Activity", key: "title", width: 28 },
    { header: "Type", key: "type", width: 18 },
    { header: "Date", key: "occurred_at", width: 18 },
    { header: "Details", key: "details", width: 52 },
  ];
  negotiations.forEach((item) => negotiationSheet.addRow({
    title: safeText(item.title),
    type: safeText(item.activity_type),
    occurred_at: item.occurred_at ? new Date(item.occurred_at) : null,
    details: safeText(item.description ?? item.metadata),
  }));
  negotiationSheet.getRow(1).font = { bold: true };
  negotiationSheet.autoFilter = { from: "A1", to: "D1" };

  const wonSheet = workbook.addWorksheet("Closed Won");
  wonSheet.columns = [
    { header: "Customer", key: "customer", width: 22 },
    { header: "Opportunity", key: "opportunity", width: 28 },
    { header: "Final Value", key: "value", width: 18 },
    { header: "Close Date", key: "close_date", width: 18 },
  ];
  won.forEach((item) => wonSheet.addRow({
    customer: safeText(item.primary_contact_name ?? item.customer_name ?? "Customer"),
    opportunity: safeText(item.name),
    value: Number(item.value ?? 0),
    close_date: item.won_at ? new Date(item.won_at) : null,
  }));
  wonSheet.getRow(1).font = { bold: true };
  wonSheet.autoFilter = { from: "A1", to: "D1" };

  const lostSheet = workbook.addWorksheet("Closed Lost");
  lostSheet.columns = [
    { header: "Customer", key: "customer", width: 22 },
    { header: "Opportunity", key: "opportunity", width: 28 },
    { header: "Lost Reason", key: "lost_reason", width: 20 },
    { header: "Competitor", key: "competitor", width: 18 },
    { header: "Close Date", key: "close_date", width: 18 },
  ];
  lost.forEach((item) => lostSheet.addRow({
    customer: safeText(item.primary_contact_name ?? item.customer_name ?? "Customer"),
    opportunity: safeText(item.name),
    lost_reason: safeText(item.lost_reason),
    competitor: safeText(item.competitor),
    close_date: item.lost_at ? new Date(item.lost_at) : null,
  }));
  lostSheet.getRow(1).font = { bold: true };
  lostSheet.autoFilter = { from: "A1", to: "E1" };

  for (const worksheet of workbook.worksheets.slice()) {
    if (worksheet.name !== "Summary" && worksheet.actualRowCount <= 1) {
      workbook.removeWorksheet(worksheet.id);
    }
  }

  return workbook;
}

export async function generateExportBundle(request: ExportRequest): Promise<ExportBundle> {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error("Authentication required.");
  }

  const orgId = await getActiveOrgId(supabase);
  if (!orgId) {
    throw new Error("No active organization found.");
  }

  const [{ data: organization }, owners] = await Promise.all([
    supabase.from("organizations").select("name, timezone, default_currency").eq("id", orgId).maybeSingle(),
    fetchOwnerIndex(supabase, orgId),
  ]);
  const organizationName = organization?.name || "FinloNexa Workspace";
  const timeZone = organization?.timezone || "UTC";

  const scope = request.scope;
  const from = request.from || "";
  const to = request.to || "";
  const periodLabel = from || to
    ? `${from ? formatDate(from) : "Beginning"} – ${to ? formatDate(to) : "Present"}`
    : "All Available Data";

  let leads: any[] = [];
  let opportunities: any[] = [];
  let meetings: any[] = [];
  let proposals: any[] = [];
  let followUps: any[] = [];
  let negotiations: any[] = [];
  let won: any[] = [];
  let lost: any[] = [];
  let singleOpportunityLead: any = null;
  let singleOpportunityActivities: any[] = [];

  if (scope === "lead" && request.id) {
    const { data: lead } = await supabase.from("leads").select("id, full_name, company_name, source, owner_id, status, created_at, expected_value, score, email, phone, last_activity_at").eq("organization_id", orgId).eq("id", request.id).maybeSingle();
    leads = lead ? [lead] : [];
  } else if (scope === "opportunity" && request.id) {
    const { data: deal } = await supabase.from("deals").select("id, name, value, currency, owner_id, expected_close_date, created_at, updated_at, won_at, lost_at, win_reason, lost_reason, competitor, description, source, pipeline_stages(name), companies(name), contacts(full_name)").eq("organization_id", orgId).eq("id", request.id).maybeSingle();
    opportunities = deal ? [deal] : [];
    if (deal) {
      const [leadResult, meetingsResult, proposalsResult, followUpsResult, activitiesResult] = await Promise.all([
        supabase.from("leads").select("id, full_name, email, phone, company_name, source, expected_value, owner_id, created_at, last_activity_at, status, budget, interested_product, description").eq("organization_id", orgId).eq("converted_deal_id", deal.id).maybeSingle(),
        supabase.from("meetings").select("id, title, meeting_type, start_at, end_at, status, notes, outcome, related_id").eq("organization_id", orgId).eq("related_type", "deal").eq("related_id", deal.id).order("start_at", { ascending: true }),
        supabase.from("quotes").select("id, quote_number, status, issue_date, expiry_date, total, terms, notes, created_at").eq("organization_id", orgId).eq("deal_id", deal.id).order("created_at", { ascending: true }),
        supabase.from("tasks").select("id, title, description, type, status, due_at, priority").eq("organization_id", orgId).eq("related_type", "deal").eq("related_id", deal.id).eq("type", "Follow-up").order("due_at", { ascending: true }),
        supabase.from("activities").select("id, activity_type, title, description, occurred_at, metadata").eq("organization_id", orgId).eq("deal_id", deal.id).order("occurred_at", { ascending: true }),
      ]);
      singleOpportunityLead = leadResult.data;
      meetings = meetingsResult.data ?? [];
      proposals = proposalsResult.data ?? [];
      followUps = followUpsResult.data ?? [];
      singleOpportunityActivities = activitiesResult.data ?? [];
    }
  } else {
    leads = await fetchLeadsForExport(supabase, orgId, request, timeZone);
    opportunities = await fetchDealsForExport(supabase, orgId, request, timeZone);
    opportunities = opportunities.filter((deal) => !request.stage || normalizeStageName(deal.pipeline_stages?.name ?? deal.stage_name) === normalizeStageName(request.stage));
    meetings = await fetchMeetingsForExport(supabase, orgId, request, timeZone);
    proposals = await fetchQuotesForExport(supabase, orgId, request, timeZone);
    followUps = await fetchTasksForExport(supabase, orgId, request, timeZone);
    negotiations = await fetchNegotiationsForExport(supabase, orgId, request, timeZone);
    won = opportunities.filter(isClosedWon);
    lost = opportunities.filter(isClosedLost);
  }

  for (const deal of opportunities) {
    deal.owner_name = deal.owner_name || owners[deal.owner_id]?.name || "—";
    deal.stage_name = normalizeStageName(deal.pipeline_stages?.name ?? deal.stage_name);
    deal.customer_name = deal.customer_name || deal.contacts?.full_name || "—";
    deal.company_name = deal.company_name || deal.companies?.name || "—";
  }

  if (scope === "leads" || scope === "lead") {
    if (request.format === "pdf") {
      const doc = new PDFDocument({ size: "A4", margin: 36, layout: "portrait" });
      doc.fontSize(18).fillColor("#0f172a").text("FINLONEXA CRM", { align: "left" });
      doc.fontSize(14).text("Lead Export");
      doc.fontSize(9).fillColor("#475569").text(`Generated: ${new Date().toLocaleString()}`);
      doc.text(`Generated By: ${userData.user.email ?? "User"}`);
      doc.text(`Report Period: ${periodLabel}`);
      doc.moveDown(1);
      drawTable(doc, ["Customer", "Company", "Source", "Owner", "Stage", "Created Date"], leads.slice(0, 50).map((lead) => [
        safeText(lead.full_name ?? lead.email ?? "Customer"),
        safeText(lead.company_name),
        safeText(lead.source),
        safeText(lead.owner_id ? "Owner" : "—"),
        safeText(lead.status),
        formatDate(lead.created_at),
      ]), { rowHeight: 18, widths: [110, 110, 80, 80, 70, 75] });
      const buffer = await finalizePdf(doc);
      return {
        filename: `${sanitizeFileName(scope === "lead" ? "FinloNexa-Lead" : "FinloNexa-Leads")}-${new Date().toISOString().slice(0, 10)}.pdf`,
        buffer,
        contentType: "application/pdf",
      };
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Leads");
    sheet.columns = [
      { header: "Customer", key: "customer", width: 24 },
      { header: "Company", key: "company", width: 20 },
      { header: "Source", key: "source", width: 18 },
      { header: "Owner", key: "owner", width: 18 },
      { header: "Stage", key: "stage", width: 18 },
      { header: "Created Date", key: "created_at", width: 20 },
    ];
    leads.forEach((lead) => sheet.addRow({
      customer: safeText(lead.full_name ?? lead.email ?? "Customer"),
      company: safeText(lead.company_name),
      source: safeText(lead.source),
      owner: safeText(lead.owner_id ? "Owner" : "—"),
      stage: safeText(lead.status),
      created_at: lead.created_at ? new Date(lead.created_at) : null,
    }));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      filename: `${sanitizeFileName(scope === "lead" ? "FinloNexa-Lead" : "FinloNexa-Leads")}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      buffer: Buffer.from(buffer),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  if (scope === "opportunities" || scope === "opportunity") {
    if (request.format === "pdf") {
      const deal = opportunities[0];
      if (scope === "opportunity" && request.id && deal) {
        const buffer = await renderSingleOpportunityPdf({
          deal,
          lead: singleOpportunityLead,
          meetings,
          proposals,
          followUps,
          activities: singleOpportunityActivities,
          generatedBy: userData.user.email ?? "User",
          timeZone,
        });
        return {
          filename: `FinloNexa-Opportunity-${sanitizeFileName(deal.name)}.pdf`,
          buffer,
          contentType: "application/pdf",
        };
      }

      const doc = new PDFDocument({ size: "A4", margin: 42 });
      doc.fontSize(18).fillColor("#0f172a").text("FINLONEXA CRM", { align: "left" });
      doc.fontSize(14).text("Opportunity Export");
      doc.fontSize(9).fillColor("#475569").text(`Generated: ${new Date().toLocaleString()}`);
      doc.text(`Generated By: ${userData.user.email ?? "User"}`);
      doc.text(`Report Period: ${periodLabel}`);
      doc.moveDown(1);
      drawTable(doc, ["Opportunity", "Customer", "Stage", "Value", "Owner"], opportunities.slice(0, 50).map((item) => [
        safeText(item.name), safeText(item.customer_name ?? item.contacts?.full_name ?? "Customer"), safeText(item.stage_name ?? item.pipeline_stages?.name ?? "Unknown"), formatCurrency(Number(item.value ?? 0), item.currency ?? "PKR"), safeText(item.owner_name || "—"),
      ]), { rowHeight: 18, widths: [145, 120, 105, 85, 58] });
      const buffer = await finalizePdf(doc);
      return {
        filename: `FinloNexa-Opportunities-${new Date().toISOString().slice(0, 10)}.pdf`,
        buffer,
        contentType: "application/pdf",
      };
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Opportunities");
    sheet.columns = [
      { header: "Opportunity", key: "opportunity", width: 26 },
      { header: "Customer", key: "customer", width: 24 },
      { header: "Company", key: "company", width: 24 },
      { header: "Stage", key: "stage", width: 18 },
      { header: "Value", key: "value", width: 14 },
      { header: "Owner", key: "owner", width: 18 },
      { header: "Expected Close", key: "expected_close", width: 18 },
      { header: "Created Date", key: "created_at", width: 20 },
    ];
    opportunities.forEach((deal) => sheet.addRow({
      opportunity: safeText(deal.name),
      customer: safeText(deal.primary_contact_name ?? deal.customer_name ?? "Customer"),
      company: safeText(deal.companies?.name ?? deal.company_name),
      stage: safeText(deal.pipeline_stages?.name ?? deal.stage_name),
      value: Number(deal.value ?? 0),
      owner: safeText(deal.owner_id ? "Owner" : "—"),
      expected_close: deal.expected_close_date ? new Date(deal.expected_close_date) : null,
      created_at: deal.created_at ? new Date(deal.created_at) : null,
    }));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      filename: `${sanitizeFileName(scope === "opportunity" ? "FinloNexa-Opportunity" : "FinloNexa-Opportunities")}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      buffer: Buffer.from(buffer),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  const report = {
    leads,
    opportunities,
    meetings,
    proposals,
    followUps,
    negotiations,
    won,
    lost,
    generatedBy: userData.user.email ?? "User",
    periodLabel,
    organizationName,
    timeZone,
  };

  if (request.format === "pdf") {
    const pdf = await renderPdfSalesReport(report);
    return {
      filename: `FinloNexa-Sales-Report-${new Date().toISOString().slice(0, 10)}.pdf`,
      buffer: pdf,
      contentType: "application/pdf",
    };
  }

  const workbook = await buildXlsxWorkbook(report);
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    filename: `FinloNexa-Sales-Report-${new Date().toISOString().slice(0, 10)}.xlsx`,
    buffer: Buffer.from(buffer),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}
