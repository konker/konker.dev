import { SignOut } from 'better-auth-ui';

import { AuthShell } from './AuthShell';

export function SignOutAction() {
  return (
    <AuthShell>
      <div className="flex items-center justify-center p-8 text-sm text-zinc-600">
        <SignOut />
      </div>
    </AuthShell>
  );
}
