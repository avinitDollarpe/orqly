import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

// passkeyClient removed with the sign-in passkey step — no registration UI
// exists yet, so the sign-in path was a dead end. Server plugin stays (schema).
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});
