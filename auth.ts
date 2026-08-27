import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { Rol } from "@prisma/client";
import { puedeAccederRuta, obtenerRutaInicial } from "@/lib/permissions";

const DEMO_USERS: Record<string, { pass: string; nombre: string; rol: Rol }> = {
  "admin@kaob.com": { pass: "Admin123!", nombre: "Administrador KAOB", rol: Rol.ADMIN },
  "gerente@kaob.com": { pass: "Gerente123!", nombre: "Gerente General", rol: Rol.GERENTE },
  "cajero@kaob.com": { pass: "Cajero123!", nombre: "Cajero Principal", rol: Rol.CAJERO },
  "vendedor@kaob.com": { pass: "Vendedor123!", nombre: "Vendedor de Mostrador", rol: Rol.VENDEDOR },
  "bodega@kaob.com": { pass: "Bodega123!", nombre: "Encargado de Bodega", rol: Rol.BODEGUERO },
};

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

        // Si es uno de los usuarios demo del sistema y aún no existe en BD
        if (!user && DEMO_USERS[email] && password === DEMO_USERS[email].pass) {
          const config = DEMO_USERS[email];
          const passwordHash = await bcrypt.hash(config.pass, 12);
          user = await db.usuario.upsert({
            where: { email },
            update: {
              passwordHash,
              activo: true,
              rol: config.rol,
            },
            create: {
              email,
              nombre: config.nombre,
              passwordHash,
              rol: config.rol,
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
          rol: user.rol,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rol = user.rol || "CAJERO";
        token.userId = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.rol = (token.rol as string) ?? "CAJERO";
        session.user.id = (token.userId as string) ?? (token.sub as string);
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const userRol = (auth?.user?.rol || "CAJERO") as string;

      // Permitir rutas públicas
      const publicPaths = ["/login", "/register", "/api/auth", "/api/health", "/api/media"];
      const isPublic =
        publicPaths.some((p) => pathname.startsWith(p)) ||
        pathname.startsWith("/tienda");

      // Si ya está logueado e intenta ir a /login, redirigir a su ruta inicial
      if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
        const target = obtenerRutaInicial(userRol);
        return Response.redirect(new URL(target, request.url));
      }

      if (isPublic) return true;
      if (!isLoggedIn) return Response.redirect(new URL("/login", request.url));

      // Si está logueado, validar si tiene permiso para la ruta
      if (!puedeAccederRuta(userRol, pathname)) {
        const fallbackUrl = obtenerRutaInicial(userRol);
        return Response.redirect(new URL(fallbackUrl, request.url));
      }

      return true;
    },
  },
});
