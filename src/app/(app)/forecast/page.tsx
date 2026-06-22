import { ChartNoAxesCombined } from "lucide-react";
import { PageHeader } from "@/components/ui";
import ForecastStudio from "@/components/forecast/ForecastStudio";

export const metadata = { title: "AI需要予測 — Webドック" };

export default function ForecastPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="AI需要予測"
        description="売上・アクセス・検索需要などの過去データから、Google TimesFMで将来の動きを予測します。"
        icon={<ChartNoAxesCombined className="h-5 w-5" />}
      />
      <ForecastStudio />
    </div>
  );
}
