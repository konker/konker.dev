import { AuthUIProvider, type AuthViewPaths } from 'better-auth-ui';
import type { ReactNode } from 'react';

import { authClient } from '@/lib/auth-client.ts';

const viewPaths: Partial<AuthViewPaths> = {
  FORGOT_PASSWORD: 'forgot-password',
  MAGIC_LINK: 'magic-link',
  RESET_PASSWORD: 'reset-password',
  SIGN_IN: 'sign-in',
  SIGN_OUT: 'sign-out',
  SIGN_UP: 'sign-up',
};

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <AuthUIProvider authClient={authClient} basePath="" viewPaths={viewPaths}>
      {children}
    </AuthUIProvider>
  );
}
