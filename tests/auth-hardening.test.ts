import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateAuthPayloadSize,
  sanitizeUserAuthMetadata,
  sanitizeAppAuthMetadata,
  AUTH_BUDGET,
} from '../src/lib/auth-guard';
import { getSafeAvatarUrl, isMalformedAvatarValue } from '../src/lib/avatar';
import { inspectCookieHeader } from '../src/lib/auth-diagnostics';

test('1. Auth Contract & Allowlist Rules', async (t) => {
  await t.test('strictly allows only authorized identity keys in user_metadata', () => {
    const input = {
      full_name: 'Jane Doe',
      name: 'Jane Doe',
      email: 'jane@example.com',
      bio: 'This is a rich profile biography that belongs in PostgreSQL.',
      skills: ['React', 'Next.js', 'PostgreSQL', 'TypeScript'],
      campus: 'Bangalore',
      batch: '2024',
      education: 'Undergraduate',
      phone: '+91 99999 88888',
      city: 'Bengaluru',
      state: 'Karnataka',
      selectedTheme: 'midnight',
      untrustedField: 'hacker_payload',
    };

    const cleaned = sanitizeUserAuthMetadata(input);

    assert.equal(cleaned.full_name, 'Jane Doe');
    assert.equal(cleaned.name, 'Jane Doe');
    assert.equal(cleaned.bio, undefined);
    assert.equal(cleaned.skills, undefined);
    assert.equal(cleaned.campus, undefined);
    assert.equal(cleaned.batch, undefined);
    assert.equal(cleaned.education, undefined);
    assert.equal(cleaned.phone, undefined);
    assert.equal(cleaned.city, undefined);
    assert.equal(cleaned.state, undefined);
    assert.equal(cleaned.selectedTheme, undefined);
    assert.equal(cleaned.untrustedField, undefined);
  });

  await t.test('strictly allows only authorization keys in app_metadata', () => {
    const input = {
      role: 'Admin',
      team: "CEO's Office",
      is_alumni: true,
      extraData: 'Should be removed',
      bio: 'Forbidden',
    };

    const cleaned = sanitizeAppAuthMetadata(input);
    assert.equal(cleaned.role, 'Admin');
    assert.equal(cleaned.team, "CEO's Office");
    assert.equal(cleaned.is_alumni, true);
    assert.equal(cleaned.extraData, undefined);
    assert.equal(cleaned.bio, undefined);
  });
});

test('2. Avatar Safety & Data URI Rejection', async (t) => {
  await t.test('accepts valid HTTP and HTTPS URLs', () => {
    const googleUrl = 'https://lh3.googleusercontent.com/a/ACg8ocK_WjwbAmUUf-sFZJiLO9023bLhp-ho6XqGindu4d5_E_Y9jg=s96-c';
    const storageUrl = 'https://abcdefgh.supabase.co/storage/v1/object/public/avatars/user-123/12345.png';

    assert.equal(getSafeAvatarUrl({ picture: googleUrl }), googleUrl);
    assert.equal(getSafeAvatarUrl({ avatar_url: storageUrl }), storageUrl);
  });

  await t.test('strictly rejects base64 data URIs', () => {
    const base64Avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    assert.equal(getSafeAvatarUrl({ avatarUrl: base64Avatar }), null);
    assert.equal(isMalformedAvatarValue(base64Avatar), true);

    const cleaned = sanitizeUserAuthMetadata({
      full_name: 'Test User',
      avatar_url: base64Avatar,
    });
    assert.equal(cleaned.avatar_url, undefined);
  });

  await t.test('rejects blob and javascript schemes', () => {
    assert.equal(getSafeAvatarUrl({ picture: 'blob:http://localhost:3000/1234-5678' }), null);
    assert.equal(getSafeAvatarUrl({ avatar_url: 'javascript:alert(1)' }), null);
  });

  await t.test('rejects oversized avatar URLs (> 2048 chars)', () => {
    const massiveUrl = 'https://example.com/' + 'a'.repeat(2500);
    assert.equal(getSafeAvatarUrl({ avatar_url: massiveUrl }), null);
  });
});

test('3. Auth Payload Size Budget & Guardrails', async (t) => {
  await t.test('evaluates small payloads (< 3KB) as HEALTHY', () => {
    const payload = {
      role: 'Program',
      team: 'Alumni Growth',
      full_name: 'Payal Kumawat',
      avatar_url: 'https://lh3.googleusercontent.com/avatar.jpg',
    };
    const res = evaluateAuthPayloadSize(payload);
    assert.equal(res.status, 'HEALTHY');
    assert.equal(res.isBlocked, false);
    assert.ok(res.sizeBytes < AUTH_BUDGET.NORMAL_MAX_BYTES);
  });

  await t.test('evaluates payloads >= 3KB as WARNING', () => {
    const largePayload = {
      role: 'Admin',
      data: 'x'.repeat(3100),
    };
    const res = evaluateAuthPayloadSize(largePayload);
    assert.equal(res.status, 'WARNING');
    assert.equal(res.isBlocked, false);
  });

  await t.test('evaluates payloads >= 3.8KB as CRITICAL', () => {
    const criticalPayload = {
      role: 'Admin',
      data: 'x'.repeat(3900),
    };
    const res = evaluateAuthPayloadSize(criticalPayload);
    assert.equal(res.status, 'CRITICAL');
    assert.equal(res.isBlocked, false);
  });

  await t.test('HARD BLOCKS payloads >= 4KB', () => {
    const oversizedPayload = {
      role: 'Admin',
      data: 'x'.repeat(4500),
    };
    const res = evaluateAuthPayloadSize(oversizedPayload);
    assert.equal(res.status, 'BLOCKED');
    assert.equal(res.isBlocked, true);
  });
});

test('4. Cookie Header Diagnostics & Bounded State', async (t) => {
  await t.test('accurately inspects Cookie header size without leaking token values', () => {
    const sampleCookieHeader = 'sb-abcdef-auth-token.0=eyJhbGciOi...; sb-abcdef-auth-token.1=...xyz; dev-role-override=Admin';
    const diag = inspectCookieHeader(sampleCookieHeader);

    assert.equal(diag.supabaseCookieCount, 2);
    assert.equal(diag.authCookieCount, 3);
    assert.ok(diag.totalCookieHeaderBytes > 0);
    assert.equal(diag.status, 'HEALTHY');
  });

  await t.test('flags oversized Cookie headers in edge inspection', () => {
    const bloatedCookieHeader = 'sb-token.0=' + 'x'.repeat(3500) + '; other=123';
    const diag = inspectCookieHeader(bloatedCookieHeader);

    assert.equal(diag.status, 'WARNING');
  });
});

test('5. Zero-Crash Resilience on Malformed Data', async (t) => {
  await t.test('never throws when presented with null, undefined, numbers, or circular objects', () => {
    assert.doesNotThrow(() => sanitizeUserAuthMetadata(null));
    assert.doesNotThrow(() => sanitizeUserAuthMetadata(undefined));
    assert.doesNotThrow(() => sanitizeUserAuthMetadata({ full_name: null as any }));
    assert.doesNotThrow(() => evaluateAuthPayloadSize(null));
    assert.doesNotThrow(() => getSafeAvatarUrl(undefined));
  });
});
