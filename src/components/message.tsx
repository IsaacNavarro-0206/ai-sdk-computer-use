"use client";

import type { Message } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { memo } from "react";
import equal from "fast-deep-equal";
import { Streamdown } from "streamdown";

import { cn } from "@/src/lib/utils";
import { ToolCallCard } from "@/src/features/chat/components/tool-call-card";

const PurePreviewMessage = ({
  message,
  selectedEventId,
  onSelectEvent,
}: {
  message: Message;
  isLoading: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
  isLatestMessage: boolean;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}) => {
  return (
    <AnimatePresence key={message.id}>
      <motion.div
        className="group/message mx-auto w-full px-4"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        key={`message-${message.id}`}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex w-full gap-4",
            "group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            "group-data-[role=user]/message:w-fit",
          )}
        >
          <div className="flex w-full flex-col">
            {message.parts?.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <motion.div
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={`message-${message.id}-part-${i}`}
                      className="flex w-full flex-row items-start gap-2 pb-4"
                    >
                      <div
                        className={cn("flex flex-col gap-4", {
                          "rounded-xl bg-secondary px-3 py-2 text-secondary-foreground":
                            message.role === "user",
                        })}
                      >
                        <Streamdown>{part.text}</Streamdown>
                      </div>
                    </motion.div>
                  );
                case "tool-invocation":
                  return (
                    <ToolCallCard
                      key={part.toolInvocation.toolCallId}
                      toolCallId={part.toolInvocation.toolCallId}
                      selectedEventId={selectedEventId}
                      onSelect={onSelectEvent}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.selectedEventId !== nextProps.selectedEventId) return false;
    if (prevProps.message.annotations !== nextProps.message.annotations)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

    return true;
  },
);
