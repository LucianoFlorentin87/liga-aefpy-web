import { NextRequest, NextResponse } from "next/server";
import { sendPendingNotificationEmails } from "@/lib/notifications";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const secret = process.env.NOTIFICATION_JOB_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const result = await sendPendingNotificationEmails();
  return NextResponse.json(result);
}
