import { ABORTED } from "@/src/lib/utils";
import type {
  AgentEvent,
  AgentStatus,
  EventCounts,
  EventType,
} from "./types/types";

export type ChatStatus = "error" | "submitted" | "streaming" | "ready";

export function getOrderedEvents(events: AgentEvent[]): AgentEvent[] {
  return [...events].sort((a, b) => a.timestamp - b.timestamp);
}

export function getCountsByType(events: AgentEvent[]): EventCounts {
  return events.reduce<EventCounts>((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1;
    return acc;
  }, {});
}

export function getAgentStatus(
  events: AgentEvent[],
  chatStatus: ChatStatus,
): AgentStatus {
  if (events.some((e) => e.status === "pending")) {
    return "executing";
  }

  if (chatStatus === "submitted" || chatStatus === "streaming") {
    return "thinking";
  }

  return "idle";
}

export function getEventById(
  events: AgentEvent[],
  id: string | null,
): AgentEvent | undefined {
  if (!id) return undefined;

  return events.find((event) => event.id === id);
}

export function formatDuration(ms: number | undefined): string {
  if (ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;

  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatEventTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function getEventTypeName(type: EventType): string {
  return type.replace(/_/g, " ");
}

export function getEventTargetDetail(event: AgentEvent): string | null {
  const args = event.payload.args;

  if (Array.isArray(args.coordinate) && args.coordinate.length >= 2) {
    const [x, y] = args.coordinate as [number, number];

    return `(${x}, ${y})`;
  }

  if (typeof args.text === "string" && args.text.length > 0) {
    return `"${args.text}"`;
  }

  if (typeof args.duration === "number") {
    return `${args.duration}s`;
  }

  if (
    typeof args.scroll_direction === "string" &&
    typeof args.scroll_amount === "number"
  ) {
    return `${args.scroll_direction} × ${args.scroll_amount}`;
  }

  if (typeof args.command === "string") {
    return args.command.length > 60
      ? `${args.command.slice(0, 60)}…`
      : args.command;
  }

  return null;
}

export function getEventResultMessage(event: AgentEvent): string | null {
  const { result } = event.payload;

  if (result === undefined) return null;

  if (result === ABORTED) {
    return ABORTED;
  }

  if (typeof result === "string") {
    return result;
  }

  if (
    isRecord(result) &&
    result.type === "text" &&
    typeof result.text === "string"
  ) {
    return result.text;
  }

  return null;
}

export function getEventLabel(event: AgentEvent): string {
  const action =
    typeof event.payload.args.action === "string"
      ? event.payload.args.action
      : event.type;

  switch (event.type) {
    case "bash": {
      const command =
        typeof event.payload.args.command === "string"
          ? event.payload.args.command
          : "";

      return `bash: ${command.slice(0, 28)}${command.length > 28 ? "…" : ""}`;
    }
    case "click":
      return action.replace(/_/g, " ");
    case "type": {
      const text =
        typeof event.payload.args.text === "string"
          ? event.payload.args.text
          : "";

      return text
        ? `type: "${text.slice(0, 20)}${text.length > 20 ? "…" : ""}"`
        : "type";
    }
    default:
      return event.type.replace(/_/g, " ");
  }
}

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  idle: "Idle",
  thinking: "Thinking",
  executing: "Executing",
};

export const STATUS_COLORS: Record<AgentEvent["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  complete: "bg-green-100 text-green-800",
  error: "bg-red-100 text-red-800",
};

export function isScreenshotResult(
  result: unknown,
): result is { type: "image"; data: string } {
  return (
    isRecord(result) &&
    result.type === "image" &&
    typeof result.data === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
