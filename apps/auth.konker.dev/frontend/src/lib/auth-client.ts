import { createAuthClient } from 'better-auth/react';

const fallbackBaseURL = 'http://localhost:8787';

export const authClient = createAuthClient({
  baseURL: import.meta.env.PUBLIC_BETTER_AUTH_URL ?? fallbackBaseURL,
  basePath: '/api/auth',
  plugins: [],
});
