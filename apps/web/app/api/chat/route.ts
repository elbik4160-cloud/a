import { NextRequest, NextResponse } from "next/server";
import { auth } from "@crm/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await import("@crm/db");
    const { chatMessages } = await import("@crm/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.isDeleted, false))
      .orderBy(desc(chatMessages.createdAt))
      .limit(100);

    return NextResponse.json(messages.reverse());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { db } = await import("@crm/db");
    const { chatMessages } = await import("@crm/db/schema");

    const [message] = await db.insert(chatMessages).values({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      messageText: body.messageText,
    }).returning();

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
