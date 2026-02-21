/* eslint-disable fp/no-nil,fp/no-unused-expression */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, jwt, oidcProvider, openAPI, twoFactor } from 'better-auth/plugins';

import { db } from '../database/index.js';
import { API_ID } from './consts.js';

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
};

const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

const splitCsv = (value: string | undefined): Array<string> =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0) ?? [];

const appName = API_ID;
const baseURL = process.env.BETTER_AUTH_BASE_URL!;
const basePath = process.env.BETTER_AUTH_BASE_PATH ?? '/api/auth';
const oidcIssuer = process.env.BETTER_AUTH_OIDC_ISSUER ?? 'https://auth.konker.dev/oidc';
const secureCookies = parseBoolean(process.env.BETTER_AUTH_SECURE_COOKIES, true);

const sameSite = (() => {
  const value = process.env.BETTER_AUTH_COOKIE_SAMESITE?.toLowerCase();
  if (value === 'strict' || value === 'none' || value === 'lax') {
    return value;
  }
  return 'lax';
})();

const sessionCookieCacheMaxAgeSeconds = parseNumber(process.env.BETTER_AUTH_SESSION_COOKIE_CACHE_MAX_AGE_SECONDS, 300);
const accessTokenTtlSeconds = parseNumber(process.env.BETTER_AUTH_OIDC_ACCESS_TOKEN_TTL_SECONDS, 15 * 60);
const idTokenTtlSeconds = parseNumber(process.env.BETTER_AUTH_OIDC_ID_TOKEN_TTL_SECONDS, 15 * 60);
const refreshTokenTtlSeconds = parseNumber(process.env.BETTER_AUTH_OIDC_REFRESH_TOKEN_TTL_SECONDS, 30 * 24 * 60 * 60);
const oidcCodeTtlSeconds = parseNumber(process.env.BETTER_AUTH_OIDC_CODE_TTL_SECONDS, 10 * 60);

const trustedOrigins = Array.from(new Set([baseURL, ...splitCsv(process.env.BETTER_AUTH_TRUSTED_ORIGINS)]));

const socialProviders = {
  ...(process.env.BETTER_AUTH_GOOGLE_CLIENT_ID && process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.BETTER_AUTH_GOOGLE_CLIENT_ID,
          clientSecret: process.env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.BETTER_AUTH_APPLE_CLIENT_ID && process.env.BETTER_AUTH_APPLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.BETTER_AUTH_APPLE_CLIENT_ID,
          clientSecret: process.env.BETTER_AUTH_APPLE_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = betterAuth({
  appName,
  baseURL,
  basePath,
  debug: true,
  logger: {
    level: 'debug',
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: parseNumber(process.env.BETTER_AUTH_RESET_PASSWORD_TOKEN_EXPIRES_SECONDS, 900),
    revokeSessionsOnPasswordReset: true,
  },
  socialProviders,
  session: {
    expiresIn: refreshTokenTtlSeconds,
    cookieCache: {
      enabled: true,
      strategy: 'jwt',
      maxAge: sessionCookieCacheMaxAgeSeconds,
    },
  },
  advanced: {
    useSecureCookies: secureCookies,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite,
      secure: secureCookies,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.info('[auth] user.create', { userId: user.id });
        },
      },
      update: {
        after: async (user) => {
          console.info('[auth] user.update', { userId: user.id });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          console.info('[auth] session.create', {
            sessionId: session.id,
            userId: session.userId,
          });
        },
      },
      delete: {
        after: async (session) => {
          console.info('[auth] session.delete', {
            sessionId: session.id,
            userId: session.userId,
          });
        },
      },
    },
  },
  plugins: [
    admin(),
    openAPI(),
    twoFactor({
      issuer: appName,
      otpOptions: {},
    }),
    jwt({
      jwks: {
        rotationInterval: 90 * 24 * 60 * 60,
        gracePeriod: 180 * 24 * 60 * 60,
      },
      jwt: {
        issuer: oidcIssuer,
        expirationTime: `${idTokenTtlSeconds}s`,
      },
      disableSettingJwtHeader: true,
    }),
    oidcProvider({
      loginPage: '/sign-in',
      metadata: {
        issuer: oidcIssuer,
      },
      scopes: ['openid', 'profile', 'email', 'roles'],
      defaultScope: 'openid profile email',
      accessTokenExpiresIn: accessTokenTtlSeconds,
      refreshTokenExpiresIn: refreshTokenTtlSeconds,
      codeExpiresIn: oidcCodeTtlSeconds,
      getAdditionalUserInfoClaim: (user, scopes) => {
        if (!scopes.includes('roles')) {
          return {};
        }
        const role = typeof user.role === 'string' ? user.role : undefined;
        const roles = Array.isArray(user.roles)
          ? user.roles.filter((item): item is string => typeof item === 'string')
          : role
            ? [role]
            : [];
        return roles.length > 0 ? { roles } : {};
      },
      useJWTPlugin: true,
    }),
  ],
});
