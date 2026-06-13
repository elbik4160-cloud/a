import { NextRequest, NextResponse } from "next/server";
import { auth } from "@crm/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Import dynamically to avoid build issues
    const { db } = await import("@crm/db");
    const { user } = await import("@crm/db/schema");
    const { eq } = await import("drizzle-orm");

    const [u] = await db.select().from(user).where(eq(user.id, session.user.id));

    return NextResponse.json(u || session.user);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
