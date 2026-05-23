import type { Message } from "ai";
import type { AgentEvent } from "@/src/features/events/types/types";

export const SESSIONS_STORAGE_KEY = "computer-use:sessions";
export const SESSIONS_STORAGE_VERSION = 1;

export type ChatSession = {
  id: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  messages: Message[];
  events: AgentEvent[];
};

export type SessionsStorage = {
  version: typeof SESSIONS_STORAGE_VERSION;
  activeSessionId: string;
  sessions: ChatSession[];
};
