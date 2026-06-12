import "server-only";
import { getDb, userPermissions, auditLogs } from "@crm/db";
import { and, eq } from "drizzle-orm";
import { PERMISSION_KEYS, type PermissionKey, PERMISSION_LABELS, AUDIT_ACTION_LABELS } from "./permission-constants";

export { PERMISSION_KEYS, PERMISSION_LABELS, AUDIT_ACTION_LABELS, type PermissionKey } from "./permission-constants";

export async function getUserPermissions(userId: string, role: string): Promise<Set<PermissionKey>> {
  if (role === "admin") return new Set(PERMISSION_KEYS);
  
  const db = getDb();
  const rows = await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
  const granted = new Set<PermissionKey>();
  for (const r of rows) {
    if (r.granted && (PERMISSION_KEYS as readonly string[]).includes(r.permissionKey)) {
      granted.add(r.permissionKey as PermissionKey);
    }
  }
  return granted;
}

export async function hasPermission(userId: string, role: string, key: PermissionKey): Promise<boolean> {
  if (role === "admin") return true;
  const db = getDb();
  const rows = await db
    .select()
    .from(userPermissions)
    .where(and(eq(userPermissions.userId, userId), eq(userPermissions.permissionKey, key)))
    .limit(1);
  return rows[0]?.granted ?? false;
}

export async function logAudit(input: {
  userId?: string | null;
  userName?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
}): Promise<void> {
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      userId: input.userId ?? null,
      userName: input.userName ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      details: input.details,
    });
  } catch {
    // swallow — auditing must never break the main flow
  }
}
