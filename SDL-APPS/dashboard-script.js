
const SUPABASE_URL = "https://nzakkkqvnjbnqgzqfgmt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YWtra3F2bmpibnFnenFmZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjg3NDYsImV4cCI6MjA3NjgwNDc0Nn0.KUe07ijr8PyWscZbdByO7UuR9J7jNpeBks4jn5QUKt4";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const DEMO_STORAGE_KEY = "sdl_demo_access";
const DEMO_CODE_RULES = {
    "DEMO-ALPHA": {
        label: "Code 1",
        mode: "all_except",
        apps: ["Admin Panel"]
    },
    "DEMO-BETA": {
        label: "Code 2",
        mode: "all_except",
        apps: ["Finance App"]
    }
};
const DEMO_APP_CATALOG = [
    {
        name: "SDL Management",
        href: "/sdl-management-app/",
        icon_class: "fa-solid fa-file-invoice-dollar",
        description: "Manage invoices, clients, and project data."
    },
    {
        name: "Finance App",
        href: "/finance-app/",
        icon_class: "fa-solid fa-chart-pie",
        description: "Track expenses and view financial reports."
    },
    {
        name: "Admin Panel",
        href: "admin.html",
        icon_class: "fa-solid fa-user-shield",
        description: "Manage users, roles, and applications."
    }
];

function getDemoAccess() {
    try {
        const raw = localStorage.getItem(DEMO_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.isDemo) return null;
        return parsed;
    } catch (error) {
        console.warn("Invalid demo access payload in localStorage.");
        localStorage.removeItem(DEMO_STORAGE_KEY);
        return null;
    }
}

function getDemoAccessFromQuery() {
    const query = new URLSearchParams(window.location.search);
    const demoCode = (query.get("demo_code") || "").trim().toUpperCase();
    if (!demoCode) return null;

    const rule = DEMO_CODE_RULES[demoCode];
    if (!rule) return null;

    return {
        isDemo: true,
        email: "demo@sdlclient.com",
        code: demoCode,
        label: rule.label,
        mode: rule.mode,
        apps: rule.apps
    };
}

function isDemoAppAllowed(appName, demoAccess) {
    const ruleApps = new Set((demoAccess.apps || []).map(name => name.toLowerCase()));
    const mode = demoAccess.mode;
    const normalizedName = (appName || "").toLowerCase();

    if (mode === "all_except") {
        return !ruleApps.has(normalizedName);
    }

    if (mode === "only") {
        return ruleApps.has(normalizedName);
    }

    return true;
}

function renderAppCards(apps, userRole = "client") {
    const appGrid = document.getElementById('app-grid');
    appGrid.innerHTML = '';

    if (!apps.length) {
        appGrid.innerHTML = '<p style="color: var(--text-secondary);">No applications assigned to your account.</p>';
        return;
    }

    apps.forEach(app => {
        const card = document.createElement('a');
        card.href = app.href;
        card.className = 'app-card';

        if (app.demoAllowed === false) {
            card.classList.add('demo-locked');
            card.href = '#';
            card.setAttribute('aria-disabled', 'true');
            card.addEventListener('click', (event) => event.preventDefault());
        }

        if (app.href.startsWith('http')) {
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
        }

        if (userRole === 'admin' && app.name.toLowerCase().includes('admin')) {
            card.classList.add('admin-card');
        }

        card.innerHTML = `
            <div class="app-card-icon"><i class="${app.icon_class || 'fa-solid fa-layer-group'}"></i></div>
            <h3 class="app-card-title">${app.name}</h3>
            <p class="app-card-description">${app.description || ''}</p>
        `;
        appGrid.appendChild(card);
    });
}

function initDemoDashboard(demoAccess) {
    const userNameDisplay = document.getElementById('user-name-display');
    userNameDisplay.textContent = `Welcome, Demo User (${demoAccess.label})!`;

    const demoApps = DEMO_APP_CATALOG.map(app => ({
        ...app,
        demoAllowed: isDemoAppAllowed(app.name, demoAccess)
    }));
    renderAppCards(demoApps, "client");

    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(DEMO_STORAGE_KEY);
        window.location.href = 'index.html';
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const demoAccessFromStorage = getDemoAccess();
    const demoAccessFromQuery = getDemoAccessFromQuery();
    const demoAccess = demoAccessFromStorage || demoAccessFromQuery;

    if (demoAccess) {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoAccess));
        initDemoDashboard(demoAccess);
        return;
    }

    // 1. Check for Active Session
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        // No session found, redirect back to login
        window.location.href = 'index.html';
        return;
    }

    // 2. Display User Name
    const user = session.user;
    const userNameDisplay = document.getElementById('user-name-display');
    
    // Use metadata name if available, otherwise email
    const fullName = user.user_metadata.full_name || user.email;
    userNameDisplay.textContent = `Welcome, ${fullName}!`;

    // --- SELF-HEALING: Ensure name is in portal_profiles ---
    if (user.user_metadata.full_name) {
        await supabaseClient
            .from('portal_profiles')
            .upsert({
                id: user.id,
                full_name: user.user_metadata.full_name,
                email: user.email
            }, { onConflict: 'id' });
    }

    // 3. Check Portal Status & Load Apps
    const { data: profile, error: profileError } = await supabaseClient
        .from('portal_profiles')
        .select('status, role')
        .eq('id', user.id)
        .single();

    const appGridContainer = document.querySelector('.app-grid-container');

    if (profileError || !profile) {
        // User exists in Auth but not in Portal Profiles (e.g. removed by admin)
        appGridContainer.innerHTML = '<h2>Access Denied</h2><p>You do not have access to this portal.</p>';
        return;
    }

    if (profile.status === 'approved') {
        await loadUserApps(user.id, profile.role);
    } else {
        appGridContainer.innerHTML = `<h2>Account ${profile.status}</h2><p>Your account is currently waiting for administrator approval.</p>`;
    }

    // 4. Handle Logout
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (!error) {
            window.location.href = 'index.html';
        }
    });
});

async function loadUserApps(userId, userRole) {
    const appGrid = document.getElementById('app-grid');
    appGrid.innerHTML = '<p style="color: var(--text-secondary);">Loading your applications...</p>';

    // Fetch ALL apps
    const { data: allApps, error } = await supabaseClient
        .from('apps')
        .select('*');

    if (error) {
        console.error('Error fetching apps:', error);
        appGrid.innerHTML = '<p style="color: var(--error-color);">Failed to load applications.</p>';
        return;
    }

    // Clear loading message
    appGrid.innerHTML = '';

    // Filter apps based on User Role
    const visibleApps = allApps.filter(app => {
        const allowed = app.allowed_role || 'all';
        
        if (userRole === 'admin') return true; // Admins see everything
        if (allowed === 'all') return true; // Everyone sees 'all'
        if (allowed === 'staff' && userRole === 'staff') return true;
        if (allowed === 'client' && userRole === 'client') return true;
        
        return false;
    });

    if (visibleApps.length === 0) {
        appGrid.innerHTML = '<p style="color: var(--text-secondary);">No applications assigned to your account.</p>';
        return;
    }

    renderAppCards(visibleApps, userRole);
}
