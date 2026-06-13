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
    const { user, clients, leads, feedback, clientLocks } = await import("@crm/db/schema");
    const { eq, sql, desc } = await import("drizzle-orm");

    const isAdmin = session.user.role === "admin";

    const [
      totalClientsResult,
      myClientsResult,
      myLeadsResult,
      activeLocksResult,
      myFeedbackResult,
      pendingUsersResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(clients),
      isAdmin
        ? db.select({ count: sql<number>`count(*)::int` }).from(clients)
        : db.select({ count: sql<number>`count(*)::int` }).from(clients).where(eq(clients.createdBy, session.user.id)),
      db.select({ count: sql<number>`count(*)::int` }).from(leads).where(eq(leads.assignedToId, session.user.id)),
      db.select({ count: sql<number>`count(*)::int` }).from(clientLocks),
      db.select({ count: sql<number>`count(*)::int` }).from(feedback).where(eq(feedback.salesUserId, session.user.id)),
      isAdmin
        ? db.select({ count: sql<number>`count(*)::int` }).from(user).where(eq(user.status, "pending"))
        : Promise.resolve([{ count: 0 }]),
    ]);

    const recentFeedback = await db.select()
      .from(feedback)
      .orderBy(desc(feedback.createdAt))
      .limit(5);

    return NextResponse.json({
      totalClients: totalClientsResult[0]?.count ?? 0,
      myClients: myClientsResult[0]?.count ?? 0,
      activeLocks: activeLocksResult[0]?.count ?? 0,
      myFeedback: myFeedbackResult[0]?.count ?? 0,
      pendingUsers: pendingUsersResult[0]?.count ?? 0,
      myLeads: myLeadsResult[0]?.count ?? 0,
      recentFeedback: recentFeedback.map((fb) => ({
        id: fb.id,
        salesName: fb.salesName,
        notes: fb.notes,
        clientStatus: fb.clientStatus,
        createdAt: fb.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
