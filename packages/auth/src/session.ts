import { auth } from "@crm/auth";
import { getDb, user as userTable } from "@crm/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  requestedRole: string;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const db = getDb();
  const rows = await db.select().from(userTable).where(eq(userTable.id, session.user.id)).limit(1);
  const u = rows[0];
  if (!u) return null;

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    requestedRole: u.requestedRole,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error("Unauthorized");
  return u;
}

export async function requireApprovedUser(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.status !== "approved") throw new Error("Account pending approval");
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireApprovedUser();
  if (u.role !== "admin") throw new Error("Admin access required");
  return u;
}
