"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/src/components/ui/resizable";
import { Button } from "@/src/components/ui/button";
import { Monitor } from "lucide-react";
import type { ReactNode } from "react";

export type DashboardLayoutProps = {
  sessionSidebar?: ReactNode;
  chatPanel: ReactNode;
  vncViewer: ReactNode;
  toolDetailPanel: ReactNode;
  mobileDesktopOpen: boolean;
  onMobileDesktopOpenChange: (open: boolean) => void;
};

export function DashboardLayout({
  sessionSidebar,
  chatPanel,
  vncViewer,
  toolDetailPanel,
  mobileDesktopOpen,
  onMobileDesktopOpenChange,
}: DashboardLayoutProps) {
  return (
    <div className="relative flex h-dvh w-full">
      {/* Desktop / tablet: chat left, VNC + detail right */}
      <div className="hidden h-full w-full lg:flex">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel
            defaultSize={40}
            minSize={28}
            className="flex min-h-0 flex-col border-r border-zinc-200"
          >
            <div className="flex h-full min-h-0">
              {sessionSidebar}

              <div className="min-h-0 min-w-0 flex-1">{chatPanel}</div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={60}
            minSize={35}
            className="flex min-h-0 flex-col"
          >
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1">{vncViewer}</div>
              <div className="h-48 shrink-0">{toolDetailPanel}</div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile: chat full width + desktop overlay */}
      <div className="flex h-full w-full min-h-0 flex-col lg:hidden">
        {sessionSidebar ? (
          <div className="flex max-h-36 shrink-0 border-b border-zinc-200">
            {sessionSidebar}
          </div>
        ) : null}

        <div className="min-h-0 flex-1">{chatPanel}</div>

        <Button
          type="button"
          variant="default"
          className="fixed bottom-24 right-4 z-40 gap-2 shadow-lg"
          onClick={() => onMobileDesktopOpenChange(true)}
        >
          <Monitor className="h-4 w-4" />
          View desktop
        </Button>

        {mobileDesktopOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black lg:hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3">
              <span className="text-sm font-medium text-white">
                Remote desktop
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onMobileDesktopOpenChange(false)}
              >
                Close
              </Button>
            </div>
            <div className="min-h-0 flex-1">{vncViewer}</div>
          </div>
        )}
      </div>
    </div>
  );
}
