// DEPRECATED: This file is kept for reference only.
// All authentication and data operations should go through lib/api.ts
// which communicates with the Hono backend (apps/api/).
//
// The backend handles:
// - Auth via Better Auth with JWT tokens
// - Database operations via Drizzle ORM
// - RLS policies enforced server-side
//
// Direct Supabase client usage has been removed to ensure:
// 1. Consistent auth between web and mobile
// 2. Server-side permission checks
// 3. Audit logging
// 4. No client-side RLS bypass

throw new Error("Direct Supabase access is deprecated. Use lib/api.ts instead.");
