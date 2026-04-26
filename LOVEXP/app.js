const SUPABASE_URL = window.LOVEXP_CONFIG?.supabaseUrl || '';
const SUPABASE_ANON_KEY = window.LOVEXP_CONFIG?.supabaseAnonKey || '';
const IS_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabaseClient = IS_CONFIGURED
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const themeLabels = {
  fantasy: 'Fantasy RPG',
  romantic: 'Romantic',
  n64: 'N64',
  retro: 'Retro'
};

const shopItems = [
  { category: 'Gift Cards', title: '$25 Restaurant Gift Card', description: 'Discounted date-night dining gift card.', price: '$22' },
  { category: 'Gift Cards', title: '$50 Coffee Shop Bundle', description: 'Use toward coffee dates and treats.', price: '$44' },
  { category: 'Dining', title: 'Dinner Reservation Deal', description: 'Special reservation perk for couples.', price: '$10 deposit' },
  { category: 'Dining', title: 'Brunch for Two', description: 'Discounted brunch experience idea.', price: '$28' },
  { category: 'Date Night', title: 'Movie Night Bundle', description: 'Tickets + snack combo bundle.', price: '$30' },
  { category: 'Date Night', title: 'Arcade Date Pack', description: 'Tokens and drinks for a fun night out.', price: '$24' },
  { category: 'Travel', title: 'Weekend Getaway Deal', description: 'Discounted couples stay package.', price: 'From $199' },
  { category: 'Travel', title: 'Road Trip Hotel Credit', description: 'Starter deal for an overnight getaway.', price: '$79' },
  { category: 'Experiences', title: 'Mini Golf for Two', description: 'Discounted local activity option.', price: '$18' },
  { category: 'Experiences', title: 'Escape Room Entry', description: 'Couples challenge night.', price: '$36' },
  { category: 'Relaxation', title: 'Spa Credit', description: 'Couples massage or spa credit.', price: '$75' },
  { category: 'Relaxation', title: 'Self-Care Box', description: 'Candles, oils, and bath items.', price: '$32' }
];

const quickTemplates = {
  task: [
    { title: 'Do the dishes', description: 'Handle dish cleanup after dinner.', points_value: 20, category: 'Chores' },
    { title: 'Take out the trash', description: 'Bag and take trash out tonight.', points_value: 10, category: 'Chores' },
    { title: 'Laundry reset', description: 'Wash, dry, and fold one full load.', points_value: 30, category: 'Chores' },
    { title: 'Pack lunches', description: 'Prepare lunches for tomorrow.', points_value: 15, category: 'Support' },
    { title: 'Tidy the living room', description: 'Quick room reset and pickup.', points_value: 15, category: 'Chores' }
  ],
  quest: [
    { title: 'Coffee run', description: 'Bring me my favorite drink on your way home.', points_value: 15, bonus_points: 10, priority: 'normal' },
    { title: 'Snack rescue', description: 'Grab my favorite snack while you’re out.', points_value: 10, bonus_points: 5, priority: 'low' },
    { title: 'Gas up the car', description: 'Please fill up the car today.', points_value: 20, bonus_points: 10, priority: 'urgent' },
    { title: 'Pick up dinner', description: 'Grab dinner for tonight.', points_value: 25, bonus_points: 10, priority: 'normal' },
    { title: 'Medicine pickup', description: 'Pick up the prescription today.', points_value: 25, bonus_points: 15, priority: 'urgent' }
  ],
  reward: [
    { title: '30-minute massage', description: 'Phone down, full focus massage.', point_cost: 120, category: 'Relaxation' },
    { title: 'Date night choice', description: 'You choose the date night plan.', point_cost: 180, category: 'Date Night' },
    { title: 'Favorite meal request', description: 'Request your favorite homemade meal.', point_cost: 100, category: 'Food' },
    { title: 'Movie night pick', description: 'Pick the movie, snacks, and setup.', point_cost: 90, category: 'Quality Time' },
    { title: 'Sleep-in morning', description: 'Extra rest while partner handles the morning.', point_cost: 140, category: 'Relaxation' }
  ]
};

const viewMeta = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Track points, teamwork, and rewards together.',
    action: '+ Quick Quest'
  },
  pairing: {
    title: 'Pairing',
    subtitle: 'Link both accounts and manage your couple profile.',
    action: '+ Invite Code'
  },
  tasks: {
    title: 'Tasks',
    subtitle: 'Recurring or one-time acts of service with approval flow.',
    action: '+ New Task'
  },
  quests: {
    title: 'Quests',
    subtitle: 'Immediate requests with bonus points and urgency.',
    action: '+ New Quest'
  },
  rewards: {
    title: 'Rewards',
    subtitle: 'Create reward options and redeem points for fun wins.',
    action: '+ New Reward'
  },
  reviews: {
    title: 'Value Reviews',
    subtitle: 'Negotiate point values and keep things fair.',
    action: '+ New Review'
  },
  activity: {
    title: 'Activity',
    subtitle: 'Shared timeline of progress, approvals, and redemptions.',
    action: 'Refresh Feed'
  },
  themes: {
    title: 'Themes',
    subtitle: 'Test different visual directions for the same product.',
    action: 'Apply Theme'
  },
  settings: {
    title: 'Settings',
    subtitle: 'Profile, notifications, and beta-test controls.',
    action: 'Save Settings'
  }
};

const state = {
  authUser: null,
  profile: null,
  partner: null,
  couple: null,
  members: [],
  tasks: [],
  quests: [],
  rewards: [],
  reviews: [],
  redemptions: [],
  activity: [],
  currentView: 'dashboard',
  activeTheme: 'fantasy',
  loading: false
};

const app = document.getElementById('app');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalForm = document.getElementById('modalForm');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const toastStack = document.getElementById('toastStack');

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || 'LX'
  );
}

function generateInviteCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out.toUpperCase();
}

function normalizeInviteCode(value = '') {
  return String(value).trim().toUpperCase();
}

