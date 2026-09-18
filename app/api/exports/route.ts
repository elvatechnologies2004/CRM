import { NextResponse } from "next/server";

import { generateExportBundle, type ExportRequest } from "@/lib/export/report";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ExportRequest>;
    const scope = body.scope || "sales_report";
    const format = body.format || "pdf";

    const bundle = await generateExportBundle({
      scope,
      format,
      id: body.id,
      from: body.from,
      to: body.to,
      ownerId: body.ownerId,
      stage: body.stage,
      source: body.source,
      outcome: body.outcome,
    });

    return new NextResponse(new Uint8Array(bundle.buffer), {
      headers: {
        "Content-Type": bundle.contentType,
        "Content-Disposition": `attachment; filename="${bundle.filename}"`,
        "Cache-Control": "no-store",
        "X-Export-Filename": bundle.filename,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate export.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
