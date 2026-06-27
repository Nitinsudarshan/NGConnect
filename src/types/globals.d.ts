export { }

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            role?: "Super Admin" | "Admin" | "Manager" | "Operator" | "Analyst" | "Viewer" | "Program" | "Operations" | "Volunteer";
            team?: "CEO's Office" | "Alumni Growth" | "Pay-Forward" | "None";
            volunteerEnabled?: boolean;
            userManagementEnabled?: boolean;
        };
    }
}
