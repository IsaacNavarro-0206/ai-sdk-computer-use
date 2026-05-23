"use client";

import { getDesktopURL } from "@/src/lib/sandbox/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function killSandbox(sandboxId: string) {
  navigator.sendBeacon(
    `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`,
  );
}

export function useDesktop(sessionKey: string) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const sandboxIdRef = useRef<string | null>(null);

  useEffect(() => {
    sandboxIdRef.current = sandboxId;
  }, [sandboxId]);

  const refreshDesktop = useCallback(async () => {
    try {
      setIsInitializing(true);
      const { streamUrl: url, id } = await getDesktopURL(
        sandboxIdRef.current ?? undefined,
      );
      setStreamUrl(url);
      setSandboxId(id);
    } catch (err) {
      console.error("Failed to refresh desktop:", err);
      toast.error("Failed to refresh desktop");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (!sandboxId) return;

    const currentSandboxId = sandboxId;

    const killDesktop = () => {
      killSandbox(currentSandboxId);
    };

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
      window.addEventListener("pagehide", killDesktop);
      return () => {
        window.removeEventListener("pagehide", killDesktop);
        killDesktop();
      };
    }

    window.addEventListener("beforeunload", killDesktop);
    return () => {
      window.removeEventListener("beforeunload", killDesktop);
      killDesktop();
    };
  }, [sandboxId]);

  useEffect(() => {
    let cancelled = false;

    const initDesktop = async () => {
      const previousSandboxId = sandboxIdRef.current;

      if (previousSandboxId) {
        killSandbox(previousSandboxId);
      }

      setStreamUrl(null);
      setSandboxId(null);
      sandboxIdRef.current = null;

      try {
        setIsInitializing(true);
        const { streamUrl: url, id } = await getDesktopURL(undefined);

        if (cancelled) {
          killSandbox(id);
          return;
        }

        setStreamUrl(url);
        setSandboxId(id);
      } catch (err) {
        console.error("Failed to initialize desktop:", err);
        toast.error("Failed to initialize desktop");
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };

    void initDesktop();

    return () => {
      cancelled = true;
    };
  }, [sessionKey]);

  return {
    streamUrl,
    sandboxId,
    isInitializing,
    refreshDesktop,
    setSandboxId,
    setStreamUrl,
  };
}
