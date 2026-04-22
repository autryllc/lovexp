# Love XP — Supabase beta starter

This is a real backend-connected starter for Love XP. It is still intentionally lightweight, but it supports:

- Supabase Auth sign up / log in
- paired couple accounts via invite code
- tasks
- quests
- rewards
- value reviews
- shared activity feed
- persistent profile themes

## Files

- `index.html` — main app shell
- `styles.css` — UI styles and theme system
- `app.js` — frontend app logic and Supabase calls
- `config.example.js` — sample config file
- `config.js` — your actual project config
- `supabase-schema.sql` — database tables + RLS policies

## Setup

1. Create a Supabase project.
2. In the SQL editor, run `supabase-schema.sql`.
3. In Auth settings, disable email confirmation for quicker testing, or keep it enabled if you want real email verification.
4. Copy values from your Supabase project settings into `config.js`:

```js
window.LOVEXP_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

5. Serve the folder with a local web server.

## Quick local run

Python:

```bash
cd lovexp-supabase
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Beta-testing flow

1. Create account A.
2. Create account B in another browser or private window.
3. From account A, go to Pairing and create a couple.
4. Copy the invite code.
5. From account B, join with the code.
6. Start testing tasks, quests, rewards, approvals, and activity sync.

## Notes

- This starter uses simple table updates for points rather than a full transaction ledger.
- For production, add a dedicated `point_transactions` table, push notifications, row-level action validation, and stronger audit logging.
- The current version is ideal for beta concept testing and handing off to a coder as a concrete starter.
