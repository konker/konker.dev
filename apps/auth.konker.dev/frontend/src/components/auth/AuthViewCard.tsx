import { AuthView, type AuthViewPath } from 'better-auth-ui';
import { Toaster } from 'sonner';

import { AuthShell } from './AuthShell';

type AuthViewCardProps = {
  view: AuthViewPath;
};

export function AuthViewCard({ view }: AuthViewCardProps) {
  return (
    <AuthShell>
      <AuthView view={view} />
      <Toaster />
    </AuthShell>
  );
}
