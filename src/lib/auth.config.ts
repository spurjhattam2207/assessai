import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: "EDUCATOR" | "STUDENT";
          isDemo?: boolean;
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
} satisfies NextAuthConfig;
