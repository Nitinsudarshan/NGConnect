"use client";

import React, { createContext, useContext } from "react";

import type { UserRole } from "@/lib/roles";

export type User = {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role?: UserRole;
    isAlumni?: boolean;
};

const UserContext = createContext<User | null>(null);

export function UserProvider({
    user,
    children,
}: {
    user: User | null;
    children: React.ReactNode;
}) {
    return (
        <UserContext.Provider value={user}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    return useContext(UserContext);
}
