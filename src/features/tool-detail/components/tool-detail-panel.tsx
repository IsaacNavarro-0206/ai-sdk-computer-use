"use client";

import { useEvents } from "@/src/features/events/store/event-provider";
import {
  formatDuration,
  formatEventTime,
  getEventById,
  getEventLabel,
  getEventResultMessage,
  getEventTargetDetail,
  getEventTypeName,
  isScreenshotResult,
  STATUS_COLORS,
} from "@/src/features/events/selectors";
import type { AgentEvent } from "@/src/features/events/types/types";
import { ABORTED, cn } from "@/src/lib/utils";

export type ToolDetailPanelProps = {
  selectedEventId: string | null;
};

function ArgsDetail({ event }: { event: AgentEvent }) {
  const entries = Object.entries(event.payload.args).filter(
    ([, value]) => value !== undefined && value !== null,
  );

  if (entries.length === 0) return null;

  return (
    <dl className="space-y-1 rounded border border-zinc-200 bg-white p-2 font-mono text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[minmax(5rem,auto)_1fr] gap-2">
          <dt className="text-zinc-500">{key}</dt>
          <dd className="break-all text-zinc-800">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ToolDetailPanel({ selectedEventId }: ToolDetailPanelProps) {
  const { events } = useEvents();
  const event = getEventById(events, selectedEventId);
  const targetDetail = event ? getEventTargetDetail(event) : null;
  const resultMessage = event ? getEventResultMessage(event) : null;

  return (
    <div className="flex h-full min-h-0 flex-col border-t border-zinc-200 bg-zinc-50 p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Tool details
      </h2>

      {!event ? (
        <p className="text-sm text-zinc-500">
          Select an action in the chat to see expanded details.
        </p>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto text-sm">
          <div>
            <p className="font-mono font-medium text-zinc-800">
              {getEventLabel(event)}
            </p>

            <p className="text-xs capitalize text-zinc-500">
              {getEventTypeName(event.type)}
              {targetDetail ? ` · ${targetDetail}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-semibold uppercase",
                STATUS_COLORS[event.status],
              )}
            >
              {event.status}
            </span>

            <span>{formatDuration(event.duration)}</span>

            <span>·</span>

            <span>{formatEventTime(event.timestamp)}</span>
          </div>

          {event.status === "error" ? (
            <p className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800">
              {event.payload.result === ABORTED
                ? "Action was aborted."
                : (resultMessage ?? "Tool execution failed.")}
            </p>
          ) : null}

          {event.type === "screenshot" &&
          isScreenshotResult(event.payload.result) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/png;base64,${event.payload.result.data}`}
              alt="Screenshot"
              className="max-h-full w-full rounded border border-zinc-200 object-contain"
            />
          ) : null}

          {event.type === "bash" ? (
            <div className="space-y-2 font-mono text-xs">
              <pre className="overflow-x-auto rounded bg-zinc-900 p-2 text-zinc-100">
                {typeof event.payload.args.command === "string"
                  ? event.payload.args.command
                  : ""}
              </pre>

              {typeof event.payload.result === "string" ? (
                <pre className="max-h-40 overflow-auto rounded bg-white p-2 text-zinc-700 ring-1 ring-zinc-200">
                  {event.payload.result}
                </pre>
              ) : null}
            </div>
          ) : null}

          {event.type !== "screenshot" && event.type !== "bash" ? (
            <>
              <ArgsDetail event={event} />

              {resultMessage && !isScreenshotResult(event.payload.result) ? (
                <pre className="max-h-32 overflow-auto rounded bg-white p-2 font-mono text-xs text-zinc-700 ring-1 ring-zinc-200">
                  {resultMessage}
                </pre>
              ) : null}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
