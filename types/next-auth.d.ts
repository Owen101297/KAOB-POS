import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      rol: string;
      id: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    rol?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rol?: string;
    userId?: string;
  }
}
