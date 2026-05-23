"use client";

import type { Message } from "ai";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  getAgentStatus,
  getCountsByType,
  getOrderedEvents,
  type ChatStatus,
} from "./selectors";
import { syncEventsFromMessages } from "./hooks/sync-from-messages";
import type { AgentEvent, AgentStatus, EventCounts } from "./types/types";

type EventState = {
  events: AgentEvent[];
};

type EventAction =
  | { type: "SYNC_MESSAGES"; messages: Message[] }
  | { type: "CLEAR" };

function eventReducer(state: EventState, action: EventAction): EventState {
  switch (action.type) {
    case "SYNC_MESSAGES":
      return {
        events: syncEventsFromMessages(state.events, action.messages),
      };
    case "CLEAR":
      return { events: [] };
    default:
      return state;
  }
}

type EventContextValue = {
  events: AgentEvent[];
  orderedEvents: AgentEvent[];
  countsByType: EventCounts;
  agentStatus: AgentStatus;
  dispatch: React.Dispatch<EventAction>;
};

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({
  children,
  chatStatus = "ready",
}: {
  children: ReactNode;
  chatStatus?: ChatStatus;
}) {
  const [state, dispatch] = useReducer(eventReducer, { events: [] });

  const orderedEvents = useMemo(
    () => getOrderedEvents(state.events),
    [state.events],
  );

  const countsByType = useMemo(
    () => getCountsByType(state.events),
    [state.events],
  );

  const agentStatus = useMemo(
    () => getAgentStatus(state.events, chatStatus),
    [state.events, chatStatus],
  );

  const value = useMemo<EventContextValue>(
    () => ({
      events: state.events,
      orderedEvents,
      countsByType,
      agentStatus,
      dispatch,
    }),
    [state.events, orderedEvents, countsByType, agentStatus],
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

/** Syncs AI SDK messages into the event store. */
export function EventSync({ messages }: { messages: Message[] }) {
  const { dispatch } = useEvents();

  useEffect(() => {
    dispatch({ type: "SYNC_MESSAGES", messages });
  }, [messages, dispatch]);

  return null;
}
