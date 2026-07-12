import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
<<<<<<< Updated upstream
import { prisma } from "@/lib/prisma";
=======
import { prisma } from "@/lib/db";
>>>>>>> Stashed changes

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite", 
  }),
  emailAndPassword: {
    enabled: true,
  },
});
