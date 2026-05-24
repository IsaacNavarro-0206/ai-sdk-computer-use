Author: Isaac David Navarro Hernández

# AI Agent Dashboard

Take-home submission for the **Senior Frontend Engineer — AI Agent Dashboard** challenge ([requirements](docs/challenge.md)). Built on [vercel-labs/ai-sdk-computer-use](https://github.com/vercel-labs/ai-sdk-computer-use) with **Next.js**, **React**, **Anthropic Claude** (computer use), and **Vercel Sandbox**.

| | |
|---|---|
| **Live demo** | https://operator-chat-cambio-ml.vercel.app/ |
| **Demo video** | _[Add your video URL — ~5 min with sound]_ |

---

## Overview

Chat with Claude while it controls a remote Linux desktop: screenshots, clicks, typing, and bash commands. The UI shows streaming messages, inline tool-call cards, a live VNC stream, expanded tool details, a debug event panel, and multi-session history persisted in `localStorage`.

**Suggested live prompt (per challenge brief):** _"What's the weather in Dubai?"_

---

## Features

### UI/UX

- **Two-panel layout** — chat + session sidebar on the left; VNC + tool detail on the right
- **Horizontally resizable** panels (desktop / tablet)
- **Mobile** — full-width chat; VNC in an overlay
- **Tool call cards** — type, status (`pending` / `complete` / `error`), duration; clickable for detail
- **Results by type** — screenshot thumbnails (full size in detail panel), bash command + output, browser action metadata
- **Debug panel** — collapsible timeline, counts by action type, agent status (`idle` / `thinking` / `executing`)

### Technical

- **Event pipeline** — tool invocations synced from AI SDK messages into a centralized event store (`src/features/events/hooks/sync-from-messages.ts`)
- **Derived state** via selectors (ordered events, counts, agent status) — no duplicated `useState`
- **VNC performance** — `VncViewer` is memoized and never receives chat `messages` or streaming `status`
- **Sessions** — create, switch, delete; persist messages + events to `localStorage` (`computer-use:sessions`)
- **TypeScript** — discriminated unions for events; no `any`
- **Streaming & errors** — existing AI SDK streaming preserved; API errors streamed as readable strings

---

## Architecture

```
User ↔ Chat UI (useChat) ↔ POST /api/chat ↔ Claude Sonnet 4.5
                                    ↓
                              Vercel Sandbox
                         (Xvnc, Chrome, noVNC)
                                    ↓
                           VNC iframe in browser

Messages ──sync──► EventProvider ──► tool cards / debug / detail panel
```

**Principles**

1. Messages are the chat source of truth; events are derived for tooling UI.
2. Sync lives in one module; UI components read events through selectors.
3. `useChat({ id: sessionId })` — session identity is separate from ephemeral `sandboxId`.
4. Each session switch starts a new VM (~30s cold start); chat history persists.

**Layout**

```
src/
├── app/                    # routes, thin page.tsx
├── components/ui/          # shadcn primitives
├── lib/sandbox/            # server: VM, tools, snapshot script
└── features/
    ├── chat/               # workspace, panel, tool cards
    ├── desktop/            # VncViewer (memo), useDesktop
    ├── events/             # types, sync, store, selectors, debug
    ├── layout/             # resizable dashboard
    ├── sessions/           # localStorage, provider, sidebar
    └── tool-detail/        # expanded tool view
```

Import direction: `events` ← sync ← `useChat`; `chat` / `tool-detail` read `events`; `events` does not import `chat`.

---

## Key decisions

| Decision | Rationale |
|----------|-----------|
| Dual state (messages + events) | AI SDK owns message shape; normalized events power debug, duration, and detail UI without parsing in every component |
| Memoized VNC subtree | Challenge requirement: iframe must not re-render on every streamed token |
| New sandbox per session | Sandboxes are ephemeral; history lives in `localStorage`, not the VM |
| `prunedMessages()` | Replaces old screenshot results with a text placeholder before API calls to reduce input tokens |
| `getStreamErrorMessage()` | AI SDK error stream parts must be strings; keeps input enabled on `error` status for retry |

---

## Running locally

### Prerequisites

- Node.js 18+
- [Vercel](https://vercel.com) account (Sandbox access)
- [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
pnpm install
```

Link Vercel and pull sandbox auth:

```bash
pnpm install -g vercel
vercel link
vercel env pull
```

Create a desktop snapshot (first time only, ~10 min):

```bash
npx tsx src/lib/sandbox/create-snapshot.ts
```

Add to `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
SANDBOX_SNAPSHOT_ID=snap_xxxxxxxxxxxxx
```

Start dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Verify

```bash
pnpm lint
pnpm build
```

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `SANDBOX_SNAPSHOT_ID` | Yes | Vercel Sandbox snapshot with desktop environment |
| `VERCEL_OIDC_TOKEN` | Yes* | From `vercel env pull` |
| `VERCEL_TOKEN` | Alt* | Personal access token |
| `VERCEL_TEAM_ID` | Alt* | With `VERCEL_TOKEN` |
| `VERCEL_PROJECT_ID` | Alt* | With `VERCEL_TOKEN` |

\* Use `VERCEL_OIDC_TOKEN` **or** `VERCEL_TOKEN` + team + project IDs.

See [.env.example](.env.example).

---

## Demo video scripts

English teleprompters for recording (aligned with [challenge deliverables](docs/challenge.md)):

- [Webapp demo](docs/DEMO-WEBAPP-SCRIPT.md) — layout, Dubai weather live demo, sessions
- [Code walkthrough](docs/DEMO-CODE-SCRIPT.md) — architecture and technical decisions

---

## Stack

Next.js App Router · React 19 · AI SDK · Anthropic Claude Sonnet 4.5 · Vercel Sandbox · noVNC · shadcn/ui · Tailwind CSS

Based on the [AI SDK Computer Use Demo](https://github.com/vercel-labs/ai-sdk-computer-use).
