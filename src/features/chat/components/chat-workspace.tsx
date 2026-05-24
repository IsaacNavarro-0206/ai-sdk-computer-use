"use client";

import { ChatPanel } from "@/src/features/chat/components/chat-panel";
import { VncViewer } from "@/src/features/desktop/components/vnc-viewer";
import { useDesktop } from "@/src/features/desktop/hooks/use-desktop";
import {
  EventProvider,
  useEvents,
} from "@/src/features/events/store/event-provider";
import { DashboardLayout } from "@/src/features/layout/components/dashboard-layout";
import { SessionSidebar } from "@/src/features/sessions/components/session-sidebar";
import { useSessions } from "@/src/features/sessions/session-provider";
import type { ChatSession } from "@/src/features/sessions/types/types";
import { ToolDetailPanel } from "@/src/features/tool-detail/components/tool-detail-panel";
import { useScrollToBottom } from "@/src/lib/use-scroll-to-bottom";
import { ABORTED } from "@/src/lib/utils";
import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type ChatWorkspaceProps = {
  session: ChatSession;
};

type PersistSessionProps = {
  sessionId: string;
  messages: Message[];
};

function PersistSession({ sessionId, messages }: PersistSessionProps) {
  const { updateSessionData } = useSessions();
  const { events } = useEvents();

  const messagesRef = useRef(messages);
  const eventsRef = useRef(events);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    messagesRef.current = messages;
    eventsRef.current = events;
    sessionIdRef.current = sessionId;
  }, [messages, events, sessionId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      updateSessionData(sessionId, messages, events);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [sessionId, messages, events, updateSessionData]);

  useEffect(() => {
    return () => {
      updateSessionData(
        sessionIdRef.current,
        messagesRef.current,
        eventsRef.current,
      );
    };
  }, [updateSessionData]);

  return null;
}

export function ChatWorkspace({ session }: ChatWorkspaceProps) {
  const [scrollContainerRef, scrollEndRef] = useScrollToBottom();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [mobileDesktopOpen, setMobileDesktopOpen] = useState(false);

  const { streamUrl, sandboxId, isInitializing, refreshDesktop } = useDesktop(
    session.id,
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop: stopGeneration,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: session.id,
    initialMessages: session.messages,
    body: {
      sandboxId,
    },
    maxSteps: 30,
    onError: (error) => {
      console.error(error);
      toast.error("There was an error", {
        description: "Please try again later.",
        richColors: true,
        position: "top-center",
      });
    },
  });

  const stop = () => {
    stopGeneration();

    const lastMessage = messages.at(-1);
    const lastMessageLastPart = lastMessage?.parts?.at(-1);
    if (
      lastMessage?.role === "assistant" &&
      lastMessageLastPart?.type === "tool-invocation"
    ) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          parts: [
            ...lastMessage.parts.slice(0, -1),
            {
              ...lastMessageLastPart,
              toolInvocation: {
                ...lastMessageLastPart.toolInvocation,
                state: "result",
                result: ABORTED,
              },
            },
          ],
        },
      ]);
    }
  };

  const isLoading = status !== "ready" && status !== "error";

  const vncViewer = useMemo(
    () => (
      <VncViewer
        streamUrl={streamUrl}
        isInitializing={isInitializing}
        onRefresh={refreshDesktop}
      />
    ),
    [streamUrl, isInitializing, refreshDesktop],
  );

  return (
    <EventProvider
      key={session.id}
      initialEvents={session.events}
      messages={messages}
      chatStatus={status}
    >
      <PersistSession sessionId={session.id} messages={messages} />

      <DashboardLayout
        sessionSidebar={<SessionSidebar />}
        chatPanel={
          <ChatPanel
            messages={messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            status={status}
            isLoading={isLoading}
            isInitializing={isInitializing}
            stop={stop}
            scrollContainerRef={scrollContainerRef}
            scrollEndRef={scrollEndRef}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            className="h-full"
          />
        }
        vncViewer={vncViewer}
        toolDetailPanel={<ToolDetailPanel selectedEventId={selectedEventId} />}
        mobileDesktopOpen={mobileDesktopOpen}
        onMobileDesktopOpenChange={setMobileDesktopOpen}
      />
    </EventProvider>
  );
}
