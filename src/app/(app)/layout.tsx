import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData, getOnboardingStatus } from "@/lib/queries";
import { summary } from "@/lib/webdock";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 初期設定が未完了ならオンボーディングへ
  const { onboarded } = await getOnboardingStatus();
  if (!onboarded) redirect("/onboarding");

  const data = await getDashboardData();
  const companyName = data?.company.name ?? "—";
  const plan = data?.company.plan ?? "ライト";

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar email={user.email} companyName={companyName} plan={plan} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header userLabel={user.email ?? "ユーザー"} lastChecked={summary.lastCheckedAt} />

        <main className="flex-1 px-5 pb-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
