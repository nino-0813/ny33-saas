import { MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/ui";
import ChatPanel from "@/components/chat/ChatPanel";

export const metadata = { title: "集客チャット — Webドック" };

export default function ChatPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="集客チャット"
        description="あなたのサイトのSEO・アクセスデータを踏まえて、AIが今日やるべきことを提案します。"
        icon={<MessageSquareText className="h-5 w-5" />}
      />
      <ChatPanel />
    </div>
  );
}
