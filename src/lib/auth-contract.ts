import { UserRole, UserTeam } from './role-constants';

/**
 * Strict Auth Metadata Contract for NGConnect.
 * 
 * INVARIANTS:
 * 1. Auth metadata is NOT a general-purpose profile store.
 * 2. app_metadata contains strictly authorization claims (role, team, is_alumni).
 * 3. user_metadata contains strictly essential authentication & identity claims.
 * 4. All rich profile data (bio, skills, phone, campus, etc.) belongs in the PostgreSQL database.
 * 5. Avatars in metadata must strictly be HTTP(S) URLs <= 2048 characters (never data:image base64).
 */

/** Allowlisted keys permitted in Supabase Auth user_metadata */
export const ALLOWED_USER_METADATA_KEYS = [
  'full_name',
  'name',
  'first_name',
  'last_name',
  'avatar_url',
  'avatarUrl',
  'picture',
  'email',
  'email_verified',
  'phone_verified',
  'iss',
  'sub',
  'provider_id',
  'custom_claims',
  'force_signout_at',
  'last_login_at',
  'last_active_at',
  'role',        // Fallback for legacy clients
  'team',        // Fallback for legacy clients
  'is_alumni',    // Fallback for legacy clients
] as const;

export type AllowedUserMetadataKey = typeof ALLOWED_USER_METADATA_KEYS[number];

/** Allowlisted keys permitted in Supabase Auth app_metadata */
export const ALLOWED_APP_METADATA_KEYS = [
  'role',
  'team',
  'is_alumni',
  'provider',
  'providers',
] as const;

export type AllowedAppMetadataKey = typeof ALLOWED_APP_METADATA_KEYS[number];

/** Explicitly forbidden keys in auth metadata (must live in database) */
export const FORBIDDEN_METADATA_KEYS = [
  'bio',
  'skills',
  'phone',
  'city',
  'state',
  'campus',
  'course',
  'batch',
  'education',
  'gender',
  'github',
  'linkedin',
  'selectedTheme',
  'selected_theme',
  'current_company',
  'current_position',
  'current_salary',
  'career_progression',
  'mentoring_interests',
] as const;

export interface MinimalAppMetadata {
  role?: UserRole;
  team?: UserTeam;
  is_alumni?: boolean;
  provider?: string;
  providers?: string[];
  [key: string]: unknown;
}

export interface MinimalUserMetadata {
  full_name?: string;
  name?: string;
  avatar_url?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  iss?: string;
  sub?: string;
  provider_id?: string;
  custom_claims?: Record<string, unknown>;
  force_signout_at?: string;
  last_login_at?: string;
  last_active_at?: string;
  role?: UserRole;
  team?: UserTeam;
  is_alumni?: boolean;
  [key: string]: unknown;
}
