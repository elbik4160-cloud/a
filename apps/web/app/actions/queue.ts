"use server"

import { db } from "@crm/db"
import { clients, clientLocks, clientQueue, clientBlocks } from "@crm/db"
import { requireApprovedUser } from "@crm/auth/session"
import { and, desc, eq, gt, lt } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// How long a claim/lock lasts before it auto-expires (minutes)
const LOCK_DURATION_MIN = 30
// How long a client is blocked from re-claiming after release (minutes)
const BLOCK_DURATION_MIN = 60

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

/**
 * Claim (lock) a client so the current sales rep can work on it.
 * Fails if the client is already locked by someone else and the lock is still active.
 */
export async function claimClient(clientId: string) {
  const user = await requireApprovedUser()
  const now = new Date()

  // Is there an active block for this client against this rep?
  const [block] = await db
    .select()
    .from(clientBlocks)
    .where(and(eq(clientBlocks.clientId, clientId), gt(clientBlocks.blockUntil, now)))
    .limit(1)
  if (block && block.salesEmail !== user.email) {
    return { ok: false, error: "هذا العميل محجوز مؤقتاً من قبل مندوب آخر." }
  }

  // Check existing lock
  const [existing] = await db
    .select()
    .from(clientLocks)
    .where(eq(clientLocks.clientId, clientId))
    .limit(1)

  if (existing) {
    const lockExpiry = addMinutes(new Date(existing.lockTime), LOCK_DURATION_MIN)
    const stillActive = lockExpiry > now
    if (stillActive && existing.salesUserId !== user.id) {
      return {
        ok: false,
        error: `العميل قيد العمل حالياً من قبل ${existing.salesName}.`,
      }
    }
    // Expired or owned by us -> take/refresh the lock
    await db
      .update(clientLocks)
      .set({
        salesUserId: user.id,
        salesEmail: user.email,
        salesName: user.name,
        lockTime: now,
      })
      .where(eq(clientLocks.clientId, clientId))
  } else {
    await db.insert(clientLocks).values({
      clientId,
      salesUserId: user.id,
      salesEmail: user.email,
      salesName: user.name,
      lockTime: now,
    })
  }

  // Record the queue slot
  await db.insert(clientQueue).values({
    clientId,
    salesUserId: user.id,
    salesEmail: user.email,
    salesName: user.name,
    startTs: now,
    endTs: addMinutes(now, LOCK_DURATION_MIN),
  })

  revalidatePath("/queue")
  revalidatePath("/clients")
  return { ok: true }
}

/**
 * Release a client lock. Optionally place a temporary block so it isn't
 * immediately re-claimed by the same rep.
 */
export async function releaseClient(clientId: string, block = false) {
  const user = await requireApprovedUser()
  const now = new Date()

  const [existing] = await db
    .select()
    .from(clientLocks)
    .where(eq(clientLocks.clientId, clientId))
    .limit(1)

  if (!existing) return { ok: true }
  if (existing.salesUserId !== user.id && user.role !== "admin") {
    return { ok: false, error: "لا يمكنك تحرير عميل يعمل عليه مندوب آخر." }
  }

  await db.delete(clientLocks).where(eq(clientLocks.clientId, clientId))

  if (block) {
    await db.insert(clientBlocks).values({
      clientId,
      salesEmail: user.email,
      blockUntil: addMinutes(now, BLOCK_DURATION_MIN),
    })
  }

  revalidatePath("/queue")
  revalidatePath("/clients")
  return { ok: true }
}

/** Clients the current rep is actively working on (their active locks). */
export async function getMyQueue() {
  const user = await requireApprovedUser()
  const now = new Date()
  const cutoff = addMinutes(now, -LOCK_DURATION_MIN)

  const rows = await db
    .select({
      lockId: clientLocks.id,
      clientId: clientLocks.clientId,
      lockTime: clientLocks.lockTime,
      clientName: clients.name,
      phone: clients.phone,
      countryCode: clients.countryCode,
      request: clients.request,
      notes: clients.notes,
    })
    .from(clientLocks)
    .leftJoin(clients, eq(clients.clientId, clientLocks.clientId))
    .where(and(eq(clientLocks.salesUserId, user.id), gt(clientLocks.lockTime, cutoff)))
    .orderBy(desc(clientLocks.lockTime))

  return rows.map((r) => ({
    ...r,
    expiresAt: addMinutes(new Date(r.lockTime), LOCK_DURATION_MIN),
  }))
}

/** All currently-active locks across the team (admin / awareness view). */
export async function getActiveLocks() {
  await requireApprovedUser()
  const now = new Date()
  const cutoff = addMinutes(now, -LOCK_DURATION_MIN)

  return db
    .select()
    .from(clientLocks)
    .where(gt(clientLocks.lockTime, cutoff))
    .orderBy(desc(clientLocks.lockTime))
}

/** Remove expired locks (housekeeping, callable from UI refresh). */
export async function purgeExpiredLocks() {
  await requireApprovedUser()
  const cutoff = addMinutes(new Date(), -LOCK_DURATION_MIN)
  await db.delete(clientLocks).where(lt(clientLocks.lockTime, cutoff))
  revalidatePath("/queue")
  return { ok: true }
}
