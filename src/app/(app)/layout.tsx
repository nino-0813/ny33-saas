import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData, getOnboardingStatus } from "@/lib/queries";

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
  const company = data?.company ?? {
    name: "—",
    industry: "",
    area: "",
    employees: 0,
    plan: "ライト",
  };

  return (
    <div className="font-uxb flex h-dvh gap-3 overflow-hidden bg-desk p-3 lg:gap-4 lg:p-4">
      <Sidebar email={user.email} />

      {/* クリームのキャンバス（ヘッダー＋スクロール領域） */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl bg-canvas shadow-sm ring-1 ring-black/[0.04]">
        <Topbar company={company} />

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {children}

          <footer className="mt-8 pt-5 text-center text-xs text-gray-400">
            NY33 Company Dock — 会社の定期健康診断プラットフォーム
          </footer>
        </div>
      </main>
    </div>
  );
}
