import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PlanCreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // This layout provides a clean, focused experience
  // without the dashboard sidebar/nav
  return <>{children}</>;
}
