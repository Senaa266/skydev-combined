// === INITIALIZE SUPABASE ===
const SUPABASE_URL = "https://nzakkkqvnjbnqgzqfgmt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56YWtra3F2bmpibnFnenFmZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMjg3NDYsImV4cCI6MjA3NjgwNDc0Nn0.KUe07ijr8PyWscZbdByO7UuR9J7jNpeBks4jn5QUKt4";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const DEMO_STORAGE_KEY = "sdl_demo_access";
const DEMO_EMAIL = "demo@sdlclient.com";
const DEMO_CODES = {
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

function resolveDemoAccess(email, codeInput) {
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedCode = (codeInput || "").trim().toUpperCase();

    if (normalizedEmail !== DEMO_EMAIL.toLowerCase()) {
        return null;
    }

    const demoRule = DEMO_CODES[normalizedCode];
    if (!demoRule) {
        return { error: "Invalid demo code for the demo email." };
    }

    return {
        isDemo: true,
        email: DEMO_EMAIL,
        code: normalizedCode,
        label: demoRule.label,
        mode: demoRule.mode,
        apps: demoRule.apps
    };
}

document.addEventListener('DOMContentLoaded', () => {
    /**
     * Handles the password visibility toggle.
     * When the eye icon is clicked, it toggles the password input field's type
     * between 'password' and 'text', and updates the icon to reflect the state.
     */
    const passwordToggleHandler = () => {
        const toggleIcons = document.querySelectorAll('.password-toggle-icon');

        toggleIcons.forEach(icon => {
            icon.addEventListener('click', function () {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);

                if (passwordInput) {
                    // Toggle the input type
                    const isPassword = passwordInput.getAttribute('type') === 'password';
                    const type = isPassword ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);

                    // Toggle the icon class
                    this.classList.toggle('fa-eye');
                    this.classList.toggle('fa-eye-slash');
                }
            });
        });
    };

    /**
     * Handles the 3D card flip transition between login and register forms.
     */
    const formFlipHandler = () => {
        const flipCard = document.querySelector('.flip-card');
        const showRegisterLink = document.getElementById('show-register-link');
        const showLoginLink = document.getElementById('show-login-link');

        if (flipCard && showRegisterLink && showLoginLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                flipCard.classList.add('is-flipped');
            });

            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                flipCard.classList.remove('is-flipped');
            });
        }
    };

    /**
     * Handles Login Form Submission
     */
    const loginForm = document.getElementById('portal-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('.submit-btn');
            
            // Simple loading state
            const originalBtnText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';
            btn.disabled = true;

            const demoAccess = resolveDemoAccess(email, password);
            if (demoAccess?.error) {
                alert(demoAccess.error);
                btn.innerHTML = originalBtnText;
                btn.disabled = false;
                return;
            }

            if (demoAccess?.isDemo) {
                localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoAccess));
                window.location.href = 'dashboard.html';
                return;
            }

            localStorage.removeItem(DEMO_STORAGE_KEY);
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                console.error("Login Error:", error.message);
                alert('Login Failed: ' + error.message);
                btn.innerHTML = originalBtnText;
                btn.disabled = false;
            } else {
                // Success! Redirect to dashboard
                window.location.href = 'dashboard.html';
            }
        });
    }

    /**
     * Handles Register Form Submission
     */
    const registerForm = document.getElementById('portal-register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const btn = registerForm.querySelector('.submit-btn');

            if (!fullName.trim()) {
                alert("Please enter your full name.");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            if (password.length < 6) {
                alert("Password must be at least 6 characters long.");
                return;
            }

            // Show loading state
            const originalBtnText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
            btn.disabled = true;

            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { full_name: fullName }
                }
            });

            if (error) {
                console.error("Registration Error:", error.message);
                alert('Registration Error: ' + error.message);
                btn.innerHTML = originalBtnText;
                btn.disabled = false;
            } else {
                alert('Registration successful! Your account is pending approval. You will be able to access the dashboard once an admin approves you.');
                // Optionally flip back to login
                document.querySelector('.flip-card').classList.remove('is-flipped');
                btn.innerHTML = originalBtnText;
                btn.disabled = false;
            }
        });
    }

    // Initialize all event handlers
    passwordToggleHandler();
    formFlipHandler();
});
