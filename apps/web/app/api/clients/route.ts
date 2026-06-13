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
    const { clients, clientLocks } = await import("@crm/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const result = session.user.role === "admin"
      ? await db.select().from(clients).orderBy(desc(clients.createdAt))
      : await db.select().from(clients)
          .where(eq(clients.createdBy, session.user.id))
          .orderBy(desc(clients.createdAt));

    return NextResponse.json(result);
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
    const { clients } = await import("@crm/db/schema");

    const [client] = await db.insert(clients).values({
      ...body,
      createdBy: session.user.id,
      createdByName: session.user.name,
    }).returning();

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
