// ============================================
// API: URL Detection
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { detectPlatform, detectMultipleUrls } from "@/lib/url-detector";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, text } = body;

    // If raw text provided, parse URLs from it
    if (text && typeof text === "string") {
      const results = detectMultipleUrls(text);
      return NextResponse.json({ success: true, data: results });
    }

    // If URL array provided
    if (urls && Array.isArray(urls)) {
      const results = urls.map((url: string) => detectPlatform(url));
      return NextResponse.json({ success: true, data: results });
    }

    return NextResponse.json(
      { success: false, error: "Provide 'urls' array or 'text' string" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
