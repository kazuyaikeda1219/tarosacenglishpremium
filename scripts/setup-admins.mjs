import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAILS = ['ikeda.sagacity@gmail.com', 'p.s.yutarooo@gmail.com'];

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === email);
    if (u) return u;
    if (data.users.length < 1000) return null;
    page++;
  }
}

for (const raw of EMAILS) {
  const email = raw.toLowerCase();
  const log = (...m) => console.log(`[${email}]`, ...m);

  try {
    // 1) ホワイトリスト登録
    const { error: wlErr } = await admin
      .from('allowed_emails')
      .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });
    if (wlErr) { log('allowed_emails ERROR:', wlErr.message); }
    else { log('allowed_emails: OK'); }

    // 2) Auth ユーザー（無ければ作成）
    let user = await findUserByEmail(email);
    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (error) { log('createUser ERROR:', error.message); continue; }
      user = data.user;
      log('auth user: CREATED', user.id);
    } else {
      log('auth user: EXISTS', user.id);
    }

    // 3) profiles を role=admin に（既存は role のみ更新、無ければ作成）
    const { data: existing } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await admin.from('profiles').update({ role: 'admin' }).eq('id', user.id);
      log('profiles role:', error ? `ERROR ${error.message}` : `admin (was ${existing.role})`);
    } else {
      const { error } = await admin.from('profiles').insert({
        id: user.id,
        display_name: email.split('@')[0],
        role: 'admin',
      });
      log('profiles:', error ? `ERROR ${error.message}` : 'CREATED role=admin');
    }
  } catch (e) {
    log('FATAL:', e.message);
  }
}

console.log('\nDone.');
