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
    const { clientLocks } = await import("@crm/db/schema");

    const locks = await db.select().from(clientLocks);
    return NextResponse.json(locks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
