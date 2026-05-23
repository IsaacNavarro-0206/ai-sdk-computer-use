import type { Message } from "ai";
import { ABORTED } from "@/src/lib/utils";
import type { AgentEvent, EventStatus, EventType } from "../types/types";

type ComputerArgs = {
  action?: string;
  coordinate?: [number, number];
  text?: string;
  duration?: number;
  scroll_amount?: number;
  scroll_direction?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseComputerArgs(args: unknown): ComputerArgs {
  if (!isRecord(args)) return {};
  return {
    action: typeof args.action === "string" ? args.action : undefined,
    coordinate: Array.isArray(args.coordinate)
      ? ([args.coordinate[0], args.coordinate[1]] as [number, number])
      : undefined,
    text: typeof args.text === "string" ? args.text : undefined,
    duration: typeof args.duration === "number" ? args.duration : undefined,
    scroll_amount:
      typeof args.scroll_amount === "number" ? args.scroll_amount : undefined,
    scroll_direction:
      typeof args.scroll_direction === "string"
        ? args.scroll_direction
        : undefined,
  };
}

function mapComputerActionToEventType(action: string | undefined): EventType {
  switch (action) {
    case "screenshot":
      return "screenshot";
    case "left_click":
    case "right_click":
    case "double_click":
      return "click";
    case "type":
      return "type";
    case "key":
      return "key";
    case "scroll":
      return "scroll";
    case "mouse_move":
      return "mouse_move";
    case "wait":
      return "wait";
    default:
      return "unknown";
  }
}

function mapInvocationStateToStatus(
  state: string,
  result: unknown,
): EventStatus {
  if (state === "call" || state === "partial-call") {
    return "pending";
  }

  if (result === ABORTED) {
    return "error";
  }

  if (
    isRecord(result) &&
    result.type === "text" &&
    typeof result.text === "string" &&
    result.text.toLowerCase().includes("error")
  ) {
    return "error";
  }

  return "complete";
}

function resolveEventType(toolName: string, args: unknown): EventType {
  if (toolName === "bash") return "bash";

  if (toolName === "computer") {
    return mapComputerActionToEventType(parseComputerArgs(args).action);
  }

  return "unknown";
}

function buildAgentEvent(
  toolCallId: string,
  toolName: string,
  state: string,
  args: unknown,
  result: unknown | undefined,
  existing: AgentEvent | undefined,
): AgentEvent {
  const now = Date.now();
  const status = mapInvocationStateToStatus(state, result);
  const startedAt = existing?.startedAt ?? now;
  const timestamp = existing?.timestamp ?? now;
  const duration = status !== "pending" ? now - startedAt : existing?.duration;

  const argsRecord = isRecord(args) ? args : {};

  return {
    id: toolCallId,
    timestamp,
    startedAt,
    type: resolveEventType(toolName, args),
    status,
    duration,
    payload: {
      args: argsRecord,
      ...(result !== undefined ? { result } : {}),
    },
  };
}

export function syncEventsFromMessages(
  previous: AgentEvent[],
  messages: Message[],
): AgentEvent[] {
  const byId = new Map<string, AgentEvent>(
    previous.map((event) => [event.id, event]),
  );

  for (const message of messages) {
    if (!message.parts) continue;

    for (const part of message.parts) {
      if (part.type !== "tool-invocation") continue;

      const invocation = part.toolInvocation;
      const result = "result" in invocation ? invocation.result : undefined;

      const event = buildAgentEvent(
        invocation.toolCallId,
        invocation.toolName,
        invocation.state,
        invocation.args,
        result,
        byId.get(invocation.toolCallId),
      );

      byId.set(invocation.toolCallId, event);
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.timestamp - b.timestamp);
}
