import type { Message } from "ai";
import equal from "fast-deep-equal";
import type { AgentEvent } from "@/src/features/events/types/types";
import {
  SESSIONS_STORAGE_KEY,
  SESSIONS_STORAGE_VERSION,
  type ChatSession,
  type SessionsStorage,
} from "./types/types";

let lastSessionTimestamp = 0;

function nextSessionTimestamp(): number {
  const now = Date.now();
  lastSessionTimestamp =
    now > lastSessionTimestamp ? now : lastSessionTimestamp + 1;

  return lastSessionTimestamp;
}

function createEmptySession(): ChatSession {
  const now = nextSessionTimestamp();

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    title: "New chat",
    messages: [],
    events: [],
  };
}

export function deriveSessionTitle(messages: Message[]): string {
  for (const message of messages) {
    if (message.role !== "user") continue;

    const textPart = message.parts?.find((part) => part.type === "text");
    if (textPart?.type === "text" && textPart.text.trim()) {
      const text = textPart.text.trim();

      return text.length > 48 ? `${text.slice(0, 48)}…` : text;
    }

    if (typeof message.content === "string" && message.content.trim()) {
      const text = message.content.trim();

      return text.length > 48 ? `${text.slice(0, 48)}…` : text;
    }
  }

  return "New chat";
}

export function loadSessionsStorage(): SessionsStorage {
  if (typeof window === "undefined") {
    const session = createEmptySession();

    return {
      version: SESSIONS_STORAGE_VERSION,
      activeSessionId: session.id,
      sessions: [session],
    };
  }

  try {
    const raw = window.localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) {
      const session = createEmptySession();

      return {
        version: SESSIONS_STORAGE_VERSION,
        activeSessionId: session.id,
        sessions: [session],
      };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isSessionsStorage(parsed)) {
      const session = createEmptySession();

      return {
        version: SESSIONS_STORAGE_VERSION,
        activeSessionId: session.id,
        sessions: [session],
      };
    }

    if (parsed.sessions.length === 0) {
      const session = createEmptySession();

      return {
        version: SESSIONS_STORAGE_VERSION,
        activeSessionId: session.id,
        sessions: [session],
      };
    }

    const activeExists = parsed.sessions.some(
      (session) => session.id === parsed.activeSessionId,
    );

    return {
      ...parsed,
      activeSessionId: activeExists
        ? parsed.activeSessionId
        : parsed.sessions[0].id,
    };
  } catch {
    const session = createEmptySession();

    return {
      version: SESSIONS_STORAGE_VERSION,
      activeSessionId: session.id,
      sessions: [session],
    };
  }
}

export function saveSessionsStorage(storage: SessionsStorage): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("Failed to persist sessions:", error);
  }
}

export function createSessionRecord(): ChatSession {
  return createEmptySession();
}

export function buildSessionPatch(
  messages: Message[],
  events: AgentEvent[],
  current: ChatSession,
): Pick<ChatSession, "messages" | "events" | "title" | "updatedAt"> | null {
  const title =
    current.title === "New chat" ? deriveSessionTitle(messages) : current.title;

  const hasChanges =
    !equal(messages, current.messages) ||
    !equal(events, current.events) ||
    title !== current.title;

  if (!hasChanges) {
    return null;
  }

  return {
    messages,
    events,
    title,
    updatedAt: Date.now(),
  };
}

function isSessionsStorage(value: unknown): value is SessionsStorage {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Record<string, unknown>;

  return (
    record.version === SESSIONS_STORAGE_VERSION &&
    typeof record.activeSessionId === "string" &&
    Array.isArray(record.sessions) &&
    record.sessions.every(isChatSession)
  );
}

function isChatSession(value: unknown): value is ChatSession {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.createdAt === "number" &&
    typeof record.updatedAt === "number" &&
    typeof record.title === "string" &&
    Array.isArray(record.messages) &&
    Array.isArray(record.events)
  );
}
