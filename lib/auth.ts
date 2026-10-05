import { headers } from "next/headers";
import {
  isBasicAuthAuthorized,
  isBasicAuthConfigured,
  isDevelopmentAuthBypassAllowed,
} from "@/lib/auth-basic";

export class UnauthorizedError extends Error {
  constructor() {
    super("Se requiere autenticación para realizar esta operación.");
    this.name = "UnauthorizedError";
  }
}

export class AuthenticationConfigurationError extends Error {
  constructor() {
    super("La autenticación de KAOB-POS no está configurada.");
    this.name = "AuthenticationConfigurationError";
  }
}

export async function requireAuth(): Promise<void> {
  if (isDevelopmentAuthBypassAllowed()) return;
  if (!isBasicAuthConfigured()) throw new AuthenticationConfigurationError();
  if (!isBasicAuthAuthorized(headers().get("authorization"))) throw new UnauthorizedError();
}
