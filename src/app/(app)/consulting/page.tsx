import { Workflow } from "lucide-react";
import { PageHeader } from "@/components/ui";
import BusinessConsultingStudio from "@/components/consulting/BusinessConsultingStudio";

export const metadata = { title: "業務・ROI診断 — Webドック" };

export default function ConsultingPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="業務・ROI診断"
        description="会社が売上を作る流れを分解し、どこで機会を失っているか、どのAI施策なら利益につながるかを数字で整理します。"
        icon={<Workflow className="h-5 w-5" />}
      />
      <BusinessConsultingStudio />
    </div>
  );
}
