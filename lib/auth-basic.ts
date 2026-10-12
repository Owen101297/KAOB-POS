const AUTH_USER_ENV = "KAOB_POS_AUTH_USER";
const AUTH_PASSWORD_ENV = "KAOB_POS_AUTH_PASSWORD";

export function isBasicAuthConfigured(): boolean {
  const username = process.env[AUTH_USER_ENV];
  const password = process.env[AUTH_PASSWORD_ENV];

  return Boolean(
    username &&
      username.trim() === username &&
      !username.includes(":") &&
      password &&
      password.length >= 16
  );
}

export function isDevelopmentAuthBypassAllowed(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    !process.env[AUTH_USER_ENV] &&
    !process.env[AUTH_PASSWORD_ENV]
  );
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return difference === 0;
}

function decodeBasicCredentials(header: string | null): { username: string; password: string } | null {
  if (!header) return null;

  const match = /^Basic\s+([A-Za-z0-9+/]+={0,2})$/i.exec(header.trim());
  if (!match) return null;

  try {
    const binary = atob(match[1]);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const separator = decoded.indexOf(":");
    if (separator <= 0) return null;

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

export function isBasicAuthAuthorized(header: string | null): boolean {
  const expectedUsername = process.env[AUTH_USER_ENV];
  const expectedPassword = process.env[AUTH_PASSWORD_ENV];
  const supplied = decodeBasicCredentials(header);

  if (!expectedUsername || !expectedPassword || !supplied) return false;

  const usernameMatches = constantTimeEqual(supplied.username, expectedUsername);
  const passwordMatches = constantTimeEqual(supplied.password, expectedPassword);
  return usernameMatches && passwordMatches;
}
