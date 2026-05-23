"use client";

import { useEvents } from "@/src/features/events/store/event-provider";
import {
  formatDuration,
  getEventById,
  getEventLabel,
  isScreenshotResult,
} from "@/src/features/events/selectors";

export type ToolDetailPanelProps = {
  selectedEventId: string | null;
};

export function ToolDetailPanel({ selectedEventId }: ToolDetailPanelProps) {
  const { events } = useEvents();
  const event = getEventById(events, selectedEventId);

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
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto text-sm">
          <p className="font-mono font-medium text-zinc-800">
            {getEventLabel(event)}
          </p>

          <p className="text-xs text-zinc-500">
            {event.status} · {formatDuration(event.duration)}
          </p>

          {event.type === "screenshot" &&
          isScreenshotResult(event.payload.result) ? (
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
                <pre className="max-h-24 overflow-auto rounded bg-white p-2 text-zinc-700 ring-1 ring-zinc-200">
                  {event.payload.result}
                </pre>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
