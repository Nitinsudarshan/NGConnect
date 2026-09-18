"use client";

import React, { createContext, useContext, useMemo } from "react";

import type { ActionType } from "@/lib/resource-tree";
import type { PermissionMap } from "@/lib/permissions";

const PermissionContext = createContext<PermissionMap>({});

/**
 * Makes the current user's effective RBAC permissions available to client
 * components so navigation entries, cards, and action buttons can hide or
 * disable themselves rather than linking to a page that will deny access.
 */
export function PermissionProvider({
    permissions,
    children,
}: {
    permissions: PermissionMap;
    children: React.ReactNode;
}) {
    return (
        <PermissionContext.Provider value={permissions}>
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions() {
    return useContext(PermissionContext);
}

/** Returns a `can(resourceId, action)` helper bound to the current user. */
export function useCan() {
    const permissions = usePermissions();
    return useMemo(
        () => (resourceId: string, action: ActionType = "view") => !!permissions[resourceId]?.[action],
        [permissions],
    );
}

/** Returns true when the user can perform `action` on any of `resourceIds`. */
export function useCanAny() {
    const permissions = usePermissions();
    return useMemo(
        () => (resourceIds: string[], action: ActionType = "view") =>
            resourceIds.some(id => !!permissions[id]?.[action]),
        [permissions],
    );
}
