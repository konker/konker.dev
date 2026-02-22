import { AuthUIProvider, AuthView } from 'better-auth-ui';

import { authClient } from '../../lib/auth-client';

export function AuthViewCard() {
  return (
    <AuthUIProvider authClient={authClient}>
      <div className="mx-auto w-full max-w-md rounded-xl border border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
        <AuthView view="SIGN_IN" />
      </div>
    </AuthUIProvider>
  );
}
