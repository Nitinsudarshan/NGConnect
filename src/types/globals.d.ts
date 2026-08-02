export { }

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            role?: "Super Admin" | "Admin" | "Manager" | "Program" | "Operations" | "Viewer" | "Member";
            team?: "CEO's Office" | "Alumni Growth" | "PNC" | "Finance" | "None";
        };
    }
}
