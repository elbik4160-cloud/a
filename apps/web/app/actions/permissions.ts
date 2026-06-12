"use server"

import { db } from "@crm/db"
import { userPermissions, user as userTable } from "@crm/db"
import { requireAdmin } from "@crm/auth/session"
import { PERMISSION_KEYS, type PermissionKey } from "@crm/shared-lib"
import { logAudit } from "@crm/shared-lib/server"
import { and, asc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type PermMatrixRow = {
  userId: string
  name: string
  email: string
  role: string
  permissions: Record<string, boolean>
}

/** Returns every approved sales user with their full permission map. */
export async function getPermissionsMatrix(): Promise<PermMatrixRow[]> {
  await requireAdmin()
  const users = await db
    .select({ id: userTable.id, name: userTable.name, email: userTable.email, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.status, "approved"))
    .orderBy(asc(userTable.name))

  const allPerms = await db.select().from(userPermissions)

  return users.map((u) => {
    const map: Record<string, boolean> = {}
    for (const k of PERMISSION_KEYS) {
      if (u.role === "admin") {
        map[k] = true
      } else {
        const row = allPerms.find((p) => p.userId === u.id && p.permissionKey === k)
        map[k] = row?.granted ?? false
      }
    }
    return { userId: u.id, name: u.name, email: u.email, role: u.role, permissions: map }
  })
}

export async function setPermission(input: { userId: string; permissionKey: PermissionKey; granted: boolean }) {
  const me = await requireAdmin()
  if (!(PERMISSION_KEYS as readonly string[]).includes(input.permissionKey)) {
    return { ok: false, error: "Invalid permission" }
  }

  const existing = await db
    .select()
    .from(userPermissions)
    .where(and(eq(userPermissions.userId, input.userId), eq(userPermissions.permissionKey, input.permissionKey)))
    .limit(1)

  if (existing[0]) {
    await db
      .update(userPermissions)
      .set({ granted: input.granted })
      .where(eq(userPermissions.id, existing[0].id))
  } else {
    await db.insert(userPermissions).values({
      userId: input.userId,
      permissionKey: input.permissionKey,
      granted: input.granted,
    })
  }

  await logAudit({
    userId: me.id,
    userName: me.name,
    action: "PERMISSION_CHANGE",
    entity: "User",
    entityId: input.userId,
    details: `${input.permissionKey} = ${input.granted}`,
  })
  revalidatePath("/admin/permissions")
  return { ok: true }
}
