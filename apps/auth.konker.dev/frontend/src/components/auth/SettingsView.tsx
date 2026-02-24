import {
  AccountSettingsCards,
  RedirectToSignIn,
  SecuritySettingsCards,
  SignedIn,
  SignedOut,
} from 'better-auth-ui';

import { AuthShell } from './AuthShell';

export function SettingsView() {
  return (
    <AuthShell>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="mx-auto grid w-full max-w-3xl gap-4">
          <AccountSettingsCards />
          <SecuritySettingsCards />
        </div>
      </SignedIn>
    </AuthShell>
  );
}
