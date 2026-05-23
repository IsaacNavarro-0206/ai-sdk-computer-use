export type EventStatus = "pending" | "complete" | "error";

export type EventType =
  | "screenshot"
  | "bash"
  | "click"
  | "type"
  | "key"
  | "scroll"
  | "mouse_move"
  | "wait"
  | "unknown";

export type AgentStatus = "idle" | "thinking" | "executing";

export type AgentEvent = {
  id: string;
  timestamp: number;
  startedAt: number;
  type: EventType;
  status: EventStatus;
  payload: {
    args: Record<string, unknown>;
    result?: unknown;
  };
  duration?: number;
};

export type EventCounts = Partial<Record<EventType, number>>;
