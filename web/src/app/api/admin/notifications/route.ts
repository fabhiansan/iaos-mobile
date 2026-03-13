import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createBroadcastNotification, buildNotificationLink } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, message } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    await createBroadcastNotification({
      title,
      message: message || null,
      type: "announcement",
      link: buildNotificationLink("announcement"),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
