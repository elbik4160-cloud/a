import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let poolInstance: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function initDB() {
  if (dbInstance) return dbInstance;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  dbInstance = drizzle(poolInstance, { schema });
  return dbInstance;
}

// Lazy singleton — only throws when actually accessed
export function getDb() {
  return initDB();
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return poolInstance;
}

// Direct instance for server-side code
export const db = new Proxy(
  {} as ReturnType<typeof drizzle>,
  {
    get: (target, prop) => {
      const instance = getDb();
      return (instance as any)[prop];
    }
  }
);

// Re-export schema types (safe to import anytime)
export * from "./schema";

export type DB = ReturnType<typeof drizzle>;
