"use client";

import { Input } from "@/src/components/input";
import { AISDKLogo } from "@/src/components/icons";
import { PreviewMessage } from "@/src/components/message";
import { PromptSuggestions } from "@/src/components/prompt-suggestions";
import { DeployButton, ProjectInfo } from "@/src/components/project-info";
import type { Message } from "ai";
import type { RefObject } from "react";
import { DebugPanel } from "@/src/features/events/components/debug-panel";

type ChatStatus = "error" | "submitted" | "streaming" | "ready";

export type ChatPanelProps = {
  messages: Message[];
  input: string;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event?: { preventDefault?: () => void }) => void;
  status: ChatStatus;
  isLoading: boolean;
  isInitializing: boolean;
  stop: () => void;
  append: (message: { role: "user"; content: string }) => void;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  scrollEndRef: RefObject<HTMLDivElement | null>;
  className?: string;
};

export function ChatPanel({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  status,
  isLoading,
  isInitializing,
  stop,
  append,
  scrollContainerRef,
  scrollEndRef,
  className,
}: ChatPanelProps) {
  return (
    <div className={`flex min-h-0 flex-col ${className ?? ""}`}>
      {/* <div className="flex items-center justify-between bg-white px-4 py-4">
        <AISDKLogo />
        <DeployButton />
      </div> */}

      <div
        className="flex-1 space-y-6 overflow-y-auto px-4 py-4"
        ref={scrollContainerRef}
      >
        {/* {messages.length === 0 ? <ProjectInfo /> : null} */}
        {messages.map((message, i) => (
          <PreviewMessage
            message={message}
            key={message.id}
            isLoading={isLoading}
            status={status}
            isLatestMessage={i === messages.length - 1}
          />
        ))}

        <div ref={scrollEndRef} className="pb-2" />
      </div>

      {/* {messages.length === 0 && (
        <PromptSuggestions
          disabled={isInitializing}
          submitPrompt={(prompt: string) =>
            append({ role: "user", content: prompt })
          }
        />
      )} */}

      <div className="bg-white">
        <form onSubmit={handleSubmit} className="p-4">
          <Input
            handleInputChange={handleInputChange}
            input={input}
            isInitializing={isInitializing}
            isLoading={isLoading}
            status={status}
            stop={stop}
          />
        </form>
      </div>

      <DebugPanel />
    </div>
  );
}
