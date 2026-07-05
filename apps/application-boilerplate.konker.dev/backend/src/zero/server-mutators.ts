import { mutators } from '@konker.dev/zero-sync-common.application-boilerplate.konker.dev/mutators';

// --------------------------------------------------------------------------
// Server-authoritative mutators. For this slice they are identical to the
// shared mutators (the same fn runs optimistically on the client and
// authoritatively here). Server-only overrides/side-effects would be added via
// `defineMutators(mutators, { ... })` — see zbugs `server/server-mutators.ts`.
export const serverMutators = mutators;
