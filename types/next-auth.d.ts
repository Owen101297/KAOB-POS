import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      rol: string;
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rol?: string;
    userId?: string;
  }
}
