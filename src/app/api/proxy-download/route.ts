import { NextRequest, NextResponse } from "next/server";

if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const BACKEND_INTERNAL_URL = (
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/?$/, "")
    : "") ||
  "https://devstridenex.quantcloud.in"
).replace(/\/$/, "");

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") || "stridenex-referral-card.png";

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let targetUrl = rawUrl;
  if (rawUrl.startsWith("/")) {
    targetUrl = `${BACKEND_INTERNAL_URL}${rawUrl}`;
  } else if (!/^https?:\/\//i.test(rawUrl)) {
    return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Failed to fetch file (${upstream.status})` },
        { status: upstream.status }
      );
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "image/png";
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Download proxy failed", details: String(error) },
      { status: 500 }
    );
  }
}

