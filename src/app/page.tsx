"use client";

import { ChatWorkspace } from "@/src/features/chat/components/chat-workspace";
import {
  SessionProvider,
  useSessions,
} from "@/src/features/sessions/session-provider";

function ChatPageContent() {
  const { activeSession, activeSessionId } = useSessions();

  return <ChatWorkspace key={activeSessionId} session={activeSession} />;
}

export default function Chat() {
  return (
    <SessionProvider>
      <ChatPageContent />
    </SessionProvider>
  );
}
