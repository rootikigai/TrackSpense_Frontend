document.addEventListener('DOMContentLoaded', () => {

    const qs = (sel) => document.querySelector(sel);
    const qsa = (sel) => Array.from(document.querySelectorAll(sel));

    const formatNaira = (amount) => {
        return '₦' + Number(amount || 0).toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Light and Dark mode
    const themeButton = qs('.icon-button');
    const iconDiv = themeButton ? themeButton.querySelector('.icon') : null;
    const sunSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
      <path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z"></path>
    </svg>
  `;
    const moonSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
      <path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z"></path>
    </svg>
  `;

    const applyThemeFromStorage = () => {
        const isLight = localStorage.getItem('theme') === 'light';
        document.body.classList.toggle('light-mode', isLight);
        if (iconDiv) {
            iconDiv.innerHTML = isLight ? moonSVG : sunSVG;
            iconDiv.setAttribute('data-icon', isLight ? 'Moon' : 'Sun');
        }
    };
    applyThemeFromStorage();

    if (themeButton && iconDiv) {
        themeButton.addEventListener('click', () => {
            const newIsLight = !document.body.classList.contains('light-mode');
            document.body.classList.toggle('light-mode', newIsLight);
            iconDiv.innerHTML = newIsLight ? moonSVG : sunSVG;
            iconDiv.setAttribute('data-icon', newIsLight ? 'Moon' : 'Sun');
            localStorage.setItem('theme', newIsLight ? 'light' : 'dark');
        });
    }

    // User email display...only authenticated users
    const userEmailElement = qs('#user-email');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (userEmailElement) {
        userEmailElement.textContent = (currentUser && currentUser.isAuthenticated && currentUser.email) ? currentUser.email : '';
    }

    // Sidebar navigation
    const sidebarItems = qsa('.sidebar-item');
    if (sidebarItems.length > 0) {
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const anchor = item.querySelector('a');
                if (anchor) {
                    window.location.href = anchor.getAttribute('href');
                    return;
                }
                const label = item.querySelector('p')?.textContent?.trim();
                if (label === 'Dashboard') window.location.href = 'dashboard.html';
                if (label === 'Expenses') window.location.href = 'all_expenses.html';
                if (label === 'Reports / Analytics') window.location.href = 'reports_analytics.html';
                if (label === 'Settings') window.location.href = 'settings.html';
                if (label === 'Help') {
                    const helpModal = qs('#help-modal');
                    if (helpModal) helpModal.style.display = 'flex';
                }
            });
        });
    }

    // Toast helper
    function ensureToastContainer() {
        let c = document.getElementById('toast-container');
        if (!c) {
            c = document.createElement('div');
            c.id = 'toast-container';
            document.body.appendChild(c);
        }
        return c;
    }
    window.showToast = function(message, type = 'info', duration = 2000) {
        const container = ensureToastContainer();
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = message;
        container.appendChild(t);
        setTimeout(() => { t.classList.add('show'); }, 10);
        setTimeout(() => { t.classList.remove('show'); t.addEventListener('transitionend', () => t.remove(), { once: true }); }, duration);
    };

    // Expense Modal (PopUp) Logic
    const addExpenseButtons = qsa('#add-expense-button');
    const expenseModal = qs('#expense-modal');
    const closeModalButton = qs('#close-modal');
    const expenseForm = qs('#expense-form');

    function setDateMax() {
        const dateInput = qs('#expense-date');
        if (dateInput) {
            const today = new Date().toISOString().slice(0,10);
            dateInput.setAttribute('max', today);
        }
    }

    if (addExpenseButtons.length && expenseModal && closeModalButton && expenseForm) {
        addExpenseButtons.forEach(btn => btn.addEventListener('click', () => {
            expenseForm.removeAttribute('data-edit-index');
            expenseForm.reset();
            setDateMax();
            expenseModal.style.display = 'flex';
        }));
        closeModalButton.addEventListener('click', () => { expenseModal.style.display = 'none'; });
        expenseModal.addEventListener('click', (e) => { if (e.target === expenseModal) expenseModal.style.display = 'none'; });
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amountEl = qs('#expense-amount');
            const categoryEl = qs('#expense-category');
            const descriptionEl = qs('#expense-description');
            const dateEl = qs('#expense-date');
            const amount = parseFloat(amountEl?.value || '0');
            const category = categoryEl?.value || '';
            const description = descriptionEl?.value || '';
            const dateStr = dateEl ? dateEl.value : '';

            // Validate future date
            if (dateStr) {
                const selected = new Date(dateStr);
                const today = new Date();
                selected.setHours(23,59,59,999);
                if (selected.getTime() > today.getTime()) {
                    showToast('You cannot select a future date.', 'error', 2500);
                    return;
                }
            }

            if (!amount || !category) {
                showToast('Please fill in amount and category.', 'error', 2500);
                return;
            }

            try {
                const isoDate = dateStr ? `${dateStr}T00:00:00` : undefined;
                if (typeof addExpense === 'function') {
                    await addExpense(amount, category, description, isoDate);
                }
                showToast('Expense added successfully', 'success', 2000);
                expenseModal.style.display = 'none';
                // Refresh current page view
                if (window.location.pathname.includes('dashboard.html')) {
                    updateDashboard();
                } else if (window.location.pathname.includes('all_expenses.html')) {
                    if (typeof renderAllExpenses === 'function') renderAllExpenses();
                } else if (window.location.pathname.includes('reports_analytics.html')) {
                    if (typeof renderReports === 'function') renderReports();
                }
            } catch (err) {
                showToast(err.message || 'Failed to add expense', 'error', 3000);
            }
        });
    }

    // To update my dashboard after CRUD
    const updateDashboard = async () => {
        try {
            if (typeof getAllExpenses !== 'function') return;
            const data = await getAllExpenses();
            const expenses = Array.isArray(data) ? data : (data?.expenses || []);
            // Total
            const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
            const totalEl = qs('#total-expenses');
            if (totalEl) totalEl.textContent = formatNaira(total);
            // Recent transactions (latest 5)
            const tbody = qs('#transactions-table-body');
            if (tbody) {
                tbody.innerHTML = '';
                const sorted = expenses.slice().sort((a,b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
                sorted.slice(0,5).forEach(e => {
                    const tr = document.createElement('tr');
                    const d = (e.date || e.createdAt || '').toString().split('T')[0] || '';
                    tr.innerHTML = `
                        <td>${d}</td>
                        <td>${e.category || '-'}</td>
                        <td>${formatNaira(e.amount)}</td>
                        <td>${e.description || '-'}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load dashboard data', 'error', 2500);
        }
    };
    if (window.location.pathname.includes('dashboard.html')) updateDashboard();

    // All Expenses renderer
    async function renderAllExpenses() {
        try {
            if (typeof getAllExpenses !== 'function') return;
            const data = await getAllExpenses();
            const expenses = Array.isArray(data) ? data : (data?.expenses || []);
            window.__allExpensesCache = expenses;
            const tbody = qs('#expenses-table-body');
            if (!tbody) return;
            const searchInput = qs('#search-expenses');
            const renderRows = (rows) => {
                tbody.innerHTML = '';
                rows.forEach(e => {
                    const tr = document.createElement('tr');
                    const d = (e.date || e.createdAt || '').toString().split('T')[0] || '';
                    tr.innerHTML = `
                        <td>${d}</td>
                        <td>${e.category || '-'}</td>
                        <td>${formatNaira(e.amount)}</td>
                        <td>${e.description || '-'}</td>
                        <td></td>
                    `;
                    tbody.appendChild(tr);
                });
            };
            renderRows(expenses);
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    const q = searchInput.value.trim().toLowerCase();
                    const filtered = !q ? expenses : expenses.filter(e =>
                        (e.description || '').toLowerCase().includes(q) ||
                        (e.category || '').toLowerCase().includes(q)
                    );
                    renderRows(filtered);
                });
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load expenses', 'error', 2500);
        }
    }
    if (window.location.pathname.includes('all_expenses.html')) renderAllExpenses();

    // Reports renderer
    async function renderReports() {
        try {
            if (typeof getAllExpenses !== 'function') return;
            const data = await getAllExpenses();
            const expenses = Array.isArray(data) ? data : (data?.expenses || []);
            const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
            const avg = expenses.length ? (total / expenses.length) : 0;
            const byCat = expenses.reduce((acc, e) => { const c = e.category || 'OTHER'; acc[c] = (acc[c]||0) + Number(e.amount||0); return acc; }, {});
            const topCat = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0]?.[0] || '-';
            const totalEl = qs('.reports-analytics #total-expenses') || qs('#total-expenses');
            const avgEl = qs('#average-expense');
            const topEl = qs('#top-category');
            if (totalEl) totalEl.textContent = formatNaira(total);
            if (avgEl) avgEl.textContent = formatNaira(avg);
            if (topEl) topEl.textContent = topCat;
        } catch (err) {
            console.error(err);
            showToast('Failed to load reports', 'error', 2500);
        }
    }
    if (window.location.pathname.includes('reports_analytics.html')) renderReports();

    // Help modal wiring (dashboard)
    const helpModal = qs('#help-modal');
    const closeHelp = qs('#close-help-modal');
    if (helpModal) {
        helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.style.display = 'none'; });
    }
    if (closeHelp) { closeHelp.addEventListener('click', () => helpModal.style.display = 'none'); }

    // Homepage: Privacy/Terms modals
    const privacyLinkEl = qs('#privacy-link');
    const termsLinkEl = qs('#terms-link');
    const privacyModal = qs('#privacy-modal');
    const termsModal = qs('#terms-modal');
    const closePrivacy = qs('#close-privacy-modal');
    const closeTerms = qs('#close-terms-modal');
    if (privacyLinkEl && privacyModal) privacyLinkEl.addEventListener('click', (e) => { e.preventDefault(); privacyModal.style.display = 'flex'; });
    if (termsLinkEl && termsModal) termsLinkEl.addEventListener('click', (e) => { e.preventDefault(); termsModal.style.display = 'flex'; });
    if (closePrivacy && privacyModal) closePrivacy.addEventListener('click', () => privacyModal.style.display = 'none');
    if (closeTerms && termsModal) closeTerms.addEventListener('click', () => termsModal.style.display = 'none');
    if (privacyModal) privacyModal.addEventListener('click', (e) => { if (e.target === privacyModal) privacyModal.style.display = 'none'; });
    if (termsModal) termsModal.addEventListener('click', (e) => { if (e.target === termsModal) termsModal.style.display = 'none'; });

    // Settings page logic
    if (window.location.pathname.includes('settings.html')) {
        const profileForm = qs('#profile-form');
        const themeForm = qs('#theme-form');
        const clearDataForm = qs('#clear-data-form');
        const userEmailInput = qs('#user-email-input');
        const themeSelect = qs('#theme-select');

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (userEmailInput) userEmailInput.value = user.email || '';
        if (themeSelect) themeSelect.value = localStorage.getItem('theme') || 'dark';

        if (profileForm && userEmailInput) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const newEmail = userEmailInput.value;
                localStorage.setItem('user', JSON.stringify({ email: newEmail, isAuthenticated: true }));
                if (qs('#user-email')) qs('#user-email').textContent = newEmail;
                alert('Email updated successfully!');
            });
        }

        if (themeForm && themeSelect) {
            themeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const theme = themeSelect.value;
                document.body.classList.toggle('light-mode', theme === 'light');
                localStorage.setItem('theme', theme);
                applyThemeFromStorage();
                alert('Theme updated successfully!');
            });
        }

        if (clearDataForm) {
            clearDataForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (confirm('You really sure about this? This cannot be undone.')) {
                    if(confirm('Ni**a you really really sure???')){
                        localStorage.removeItem('expenses');
                        alert('All expenses cleared successfully!');
                    }
                }
            });
        }
    }

    // Navbar smooth scroll and contact form
    const featuresLink = qs('#features-link');
    const testimonialsLink = qs('#testimonials-link');
    const aboutLink = qs('#about-link');
    const contactLink = qs('#contact-link');

    if (featuresLink) featuresLink.addEventListener('click', (e) => { e.preventDefault(); qs('#features')?.scrollIntoView({ behavior: 'smooth' }); });
    if (testimonialsLink) testimonialsLink.addEventListener('click', (e) => { e.preventDefault(); qs('#testimonials')?.scrollIntoView({ behavior: 'smooth' }); });
    if (aboutLink) aboutLink.addEventListener('click', (e) => { e.preventDefault(); qs('#about')?.scrollIntoView({ behavior: 'smooth' }); });
    if (contactLink) contactLink.addEventListener('click', (e) => { e.preventDefault(); qs('#contact')?.scrollIntoView({ behavior: 'smooth' }); });

    // Logic for Contact form
    const contactFormHome = qs('#contact-form-home');
    if (contactFormHome) {
        contactFormHome.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = qs('#contact-name-home')?.value.trim();
            const email = qs('#contact-email-home')?.value.trim();
            const subject = qs('#contact-subject-home')?.value.trim();
            const message = qs('#contact-message-home')?.value.trim();
            const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
            messages.push({ name, email, subject, message, date: new Date().toISOString() });
            localStorage.setItem('contactMessages', JSON.stringify(messages));
            alert('Thanks! Your message has been received.');
            contactFormHome.reset();
        });
    }

    // My Signup/Login/Logout button logic
    const actionButtons = qsa('.primary-button, .secondary-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const action = button.querySelector('span')?.textContent?.trim();
            if (!action) return;
            if (action === 'Sign Up' || action === 'Get Started') {
                window.location.href = 'signup.html';
            } else if (action === 'Login') {
                const loginModal = qs('#login-modal');
                if (loginModal) {
                    e.preventDefault();
                    loginModal.style.display = 'flex';
                } else {
                    window.location.href = 'login.html';
                }
            } else if (action === 'Logout') {
                if (typeof logout === 'function') {
                    logout();
                } else {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'homepage.html';
                }
            }
        });
    });

    // Signup is handled in auth.js via handleSignup attached to #signup-form


    // My Login Modal (Pop Up) Logic
    const loginModal = qs('#login-modal');
    const closeLoginModal = qs('#close-login-modal');
    const loginModalForm = qs('#login-modal-form');
    if (closeLoginModal && loginModal) {
        closeLoginModal.addEventListener('click', () => { loginModal.style.display = 'none'; });
        loginModal.addEventListener('click', (ev) => { if (ev.target === loginModal) loginModal.style.display = 'none'; });
    }
    // My Login Logic (delegated to auth.js)
    if (loginModalForm) {
        loginModalForm.addEventListener('submit', (e) => {
            if (typeof handleLogin === 'function') {
                handleLogin(e);
            } else {
                e.preventDefault();
                console.error("handleLogin not available. Make sure auth.js is loaded before script.js.");
            }
        });
    }


    // Global route guard: restrict protected pages to authenticated users
    const protectedPages = ['dashboard.html', 'all_expenses.html', 'reports_analytics.html', 'settings.html'];
    const currentPath = window.location.pathname || '';
    const isProtected = protectedPages.some(p => currentPath.includes(p));
    const token = (typeof getToken === 'function') ? getToken() : (localStorage.getItem('token') || null);
    if (isProtected && !token) {
        window.location.href = 'login.html';
    }

    // My Header blur effect
    const header = qs('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('header-scrolled', window.scrollY > 0);
        });
    }

});