"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "./user-context";

interface PresenceContextType {
  onlineUserIds: Set<string>;
  isUserOnline: (userId?: string | null) => boolean;
  onlineCount: number;
  broadcastForceSignOut: (targetUserId?: string, all?: boolean) => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUserIds: new Set(),
  isUserOnline: () => false,
  onlineCount: 0,
  broadcastForceSignOut: async () => {},
});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const user = useUserContext();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<any>(null);

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

    channelRef.current = channel;

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
      .on("broadcast", { event: "force_signout" }, async ({ payload }: { payload: any }) => {
        if (!user?.id) return;
        const isTargetUser = payload?.targetUserId && payload.targetUserId === user.id;
        const isBulkExceptIssuer = payload?.all && payload?.issuerId !== user.id;
        
        if (isTargetUser || isBulkExceptIssuer) {
          console.warn("[FORCE_SIGNOUT] Active session revoked by administrator.");
          try {
            await supabase.auth.signOut();
          } catch {
            // Ignore signOut error during forced exit
          }
          window.location.href = "/login?error=SessionTerminated";
        }
      })
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
      channelRef.current = null;
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.name, user?.email, supabase, sendHeartbeat]);

  const broadcastForceSignOut = useCallback(
    async (targetUserId?: string, all?: boolean) => {
      if (!channelRef.current) return;
      try {
        await channelRef.current.send({
          type: "broadcast",
          event: "force_signout",
          payload: {
            targetUserId,
            all: Boolean(all),
            issuerId: user?.id,
          },
        });
      } catch (err) {
        console.error("Failed to broadcast force signout:", err);
      }
    },
    [user?.id]
  );

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
      broadcastForceSignOut,
    }),
    [onlineUserIds, isUserOnline, broadcastForceSignOut]
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
