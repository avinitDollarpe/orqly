import { redirect } from "next/navigation";
import { ProgressiveAuthForm } from "@/components/auth/ProgressiveAuthForm";
import { getSession } from "@/lib/session";

export default async function SignInPage() {
  if (await getSession()) redirect("/");
  return (
    <ProgressiveAuthForm
      githubEnabled={!!process.env.GITHUB_CLIENT_ID}
      googleEnabled={!!process.env.GOOGLE_CLIENT_ID}
    />
  );
}
