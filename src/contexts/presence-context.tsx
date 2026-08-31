"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "./user-context";

interface PresenceContextType {
  onlineUserIds: Set<string>;
  isUserOnline: (userId?: string | null) => boolean;
  onlineCount: number;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUserIds: new Set(),
  isUserOnline: () => false,
  onlineCount: 0,
});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const user = useUserContext();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const supabase = useMemo(() => createClient(), []);

  // Function to send a lightweight heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!user?.id) return;
    try {
      await fetch("/api/user/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Ignore heartbeat network errors silently
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Send immediate heartbeat on mount
    sendHeartbeat();

    // Setup periodic heartbeat every 3 minutes
    const heartbeatInterval = setInterval(sendHeartbeat, 3 * 60 * 1000);

    // Track user presence via Supabase Realtime channel
    const channel = supabase.channel("online_presence", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    const updatePresenceState = () => {
      const state = channel.presenceState();
      const ids = new Set<string>();

      Object.entries(state).forEach(([key, presences]) => {
        if (key) ids.add(key);
        if (Array.isArray(presences)) {
          presences.forEach((p: any) => {
            if (p?.user_id) ids.add(p.user_id);
          });
        }
      });

      // Always include current user if logged in
      if (user?.id) {
        ids.add(user.id);
      }

      setOnlineUserIds(ids);
    };

    channel
      .on("presence", { event: "sync" }, updatePresenceState)
      .on("presence", { event: "join" }, updatePresenceState)
      .on("presence", { event: "leave" }, updatePresenceState)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.track({
              user_id: user.id,
              name: user.name,
              email: user.email,
              online_at: new Date().toISOString(),
            });
          } catch (err) {
            console.error("Failed to track presence:", err);
          }
        }
      });

    // Handle document visibility change (e.g. tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.name, user?.email, supabase, sendHeartbeat]);

  const isUserOnline = useCallback(
    (userId?: string | null) => {
      if (!userId) return false;
      if (user?.id && user.id === userId) return true;
      return onlineUserIds.has(userId);
    },
    [onlineUserIds, user?.id]
  );

  const contextValue = useMemo(
    () => ({
      onlineUserIds,
      isUserOnline,
      onlineCount: onlineUserIds.size,
    }),
    [onlineUserIds, isUserOnline]
  );

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
