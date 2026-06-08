import { Bot } from "lucide-react";
import { redirect } from "next/navigation";
import { PageHeader, Card } from "@/components/ui";
import CompanyAiChat from "@/components/CompanyAiChat";
import AiAdvisor from "@/components/AiAdvisor";
import { aiPersonas } from "@/lib/mock";
import { getDashboardData } from "@/lib/queries";

export const metadata = { title: "Company AI — NY33 Company Dock" };

export default async function CompanyAiPage() {
  const data = await getDashboardData();
  if (!data) redirect("/onboarding");

  return (
    <div className="space-y-8">
      <PageHeader
        icon={<Bot className="h-5 w-5" />}
        title="Company AI"
        description="経営コンサル・マーケター・データアナリストの視点で、あなたの会社のデータを分析し、利益を上げる打ち手を提案します。"
      />

      {/* 3つの役割 */}
      <div className="grid gap-3 sm:grid-cols-3">
        {aiPersonas.map((p) => (
          <Card key={p.id} className="p-4">
            <p className="text-sm font-bold text-foreground">{p.label}</p>
            <p className="mt-1 text-xs text-muted">{p.desc}</p>
          </Card>
        ))}
      </div>

      {/* チャット */}
      <div className="h-[560px]">
        <CompanyAiChat />
      </div>

      {/* 優先課題 */}
      <AiAdvisor issues={data.aiIssues} improvementYen={data.improvementYen} />
    </div>
  );
}
