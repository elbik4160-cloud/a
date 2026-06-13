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
    const { leads, leadActivities } = await import("@crm/db/schema");
    const { eq, desc, and, or, ilike } = await import("drizzle-orm");

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const conditions = [];

    // Non-admins only see their assigned leads
    if (session.user.role !== "admin") {
      conditions.push(eq(leads.assignedToId, session.user.id));
    }

    if (status) {
      conditions.push(eq(leads.status, status));
    }

    if (search) {
      conditions.push(or(
        ilike(leads.name, `%${search}%`),
        ilike(leads.phone, `%${search}%`)
      ));
    }

    const result = await db.select().from(leads)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(leads.createdAt));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to fetch leads:", error);
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
    const { leads } = await import("@crm/db/schema");

    const [lead] = await db.insert(leads).values({
      ...body,
      createdById: session.user.id,
      createdByName: session.user.name,
      status: "New",
      statusChangedAt: new Date(),
    }).returning();

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create lead:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
