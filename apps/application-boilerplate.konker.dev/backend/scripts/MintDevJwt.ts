/* eslint-disable */
/**
 * Mint a dev JWT for the manual, out-of-band auth flow.
 *
 * The token is HS256-signed with the shared secret (JWT_SIGNING_SECRET) and
 * issuer (JWT_ISSUER) that both zero-cache (ZERO_AUTH_SECRET) and the backend
 * /zero/* routes verify against. Paste the printed token into the frontend.
 *
 * Usage:
 *   pnpm run mint-jwt -- --sub user-1
 *   pnpm run mint-jwt -- --sub user-1 --ttl 86400
 */
import { SignJWT } from 'jose';

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const sub = getArg('sub') ?? 'dev-user-1';
const ttl = Number.parseInt(getArg('ttl') ?? '86400', 10);

const signingSecret = process.env.JWT_SIGNING_SECRET;
const issuer = process.env.JWT_ISSUER;
if (!signingSecret || !issuer) {
  console.error('JWT_SIGNING_SECRET and JWT_ISSUER must be set (run via dotenvx with .env.local.development)');
  process.exit(1);
}

const token = await new SignJWT({})
  .setProtectedHeader({ alg: 'HS256' })
  .setSubject(sub)
  .setIssuer(issuer)
  .setIssuedAt()
  .setExpirationTime(`${ttl}s`)
  .sign(new TextEncoder().encode(signingSecret));

console.error(`# JWT for sub="${sub}" issuer="${issuer}" ttl=${ttl}s`);
console.log(token);
