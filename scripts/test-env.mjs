import { readFileSync } from 'fs';
import { createRequire } from 'module';

// Load .env manually
const env = readFileSync('f:\\Memory-Rooms\\.env', 'utf-8');
const vars = {};
for (const line of env.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...rest] = trimmed.split('=');
  vars[key.trim()] = rest.join('=').replace(/^["']|["']$/g, '').trim();
}

console.log('\n🔍 ENV VARIABLE AUDIT\n' + '='.repeat(50));

const checks = [
  { key: 'DATABASE_URL', type: 'postgres_pooler' },
  { key: 'DIRECT_URL', type: 'postgres_direct' },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', type: 'https_url' },
  { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', type: 'jwt' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', type: 'jwt' },
  { key: 'UPLOADTHING_SECRET', type: 'ut_secret' },
  { key: 'UPLOADTHING_APP_ID', type: 'string' },
  { key: 'UPLOADTHING_TOKEN', type: 'base64' },
  { key: 'ADMIN_PASSWORD', type: 'string' },
  { key: 'ADMIN_EMAIL', type: 'email' },
  { key: 'ADMIN_EMAIL_2', type: 'email' },
];

let warnings = 0;

for (const { key, type } of checks) {
  const val = vars[key];
  if (!val) {
    console.log(`❌ ${key}: MISSING`);
    warnings++;
    continue;
  }

  let status = '✅';
  let note = '';

  if (type === 'postgres_pooler') {
    if (!val.startsWith('postgresql://')) { status = '❌'; note = 'must start with postgresql://'; warnings++; }
    else if (!val.includes('pgbouncer=true')) { status = '⚠️ '; note = 'missing pgbouncer=true (pooler URL should have it)'; warnings++; }
    else { note = `host: ${val.split('@')[1]?.split('/')[0]}`; }
  } else if (type === 'postgres_direct') {
    if (!val.startsWith('postgresql://')) { status = '❌'; note = 'must start with postgresql://'; warnings++; }
    else { note = `host: ${val.split('@')[1]?.split('/')[0]}`; }
  } else if (type === 'https_url') {
    if (!val.startsWith('https://')) { status = '❌'; note = 'must start with https://'; warnings++; }
    else { note = val; }
  } else if (type === 'jwt') {
    if (!val.startsWith('eyJ')) { status = '❌'; note = 'invalid JWT format'; warnings++; }
    else {
      try {
        const payload = JSON.parse(Buffer.from(val.split('.')[1], 'base64').toString());
        const exp = payload.exp ? new Date(payload.exp * 1000).toISOString().split('T')[0] : 'no-expiry';
        note = `role: ${payload.role}, expires: ${exp}`;
      } catch { note = 'valid JWT (could not decode)'; }
    }
  } else if (type === 'ut_secret') {
    if (!val.startsWith('sk_live_') && !val.startsWith('sk_test_')) { status = '⚠️ '; note = 'expected sk_live_ or sk_test_ prefix'; warnings++; }
    else { note = `${val.substring(0, 12)}...`; }
  } else if (type === 'base64') {
    try { Buffer.from(val, 'base64').toString(); note = 'valid base64'; } 
    catch { status = '❌'; note = 'invalid base64'; warnings++; }
  } else if (type === 'email') {
    if (!val.includes('@') || val === 'your.girlfriend@email.com') { 
      status = '⚠️ '; 
      note = val === 'your.girlfriend@email.com' ? 'PLACEHOLDER — replace with real email!' : 'invalid email format'; 
      warnings++; 
    } else { note = val; }
  } else {
    note = val.length > 30 ? val.substring(0, 30) + '...' : val;
  }

  console.log(`${status} ${key}: ${note}`);
}

console.log('\n' + '='.repeat(50));
if (warnings === 0) {
  console.log('🎉 All env vars look good!');
} else {
  console.log(`⚠️  ${warnings} issue(s) found — review above`);
}
