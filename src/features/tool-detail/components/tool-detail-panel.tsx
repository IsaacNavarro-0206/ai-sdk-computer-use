"use client";

export type ToolDetailPanelProps = {
  selectedEventId: string | null;
};

export function ToolDetailPanel({ selectedEventId }: ToolDetailPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-t border-zinc-200 bg-zinc-50 p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Tool details
      </h2>
      {selectedEventId ? (
        <p className="text-sm text-zinc-600">
          Selected: <span className="font-mono">{selectedEventId}</span>
        </p>
      ) : (
        <p className="text-sm text-zinc-500">
          Select an action in the chat to see expanded details.
        </p>
      )}
    </div>
  );
}
