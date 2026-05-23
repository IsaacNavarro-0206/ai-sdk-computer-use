"use client";

import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { useSessions } from "../session-provider";

function formatSessionDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getSessionDisplayDate(session: {
  createdAt: number;
  updatedAt: number;
  messages: unknown[];
}): number {
  return session.messages.length > 0 ? session.updatedAt : session.createdAt;
}

export function SessionSidebar() {
  const {
    sessions,
    activeSessionId,
    createSession,
    switchSession,
    deleteSession,
  } = useSessions();

  const sortedSessions = [...sessions].sort(
    (a, b) => getSessionDisplayDate(b) - getSessionDisplayDate(a),
  );

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 lg:w-52">
      <div className="border-b border-zinc-200 p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={createSession}
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {sortedSessions.map((session) => {
          const isActive = session.id === activeSessionId;

          return (
            <li key={session.id}>
              <div
                className={cn(
                  "group flex items-start gap-1 rounded-md border px-2 py-2 text-left transition-colors",
                  isActive
                    ? "border-blue-200 bg-blue-50"
                    : "border-transparent hover:bg-white",
                )}
              >
                <button
                  type="button"
                  onClick={() => switchSession(session.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-medium text-zinc-800">
                    {session.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-500">
                    {formatSessionDate(getSessionDisplayDate(session))}
                  </p>
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteSession(session.id)}
                  aria-label={`Delete ${session.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-zinc-500" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
