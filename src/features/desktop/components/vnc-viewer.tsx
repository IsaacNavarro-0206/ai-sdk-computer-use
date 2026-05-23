"use client";

import { Button } from "@/src/components/ui/button";
import { memo } from "react";

export type VncViewerProps = {
  streamUrl: string | null;
  isInitializing: boolean;
  onRefresh: () => void;
};

function VncViewerComponent({
  streamUrl,
  isInitializing,
  onRefresh,
}: VncViewerProps) {
  return (
    <div className="relative h-full w-full min-h-0 bg-black">
      {streamUrl ? (
        <>
          <iframe
            src={streamUrl}
            className="h-full w-full"
            style={{
              transformOrigin: "center",
              width: "100%",
              height: "100%",
            }}
            allow="autoplay"
            title="Remote desktop"
          />

          <Button
            type="button"
            onClick={onRefresh}
            className="absolute top-2 right-2 z-10 rounded bg-black/50 px-3 py-1 text-sm text-white hover:bg-black/70"
            disabled={isInitializing}
          >
            {isInitializing ? "Creating desktop..." : "New desktop"}
          </Button>
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-white">
          {isInitializing ? "Initializing desktop..." : "Loading stream..."}
        </div>
      )}
    </div>
  );
}

export const VncViewer = memo(VncViewerComponent);