function toast(title, body) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<strong>${escapeHtml(title)}</strong><div>${escapeHtml(body)}</div>`;
  toastStack.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

async function copyText(text) {
  try {
    await navigator.clipboard?.writeText(text);
    toast('Copied', `${text} copied to clipboard.`);
  } catch {
    toast('Copy failed', 'Clipboard access was blocked.');
  }
}

function statusBadge(status) {
  const map = {
    open: 'good',
    accepted: 'good',
    approved: 'good',
    awaiting_accept: 'warn',
    pending_approval: 'warn',
    redeemed: 'good',
    fulfilled: 'good',
    rejected: 'danger',
    declined: 'danger',
    resolved: 'good'
  };
  return `<span class="badge ${map[status] || ''}">${escapeHtml(
    String(status || 'open').replaceAll('_', ' ')
  )}</span>`;
}

function currentUserId() {
  return state.authUser?.id || null;
}

function currentUserName() {
  return state.profile?.name || state.authUser?.email || 'You';
}

function getBadgeCounts() {
  return {
    dashboard:
      state.tasks.filter((t) => t.status === 'pending_approval').length +
      state.redemptions.filter(
        (r) => r.status === 'pending' && r.fulfilled_by_user_id === currentUserId()
      ).length,
    pairing: 0,
    tasks: state.tasks.filter((t) => t.status === 'pending_approval').length,
    quests: state.quests.filter((q) =>
      ['awaiting_accept', 'pending_approval'].includes(q.status)
    ).length,
    rewards: state.redemptions.filter(
      (r) => r.status === 'pending' && r.fulfilled_by_user_id === currentUserId()
    ).length,
    reviews: state.reviews.filter((r) => r.status === 'open').length,
    activity: 0,
    themes: 0,
    settings: 0
  };
}

function resetState() {
  state.profile = null;
  state.partner = null;
  state.couple = null;
  state.members = [];
  state.tasks = [];
  state.quests = [];
  state.rewards = [];
  state.reviews = [];
  state.redemptions = [];
  state.activity = [];
  state.activeTheme = 'fantasy';
  state.currentView = 'dashboard';
}

async function ensureProfile(user, profileName = '') {
  const { data: existing, error: existingError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const payload = {
    id: user.id,
    email: user.email,
    name: profileName || user.user_metadata?.name || user.email.split('@')[0],
    theme: 'fantasy',
    points_balance: 0,
    lifetime_earned: 0,
    lifetime_spent: 0
  };

  const { data, error } = await supabaseClient
    .from('profiles')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function safeSingle(table, filters = {}) {
  let query = supabaseClient.from(table).select('*');
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function createActivity(eventType, title, body, coupleId = null) {
  const resolvedCoupleId = coupleId || state.couple?.id;
  if (!resolvedCoupleId || !currentUserId()) return;

  const { error } = await supabaseClient.from('activity_events').insert({
    couple_id: resolvedCoupleId,
    actor_user_id: currentUserId(),
    event_type: eventType,
    title,
    body
  });

  if (error) throw error;
}

async function adjustPoints(userId, delta) {
  const member =
    state.members.find((m) => m.user_id === userId) ||
    (state.profile?.id === userId ? { profiles: state.profile } : null) ||
    (state.partner?.id === userId ? { profiles: state.partner } : null);

  const profile = member?.profiles;
  if (!profile) throw new Error('Could not find profile to adjust points.');

  const newBalance = Math.max(0, Number(profile.points_balance || 0) + Number(delta || 0));
  const earned =
    Number(profile.lifetime_earned || 0) + (delta > 0 ? Number(delta) : 0);
  const spent =
    Number(profile.lifetime_spent || 0) + (delta < 0 ? Math.abs(Number(delta)) : 0);

  const { error } = await supabaseClient
    .from('profiles')
    .update({
      points_balance: newBalance,
      lifetime_earned: earned,
      lifetime_spent: spent
    })
    .eq('id', userId);

  if (error) throw error;
}

async function loadAppData() {
  state.loading = true;

  try {
    state.profile = await ensureProfile(state.authUser);
    state.activeTheme = state.profile.theme || 'fantasy';

    const { data: memberRows, error: memberError } = await supabaseClient
      .from('couple_members')
      .select('couple_id, role, status')
      .eq('user_id', currentUserId())
      .eq('status', 'active');

    if (memberError) throw memberError;

    if (!memberRows?.length) {
      state.couple = null;
      state.partner = null;
      state.members = [];
      state.tasks = [];
      state.quests = [];
      state.rewards = [];
      state.reviews = [];
      state.redemptions = [];
      state.activity = [];
      return;
    }

    const coupleId = memberRows[0].couple_id;

    const { data: couple, error: coupleError } = await supabaseClient
      .from('couples')
      .select('*')
      .eq('id', coupleId)
      .single();

    if (coupleError) throw coupleError;
    state.couple = couple;

    const { data: members, error: membersError } = await supabaseClient
      .from('couple_members')
      .select('user_id, role, profiles(*)')
      .eq('couple_id', coupleId);

    if (membersError) throw membersError;

    state.members = members || [];
    state.partner =
      members?.find((m) => m.user_id !== currentUserId())?.profiles || null;

    const [tasks, quests, rewards, reviews, redemptions, activity] = await Promise.all([
      supabaseClient
        .from('tasks')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('quests')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('rewards')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('value_reviews')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('reward_redemptions')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false }),
      supabaseClient
        .from('activity_events')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    for (const result of [tasks, quests, rewards, reviews, redemptions, activity]) {
      if (result.error) throw result.error;
    }

    state.tasks = tasks.data || [];
    state.quests = quests.data || [];
    state.rewards = rewards.data || [];
    state.reviews = reviews.data || [];
    state.redemptions = redemptions.data || [];
    state.activity = activity.data || [];
  } catch (err) {
    console.error(err);
    toast('Load failed', err.message || 'Could not load app data.');
  } finally {
    state.loading = false;
  }
}

async function refreshAndRender(successMessage = '') {
  state.loading = true;
  renderShell();

  try {
    await Promise.race([
      loadAppData(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase request timed out.')), 12000)
      )
    ]);
  } catch (err) {
    console.error(err);
    toast('Refresh failed', err.message || 'Could not load data.');
  } finally {
    state.loading = false;
    renderShell();
  }

  if (successMessage) toast('Updated', successMessage);
}

function renderShell() {
  document.body.dataset.theme = state.activeTheme || 'fantasy';
  if (!state.authUser) {
    renderAuth();
  } else {
    renderApp();
  }
}

function renderAuth() {
  app.innerHTML = document.getElementById('authTemplate').innerHTML;
  app
    .querySelector('.auth-brand')
    .appendChild(document.getElementById('logoTemplate').content.cloneNode(true));

  const segBtns = [...app.querySelectorAll('.seg-btn')];
  const forms = {
    login: app.querySelector('#loginForm'),
    signup: app.querySelector('#signupForm')
  };

  segBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      segBtns.forEach((b) => b.classList.toggle('active', b === btn));
      Object.entries(forms).forEach(([k, form]) => {
        form.classList.toggle('active', k === btn.dataset.authView);
      });
    });
  });

  forms.login.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!IS_CONFIGURED) {
      toast('Setup required', 'SB Key Needed.');
      return;
    }

    const data = Object.fromEntries(new FormData(forms.login).entries());

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: String(data.email || '').trim(),
      password: String(data.password || '')
    });

    if (error) {
      toast('Login failed', error.message);
      return;
    }

    toast('Welcome back', 'You are now signed in.');
  });

  forms.signup.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!IS_CONFIGURED) {
      toast('Setup required', 'Add your Supabase keys first.');
      return;
    }

    const data = Object.fromEntries(new FormData(forms.signup).entries());

    const { data: authData, error } = await supabaseClient.auth.signUp({
      email: String(data.email || '').trim(),
      password: String(data.password || ''),
      options: {
        data: {
          name: String(data.name || '').trim()
        }
      }
    });

    if (error) {
      toast('Signup failed', error.message);
      return;
    }

    if (authData.user) {
      await ensureProfile(authData.user, String(data.name || '').trim());
      toast(
        'Account created',
        'Check your email if confirmation is enabled, then log in.'
      );
      segBtns[0].click();
      forms.login.querySelector('input[name="email"]').value = String(
        data.email || ''
      ).trim();
    }
  });
}

function renderApp() {
  app.innerHTML = document.getElementById('appTemplate').innerHTML;
  app
    .querySelector('.sidebar-brand')
    .appendChild(document.getElementById('logoTemplate').content.cloneNode(true));

  const nav = app.querySelector('#nav');
  const navItems = Object.keys(viewMeta);
  const badgeCounts = getBadgeCounts();

  nav.innerHTML = navItems
    .map((key) => {
      const count = badgeCounts[key] || 0;
      return `
        <button class="nav-item ${
          state.currentView === key ? 'active' : ''
        }" data-view="${key}">
          <span>${viewMeta[key].title}</span>
          ${count > 0 ? `<span class="nav-badge">${count}</span>` : ''}
        </button>
      `;
    })
    .join('');

  nav.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currentView = btn.dataset.view;
      renderApp();
    });
  });

  app.querySelector('#userAvatar').textContent = initials(currentUserName());
  app.querySelector('#partnerAvatar').textContent = initials(state.partner?.name || '+');
  app.querySelector('#pairTitle').textContent = state.partner
    ? `${state.profile.name} + ${state.partner.name}`
    : state.profile?.name || 'Love XP';
  app.querySelector('#pairSubtitle').textContent = state.partner
    ? 'Paired account active'
    : 'No partner linked yet';
  app.querySelector('#activeThemeLabel').textContent =
    themeLabels[state.activeTheme] || 'Fantasy RPG';
  app.querySelector('#inviteCodeDisplay').textContent = state.couple?.invite_code || '—';

  app.querySelector('#copyCodeBtn').addEventListener('click', () => {
    if (!state.couple?.invite_code) {
      toast('No code yet', 'Create a couple first.');
      return;
    }
    copyText(state.couple.invite_code);
  });

  app.querySelector('#logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    resetState();
    renderShell();
  });

  app.querySelector('#refreshBtn').addEventListener('click', async () => {
    await refreshAndRender('Fresh data pulled from Supabase.');
  });

  app.querySelector('#primaryActionBtn').textContent =
    viewMeta[state.currentView].action;
  app.querySelector('#primaryActionBtn').addEventListener('click', onPrimaryAction);
  app.querySelector('#viewTitle').textContent = viewMeta[state.currentView].title;
  app.querySelector('#viewSubtitle').textContent =
    viewMeta[state.currentView].subtitle;

  const content = app.querySelector('#contentArea');
  content.innerHTML = renderCurrentView();
  bindViewEvents(content);
  bindMobileNav();
}

function renderCurrentView() {
  if (state.loading) {
    return `<section class="panel glass"><h3>Loading…</h3><p class="muted">Syncing your latest activity.</p></section>`;
  }

  switch (state.currentView) {
    case 'dashboard':
      return renderDashboard();
    case 'pairing':
      return renderPairing();
    case 'tasks':
      return renderTasks();
    case 'quests':
      return renderQuests();
    case 'rewards':
      return renderRewards();
    case 'reviews':
      return renderReviews();
    case 'activity':
      return renderActivity();
    case 'themes':
      return renderThemes();
    case 'settings':
      return renderSettings();
    default:
      return renderDashboard();
  }
}

function renderDashboard() {
  const pendingTasks = state.tasks.filter((t) => t.status === 'pending_approval').length;
  const openQuests = state.quests.filter((q) =>
    ['awaiting_accept', 'accepted', 'pending_approval'].includes(q.status)
  ).length;
  const availableRewards = state.rewards.filter(
    (r) => Number(r.point_cost || 0) <= Number(state.profile?.points_balance || 0)
  ).length;
  const recent = state.activity.slice(0, 6);
  const pendingFulfillment = state.redemptions.filter(
    (r) => r.status === 'pending' && r.fulfilled_by_user_id === currentUserId()
  ).length;

  return `
    <section class="hero-panel glass-strong">
      <div>
        <span class="eyebrow">LIVE COUPLE PROTOTYPE</span>
        <h2>Level up everyday effort with shared points, quests, and rewards.</h2>
        <p class="muted">Stay on top of points, tasks, quests, rewards, and shared progress with your partner.</p>
        <div class="hero-actions">
          <button class="primary-btn" data-open-modal="quest">Send Quick Quest</button>
          <button class="secondary-btn" data-view-jump="pairing">Manage Pairing</button>
        </div>
      </div>
      <div class="xp-ring">
        <div class="xp-core">
          <div class="xp-number">${Number(state.profile?.points_balance || 0)}</div>
          <div class="xp-label">Your XP</div>
        </div>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card glass">
        <div class="stat-label">Your Balance</div>
        <div class="stat-value">${Number(state.profile?.points_balance || 0)}</div>
        <div class="stat-foot">Lifetime earned ${Number(state.profile?.lifetime_earned || 0)}</div>
      </article>

      <article class="stat-card glass">
        <div class="stat-label">Partner Balance</div>
        <div class="stat-value">${Number(state.partner?.points_balance || 0)}</div>
        <div class="stat-foot">Partner ready for rewards</div>
      </article>

      <article class="stat-card glass">
        <div class="stat-label">Pending Approvals</div>
        <div class="stat-value">${pendingTasks}</div>
        <div class="stat-foot">Tasks or quests waiting on review</div>
      </article>

      <article class="stat-card glass">
        <div class="stat-label">Pending Fulfillments</div>
        <div class="stat-value">${pendingFulfillment}</div>
        <div class="stat-foot">Rewards your partner redeemed</div>
      </article>

      <article class="stat-card glass">
        <div class="stat-label">Rewards You Can Redeem</div>
        <div class="stat-value">${availableRewards}</div>
        <div class="stat-foot">Available from your current balance</div>
      </article>
    </section>

    <section class="content-grid">
      <article class="data-card glass">
        <div class="panel-head">
          <h3>Pending Reward Fulfillment</h3>
        </div>
        <div class="list-stack">
          ${
            state.redemptions.filter(
              (r) => r.status === 'pending' && r.fulfilled_by_user_id === currentUserId()
            ).length
              ? state.redemptions
                  .filter(
                    (r) => r.status === 'pending' && r.fulfilled_by_user_id === currentUserId()
                  )
                  .map(
                    (r) => `
                      <div class="timeline-item">
                        <div class="activity-icon">🎁</div>
                        <div>
                          <strong>${escapeHtml(r.reward_title)}</strong>
                          <div class="muted">Your partner redeemed this for ${r.point_cost} XP.</div>
                        </div>
                        <div>
                          <button class="ghost-btn small" data-fulfill-reward="${r.id}">Mark fulfilled</button>
                        </div>
                      </div>
                    `
                  )
                  .join('')
              : `<div class="auth-note">No pending reward fulfillments.</div>`
          }
        </div>
      </article>
    </section>

    <section class="content-grid two-col">
      <article class="data-card glass">
        <div class="panel-head">
          <h3>Open quests</h3>
          <button class="ghost-btn small" data-view-jump="quests">Open</button>
        </div>
        <div class="list-stack">
          ${
            openQuests
              ? state.quests
                  .slice(0, 4)
                  .map((q) =>
                    cardLine(
                      q.title,
                      `${Number(q.points_value || 0) + Number(q.bonus_points || 0)} XP • ${String(q.status || '').replaceAll('_', ' ')}`
                    )
                  )
                  .join('')
              : emptyMini('No active quests yet.')
          }
        </div>
      </article>

      <article class="data-card glass">
        <div class="panel-head">
          <h3>Recent activity</h3>
          <button class="ghost-btn small" data-view-jump="activity">See all</button>
        </div>
        <div class="feed-stack">
          ${
            recent.length
              ? recent
                  .map((a) =>
                    timelineLine(
                      a.icon || '✨',
                      a.title,
                      a.body,
                      formatTime(a.created_at)
                    )
                  )
                  .join('')
              : emptyMini('Activity will appear here once you start using the app.')
          }
        </div>
      </article>
    </section>
  `;
}

function renderPairing() {
  const hasCouple = Boolean(state.couple);

  return `
    <section class="pairing-grid">
      <article class="panel glass-strong">
        <div class="panel-head">
          <h3>${hasCouple ? 'Your paired account' : 'Create your couple'}</h3>
        </div>
        <p class="muted">
          ${
            hasCouple
              ? 'Share your invite code or keep testing with your linked partner.'
              : 'Generate an invite code for your partner to join from their own account.'
          }
        </p>

        ${
          hasCouple
            ? `
              <div class="auth-note"><strong>Invite code:</strong> <code>${escapeHtml(
                state.couple.invite_code || ''
              )}</code></div>
              <div class="split-actions">
                <button class="primary-btn" id="copyInviteMain">Copy code</button>
                <button class="secondary-btn" id="regenCodeBtn">Regenerate code</button>
              </div>
              <div class="auth-note"><strong>Partner:</strong> ${escapeHtml(
                state.partner?.name || 'Waiting for partner'
              )}</div>
              <div class="auth-note">
                Leaving a couple will archive the shared workspace and let you pair again later.
              </div>
              <button class="ghost-btn danger-btn block" id="leaveCoupleBtn">Leave Couple</button>
            `
            : `
              <div class="split-actions">
                <button class="primary-btn" id="createCoupleBtn">Create couple + code</button>
              </div>
            `
        }
      </article>

      <article class="panel glass">
        <div class="panel-head"><h3>Join with invite code</h3></div>
        <p class="muted">Use a partner's six-character code to link both accounts.</p>
        <form id="joinCoupleForm" class="auth-form active">
          <label>Invite code
            <input type="text" name="invite_code" placeholder="AB12CD" maxlength="6" required>
          </label>
          <button class="primary-btn block">Join partner</button>
        </form>
      </article>
    </section>
  `;
}

function itemCard(item, type) {
  const owner =
    item.created_by_user_id === currentUserId()
      ? 'You'
      : state.partner?.name || 'Partner';

  const assignedTo =
    item.assigned_to_user_id === currentUserId()
      ? 'You'
      : state.partner?.name || 'Partner';

  const points =
    type === 'quest'
      ? Number(item.points_value || 0) + Number(item.bonus_points || 0)
      : Number(item.points_value || item.point_cost || 0);

  const actions = [];
  const isCreator = item.created_by_user_id === currentUserId();

  if (type === 'task') {
    if (item.assigned_to_user_id === currentUserId() && item.status === 'open') {
      actions.push(
        `<button class="ghost-btn small" data-task-complete="${item.id}">Mark complete</button>`
      );
    }
    if (
      item.created_by_user_id === currentUserId() &&
      item.status === 'pending_approval'
    ) {
      actions.push(
        `<button class="ghost-btn small" data-task-approve="${item.id}">Approve</button>`
      );
    }
  }

  if (type === 'quest') {
    if (
      item.assigned_to_user_id === currentUserId() &&
      item.status === 'awaiting_accept'
    ) {
      actions.push(
        `<button class="ghost-btn small" data-quest-accept="${item.id}">Accept</button>`
      );
    }
    if (item.assigned_to_user_id === currentUserId() && item.status === 'accepted') {
      actions.push(
        `<button class="ghost-btn small" data-quest-complete="${item.id}">Complete</button>`
      );
    }
    if (
      item.created_by_user_id === currentUserId() &&
      item.status === 'pending_approval'
    ) {
      actions.push(
        `<button class="ghost-btn small" data-quest-approve="${item.id}">Approve</button>`
      );
    }
  }

  if (type === 'reward') {
    if (Number(state.profile?.points_balance || 0) >= Number(item.point_cost || 0)) {
      actions.push(
        `<button class="ghost-btn small" data-reward-redeem="${item.id}">Redeem</button>`
      );
    }
  }

  if (type === 'review' && item.status === 'open' && item.created_by_user_id !== currentUserId()) {
    actions.push(
      `<button class="ghost-btn small" data-review-resolve="${item.id}">Resolve</button>`
    );
  }

  if (isCreator) {
    actions.push(
      `<button class="ghost-btn small" data-item-edit="${type}:${item.id}">Edit</button>`
    );
    actions.push(
      `<button class="ghost-btn small danger-btn" data-item-delete="${type}:${item.id}">Delete</button>`
    );
  }

  return `
    <article class="data-card glass">
      <div class="card-topline">
        <div>
          <h3>${escapeHtml(item.title || item.item_title || 'Untitled')}</h3>
          <p class="muted">${escapeHtml(item.description || item.reason || '')}</p>
        </div>
        <div class="card-points">${points} XP</div>
      </div>
      <div class="card-meta">
        ${statusBadge(item.status || 'open')}
        <span class="tag">Created by ${escapeHtml(owner)}</span>
        ${
          type === 'reward'
            ? `<span class="tag">Category ${escapeHtml(item.category || 'Custom')}</span>`
            : `<span class="tag">Assigned to ${escapeHtml(assignedTo)}</span>`
        }
        ${type === 'task' && item.auto_approve ? `<span class="tag">Auto approve</span>` : ''}
      </div>
      ${
        actions.length
          ? `<div class="card-actions" style="margin-top:16px;">${actions.join('')}</div>`
          : ''
      }
    </article>
  `;
}

function renderTasks() {
  const activeTasks = state.tasks.filter((t) =>
    ['open', 'pending_approval'].includes(t.status)
  );
  const completedTasks = state.tasks.filter((t) =>
    ['approved'].includes(t.status)
  );

  return `
    <section class="glass section-toolbar">
      <div>
        <h2>Tasks</h2>
        <p class="muted">Build recurring chores and one-time acts of service.</p>
      </div>
    </section>

    <section class="content-grid">
      <article class="panel glass">
        <div class="panel-head">
          <h3>Need to Do</h3>
          <div class="split-actions">
            <button class="ghost-btn small" data-open-quick-add="task">Quick Add</button>
            <button class="ghost-btn small" data-open-reuse="task">Reuse Previous</button>
            <button class="ghost-btn small" data-open-modal="task">+ New Task</button>
          </div>
        </div>
        ${
          activeTasks.length
            ? `<section class="content-grid two-col">${activeTasks
                .map((t) => itemCard(t, 'task'))
                .join('')}</section>`
            : `<div class="auth-note">No active tasks right now.</div>`
        }
      </article>

      <article class="panel glass">
        <div class="panel-head">
          <h3>Completed</h3>
        </div>
        ${
          completedTasks.length
            ? `<section class="content-grid two-col">${completedTasks
                .map((t) => itemCard(t, 'task'))
                .join('')}</section>`
            : `<div class="auth-note">No completed tasks yet.</div>`
        }
      </article>
    </section>
  `;
}

function renderQuests() {
  const activeQuests = state.quests.filter((q) =>
    ['awaiting_accept', 'accepted', 'pending_approval'].includes(q.status)
  );
  const completedQuests = state.quests.filter((q) =>
    ['approved'].includes(q.status)
  );

  return `
    <section class="glass section-toolbar">
      <div>
        <h2>Quests</h2>
        <p class="muted">Immediate requests with a bonus-point twist.</p>
      </div>
    </section>

    <section class="content-grid">
      <article class="panel glass">
        <div class="panel-head">
          <h3>Need to Do</h3>
          <div class="split-actions">
            <button class="ghost-btn small" data-open-quick-add="quest">Quick Add</button>
            <button class="ghost-btn small" data-open-reuse="quest">Reuse Previous</button>
            <button class="ghost-btn small" data-open-modal="quest">+ New Quest</button>
          </div>
        </div>
        ${
          activeQuests.length
            ? `<section class="content-grid two-col">${activeQuests
                .map((q) => itemCard(q, 'quest'))
                .join('')}</section>`
            : `<div class="auth-note">No active quests right now.</div>`
        }
      </article>

      <article class="panel glass">
        <div class="panel-head">
          <h3>Completed</h3>
        </div>
        ${
          completedQuests.length
            ? `<section class="content-grid two-col">${completedQuests
                .map((q) => itemCard(q, 'quest'))
                .join('')}</section>`
            : `<div class="auth-note">No completed quests yet.</div>`
        }
      </article>
    </section>
  `;
}

function renderRewards() {
  return `
    <section class="glass section-toolbar">
      <div>
        <h2>Rewards</h2>
        <p class="muted">Turn points into date nights, massages, and other fun perks.</p>
      </div>
    </section>

    <section class="content-grid">
      <article class="panel glass">
        <div class="panel-head">
          <h3>Custom Rewards</h3>
          <div class="split-actions">
            <button class="ghost-btn small" data-open-quick-add="reward">Quick Add</button>
            <button class="ghost-btn small" data-open-shop="true">Open Shop</button>
            <button class="ghost-btn small" data-open-modal="reward">+ New Reward</button>
          </div>
        </div>
        ${
          state.rewards.length
            ? `<section class="content-grid two-col">${state.rewards
                .map((r) => itemCard(r, 'reward'))
                .join('')}</section>`
            : `<div class="auth-note">No rewards yet. Add one to get started.</div>`
        }
      </article>
    </section>
  `;
}

function renderReviews() {
  return sectionWithEmpty(
    'Value reviews',
    'Negotiate point values so the app feels fair.',
    state.reviews,
    'No reviews yet. Create one when a point value needs adjusting.',
    state.reviews.map((r) => itemCard(r, 'review')).join('')
  );
}

function renderActivity() {
  return sectionWithEmpty(
    'Activity feed',
    'A shared timeline of your couple economy.',
    state.activity,
    'No activity yet. It will fill in as you use the app.',
    state.activity
      .map((a) => timelineLine(a.icon || '✨', a.title, a.body, formatTime(a.created_at)))
      .join('')
  );
}

function renderThemes() {
  return `
    <section class="theme-grid">
      ${Object.entries(themeLabels)
        .map(
          ([key, label]) => `
            <article class="theme-card glass ${
              state.activeTheme === key ? 'selected' : ''
            }" data-theme-select="${key}">
              <div class="theme-art ${key}-art theme-stars">
                <div class="icon-frame">${themeIcon(key)}</div>
              </div>
              <h3>${escapeHtml(label)}</h3>
              <p class="muted">${themeDescription(key)}</p>
            </article>
          `
        )
        .join('')}
    </section>
  `;
}

function renderSettings() {
  return `
    <section class="settings-grid">
      <article class="panel glass-strong">
        <div class="panel-head"><h3>Your profile</h3></div>
        <form id="profileForm" class="auth-form active">
          <label>Name
            <input type="text" name="name" value="${escapeHtml(
              state.profile?.name || ''
            )}" required>
          </label>
          <label>Theme
            <select name="theme">
              ${Object.entries(themeLabels)
                .map(
                  ([key, label]) =>
                    `<option value="${key}" ${
                      state.activeTheme === key ? 'selected' : ''
                    }>${label}</option>`
                )
                .join('')}
            </select>
          </label>
          <button class="primary-btn block">Save profile</button>
        </form>
      </article>

      <article class="panel glass">
        <div class="panel-head"><h3>Account notes</h3></div>
        <div class="auth-note">
          Both partners can create items, approve tasks, redeem rewards, and see shared activity in the same couple space.
        </div>
        <div class="auth-note"><strong>Email:</strong> ${escapeHtml(
          state.profile?.email || state.authUser?.email || ''
        )}</div>
        <div class="auth-note"><strong>Current theme:</strong> ${escapeHtml(
          themeLabels[state.activeTheme]
        )}</div>
      </article>
    </section>
  `;
}

function sectionWithEmpty(title, subtitle, list, emptyText, inner) {
  return `
    <section class="glass section-toolbar">
      <div>
        <h2>${escapeHtml(title)}</h2>
        <p class="muted">${escapeHtml(subtitle)}</p>
      </div>
    </section>
    ${
      list.length
        ? `<section class="content-grid two-col">${inner}</section>`
        : `<section class="empty-state glass"><h3>${escapeHtml(
            emptyText
          )}</h3><p class="muted">Use the primary action button at the top right to add data and test the flow.</p></section>`
    }
  `;
}

function timelineLine(icon, title, body, time) {
  return `
    <div class="timeline-item">
      <div class="activity-icon">${icon}</div>
      <div>
        <strong>${escapeHtml(title)}</strong>
        <div class="muted">${escapeHtml(body || '')}</div>
      </div>
      <div class="activity-time">${escapeHtml(time)}</div>
    </div>
  `;
}

function cardLine(title, meta) {
  return `
    <div class="kv">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <div class="muted small">${escapeHtml(meta)}</div>
      </div>
    </div>
  `;
}

function emptyMini(text) {
  return `<div class="auth-note">${escapeHtml(text)}</div>`;
}

function themeIcon(key) {
  return {
    fantasy: '⚔️',
    romantic: '💞',
    n64: '🕹️',
    retro: '✨'
  }[key] || '🎮';
}

function themeDescription(key) {
  return {
    fantasy: 'Epic gradients, elegant type, and adventure energy.',
    romantic: 'Softer warmth with premium relationship vibes.',
    n64: 'Bolder contrast with playful console-era flavor.',
    retro: 'Pixel-inspired neon styling for nostalgic charm.'
  }[key] || '';
}

function bindViewEvents(root) {
  root.querySelectorAll('[data-view-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currentView = btn.dataset.viewJump;
      renderApp();
    });
  });

  root.querySelectorAll('[data-open-modal]').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.openModal));
  });

  root.querySelectorAll('[data-open-quick-add]').forEach((btn) => {
    btn.addEventListener('click', () => openQuickAddModal(btn.dataset.openQuickAdd));
  });

  root.querySelectorAll('[data-open-reuse]').forEach((btn) => {
    btn.addEventListener('click', () => openReuseModal(btn.dataset.openReuse));
  });

  root.querySelectorAll('[data-open-shop]').forEach((btn) => {
    btn.addEventListener('click', () => openShopModal());
  });

  root.querySelectorAll('[data-theme-select]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const nextTheme = btn.dataset.themeSelect;
      state.activeTheme = nextTheme;
      document.body.dataset.theme = nextTheme;
      renderShell();
      await updateProfile({ theme: nextTheme });
    });
  });

  root.querySelector('#createCoupleBtn')?.addEventListener('click', createCoupleRecord);
  root.querySelector('#copyInviteMain')?.addEventListener('click', () => {
    if (state.couple?.invite_code) copyText(state.couple.invite_code);
  });
  root.querySelector('#regenCodeBtn')?.addEventListener('click', regenerateCode);
  root.querySelector('#joinCoupleForm')?.addEventListener('submit', joinCouple);

  root.querySelector('#profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    await updateProfile(data);
  });

  root.querySelectorAll('[data-task-complete]').forEach((btn) => {
    btn.addEventListener('click', () =>
      updateTaskStatus(btn.dataset.taskComplete, 'pending_approval')
    );
  });

  root.querySelectorAll('[data-task-approve]').forEach((btn) => {
    btn.addEventListener('click', () => approveTask(btn.dataset.taskApprove));
  });

  root.querySelectorAll('[data-quest-accept]').forEach((btn) => {
    btn.addEventListener('click', () =>
      updateQuestStatus(btn.dataset.questAccept, 'accepted')
    );
  });

  root.querySelectorAll('[data-quest-complete]').forEach((btn) => {
    btn.addEventListener('click', () =>
      updateQuestStatus(btn.dataset.questComplete, 'pending_approval')
    );
  });

  root.querySelectorAll('[data-quest-approve]').forEach((btn) => {
    btn.addEventListener('click', () => approveQuest(btn.dataset.questApprove));
  });

  root.querySelectorAll('[data-reward-redeem]').forEach((btn) => {
    btn.addEventListener('click', () => redeemReward(btn.dataset.rewardRedeem));
  });

  root.querySelectorAll('[data-review-resolve]').forEach((btn) => {
    btn.addEventListener('click', () => resolveReview(btn.dataset.reviewResolve));
  });

  root.querySelectorAll('[data-fulfill-reward]').forEach((btn) => {
    btn.addEventListener('click', () =>
      fulfillRewardRedemption(btn.dataset.fulfillReward)
    );
  });

  root.querySelectorAll('[data-item-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [type, id] = btn.dataset.itemDelete.split(':');
      deleteItem(type, id);
    });
  });

  root.querySelectorAll('[data-item-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [type, id] = btn.dataset.itemEdit.split(':');
      openEditModal(type, id);
    });
  });

  root.querySelector('#leaveCoupleBtn')?.addEventListener('click', leaveCouple);
}

async function updateProfile(values) {
  try {
    const payload = { ...values };

    if (payload.theme) {
      state.activeTheme = payload.theme;
      document.body.dataset.theme = payload.theme;
    }

    const { error } = await supabaseClient
      .from('profiles')
      .update(payload)
      .eq('id', currentUserId());

    if (error) throw error;

    await refreshAndRender('Profile saved.');
  } catch (err) {
    toast('Save failed', err.message);
  }
}

async function leaveCouple() {
  try {
    if (!state.couple?.id) {
      toast('No active couple', 'There is no active couple to reset.');
      return;
    }

    const confirmed = window.confirm(
      'Reset this pairing for both partners? This will archive the shared workspace and allow both people to pair again later.'
    );
    if (!confirmed) return;

    const now = new Date().toISOString();
    const coupleId = state.couple.id;

    const { data: members, error: membersFetchError } = await supabaseClient
      .from('couple_members')
      .select('user_id, status')
      .eq('couple_id', coupleId);

    if (membersFetchError) throw membersFetchError;

    const activeMembers = (members || []).filter((m) => m.status === 'active');

    if (!activeMembers.length) {
      throw new Error('No active members found for this couple.');
    }

    const userIds = activeMembers.map((m) => m.user_id);

    const { error: membersError } = await supabaseClient
      .from('couple_members')
      .update({
        status: 'removed',
        left_at: now
      })
      .eq('couple_id', coupleId)
      .in('user_id', userIds);

    if (membersError) throw membersError;

    const { error: coupleError } = await supabaseClient
      .from('couples')
      .update({
        status: 'ended',
        ended_at: now,
        ended_by_user_id: currentUserId()
      })
      .eq('id', coupleId);

    if (coupleError) throw coupleError;

    await createActivity(
      'pairing',
      `${currentUserName()} reset the pairing`,
      'The couple was archived and both partners can pair again later.',
      coupleId
    );

    resetState();
    await refreshAndRender('Pairing reset for both users.');
  } catch (err) {
    console.error(err);
    toast('Could not reset pairing', err.message || 'Something went wrong.');
  }
}

async function createCoupleRecord() {
  try {
    if (state.couple) {
      toast('Already paired', 'This account is already in a couple.');
      return;
    }

    const existingMembership = await safeSingle('couple_members', {
      user_id: currentUserId(),
      status: 'active'
    });

    if (existingMembership) {
      toast('Already paired', 'This account is already linked to a couple.');
      await refreshAndRender();
      return;
    }

    let createdCouple = null;
    let code = '';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      code = generateInviteCode();

      const { data, error } = await supabaseClient
        .from('couples')
        .insert({
          invite_code: code,
          created_by_user_id: currentUserId(),
          status: 'active'
        })
        .select()
        .single();

      if (!error) {
        createdCouple = data;
        break;
      }

      if (
        error.code !== '23505' &&
        !String(error.message || '').toLowerCase().includes('duplicate')
      ) {
        throw error;
      }
    }

    if (!createdCouple) {
      throw new Error('Could not generate a unique invite code. Try again.');
    }

    const existingOwnerMembership = await safeSingle('couple_members', {
      couple_id: createdCouple.id,
      user_id: currentUserId()
    });

    if (!existingOwnerMembership) {
      const { error: memberError } = await supabaseClient
        .from('couple_members')
        .insert({
          couple_id: createdCouple.id,
          user_id: currentUserId(),
          role: 'owner'
        });

      if (memberError) throw memberError;
    }

    state.couple = createdCouple;

    await createActivity(
      'pairing',
      `${currentUserName()} created a couple`,
      `Invite code ${code} is ready to share.`,
      createdCouple.id
    );

    await refreshAndRender('Couple created.');
  } catch (err) {
    console.error(err);
    toast('Could not create couple', err.message || 'Something went wrong.');
  }
}

async function regenerateCode() {
  try {
    if (!state.couple?.id) {
      toast('No couple found', 'Create a couple first.');
      return;
    }

    let code = '';
    let updated = false;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      code = generateInviteCode();

      const { error } = await supabaseClient
        .from('couples')
        .update({ invite_code: code })
        .eq('id', state.couple.id);

      if (!error) {
        updated = true;
        break;
      }

      if (
        error.code !== '23505' &&
        !String(error.message || '').toLowerCase().includes('duplicate')
      ) {
        throw error;
      }
    }

    if (!updated) {
      throw new Error('Could not generate a new unique code. Try again.');
    }

    await createActivity(
      'pairing',
      `${currentUserName()} regenerated the invite code`,
      `New code: ${code}.`,
      state.couple.id
    );

    await refreshAndRender('Invite code regenerated.');
  } catch (err) {
    console.error(err);
    toast('Update failed', err.message || 'Could not regenerate code.');
  }
}

async function joinCouple(e) {
  e.preventDefault();

  try {
    if (state.couple) {
      toast('Already paired', 'This account is already linked to a couple.');
      return;
    }

    const raw = Object.fromEntries(new FormData(e.currentTarget).entries());
    const code = normalizeInviteCode(raw.invite_code);

    if (!code || code.length < 6) {
      toast('Invalid code', 'Enter a valid six-character invite code.');
      return;
    }

    const couple = await safeSingle('couples', { invite_code: code });

    if (!couple) {
      toast('Code not found', 'Double-check the invite code.');
      return;
    }

    if (couple.created_by_user_id === currentUserId()) {
      toast('Not allowed', 'You cannot join your own invite code.');
      return;
    }

    const existingMembership = await safeSingle('couple_members', {
      user_id: currentUserId(),
      status: 'active'
    });

    if (existingMembership) {
      toast('Already paired', 'This account is already linked to a couple.');
      await refreshAndRender();
      return;
    }

    const existingPartner = await safeSingle('couple_members', {
      couple_id: couple.id,
      user_id: currentUserId(),
      status: 'active'
    });

    if (existingPartner) {
      toast('Already joined', 'This account is already in that couple.');
      await refreshAndRender();
      return;
    }

    const { error: memberError } = await supabaseClient
      .from('couple_members')
      .insert({
        couple_id: couple.id,
        user_id: currentUserId(),
        role: 'partner'
      });

    if (memberError) throw memberError;

    await createActivity(
      'pairing',
      `${currentUserName()} joined the couple`,
      `Pairing completed with code ${code}.`,
      couple.id
    );

    await refreshAndRender('Pairing complete.');
  } catch (err) {
    console.error(err);
    toast('Join failed', err.message || 'Could not join with that code.');
  }
}

async function updateTaskStatus(id, status) {
  try {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found.');

    const nextStatus =
      status === 'pending_approval' && task.auto_approve ? 'approved' : status;

    const { error } = await supabaseClient
      .from('tasks')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) throw error;

    if (nextStatus === 'approved') {
      await adjustPoints(task.assigned_to_user_id, Number(task.points_value || 0));

      await createActivity(
        'task',
        `${currentUserName()} completed task “${task.title}”`,
        `${task.points_value} XP awarded automatically.`
      );

      await refreshAndRender('Task auto-approved and points awarded.');
      return;
    }

    await createActivity(
      'task',
      `${currentUserName()} updated task “${task.title}”`,
      `Status changed to ${String(nextStatus).replaceAll('_', ' ')}.`
    );

    await refreshAndRender('Task updated.');
  } catch (err) {
    toast('Task update failed', err.message);
  }
}

async function approveTask(id) {
  try {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) throw new Error('Task not found.');

    await adjustPoints(task.assigned_to_user_id, Number(task.points_value || 0));

    const { error } = await supabaseClient
      .from('tasks')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) throw error;

    await createActivity(
      'task',
      `${currentUserName()} approved task “${task.title}”`,
      `${task.points_value} XP awarded.`
    );

    await refreshAndRender('Task approved and points awarded.');
  } catch (err) {
    toast('Approval failed', err.message);
  }
}

async function updateQuestStatus(id, status) {
  try {
    const quest = state.quests.find((q) => q.id === id);
    if (!quest) throw new Error('Quest not found.');

    const { error } = await supabaseClient
      .from('quests')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    await createActivity(
      'quest',
      `${currentUserName()} updated quest “${quest.title}”`,
      `Status changed to ${String(status).replaceAll('_', ' ')}.`
    );

    await refreshAndRender('Quest updated.');
  } catch (err) {
    toast('Quest update failed', err.message);
  }
}

async function approveQuest(id) {
  try {
    const quest = state.quests.find((q) => q.id === id);
    if (!quest) throw new Error('Quest not found.');

    const total =
      Number(quest.points_value || 0) + Number(quest.bonus_points || 0);

    await adjustPoints(quest.assigned_to_user_id, total);

    const { error } = await supabaseClient
      .from('quests')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) throw error;

    await createActivity(
      'quest',
      `${currentUserName()} approved quest “${quest.title}”`,
      `${total} XP awarded.`
    );

    await refreshAndRender('Quest approved and points awarded.');
  } catch (err) {
    toast('Approval failed', err.message);
  }
}

async function redeemReward(id) {
  try {
    const reward = state.rewards.find((r) => r.id === id);
    if (!reward) throw new Error('Reward not found.');

    const cost = Number(reward.point_cost || 0);

    if (cost > Number(state.profile?.points_balance || 0)) {
      toast('Not enough XP', 'You need more points to redeem this reward.');
      return;
    }

    await adjustPoints(currentUserId(), -cost);

    const partnerId = state.partner?.id;
    if (!partnerId) {
      throw new Error('No partner linked to fulfill this reward.');
    }

    const { error: redemptionError } = await supabaseClient
      .from('reward_redemptions')
      .insert({
        couple_id: state.couple.id,
        reward_id: reward.id,
        redeemed_by_user_id: currentUserId(),
        fulfilled_by_user_id: partnerId,
        reward_title: reward.title,
        point_cost: cost,
        status: 'pending'
      });

    if (redemptionError) throw redemptionError;

    await createActivity(
      'reward',
      `${currentUserName()} redeemed “${reward.title}”`,
      `${cost} XP spent. Waiting for fulfillment.`
    );

    await refreshAndRender('Reward redeemed. Partner has been notified.');
  } catch (err) {
    toast('Redemption failed', err.message);
  }
}

async function fulfillRewardRedemption(id) {
  try {
    const redemption = state.redemptions.find((r) => r.id === id);
    if (!redemption) throw new Error('Reward redemption not found.');

    const { error } = await supabaseClient
      .from('reward_redemptions')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    await createActivity(
      'reward',
      `${currentUserName()} fulfilled reward “${redemption.reward_title}”`,
      'The reward was marked fulfilled.'
    );

    await refreshAndRender('Reward marked fulfilled.');
  } catch (err) {
    toast('Fulfillment failed', err.message);
  }
}

async function resolveReview(id) {
  try {
    const { error } = await supabaseClient
      .from('value_reviews')
      .update({ status: 'resolved' })
      .eq('id', id);

    if (error) throw error;

    await createActivity(
      'review',
      `${currentUserName()} resolved a value review`,
      'The review was marked resolved.'
    );

    await refreshAndRender('Review resolved.');
  } catch (err) {
    toast('Resolve failed', err.message);
  }
}

async function deleteItem(type, id) {
  try {
    const tableMap = {
      task: 'tasks',
      quest: 'quests',
      reward: 'rewards',
      review: 'value_reviews'
    };

    const table = tableMap[type];
    if (!table) throw new Error('Unsupported item type.');

    const confirmed = window.confirm(`Delete this ${type}? This cannot be undone.`);
    if (!confirmed) return;

    const { error } = await supabaseClient
      .from(table)
      .delete()
      .eq('id', id)
      .eq('created_by_user_id', currentUserId());

    if (error) throw error;

    await createActivity(
      type,
      `${currentUserName()} deleted a ${type}`,
      `A ${type} they created was removed.`
    );

    await refreshAndRender(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted.`);
  } catch (err) {
    toast('Delete failed', err.message || 'Could not delete item.');
  }
}

