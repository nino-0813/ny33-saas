import { Map } from "lucide-react";
import { PageHeader } from "@/components/ui";
import JourneyStudio from "@/components/journey/JourneyStudio";

export const metadata = { title: "集客設計 — Webドック" };

export default function JourneyPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="集客設計"
        description="商品を起点に、顧客が知ってからファンになるまでの流れと、各段階で行う施策を設計します。"
        icon={<Map className="h-5 w-5" />}
      />
      <JourneyStudio />
    </div>
  );
}

