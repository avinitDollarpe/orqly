import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getSession } from "@/lib/session";

export default async function SignUpPage() {
  if (await getSession()) redirect("/");
  return (
    <AuthForm mode="sign-up" googleEnabled={!!process.env.GOOGLE_CLIENT_ID} />
  );
}
