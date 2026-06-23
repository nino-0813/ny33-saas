import { MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/ui";
import ChatPanel from "@/components/chat/ChatPanel";
import { getFunnelData } from "@/lib/funnel-data";
import {
  buildFunnelChatFocus,
  isFunnelKey,
  type FunnelChatFocus,
} from "@/lib/funnel-insights";

export const metadata = { title: "集客チャット — Webドック" };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string | string[] }>;
}) {
  const query = await searchParams;
  const topic = Array.isArray(query.topic) ? query.topic[0] : query.topic;
  let focus: FunnelChatFocus | undefined;

  if (topic && isFunnelKey(topic)) {
    const funnel = await getFunnelData();
    const score = Math.round(
      (funnel.stages?.find((item) => item.key === topic)?.rate ?? 0) * 100,
    );
    focus = buildFunnelChatFocus(topic, score, funnel.signals);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="集客チャット"
        description="あなたのサイトのSEO・アクセスデータを踏まえて、AIが今日やるべきことを提案します。"
        icon={<MessageSquareText className="h-5 w-5" />}
      />
      <ChatPanel focus={focus} />
    </div>
  );
}
