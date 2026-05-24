"use client";

import {
  formatDuration,
  getEventById,
  getEventLabel,
  getEventTargetDetail,
  getEventTypeName,
  isScreenshotResult,
  STATUS_COLORS,
} from "@/src/features/events/selectors";
import { useEvents } from "@/src/features/events/store/event-provider";
import type { AgentEvent, EventType } from "@/src/features/events/types/types";
import { ABORTED, cn } from "@/src/lib/utils";
import {
  Camera,
  CheckCircle,
  CircleSlash,
  Clock,
  Keyboard,
  KeyRound,
  Loader2,
  MousePointer,
  MousePointerClick,
  ScrollText,
  Terminal,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";

const EVENT_ICONS: Record<EventType, LucideIcon> = {
  screenshot: Camera,
  bash: Terminal,
  click: MousePointerClick,
  type: Keyboard,
  key: KeyRound,
  scroll: ScrollText,
  mouse_move: MousePointer,
  wait: Clock,
  unknown: MousePointer,
};

function StatusIcon({ event }: { event: AgentEvent }) {
  if (event.status === "pending") {
    return <Loader2 className="h-4 w-4 animate-spin text-amber-600" />;
  }

  if (event.status === "error") {
    if (event.payload.result === ABORTED) {
      return <CircleSlash className="h-4 w-4 text-amber-600" />;
    }

    return <XCircle className="h-4 w-4 text-red-600" />;
  }

  return <CheckCircle className="h-4 w-4 text-green-600" />;
}

export type ToolCallCardProps = {
  toolCallId: string;
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
  className?: string;
};

export function ToolCallCard({
  toolCallId,
  selectedEventId,
  onSelect,
  className,
}: ToolCallCardProps) {
  const { events } = useEvents();
  const event = getEventById(events, toolCallId);

  if (!event) {
    return null;
  }

  const isSelected = selectedEventId === toolCallId;
  const Icon = EVENT_ICONS[event.type];
  const targetDetail = getEventTargetDetail(event);
  const screenshotThumbnail =
    event.type === "screenshot" &&
    event.status === "complete" &&
    isScreenshotResult(event.payload.result)
      ? event.payload.result.data
      : null;

  return (
    <motion.button
      type="button"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={() => onSelect(toolCallId)}
      className={cn(
        "mb-3 flex w-full flex-col gap-2 rounded-md border p-2 text-left text-sm transition-colors",
        "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800",
        event.status === "error"
          ? "border-red-300 dark:border-red-800"
          : "border-zinc-200 dark:border-zinc-800",
        isSelected && "ring-2 ring-blue-500 ring-offset-1",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-800">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono font-medium capitalize">
              {getEventLabel(event)}
            </span>

            <span className="text-xs text-zinc-500">
              {getEventTypeName(event.type)}
            </span>
          </div>

          {targetDetail ? (
            <p className="truncate text-xs text-zinc-500">{targetDetail}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusIcon event={event} />
          <span className="text-[10px] tabular-nums text-zinc-400">
            {formatDuration(event.duration)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
            STATUS_COLORS[event.status],
          )}
        >
          {event.status}
        </span>
      </div>

      {event.type === "screenshot" && event.status === "pending" ? (
        <div className="h-16 w-28 animate-pulse rounded border border-zinc-200 bg-zinc-200 dark:bg-zinc-700" />
      ) : null}

      {screenshotThumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/png;base64,${screenshotThumbnail}`}
          alt="Screenshot thumbnail"
          className="h-16 w-auto max-w-full rounded border border-zinc-200 object-cover"
        />
      ) : null}
    </motion.button>
  );
}
