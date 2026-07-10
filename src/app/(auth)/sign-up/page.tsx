import { redirect } from "next/navigation";
import { ProgressiveAuthForm } from "@/components/auth/ProgressiveAuthForm";
import { getSession } from "@/lib/session";

// Same progressive flow as sign-in: email OTP creates the account on first
// verify, so a separate password sign-up form is not needed.
export default async function SignUpPage() {
  if (await getSession()) redirect("/");
  return (
    <ProgressiveAuthForm
      githubEnabled={!!process.env.GITHUB_CLIENT_ID}
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
    />
  );
}
