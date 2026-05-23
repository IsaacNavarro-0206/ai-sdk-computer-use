"use client";

import { ChatPanel } from "@/src/features/chat/components/chat-panel";
import { VncViewer } from "@/src/features/desktop/components/vnc-viewer";
import { useDesktop } from "@/src/features/desktop/hooks/use-desktop";
import { EventProvider } from "@/src/features/events/store/event-provider";
import { DashboardLayout } from "@/src/features/layout/components/dashboard-layout";
import { ToolDetailPanel } from "@/src/features/tool-detail/components/tool-detail-panel";
import { useScrollToBottom } from "@/src/lib/use-scroll-to-bottom";
import { ABORTED } from "@/src/lib/utils";
import { useChat } from "@ai-sdk/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Chat() {
  const [scrollContainerRef, scrollEndRef] = useScrollToBottom();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [mobileDesktopOpen, setMobileDesktopOpen] = useState(false);

  const { streamUrl, sandboxId, isInitializing, refreshDesktop } = useDesktop();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop: stopGeneration,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: sandboxId ?? undefined,
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

  const isLoading = status !== "ready";

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

  const chatPanel = (
    <ChatPanel
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      status={status}
      isLoading={isLoading}
      isInitializing={isInitializing}
      stop={stop}
      append={append}
      scrollContainerRef={scrollContainerRef}
      scrollEndRef={scrollEndRef}
      className="h-full"
    />
  );

  return (
    <EventProvider messages={messages} chatStatus={status}>
      <DashboardLayout
        chatPanel={chatPanel}
        vncViewer={vncViewer}
        toolDetailPanel={<ToolDetailPanel selectedEventId={selectedEventId} />}
        mobileDesktopOpen={mobileDesktopOpen}
        onMobileDesktopOpenChange={setMobileDesktopOpen}
      />
    </EventProvider>
  );
}
