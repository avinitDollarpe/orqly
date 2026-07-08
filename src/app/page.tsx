import { redirect } from "next/navigation";
import { Builder } from "@/components/Builder";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return (
    <Builder userName={session.user.name} userEmail={session.user.email} />
  );
}
