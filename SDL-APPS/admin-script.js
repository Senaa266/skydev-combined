// === INITIALIZE SUPABASE ===
const SUPABASE_URL = "https://nzakkkqvnjbnqgzqfgmt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YWtra3F2bmpibnFnenFmZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjg3NDYsImV4cCI6MjA3NjgwNDc0Nn0.KUe07ijr8PyWscZbdByO7UuR9J7jNpeBks4jn5QUKt4";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Tab Switching Logic ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Show corresponding content
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // --- Modal Logic ---
    const modal = document.getElementById('app-modal');
    const addAppBtn = document.getElementById('add-app-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const appForm = document.getElementById('app-form');

    // --- Icon Picker Logic ---
    const iconList = [
        'fa-solid fa-file-invoice-dollar', 'fa-solid fa-chart-pie', 'fa-solid fa-user-shield',
        'fa-solid fa-users', 'fa-solid fa-briefcase', 'fa-solid fa-building',
        'fa-solid fa-calendar-check', 'fa-solid fa-comments', 'fa-solid fa-envelope',
        'fa-solid fa-folder-open', 'fa-solid fa-image', 'fa-solid fa-clipboard-list',
        'fa-solid fa-cogs', 'fa-solid fa-database', 'fa-solid fa-lock',
        'fa-solid fa-truck', 'fa-solid fa-shopping-cart', 'fa-solid fa-store',
        'fa-solid fa-wallet', 'fa-solid fa-wrench'
    ];

    const iconPicker = document.getElementById('icon-picker');
    const iconInput = document.getElementById('app-icon');

    // Generate Icons
    iconList.forEach(iconClass => {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'icon-option';
        iconDiv.innerHTML = `<i class="${iconClass}"></i>`;
        iconDiv.dataset.icon = iconClass;
        
        iconDiv.addEventListener('click', () => {
            // Deselect all
            document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
            // Select clicked
            iconDiv.classList.add('selected');
            // Update hidden input
            iconInput.value = iconClass;
        });

        iconPicker.appendChild(iconDiv);
    });

    // Open Modal
    if (addAppBtn) {
        addAppBtn.addEventListener('click', () => {
            document.getElementById('modal-title').textContent = 'Add New App';
            appForm.reset(); // Clear form
            document.getElementById('app-id').value = ''; // Clear hidden ID
            
            // Reset icon selection
            document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
            iconInput.value = '';

            modal.style.display = 'flex';
        });
    }

    // Close Modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close if clicked outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // --- Delete Modal Logic ---
    const deleteModal = document.getElementById('delete-modal');
    const closeDeleteModalBtn = document.querySelector('.close-delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    let appToDeleteId = null;

    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
    }

    // Close delete modal if clicked outside
    window.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            deleteModal.style.display = 'none';
        }
    });

    // --- Manage Apps Logic ---
    const appsGrid = document.getElementById('admin-apps-grid');

    async function loadApps() {
        appsGrid.innerHTML = '<p>Loading apps...</p>';
        const { data: apps, error } = await supabaseClient
            .from('apps')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading apps:', error);
            appsGrid.innerHTML = '<p style="color: var(--error-color)">Failed to load apps.</p>';
            return;
        }

        renderApps(apps);
    }

    function renderApps(apps) {
        appsGrid.innerHTML = '';
        apps.forEach(app => {
            const card = document.createElement('div');
            card.className = 'app-card';
            card.innerHTML = `
                <div class="app-card-icon"><i class="${app.icon_class}"></i></div>
                <h3 class="app-card-title">${app.name}</h3>
                <p class="app-card-description">${app.description || 'No description'}</p>
                <div class="app-card-actions">
                    <button class="card-btn edit-btn" data-id="${app.app_id}"><i class="fa-solid fa-pen"></i> Edit</button>
                    <button class="card-btn delete-btn" data-id="${app.app_id}"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            `;
            appsGrid.appendChild(card);
        });

        // Attach Event Listeners for Edit/Delete
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openEditModal(e.target.closest('.edit-btn').dataset.id, apps));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => deleteApp(e.target.closest('.delete-btn').dataset.id));
        });
    }

    function openEditModal(appId, apps) {
        const app = apps.find(a => a.app_id === appId);
        if (!app) return;

        document.getElementById('modal-title').textContent = 'Edit App';
        document.getElementById('app-id').value = app.app_id;
        document.getElementById('app-name').value = app.name;
        document.getElementById('app-desc').value = app.description;
        document.getElementById('app-href').value = app.href;
        document.getElementById('app-icon').value = app.icon_class;
        document.getElementById('app-role').value = app.allowed_role || 'all';
        // Note: We aren't setting the role dropdown because it's not in the DB schema yet, 
        // but the UI is there for future use.

        // Highlight correct icon
        document.querySelectorAll('.icon-option').forEach(el => {
            el.classList.remove('selected');
            if (el.dataset.icon === app.icon_class) {
                el.classList.add('selected');
                el.scrollIntoView({ block: 'center' });
            }
        });

        modal.style.display = 'flex';
    }

    // Handle Form Submit (Add/Edit)
    appForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const appId = document.getElementById('app-id').value;
        const name = document.getElementById('app-name').value;
        const description = document.getElementById('app-desc').value;
        const href = document.getElementById('app-href').value;
        const icon_class = document.getElementById('app-icon').value;
        const allowed_role = document.getElementById('app-role').value;

        if (!icon_class) {
            alert('Please select an icon.');
            return;
        }

        const appData = { name, description, href, icon_class, allowed_role };

        let error;
        if (appId) {
            // Update
            ({ error } = await supabaseClient.from('apps').update(appData).eq('app_id', appId));
        } else {
            // Insert
            ({ error } = await supabaseClient.from('apps').insert([appData]));
        }

        if (error) {
            alert('Error saving app: ' + error.message);
        } else {
            modal.style.display = 'none';
            loadApps(); // Refresh list
        }
    });

    function deleteApp(appId) {
        appToDeleteId = appId;
        deleteModal.style.display = 'flex';
    }

    // Handle Confirm Delete
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!appToDeleteId) return;
            
            const { error } = await supabaseClient.from('apps').delete().eq('app_id', appToDeleteId);
        if (error) {
            alert('Error deleting app: ' + error.message);
        } else {
            deleteModal.style.display = 'none';
            loadApps();
        }
        });
    }
    
    // --- Manage Users Logic ---
    const usersTableBody = document.getElementById('users-table-body');
    const userSearchInput = document.getElementById('user-search');
    
    // User Role Modal Elements
    const roleModal = document.getElementById('user-role-modal');
    const closeRoleModalBtn = document.querySelector('.close-role-modal');
    const userGlobalRoleSelect = document.getElementById('user-global-role');
    const saveRolesBtn = document.getElementById('save-roles-btn');
    let currentEditingUserId = null;

    async function loadUsers(searchTerm = '') {
        usersTableBody.innerHTML = '<tr><td colspan="6">Loading users...</td></tr>';
        
        let query = supabaseClient
            .from('portal_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (searchTerm) {
            query = query.ilike('full_name', `%${searchTerm}%`);
        }

        const { data: users, error } = await query;

        if (error) {
            console.error('Error loading users:', error);
            usersTableBody.innerHTML = '<tr><td colspan="4" style="color: var(--error-color)">Failed to load users.</td></tr>';
            return;
        }

        renderUsers(users);
    }

    function renderUsers(users) {
        usersTableBody.innerHTML = '';
        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="6">No users found.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');
            const joinedDate = new Date(user.created_at).toLocaleDateString();
            const displayName = user.full_name || user.email || 'No Name Provided';
            const role = user.role || 'client';
            const status = user.status || 'pending';
            
            // Determine Status Badge Color
            let statusColor = '#ffc107'; // yellow/pending
            if (status === 'approved') statusColor = '#28a745'; // green
            if (status === 'disabled') statusColor = '#dc3545'; // red

            // Determine Action Buttons based on status
            let actionButtons = '';
            if (status === 'pending' || status === 'disabled') {
                actionButtons += `<button class="action-btn approve-btn" data-id="${user.id}" data-name="${displayName}" data-role="${role}" style="background-color: #28a745; padding: 0.4rem 0.8rem; font-size: 0.8rem;"><i class="fa-solid fa-check"></i> Approve</button>`;
            }
            if (status === 'approved') {
                actionButtons += `<button class="action-btn disable-btn" data-id="${user.id}" style="background-color: #ffc107; color: #000; padding: 0.4rem 0.8rem; font-size: 0.8rem;"><i class="fa-solid fa-ban"></i> Disable</button>`;
            }
            
            row.innerHTML = `
                <td>${displayName}</td>
                <td>${user.email || 'N/A'}</td>
                <td><span style="background-color: var(--surface-color); border: 1px solid var(--border-color); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${role.toUpperCase()}</span></td>
                <td><span style="background-color: ${statusColor}; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">${status.toUpperCase()}</span></td>
                <td>${joinedDate}</td>
                <td style="display: flex; gap: 0.5rem;">
                    ${actionButtons}
                    <button class="action-btn manage-role-btn" data-id="${user.id}" data-name="${displayName}" data-role="${role}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                        <i class="fa-solid fa-user-tag"></i> Roles
                    </button>
                    <button class="action-btn remove-user-btn" data-id="${user.id}" style="background-color: #dc3545; padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });

        // Attach listeners
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnEl = e.target.closest('.approve-btn');
                openUserRoleModal(btnEl.dataset.id, btnEl.dataset.name, btnEl.dataset.role, true);
            });
        });
        document.querySelectorAll('.disable-btn').forEach(btn => {
            btn.addEventListener('click', (e) => updateUserStatus(e.target.closest('button').dataset.id, 'disabled'));
        });
        document.querySelectorAll('.remove-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => removeUserFromPortal(e.target.closest('button').dataset.id));
        });

        document.querySelectorAll('.manage-role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnEl = e.target.closest('.manage-role-btn');
                openUserRoleModal(btnEl.dataset.id, btnEl.dataset.name, btnEl.dataset.role, false);
            });
        });
    }

    async function updateUserStatus(userId, newStatus) {
        const { error } = await supabaseClient
            .from('portal_profiles')
            .update({ status: newStatus })
            .eq('id', userId);
        
        if (error) alert('Error updating status: ' + error.message);
        else loadUsers();
    }

    async function removeUserFromPortal(userId) {
        if(!confirm("Remove this user from the Portal list? (This does not delete their account from the other app)")) return;
        
        const { error } = await supabaseClient
            .from('portal_profiles')
            .delete()
            .eq('id', userId);
        
        if (error) alert('Error removing user: ' + error.message);
        else loadUsers();
    }

    // Search Listener
    if (userSearchInput) {
        userSearchInput.addEventListener('input', (e) => {
            loadUsers(e.target.value);
        });
    }

    // Open Role Modal
    function openUserRoleModal(userId, userName, currentRole, isApproving) {
        currentEditingUserId = userId;
        document.getElementById('role-modal-title').textContent = isApproving ? `Approve & Assign Role: ${userName}` : `Manage Role: ${userName}`;
        userGlobalRoleSelect.value = currentRole || 'client';
        roleModal.style.display = 'flex';
    }

    // Save Roles
    if (saveRolesBtn) {
        saveRolesBtn.addEventListener('click', async () => {
            const newRole = userGlobalRoleSelect.value;
            
            // Update role AND ensure status is approved
            const { error } = await supabaseClient
                .from('portal_profiles')
                .update({ role: newRole, status: 'approved' })
                .eq('id', currentEditingUserId);

            if (error) {
                alert('Error updating role: ' + error.message);
            } else {
                roleModal.style.display = 'none';
                loadUsers();
            }
        });
    }

    if (closeRoleModalBtn) {
        closeRoleModalBtn.addEventListener('click', () => {
            roleModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === roleModal) {
            roleModal.style.display = 'none';
        }
    });

    // Initial Load
    loadApps();
    loadUsers();
});