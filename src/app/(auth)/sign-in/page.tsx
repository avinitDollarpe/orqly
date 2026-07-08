import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getSession } from "@/lib/session";

export default async function SignInPage() {
  if (await getSession()) redirect("/");
  return (
    <AuthForm mode="sign-in" googleEnabled={!!process.env.GOOGLE_CLIENT_ID} />
  );
}
