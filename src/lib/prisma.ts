import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Initialize Turso (LibSQL) client
// Supports both local file URLs (file:./local.db) and remote Turso URLs (libsql://...)
const libsql = createClient({
  url: process.env.DATABASE_URL || "file:./instance/transitops.sqlite",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSQL(libsql);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
