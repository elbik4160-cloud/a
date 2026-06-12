import { pgTable, text, timestamp, boolean, serial, integer } from "drizzle-orm/pg-core";

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  // App-specific user fields
  role: text("role").notNull().default("sales"), // 'admin' | 'sales'
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  requestedRole: text("requestedRole").notNull().default("sales"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// --- App tables ------------------------------------------------------------

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  clientId: text("clientId").notNull().unique(),
  name: text("name").notNull(),
  countryCode: text("countryCode"),
  phone: text("phone"),
  countryCode2: text("countryCode2"),
  phone2: text("phone2"),
  request: text("request"),
  notes: text("notes"),
  chooseSales: text("chooseSales"),
  createdBy: text("createdBy").notNull(),
  createdByName: text("createdByName"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const clientQueue = pgTable("client_queue", {
  id: serial("id").primaryKey(),
  clientId: text("clientId").notNull(),
  salesUserId: text("salesUserId").notNull(),
  salesEmail: text("salesEmail").notNull(),
  salesName: text("salesName").notNull(),
  startTs: timestamp("startTs").notNull(),
  endTs: timestamp("endTs").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const clientLocks = pgTable("client_locks", {
  id: serial("id").primaryKey(),
  clientId: text("clientId").notNull().unique(),
  salesUserId: text("salesUserId").notNull(),
  salesEmail: text("salesEmail").notNull(),
  salesName: text("salesName").notNull(),
  lockTime: timestamp("lockTime").notNull().defaultNow(),
});

export const clientBlocks = pgTable("client_blocks", {
  id: serial("id").primaryKey(),
  clientId: text("clientId").notNull(),
  salesEmail: text("salesEmail").notNull(),
  blockUntil: timestamp("blockUntil").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  clientId: text("clientId").notNull(),
  salesUserId: text("salesUserId").notNull(),
  salesName: text("salesName").notNull(),
  salesEmail: text("salesEmail").notNull(),
  clientData: text("clientData"),
  clientStatus: text("clientStatus").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  messageText: text("messageText").notNull(),
  isDeleted: boolean("isDeleted").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// --- Leads / Pipeline module ----------------------------------------------

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  phone2: text("phone2"),
  project: text("project"),
  unitType: text("unitType"),
  budget: text("budget"),
  area: text("area"),
  source: text("source").notNull().default("Other"),
  notes: text("notes"),
  status: text("status").notNull().default("New"),
  assignedToId: text("assignedToId"),
  assignedToName: text("assignedToName"),
  assignedAt: timestamp("assignedAt"),
  statusChangedAt: timestamp("statusChangedAt").notNull().defaultNow(),
  createdById: text("createdById").notNull(),
  createdByName: text("createdByName"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId").notNull(),
  userId: text("userId").notNull(),
  userName: text("userName").notNull(),
  type: text("type").notNull(),
  notes: text("notes"),
  outcome: text("outcome"),
  nextAction: text("nextAction"),
  followUpAt: timestamp("followUpAt"),
  durationMin: integer("durationMin"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const leadDelays = pgTable("lead_delays", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId").notNull(),
  userId: text("userId").notNull(),
  reason: text("reason").notNull(),
  reasonNote: text("reasonNote"),
  resumeAt: timestamp("resumeAt").notNull(),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// --- Resale market ---------------------------------------------------------

export const resaleListings = pgTable("resale_listings", {
  id: serial("id").primaryKey(),
  projectName: text("projectName").notNull(),
  unitType: text("unitType").notNull(),
  floor: integer("floor"),
  area: text("area"),
  price: text("price"),
  finishing: text("finishing"),
  description: text("description"),
  images: text("images"),
  ownerNameEnc: text("ownerNameEnc").notNull(),
  ownerPhoneEnc: text("ownerPhoneEnc").notNull(),
  ownerIdEnc: text("ownerIdEnc"),
  status: text("status").notNull().default("Pending"),
  uploadedById: text("uploadedById").notNull(),
  uploadedByName: text("uploadedByName"),
  assignedToId: text("assignedToId"),
  assignedToName: text("assignedToName"),
  assignedAt: timestamp("assignedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- Permissions, notifications, comments, audit, chat moderation ----------

export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  permissionKey: text("permissionKey").notNull(),
  granted: boolean("granted").notNull().default(true),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  titleAr: text("titleAr").notNull(),
  body: text("body").notNull(),
  bodyAr: text("bodyAr").notNull(),
  type: text("type").notNull(),
  refId: text("refId"),
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId"),
  fromUserId: text("fromUserId").notNull(),
  fromUserName: text("fromUserName").notNull(),
  toUserId: text("toUserId").notNull(),
  text: text("text").notNull(),
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: text("userId"),
  userName: text("userName"),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: text("entityId"),
  details: text("details"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const chatPermissions = pgTable("chat_permissions", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull().unique(),
  isMuted: boolean("isMuted").notNull().default(false),
  isBanned: boolean("isBanned").notNull().default(false),
  joinedAt: timestamp("joinedAt").notNull().defaultNow(),
});

// --- Sales targets (monthly missions / KPI goals) --------------------------

export const salesTargets = pgTable("sales_targets", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  periodMonth: text("periodMonth").notNull(),
  callsTarget: integer("callsTarget").notNull().default(0),
  whatsappTarget: integer("whatsappTarget").notNull().default(0),
  meetingsTarget: integer("meetingsTarget").notNull().default(0),
  dealsTarget: integer("dealsTarget").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type Client = typeof clients.$inferSelect;
export type QueueSlot = typeof clientQueue.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type AppUser = typeof user.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type LeadDelay = typeof leadDelays.$inferSelect;
export type ResaleListing = typeof resaleListings.$inferSelect;
export type UserPermission = typeof userPermissions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ChatPermission = typeof chatPermissions.$inferSelect;
export type SalesTarget = typeof salesTargets.$inferSelect;
