import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (user) {
    redirect("/onboarding");
  }

  return <div className="min-h-screen">{children}</div>;
}
