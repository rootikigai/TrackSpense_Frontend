const API_BASE = "http://localhost:8080/api";

// Runtime environment checks to help avoid common CORS/mixed-content pitfalls in dev
(function runtimeChecks() {
  try {
    const allowedOrigins = [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://localhost:3000",
      "http://localhost:5173"
    ];
    if (window.location.protocol === 'file:') {
      console.warn('[TrackSpense] You are opening the app via file://. Please serve it via a local server (e.g., Live Server).');
    } else if (!allowedOrigins.includes(window.location.origin)) {
      console.warn(`[TrackSpense] Origin ${window.location.origin} is not among recommended dev origins: ${allowedOrigins.join(', ')}`);
    }
    if (window.location.protocol === 'https:' && API_BASE.startsWith('http://')) {
      console.warn('[TrackSpense] Mixed content risk: page is https:// but API_BASE is http://. Use http:// for the page in dev or serve the API over https.');
    }
  } catch (e) {
    // no-op in case window is not available
  }
})();

function saveToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function clearToken() {
  localStorage.removeItem("token");
}

function authHeader() {
  const token = getToken();
  return token ? { "Authorization": "Bearer " + token } : {};
}

// Centralized fetch wrapper
async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    auth = false,
    redirectOn401 = true
  } = options;

  const url = path.startsWith('http')
    ? path
    : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const finalHeaders = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...headers
  };
  if (auth) Object.assign(finalHeaders, authHeader());

  let finalBody = body;
  if (typeof finalBody === 'object' && finalBody !== null) {
    finalBody = JSON.stringify(finalBody);
  }

  const res = await fetch(url, { method, headers: finalHeaders, body: finalBody });

  if (!res.ok) {
    let text = '';
    try { text = await res.text(); } catch {}

    if ((res.status === 401 || res.status === 403) && auth && redirectOn401) {
      // Session invalid/expired — clear and redirect to login
      clearToken();
      try { localStorage.removeItem('user'); } catch {}
      if (!/login\.html$/.test(window.location.pathname)) {
        if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
          window.showToast('Your session has expired. Please log in again.', 'warning', 2000);
        } else {
          alert('Your session has expired. Please log in again.');
        }
        window.location.href = 'login.html';
      }
    }

    const message = `HTTP ${res.status}: ${text || res.statusText}`;
    throw new Error(message);
  }

  if (res.status === 204) return null; // No content

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  // Fallback for plain text or empty body
  try { return await res.text(); } catch { return null; }
}

async function handleSignup(event) {
  event.preventDefault();

  const usernameInput = document.getElementById("signup-username");
  const emailInput = document.getElementById("signup-email");
  const passwordInput = document.getElementById("signup-password");
  const confirmInput = document.getElementById("signup-confirm-password");

  const email = emailInput ? emailInput.value : '';
  const password = passwordInput ? passwordInput.value : '';
  // Derive a username if the field is missing (e.g., page without a username input)
  let username = usernameInput && usernameInput.value ? usernameInput.value : '';
  if (!username && email) {
    const at = email.indexOf('@');
    username = at > 0 ? email.slice(0, at) : email;
  }

  if (confirmInput && password !== confirmInput.value) {
    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast('Passwords do not match.', 'error', 2500);
    } else {
      alert('Passwords do not match.');
    }
    return;
  }

  try {
    await apiFetch('/users/register', {
      method: 'POST',
      body: { userName: username, email, password }
    });

    // Auto-login immediately after successful signup
    const loginData = await apiFetch('/users/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
      redirectOn401: false
    });

    if (loginData && loginData.token) saveToken(loginData.token);
    if (loginData && loginData.email) {
      try { localStorage.setItem('user', JSON.stringify({ email: loginData.email, isAuthenticated: true })); } catch {}
    }

    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast("Signup successful! You're now logged in.", 'success', 2000);
    } else {
      alert("Signup successful! You're now logged in.");
    }
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
  } catch (err) {
    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast(err.message, 'error', 3000);
    } else {
      alert(err.message);
    }
  }
}

// Login
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const data = await apiFetch('/users/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
      redirectOn401: false // don't auto-redirect on login failures
    });

    if (data && data.token) saveToken(data.token);
    if (data && data.email) {
      try { localStorage.setItem('user', JSON.stringify({ email: data.email, isAuthenticated: true })); } catch {}
    }
    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast("Login successful!", 'success', 2000);
    } else {
      alert("Login successful!");
    }
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 2000);
  } catch (err) {
    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast(err.message, 'error', 3000);
    } else {
      alert(err.message);
    }
  }
}

// ====== Expense: Add ======
async function addExpense(amount, category, description, dateISO) {
  try {
    const body = { amount, category, description };
    if (dateISO) body.date = dateISO;
    const data = await apiFetch('/expenses/add', {
      method: 'POST',
      auth: true,
      body
    });
    console.log("Expense added:", data);
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// ====== Expenses: Fetch all ======
async function getAllExpenses() {
  try {
    const data = await apiFetch('/expenses/all', { auth: true });
    console.log("Expenses:", data);
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// ====== Expenses by date (ISO-8601 with time) ======
async function getExpensesByDate(startISO, endISO) {
  const isoLike = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  if (!isoLike.test(startISO) || !isoLike.test(endISO)) {
    console.warn('[TrackSpense] start/end should be ISO-8601 with time, e.g., 2025-09-27T10:00:00');
  }
  const url = `/expenses/user/date?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`;
  return apiFetch(url, { auth: true });
}

// ====== Logout ======
function logout() {
  clearToken();
  try { localStorage.removeItem('user'); } catch {}
  window.location.href = "login.html";
}

// ====== Attach Handlers ======
document.getElementById("signup-form")?.addEventListener("submit", handleSignup);
document.getElementById("login-form")?.addEventListener("submit", handleLogin);
document.getElementById("login-modal-form")?.addEventListener("submit", handleLogin);
