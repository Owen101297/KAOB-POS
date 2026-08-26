import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        let user = await db.usuario.findFirst({
          where: {
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
        });

        // Si la base de datos está vacía o el usuario admin inicial aún no ha sido creado por seed
        if (!user && email === "admin@kaob.com" && password === "Admin123!") {
          const passwordHash = await bcrypt.hash("Admin123!", 12);
          user = await db.usuario.upsert({
            where: { email: "admin@kaob.com" },
            update: {
              passwordHash,
              activo: true,
              rol: "ADMIN",
            },
            create: {
              email: "admin@kaob.com",
              nombre: "Administrador",
              passwordHash,
              rol: "ADMIN",
              activo: true,
              emailVerified: new Date(),
            },
          });
        }

        if (!user || !user.activo || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          image: user.imagen,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await db.usuario.findUnique({
          where: { id: user.id! },
          select: { rol: true, activo: true },
        });
        token.rol = dbUser?.rol ?? "CAJERO";
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.rol = token.rol as string;
        session.user.id = token.userId as string;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // Permitir rutas públicas
      const publicPaths = ["/login", "/register", "/api/auth"];
      const isPublic =
        publicPaths.some((p) => pathname.startsWith(p)) ||
        pathname.startsWith("/tienda");

      if (isPublic) return true;
      if (!isLoggedIn) return Response.redirect(new URL("/login", request.url));

      return true;
    },
  },
});
