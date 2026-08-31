import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local manually
const envLocal = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});

const adminSupabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function getSafeAvatarUrl(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  const candidates = [metadata.picture, metadata.avatar_url, metadata.avatarUrl, metadata.imageUrl];
  for (const c of candidates) {
    if (typeof c === 'string') {
      const trimmed = c.trim();
      if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) continue;
      if (/^(https?:\/\/|\/)/i.test(trimmed) && trimmed.length <= 2048) return trimmed;
    }
  }
  return null;
}

const ALLOWED_USER_KEYS = new Set([
  'full_name', 'name', 'first_name', 'last_name',
  'avatar_url', 'avatarUrl', 'picture',
  'email', 'email_verified', 'phone_verified',
  'iss', 'sub', 'provider_id', 'custom_claims',
  'force_signout_at', 'last_login_at', 'last_active_at',
  'role', 'team', 'is_alumni'
]);

const ALLOWED_APP_KEYS = new Set([
  'role', 'team', 'is_alumni', 'provider', 'providers'
]);

async function migrate() {
  console.log('=== STARTING AUTH METADATA MIGRATION & PROFILE ISOLATION ===\n');

  const { data: { users }, error } = await adminSupabase.auth.admin.listUsers();
  if (error || !users) {
    console.error('Failed to list users:', error);
    return;
  }

  console.log(`Found ${users.length} registered users. Processing...\n`);

  for (const u of users) {
    const rawMeta = u.user_metadata || {};
    const rawAppMeta = u.app_metadata || {};
    const email = (u.email || '').trim().toLowerCase();

    const beforeSize = Buffer.byteLength(JSON.stringify(rawMeta), 'utf8') + Buffer.byteLength(JSON.stringify(rawAppMeta), 'utf8');

    // 1. Extract rich profile data and sync to public.alumni_profile table
    if (email) {
      const safeAvatar = getSafeAvatarUrl(rawMeta);
      const batchYearNum = rawMeta.batch ? parseInt(rawMeta.batch, 10) : null;

      const profilePayload = {
        alumni_email: email,
        phone_number: rawMeta.phone || null,
        city: rawMeta.city || null,
        state: rawMeta.state || null,
        highest_education: rawMeta.education || null,
        batch_year: isNaN(batchYearNum) ? null : batchYearNum,
        bio: rawMeta.bio || null,
        skills: Array.isArray(rawMeta.skills) ? rawMeta.skills.slice(0, 5) : [],
        linkedin_profile: rawMeta.linkedin || null,
        github_profile: rawMeta.github || null,
        profile_photo: safeAvatar || null,
        updated_at: new Date().toISOString(),
        updated_by: u.id,
      };

      const { error: profileErr } = await adminSupabase
        .from('alumni_profile')
        .upsert(profilePayload, { onConflict: 'alumni_email' });

      if (profileErr) {
        console.warn(`  [${email}] Note on alumni_profile upsert: ${profileErr.message}`);
      }
    }

    // 2. Clean user_metadata
    const safeAvatar = getSafeAvatarUrl(rawMeta);
    const cleanUserMeta = {};
    for (const [k, v] of Object.entries(rawMeta)) {
      if (ALLOWED_USER_KEYS.has(k) && v !== null && v !== undefined) {
        if (k === 'avatar_url' || k === 'avatarUrl' || k === 'picture') {
          if (safeAvatar) cleanUserMeta[k] = safeAvatar;
        } else if (typeof v === 'string') {
          const trimmed = v.trim();
          if (!trimmed.startsWith('data:') && trimmed.length <= 2048) {
            cleanUserMeta[k] = trimmed;
          }
        } else {
          cleanUserMeta[k] = v;
        }
      }
    }
    if (safeAvatar) {
      cleanUserMeta.avatar_url = safeAvatar;
      cleanUserMeta.avatarUrl = safeAvatar;
    }

    // 3. Clean app_metadata
    const cleanAppMeta = {};
    for (const [k, v] of Object.entries(rawAppMeta)) {
      if (ALLOWED_APP_KEYS.has(k) && v !== null && v !== undefined) {
        cleanAppMeta[k] = v;
      }
    }

    // Ensure role and team defaults
    if (!cleanAppMeta.role) cleanAppMeta.role = cleanUserMeta.role || 'Member';
    if (!cleanAppMeta.team) cleanAppMeta.team = cleanUserMeta.team || 'None';

    // 4. Update Supabase Auth user
    const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(u.id, {
      user_metadata: cleanUserMeta,
      app_metadata: cleanAppMeta,
    });

    const afterSize = Buffer.byteLength(JSON.stringify(cleanUserMeta), 'utf8') + Buffer.byteLength(JSON.stringify(cleanAppMeta), 'utf8');

    if (updateErr) {
      console.error(`❌ [${email}] Failed to update: ${updateErr.message}`);
    } else {
      console.log(`✅ [${email.padEnd(32)}] ${beforeSize} B -> ${afterSize} B (Reduced by ${beforeSize - afterSize} B)`);
    }
  }

  console.log('\n=== MIGRATION COMPLETE ===');
}

migrate();