function onPrimaryAction() {
  if (state.currentView === 'tasks') {
    openModal('task');
    return;
  }
  if (state.currentView === 'quests' || state.currentView === 'dashboard') {
    openModal('quest');
    return;
  }
  if (state.currentView === 'rewards') {
    openModal('reward');
    return;
  }
  if (state.currentView === 'reviews') {
    openModal('review');
    return;
  }
  if (state.currentView === 'pairing') {
    if (state.couple?.invite_code) {
      copyText(state.couple.invite_code);
    } else {
      createCoupleRecord();
    }
    return;
  }
  if (state.currentView === 'activity') {
    refreshAndRender('Feed refreshed.');
    return;
  }
  if (state.currentView === 'themes') {
    state.currentView = 'settings';
    renderApp();
    return;
  }
  if (state.currentView === 'settings') {
    document.querySelector('#profileForm button')?.click();
  }
}

function openQuickAddModal(type) {
  const items = quickTemplates[type] || [];
  if (!items.length) {
    toast('No suggestions', 'No templates available for this type yet.');
    return;
  }

  modalTitle.textContent = `Quick Add ${type.charAt(0).toUpperCase() + type.slice(1)}s`;
  modalSubtitle.textContent = 'Choose a suggestion, then edit it before saving.';
  modalForm.innerHTML = `
    <div class="helper-full quick-add-list">
      ${items
        .map(
          (item, index) => `
            <button type="button" class="ghost-btn quick-add-item" data-quick-template="${type}:${index}">
              <strong>${escapeHtml(item.title)}</strong>
              <div class="muted small">${escapeHtml(item.description || '')}</div>
            </button>
          `
        )
        .join('')}
    </div>
    <div class="modal-actions">
      <button type="button" class="secondary-btn" id="cancelModalBtn">Close</button>
    </div>
  `;
  modalBackdrop.classList.remove('hidden');

  document.querySelectorAll('[data-quick-template]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [templateType, index] = btn.dataset.quickTemplate.split(':');
      const template = quickTemplates[templateType]?.[Number(index)];
      closeModal();
      openModal(templateType, template);
    });
  });

  document.getElementById('cancelModalBtn').onclick = closeModal;
}

