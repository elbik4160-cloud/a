import { betterAuth } from "better-auth";
import { getDb, getPool, user as userTable } from "@crm/db";
import { sql } from "drizzle-orm";

const authSecret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
if (!authSecret && !process.env.BETTER_AUTH_SECRETS) {
  throw new Error(
    "Missing Better Auth secret. Set BETTER_AUTH_SECRET or AUTH_SECRET in your environment, or BETTER_AUTH_SECRETS for versioned secrets."
  );
}

export const auth = betterAuth({
  database: getPool(),
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          const db = getDb();
          const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(userTable);
          const isFirstUser = Number(count) === 0;
          if (isFirstUser) {
            return {
              data: {
                ...newUser,
                role: "admin",
                status: "approved",
                requestedRole: "admin",
              },
            };
          }
          return { data: newUser };
        },
      },
    },
  },
  ...(authSecret ? { secret: authSecret } : {}),
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "sales",
        input: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "pending",
        input: false,
      },
      requestedRole: {
        type: "string",
        required: false,
        defaultValue: "sales",
        input: true,
      },
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://*.vusercontent.net",
    "https://*.v0.dev",
    "https://*.v0.app",
    "https://*.vercel.app",
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
});
