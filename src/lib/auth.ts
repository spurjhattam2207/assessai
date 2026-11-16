import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface User {
    role: "EDUCATOR" | "STUDENT";
    isDemo: boolean;
    audience?: "JEE" | "UPSC" | "COLLEGE";
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "EDUCATOR" | "STUDENT";
      isDemo: boolean;
      audience?: "JEE" | "UPSC" | "COLLEGE";
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").toLowerCase().trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({
          where: { email },
          include: { profile: true },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isDemo: user.isDemo,
          audience: user.profile?.audience,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          role: "EDUCATOR" | "STUDENT";
          isDemo: boolean;
          audience?: "JEE" | "UPSC" | "COLLEGE";
        };
        token.id = u.id;
        token.role = u.role;
        token.isDemo = u.isDemo;
        token.audience = u.audience;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.id || "");
      session.user.role = (token.role as "EDUCATOR" | "STUDENT") || "STUDENT";
      session.user.isDemo = Boolean(token.isDemo);
      session.user.audience = token.audience as "JEE" | "UPSC" | "COLLEGE" | undefined;
      return session;
    },
  },
});
