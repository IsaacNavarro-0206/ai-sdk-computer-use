"use client";

import { cn } from "@/src/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useEvents } from "../store/event-provider";
import {
  AGENT_STATUS_LABELS,
  formatDuration,
  formatEventTime,
  getEventLabel,
  STATUS_COLORS,
} from "../selectors";
import type { AgentStatus } from "../types/types";

const AGENT_STATUS_STYLES: Record<AgentStatus, string> = {
  idle: "bg-zinc-200 text-zinc-700",
  thinking: "bg-blue-100 text-blue-800",
  executing: "bg-amber-100 text-amber-800",
};

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { orderedEvents, countsByType, agentStatus } = useEvents();

  const countEntries = Object.entries(countsByType).filter(
    ([, count]) => count !== undefined && count > 0,
  );

  return (
    <div className="mx-2 mb-2 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100"
      >
        <span className="flex flex-wrap items-center gap-2">
          Debug / Events
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              AGENT_STATUS_STYLES[agentStatus],
            )}
          >
            {AGENT_STATUS_LABELS[agentStatus]}
          </span>
          <span className="text-xs font-normal text-zinc-500">
            ({orderedEvents.length} events)
          </span>
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="max-h-48 space-y-3 overflow-y-auto border-t border-zinc-200 px-4 py-3">
          {countEntries.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {countEntries.map(([type, count]) => (
                <span
                  key={type}
                  className="rounded-md bg-white px-2 py-0.5 font-mono text-xs text-zinc-600 ring-1 ring-zinc-200"
                >
                  {type} ×{count}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No events yet.</p>
          )}

          {orderedEvents.length > 0 ? (
            <ul className="space-y-1 font-mono text-xs">
              {orderedEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center gap-2 rounded bg-white px-2 py-1 ring-1 ring-zinc-100"
                >
                  <span className="shrink-0 text-zinc-400">
                    {formatEventTime(event.timestamp)}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-zinc-700">
                    {getEventLabel(event)}
                  </span>

                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                      STATUS_COLORS[event.status],
                    )}
                  >
                    {event.status}
                  </span>

                  <span className="shrink-0 text-zinc-400">
                    {formatDuration(event.duration)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
