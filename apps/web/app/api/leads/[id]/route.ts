import { NextRequest, NextResponse } from "next/server";
import { auth } from "@crm/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await import("@crm/db");
    const { leads } = await import("@crm/db/schema");
    const { eq } = await import("drizzle-orm");

    const [lead] = await db.select().from(leads).where(eq(leads.id, parseInt(params.id)));

    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { db } = await import("@crm/db");
    const { leads } = await import("@crm/db/schema");
    const { eq } = await import("drizzle-orm");

    const [lead] = await db.update(leads)
      .set({ ...body, statusChangedAt: new Date() })
      .where(eq(leads.id, parseInt(params.id)))
      .returning();

    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
