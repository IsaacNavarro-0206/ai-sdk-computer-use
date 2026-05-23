"use client";

import type { Message } from "ai";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AgentEvent } from "@/src/features/events/types/types";
import {
  buildSessionPatch,
  createSessionRecord,
  loadSessionsStorage,
  saveSessionsStorage,
} from "./storage";
import type { ChatSession } from "./types/types";

type SessionContextValue = {
  sessions: ChatSession[];
  activeSession: ChatSession;
  activeSessionId: string;
  isHydrated: boolean;
  createSession: () => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionData: (
    sessionId: string,
    messages: Message[],
    events: AgentEvent[],
  ) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = {
  children: ReactNode;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storage = loadSessionsStorage();
    setSessions(storage.sessions);
    setActiveSessionId(storage.activeSessionId);
    setIsHydrated(true);
  }, []);

  const persist = useCallback(
    (nextSessions: ChatSession[], nextActiveId: string) => {
      setSessions(nextSessions);
      setActiveSessionId(nextActiveId);
      saveSessionsStorage({
        version: 1,
        activeSessionId: nextActiveId,
        sessions: nextSessions,
      });
    },
    [],
  );

  const activeSession = useMemo(() => {
    return (
      sessions.find((session) => session.id === activeSessionId) ?? sessions[0]
    );
  }, [sessions, activeSessionId]);

  const updateSessionData = useCallback(
    (sessionId: string, messages: Message[], events: AgentEvent[]) => {
      setSessions((prev) => {
        const current = prev.find((session) => session.id === sessionId);
        if (!current) return prev;

        const patch = buildSessionPatch(messages, events, current);
        if (!patch) return prev;

        const nextSessions = prev.map((session) =>
          session.id === sessionId ? { ...session, ...patch } : session,
        );

        saveSessionsStorage({
          version: 1,
          activeSessionId,
          sessions: nextSessions,
        });

        return nextSessions;
      });
    },
    [activeSessionId],
  );

  const createSession = useCallback(() => {
    const newSession = createSessionRecord();
    const nextSessions = [newSession, ...sessions];
    persist(nextSessions, newSession.id);
  }, [sessions, persist]);

  const switchSession = useCallback(
    (sessionId: string) => {
      if (sessionId === activeSessionId) return;
      if (!sessions.some((session) => session.id === sessionId)) return;

      persist(sessions, sessionId);
    },
    [activeSessionId, sessions, persist],
  );

  const deleteSession = useCallback(
    (sessionId: string) => {
      const nextSessions = sessions.filter(
        (session) => session.id !== sessionId,
      );

      if (nextSessions.length === 0) {
        const newSession = createSessionRecord();
        persist([newSession], newSession.id);
        return;
      }

      const nextActiveId =
        activeSessionId === sessionId ? nextSessions[0].id : activeSessionId;

      persist(nextSessions, nextActiveId);
    },
    [sessions, activeSessionId, persist],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      sessions,
      activeSession,
      activeSessionId,
      isHydrated,
      createSession,
      switchSession,
      deleteSession,
      updateSessionData,
    }),
    [
      sessions,
      activeSession,
      activeSessionId,
      isHydrated,
      createSession,
      switchSession,
      deleteSession,
      updateSessionData,
    ],
  );

  if (!isHydrated || !activeSession) {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-zinc-500">
        Loading sessions…
      </div>
    );
  }

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSessions(): SessionContextValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSessions must be used within SessionProvider");
  }

  return context;
}
