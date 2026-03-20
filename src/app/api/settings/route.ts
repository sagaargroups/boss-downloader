// ============================================
// API: Settings
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSetting } from "@/lib/db/supabase";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (err) {
    // Return defaults if Supabase unavailable
    return NextResponse.json({
      success: true,
      data: {
        defaultEngine: "ytdlp",
        defaultQuality: "best",
        defaultFormat: "mp4",
        downloadPath: "./downloads",
        maxConcurrent: 3,
      },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Key is required" },
        { status: 400 }
      );
    }

    const validKeys = [
      "defaultEngine",
      "defaultQuality",
      "defaultFormat",
      "downloadPath",
      "maxConcurrent",
      "supabaseUrl",
      "supabaseKey",
      "redisUrl",
      "redisToken",
    ];

    if (!validKeys.includes(key)) {
      return NextResponse.json(
        { success: false, error: `Invalid setting key: ${key}` },
        { status: 400 }
      );
    }

    await updateSetting(key, value);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update",
      },
      { status: 500 }
    );
  }
}