function openReuseModal(type) {
  const sourceMap = {
    task: state.tasks,
    quest: state.quests
  };

  const items = (sourceMap[type] || []).filter(
    (item) => item.created_by_user_id === currentUserId()
  );

  if (!items.length) {
    toast('Nothing to reuse', `You have not created any ${type}s yet.`);
    return;
  }

  modalTitle.textContent = `Reuse Previous ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  modalSubtitle.textContent = 'Choose a previous item to duplicate and edit.';
  modalForm.innerHTML = `
    <div class="helper-full quick-add-list">
      ${items
        .map(
          (item) => `
            <button type="button" class="ghost-btn quick-add-item" data-reuse-item="${type}:${item.id}">
              <strong>${escapeHtml(item.title)}</strong>
              <div class="muted small">${escapeHtml(item.description || '')}</div>
            </button>
          `
        )
        .join('')}
    </div>
    <div class="modal-actions">
      <button type="button" class="secondary-btn" id="cancelModalBtn">Close</button>
    </div>
  `;
  modalBackdrop.classList.remove('hidden');

  document.querySelectorAll('[data-reuse-item]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [reuseType, id] = btn.dataset.reuseItem.split(':');
      const item = sourceMap[reuseType].find((x) => x.id === id);
      if (!item) return;

      const preset =
        reuseType === 'task'
          ? {
              title: item.title,
              description: item.description,
              points_value: item.points_value,
              category: item.category
            }
          : {
              title: item.title,
              description: item.description,
              points_value: item.points_value,
              bonus_points: item.bonus_points,
              priority: item.priority
            };

      closeModal();
      openModal(reuseType, preset);
    });
  });

  document.getElementById('cancelModalBtn').onclick = closeModal;
}

function openShopModal() {
  const categories = [...new Set(shopItems.map((item) => item.category))];

  modalTitle.textContent = 'Love XP Shop';
  modalSubtitle.textContent = 'Demo marketplace for discounted gift cards, date nights, trips, and more.';
  modalForm.innerHTML = `
    <div class="helper-full shop-groups">
      ${categories
        .map(
          (category) => `
            <div class="shop-group">
              <h3>${escapeHtml(category)}</h3>
              <div class="shop-grid">
                ${shopItems
                  .filter((item) => item.category === category)
                  .map(
                    (item) => `
                      <div class="shop-card glass-soft">
                        <strong>${escapeHtml(item.title)}</strong>
                        <div class="muted small">${escapeHtml(item.description)}</div>
                        <div class="shop-price">${escapeHtml(item.price)}</div>
                        <button type="button" class="ghost-btn small">View Offer</button>
                      </div>
                    `
                  )
                  .join('')}
              </div>
            </div>
          `
        )
        .join('')}
    </div>
    <div class="modal-actions">
      <button type="button" class="secondary-btn" id="cancelModalBtn">Close</button>
    </div>
  `;
  modalBackdrop.classList.remove('hidden');
  document.getElementById('cancelModalBtn').onclick = closeModal;
}

function openModal(type, preset = null) {
  const partnerId = state.partner?.id || '';
  const partnerName = state.partner?.name || 'Partner';

  const assigneeOptions = partnerId
    ? [{ id: partnerId, label: partnerName }]
    : [];

  const baseButtons = `
    <div class="modal-actions">
      <button type="button" class="secondary-btn" id="cancelModalBtn">Cancel</button>
      <button class="primary-btn">Save</button>
    </div>
  `;

  const templates = {
    task: {
      title: 'Create task',
      subtitle: 'Add a recurring or one-time task for your couple.',
      html: `
        <label>Title<input name="title" required placeholder="Do the dishes" value="${escapeHtml(preset?.title || '')}"></label>
        <label>Points<input name="points_value" type="number" min="1" value="${Number(preset?.points_value || 20)}" required></label>
        <label class="field-full">Description<textarea name="description" placeholder="Handle kitchen cleanup after dinner.">${escapeHtml(preset?.description || '')}</textarea></label>
        <label>Assign to<select name="assigned_to_user_id">${assigneeOptions
          .map((o) => `<option value="${o.id}">${o.label}</option>`)
          .join('')}</select></label>
        <label>Category<select name="category">
          <option ${preset?.category === 'Chores' ? 'selected' : ''}>Chores</option>
          <option ${preset?.category === 'Errands' ? 'selected' : ''}>Errands</option>
          <option ${preset?.category === 'Romance' ? 'selected' : ''}>Romance</option>
          <option ${preset?.category === 'Support' ? 'selected' : ''}>Support</option>
          <option ${preset?.category === 'Custom' ? 'selected' : ''}>Custom</option>
        </select></label>
        <label>Recurrence<select name="recurrence_type"><option value="one_time">One-time</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
        <label>Due date<input name="due_date" type="datetime-local"></label>
        <label>Auto approve on completion
          <select name="auto_approve">
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>
        ${baseButtons}
      `,
      submit: async (data) => {
        const payload = {
          ...data,
          auto_approve: data.auto_approve === 'true',
          couple_id: state.couple.id,
          created_by_user_id: currentUserId(),
          status: 'open'
        };

        const { error } = await supabaseClient.from('tasks').insert(payload);
        if (error) throw error;

        await createActivity(
          'task',
          `${currentUserName()} created task “${data.title}”`,
          `${data.points_value} XP assigned.`
        );

        await refreshAndRender('Task created.');
      }
    },

    quest: {
      title: 'Create quest',
      subtitle: 'Send an immediate request with optional bonus points.',
      html: `
        <label>Title<input name="title" required placeholder="Coffee Run" value="${escapeHtml(preset?.title || '')}"></label>
        <label>Base XP<input name="points_value" type="number" min="1" value="${Number(preset?.points_value || 15)}" required></label>
        <label class="field-full">Message<textarea name="description" placeholder="Bring me an iced coffee on your way home.">${escapeHtml(preset?.description || '')}</textarea></label>
        <label>Assign to<select name="assigned_to_user_id">${assigneeOptions
          .map((o) => `<option value="${o.id}">${o.label}</option>`)
          .join('')}</select></label>
        <label>Bonus XP<input name="bonus_points" type="number" min="0" value="${Number(preset?.bonus_points || 10)}"></label>
        <label>Priority<select name="priority">
          <option value="normal" ${preset?.priority === 'normal' ? 'selected' : ''}>normal</option>
          <option value="urgent" ${preset?.priority === 'urgent' ? 'selected' : ''}>urgent</option>
          <option value="low" ${preset?.priority === 'low' ? 'selected' : ''}>low</option>
        </select></label>
        <label>Due at<input name="due_at" type="datetime-local"></label>
        ${baseButtons}
      `,
      submit: async (data) => {
        const payload = {
          ...data,
          couple_id: state.couple.id,
          created_by_user_id: currentUserId(),
          status: 'awaiting_accept'
        };

        const { error } = await supabaseClient.from('quests').insert(payload);
        if (error) throw error;

        await createActivity(
          'quest',
          `${currentUserName()} sent quest “${data.title}”`,
          `${Number(data.points_value || 0) + Number(data.bonus_points || 0)} XP available.`
        );

        await refreshAndRender('Quest created.');
      }
    },

    reward: {
      title: 'Create reward',
      subtitle: 'Define something fun partners can redeem.',
      html: `
        <label>Title<input name="title" required placeholder="30-minute massage" value="${escapeHtml(preset?.title || '')}"></label>
        <label>Cost<input name="point_cost" type="number" min="1" value="${Number(preset?.point_cost || 120)}" required></label>
        <label class="field-full">Description<textarea name="description" placeholder="Phone down, full focus.">${escapeHtml(preset?.description || '')}</textarea></label>
        <label>Category<select name="category">
          <option ${preset?.category === 'Relaxation' ? 'selected' : ''}>Relaxation</option>
          <option ${preset?.category === 'Date Night' ? 'selected' : ''}>Date Night</option>
          <option ${preset?.category === 'Food' ? 'selected' : ''}>Food</option>
          <option ${preset?.category === 'Quality Time' ? 'selected' : ''}>Quality Time</option>
          <option ${preset?.category === 'Custom' ? 'selected' : ''}>Custom</option>
        </select></label>
        <label>Cooldown days<input name="cooldown_days" type="number" min="0" value="0"></label>
        ${baseButtons}
      `,
      submit: async (data) => {
        const payload = {
          ...data,
          couple_id: state.couple.id,
          created_by_user_id: currentUserId(),
          is_reusable: true,
          approval_required: true,
          status: 'open'
        };

        const { error } = await supabaseClient.from('rewards').insert(payload);
        if (error) throw error;

        await createActivity(
          'reward',
          `${currentUserName()} created reward “${data.title}”`,
          `${data.point_cost} XP cost.`
        );

        await refreshAndRender('Reward created.');
      }
    },

    review: {
      title: 'Create value review',
      subtitle: 'Start a fair-value negotiation on points.',
      html: `
        <label>Item title<input name="item_title" required placeholder="Laundry reset"></label>
        <label>Current value<input name="current_value" type="number" min="1" value="20" required></label>
        <label class="field-full">Reason<textarea name="reason" placeholder="This takes longer than most chores."></textarea></label>
        <label>Item type<select name="item_type"><option value="task">Task</option><option value="reward">Reward</option><option value="quest">Quest</option></select></label>
        <label>Proposed value<input name="proposed_value" type="number" min="1" value="35" required></label>
        ${baseButtons}
      `,
      submit: async (data) => {
        const payload = {
          ...data,
          couple_id: state.couple.id,
          created_by_user_id: currentUserId(),
          status: 'open'
        };

        const { error } = await supabaseClient.from('value_reviews').insert(payload);
        if (error) throw error;

        await createActivity(
          'review',
          `${currentUserName()} opened a value review`,
          `${data.item_title} proposed at ${data.proposed_value} XP.`
        );

        await refreshAndRender('Value review created.');
      }
    }
  };

  if (!state.couple && ['task', 'quest', 'reward', 'review'].includes(type)) {
    toast('Pair first', 'Create or join a couple before adding shared items.');
    return;
  }

  const tpl = templates[type];
  if (!tpl) return;

  modalTitle.textContent = tpl.title;
  modalSubtitle.textContent = tpl.subtitle;
  modalForm.innerHTML = tpl.html;
  modalBackdrop.classList.remove('hidden');

  modalForm.onsubmit = async (e) => {
    e.preventDefault();

    try {
      const data = Object.fromEntries(new FormData(modalForm).entries());
      await tpl.submit(data);
      closeModal();
    } catch (err) {
      toast('Save failed', err.message || 'Could not save item.');
    }
  };

  document.getElementById('cancelModalBtn').onclick = closeModal;
}

function openEditModal(type, id) {
  const itemMap = {
    task: state.tasks.find((x) => x.id === id),
    quest: state.quests.find((x) => x.id === id),
    reward: state.rewards.find((x) => x.id === id),
    review: state.reviews.find((x) => x.id === id)
  };

  const item = itemMap[type];
  if (!item) {
    toast('Not found', 'Could not find item to edit.');
    return;
  }

  const partnerId = state.partner?.id || '';
  const partnerName = state.partner?.name || 'Partner';

  const assigneeOptions = partnerId
    ? [{ id: partnerId, label: partnerName }]
    : [];

  const baseButtons = `
    <div class="modal-actions">
      <button type="button" class="secondary-btn" id="cancelModalBtn">Cancel</button>
      <button class="primary-btn">Save Changes</button>
    </div>
  `;

  const templates = {
    task: {
      title: 'Edit task',
      subtitle: 'Update your task details.',
      html: `
        <label>Title<input name="title" required value="${escapeHtml(item.title || '')}"></label>
        <label>Points<input name="points_value" type="number" min="1" value="${Number(item.points_value || 1)}" required></label>
        <label class="field-full">Description<textarea name="description">${escapeHtml(item.description || '')}</textarea></label>
        <label>Assign to<select name="assigned_to_user_id">${assigneeOptions
          .map((o) => `<option value="${o.id}" ${item.assigned_to_user_id === o.id ? 'selected' : ''}>${o.label}</option>`)
          .join('')}</select></label>
        <label>Category<input name="category" value="${escapeHtml(item.category || '')}"></label>
        <label>Recurrence<select name="recurrence_type">
          <option value="one_time" ${item.recurrence_type === 'one_time' ? 'selected' : ''}>One-time</option>
          <option value="daily" ${item.recurrence_type === 'daily' ? 'selected' : ''}>Daily</option>
          <option value="weekly" ${item.recurrence_type === 'weekly' ? 'selected' : ''}>Weekly</option>
        </select></label>
        <label>Due date<input name="due_date" type="datetime-local" value="${item.due_date ? item.due_date.slice(0, 16) : ''}"></label>
        <label>Auto approve on completion
          <select name="auto_approve">
            <option value="false" ${!item.auto_approve ? 'selected' : ''}>No</option>
            <option value="true" ${item.auto_approve ? 'selected' : ''}>Yes</option>
          </select>
        </label>
        ${baseButtons}
      `
    },

    quest: {
      title: 'Edit quest',
      subtitle: 'Update your quest details.',
      html: `
        <label>Title<input name="title" required value="${escapeHtml(item.title || '')}"></label>
        <label>Base XP<input name="points_value" type="number" min="1" value="${Number(item.points_value || 1)}" required></label>
        <label class="field-full">Message<textarea name="description">${escapeHtml(item.description || '')}</textarea></label>
        <label>Assign to<select name="assigned_to_user_id">${assigneeOptions
          .map((o) => `<option value="${o.id}" ${item.assigned_to_user_id === o.id ? 'selected' : ''}>${o.label}</option>`)
          .join('')}</select></label>
        <label>Bonus XP<input name="bonus_points" type="number" min="0" value="${Number(item.bonus_points || 0)}"></label>
        <label>Priority<select name="priority">
          <option value="normal" ${item.priority === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="urgent" ${item.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
          <option value="low" ${item.priority === 'low' ? 'selected' : ''}>Low</option>
        </select></label>
        <label>Due at<input name="due_at" type="datetime-local" value="${item.due_at ? item.due_at.slice(0, 16) : ''}"></label>
        ${baseButtons}
      `
    },

    reward: {
      title: 'Edit reward',
      subtitle: 'Update your reward details.',
      html: `
        <label>Title<input name="title" required value="${escapeHtml(item.title || '')}"></label>
        <label>Cost<input name="point_cost" type="number" min="1" value="${Number(item.point_cost || 1)}" required></label>
        <label class="field-full">Description<textarea name="description">${escapeHtml(item.description || '')}</textarea></label>
        <label>Category<input name="category" value="${escapeHtml(item.category || '')}"></label>
        <label>Cooldown days<input name="cooldown_days" type="number" min="0" value="${Number(item.cooldown_days || 0)}"></label>
        ${baseButtons}
      `
    },

    review: {
      title: 'Edit review',
      subtitle: 'Update your value review.',
      html: `
        <label>Item title<input name="item_title" required value="${escapeHtml(item.item_title || '')}"></label>
        <label>Current value<input name="current_value" type="number" min="1" value="${Number(item.current_value || 1)}" required></label>
        <label class="field-full">Reason<textarea name="reason">${escapeHtml(item.reason || '')}</textarea></label>
        <label>Item type<select name="item_type">
          <option value="task" ${item.item_type === 'task' ? 'selected' : ''}>Task</option>
          <option value="reward" ${item.item_type === 'reward' ? 'selected' : ''}>Reward</option>
          <option value="quest" ${item.item_type === 'quest' ? 'selected' : ''}>Quest</option>
        </select></label>
        <label>Proposed value<input name="proposed_value" type="number" min="1" value="${Number(item.proposed_value || 1)}" required></label>
        ${baseButtons}
      `
    }
  };

  const tpl = templates[type];
  if (!tpl) return;

  modalTitle.textContent = tpl.title;
  modalSubtitle.textContent = tpl.subtitle;
  modalForm.innerHTML = tpl.html;
  modalBackdrop.classList.remove('hidden');

  modalForm.onsubmit = async (e) => {
    e.preventDefault();

    try {
      const data = Object.fromEntries(new FormData(modalForm).entries());
      await updateItem(type, id, data);
      closeModal();
    } catch (err) {
      toast('Update failed', err.message || 'Could not update item.');
    }
  };

  document.getElementById('cancelModalBtn').onclick = closeModal;
}

async function updateItem(type, id, data) {
  try {
    const tableMap = {
      task: 'tasks',
      quest: 'quests',
      reward: 'rewards',
      review: 'value_reviews'
    };

    if (type === 'task') {
      data.auto_approve = data.auto_approve === 'true';
    }

    const table = tableMap[type];
    if (!table) throw new Error('Unsupported item type.');

    const { error } = await supabaseClient
      .from(table)
      .update(data)
      .eq('id', id)
      .eq('created_by_user_id', currentUserId());

    if (error) throw error;

    await createActivity(
      type,
      `${currentUserName()} edited a ${type}`,
      `A ${type} they created was updated.`
    );

    await refreshAndRender(`${type.charAt(0).toUpperCase() + type.slice(1)} updated.`);
  } catch (err) {
    toast('Update failed', err.message || 'Could not update item.');
  }
}

function closeModal() {
  modalBackdrop.classList.add('hidden');
  modalForm.innerHTML = '';
}

function bindMobileNav() {
  const mobileBadgeCounts = {
    dashboard:
      state.tasks.filter((t) => t.status === 'pending_approval').length +
      state.redemptions.filter(
        (r) => r.status === 'pending' && r.fulfilled_by_user_id === currentUserId()
      ).length,
    tasks: state.tasks.filter((t) => t.status === 'pending_approval').length,
    quests: state.quests.filter((q) =>
      ['awaiting_accept', 'pending_approval'].includes(q.status)
    ).length,
    rewards: state.redemptions.filter(
      (r) => r.status === 'pending' && r.fulfilled_by_user_id === currentUserId()
    ).length,
    settings: 0
  };

  document.querySelectorAll('[data-mobile-view]').forEach((btn) => {
    const view = btn.dataset.mobileView;
    const label = btn.dataset.label || btn.textContent.trim();
    const count = mobileBadgeCounts[view] || 0;

    btn.dataset.label = label;
    btn.classList.toggle('active', view === state.currentView);
    btn.innerHTML = `
      <span>${label}</span>
      ${count > 0 ? `<span class="mobile-nav-badge">${count}</span>` : ''}
    `;

    btn.onclick = () => {
      state.currentView = btn.dataset.mobileView;
      renderApp();
    };
  });

  const fab = document.getElementById('mobileFabBtn');
  if (fab) {
    fab.onclick = () => {
      if (state.currentView === 'tasks') openModal('task');
      else if (state.currentView === 'quests') openModal('quest');
      else if (state.currentView === 'rewards') openModal('reward');
      else if (state.currentView === 'reviews') openModal('review');
      else openModal('quest');
    };
  }
}

async function boot() {
  renderShell();

  if (!IS_CONFIGURED) {
    renderAuth();
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  state.authUser = data.session?.user || null;

  if (state.authUser) {
    await loadAppData();
  }

  renderShell();
  bindGlobalAuthListener();
}

function bindGlobalAuthListener() {
  if (!supabaseClient) return;

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    setTimeout(async () => {
      try {
        state.authUser = session?.user || null;

        if (state.authUser) {
          await refreshAndRender();
        } else {
          resetState();
          renderShell();
        }
      } catch (err) {
        console.error(err);
        toast('Auth refresh failed', err.message || 'Could not reload session data.');
        state.loading = false;
        renderShell();
      }
    }, 0);
  });
}

document.getElementById('closeModalBtn').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

boot();

/* ═══════════════════════════════════════════════════════════════
   PARTICLE SYSTEM — theme-aware ambient effects
   ═══════════════════════════════════════════════════════════════ */
(function initParticleSystem() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let currentTheme = '';
  let animId = null;
  const MAX_PARTICLES = 55;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const configs = {
    fantasy: {
      spawn() {
        return {
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -(0.3 + Math.random() * 0.6),
          size: 1.5 + Math.random() * 3,
          life: 1,
          decay: 0.001 + Math.random() * 0.003,
          kind: Math.random() > 0.5 ? 'ember' : 'sparkle',
          flicker: Math.random() * Math.PI * 2,
          color: Math.random() > 0.4
            ? `rgba(232,168,64,${0.4 + Math.random() * 0.4})`
            : `rgba(192,140,255,${0.3 + Math.random() * 0.3})`
        };
      },
      draw(p) {
        ctx.save();
        p.flicker += 0.04;
        const alpha = p.life * (0.6 + 0.4 * Math.sin(p.flicker));
        ctx.globalAlpha = alpha;
        if (p.kind === 'ember') {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
          g.addColorStop(0, p.color);
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    },
    romantic: {
      spawn() {
        return {
          x: Math.random() * canvas.width,
          y: -20,
          vx: (Math.random() - 0.5) * 0.4,
          vy: 0.4 + Math.random() * 0.5,
          size: 6 + Math.random() * 10,
          life: 1,
          decay: 0.001 + Math.random() * 0.002,
          rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 0.02,
          sway: Math.random() * Math.PI * 2,
          swayAmp: 0.3 + Math.random() * 0.5,
          color: ['#ff6b8a', '#e89adc', '#f8c0d4', '#ffb3c6'][Math.floor(Math.random() * 4)],
          opacity: 0.25 + Math.random() * 0.35
        };
      },
      draw(p) {
        ctx.save();
        p.sway += 0.012;
        p.rot += p.rotV;
        const sx = Math.sin(p.sway) * p.swayAmp;
        ctx.globalAlpha = p.life * p.opacity;
        ctx.translate(p.x + sx, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size * 0.5);
        ctx.bezierCurveTo(p.size * 0.5, -p.size * 0.3, p.size * 0.4, p.size * 0.3, 0, p.size * 0.5);
        ctx.bezierCurveTo(-p.size * 0.4, p.size * 0.3, -p.size * 0.5, -p.size * 0.3, 0, -p.size * 0.5);
        ctx.fill();
        ctx.restore();
      }
    },
    n64: {
      spawn() {
        const shapes = ['tri', 'square', 'circle'];
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: 4 + Math.random() * 8,
          life: 1,
          decay: 0.001 + Math.random() * 0.002,
          rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 0.03,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          color: ['#ff4444', '#22cc66', '#3388ff', '#ffbb22'][Math.floor(Math.random() * 4)],
          opacity: 0.15 + Math.random() * 0.20
        };
      },
      draw(p) {
        ctx.save();
        p.rot += p.rotV;
        ctx.globalAlpha = p.life * p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        if (p.shape === 'tri') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.87, p.size * 0.5);
          ctx.lineTo(-p.size * 0.87, p.size * 0.5);
          ctx.closePath();
          ctx.stroke();
        } else if (p.shape === 'square') {
          ctx.strokeRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    },
    retro: {
      spawn() {
        return {
          x: Math.random() * canvas.width,
          y: -5,
          vx: 0,
          vy: 1 + Math.random() * 2.5,
          size: 2 + Math.random() * 3,
          life: 1,
          decay: 0.003 + Math.random() * 0.004,
          color: Math.random() > 0.5
            ? `rgba(0,220,255,${0.3 + Math.random() * 0.4})`
            : Math.random() > 0.5
              ? `rgba(180,77,255,${0.25 + Math.random() * 0.3})`
              : `rgba(255,45,122,${0.2 + Math.random() * 0.3})`,
          trail: [],
          maxTrail: 4 + Math.floor(Math.random() * 6)
        };
      },
      draw(p) {
        ctx.save();
        for (let i = 0; i < p.trail.length; i++) {
          const t = p.trail[i];
          const a = (i / p.trail.length) * p.life * 0.3;
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.fillRect(t.x - p.size * 0.3, t.y - p.size * 0.3, p.size * 0.6, p.size * 0.6);
        }
        ctx.globalAlpha = p.life * 0.8;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
        ctx.restore();
      }
    }
  };

  function update() {
    const theme = document.body.dataset.theme || 'fantasy';
    if (theme !== currentTheme) {
      currentTheme = theme;
      particles = [];
    }

    const cfg = configs[currentTheme];
    if (!cfg) {
      animId = requestAnimationFrame(update);
      return;
    }

    if (particles.length < MAX_PARTICLES && Math.random() < 0.15) {
      particles.push(cfg.spawn());
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (p.trail) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > p.maxTrail) p.trail.shift();
      }
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0 || p.y > canvas.height + 30 || p.y < -40 || p.x < -30 || p.x > canvas.width + 30) {
        particles.splice(i, 1);
        continue;
      }
      cfg.draw(p);
    }

    animId = requestAnimationFrame(update);
  }

  update();
})();
