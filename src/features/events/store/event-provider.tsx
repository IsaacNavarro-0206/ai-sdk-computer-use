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
import { syncEventsFromMessages } from "../hooks/sync-from-messages";
import {
  getAgentStatus,
  getCountsByType,
  getOrderedEvents,
  type ChatStatus,
} from "../selectors";
import type { AgentEvent, AgentStatus, EventCounts } from "../types/types";

type EventContextValue = {
  events: AgentEvent[];
  orderedEvents: AgentEvent[];
  countsByType: EventCounts;
  agentStatus: AgentStatus;
  clearEvents: () => void;
};

const EventContext = createContext<EventContextValue | null>(null);

type EventProviderProps = {
  children: ReactNode;
  messages: Message[];
  chatStatus: ChatStatus;
};

export function EventProvider({
  children,
  messages,
  chatStatus,
}: EventProviderProps) {
  const [events, setEvents] = useState<AgentEvent[]>([]);

  useEffect(() => {
    setEvents((prev) => syncEventsFromMessages(prev, messages));
  }, [messages]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const orderedEvents = useMemo(() => getOrderedEvents(events), [events]);

  const countsByType = useMemo(() => getCountsByType(events), [events]);

  const agentStatus = useMemo(
    () => getAgentStatus(events, chatStatus),
    [events, chatStatus],
  );

  const value = useMemo<EventContextValue>(
    () => ({
      events,
      orderedEvents,
      countsByType,
      agentStatus,
      clearEvents,
    }),
    [events, orderedEvents, countsByType, agentStatus, clearEvents],
  );

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
}

export function useEvents(): EventContextValue {
  const context = useContext(EventContext);

  if (!context) {
    throw new Error("useEvents must be used within EventProvider");
  }

  return context;
}
