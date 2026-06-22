"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () => import("@/components/chat-widget").then((m) => m.ChatWidget),
  { ssr: false }
);

export function ChatWidgetLoader() {
  return <ChatWidget />;
}
