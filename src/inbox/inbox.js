// ---------------------------------------------------------------------------
//  Private inbox (/inbox): sign in, then read the messages people sent
//  through the contact form. Talks to the same backend as before:
//    POST {API}/auth/login   { email, password }  → { token }
//    GET  {API}/contact      (Authorization: Bearer <token>) → [messages]
//  The sign-in token is remembered in this browser (localStorage).
// ---------------------------------------------------------------------------
import { $, h } from "../lib/dom.js";
import { API } from "../config.js";

const TOKEN_KEY = "inbox_token";

const view = $("#inboxView");
const notice = $("#inboxNotice");

function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage blocked: the visitor will just sign in again */ }
}

/** Turn FastAPI-style error details into one readable sentence. */
function describeError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d?.msg || "").filter(Boolean).join(" ");
  return String(detail);
}

function showNotice(text) {
  notice.textContent = text;
  notice.hidden = !text;
}

// ----- sign in ---------------------------------------------------------------

function renderLogin(errorText = "") {
  const email = h("input", { id: "in-email", type: "email", required: true, autocomplete: "username", placeholder: "you@example.com" });
  const password = h("input", { id: "in-password", type: "password", required: true, autocomplete: "current-password", placeholder: "Password" });
  const submit = h("button", { class: "btn btn-primary", type: "submit", text: "Unlock inbox" });
  const error = h("p", { class: "inbox-error", role: "alert", text: errorText, hidden: !errorText });

  const form = h("form", { class: "inbox-card inbox-login" },
    h("p", { class: "eyebrow" }, h("span", { text: "Restricted" }), " Inbox"),
    h("h1", { text: "Sign in to read messages" }),
    h("div", { class: "field" }, h("label", { for: "in-email", text: "Email" }), email),
    h("div", { class: "field" }, h("label", { for: "in-password", text: "Password" }), password),
    error,
    submit);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submit.disabled = true;
    submit.textContent = "Checking…";
    error.hidden = true;
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, password: password.value }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token) throw new Error(describeError(data.detail));
      setToken(data.token);
      renderInbox();
    } catch (err) {
      error.textContent = err.message || "Couldn't reach the server. Check your connection and try again.";
      error.hidden = false;
      submit.disabled = false;
      submit.textContent = "Unlock inbox";
    }
  });

  view.replaceChildren(form);
  email.focus();
}

// ----- messages ----------------------------------------------------------------

async function renderInbox() {
  const count = h("span", { class: "inbox-count" });
  const refresh = h("button", { class: "btn btn-ghost", type: "button", text: "Refresh" });
  const logout = h("button", { class: "btn btn-ghost", type: "button", text: "Sign out" });
  const list = h("div", { class: "inbox-list" }, h("p", { class: "inbox-empty", text: "Loading messages…" }));

  view.replaceChildren(
    h("header", { class: "inbox-head" },
      h("div", {},
        h("p", { class: "eyebrow" }, h("span", { text: "Inbox" }), " Contact messages"),
        h("h1", {}, "Messages ", count)),
      h("div", { class: "inbox-actions" }, refresh, logout)),
    list);

  refresh.addEventListener("click", () => loadMessages(list, count, refresh));
  logout.addEventListener("click", () => {
    setToken(null);
    renderLogin();
  });
  await loadMessages(list, count, refresh);
}

async function loadMessages(list, count, refresh) {
  refresh.disabled = true;
  try {
    const response = await fetch(`${API}/contact`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (response.status === 401) {
      setToken(null);
      renderLogin("Your session expired. Please sign in again.");
      return;
    }
    if (!response.ok) throw new Error();
    const messages = await response.json();
    count.textContent = `(${messages.length})`;
    list.replaceChildren(...(messages.length
      ? messages.map(createMessage)
      : [h("p", { class: "inbox-empty", text: "No messages yet. Share your portfolio to get some." })]));
  } catch {
    list.replaceChildren(h("p", { class: "inbox-empty", text: "Couldn't load messages. Try Refresh in a moment." }));
  } finally {
    refresh.disabled = false;
  }
}

function createMessage(message) {
  const when = new Date(message.timestamp).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return h("article", { class: "inbox-card inbox-message" },
    h("div", { class: "inbox-message-top" },
      h("div", {},
        h("p", { class: "inbox-name", text: message.name }),
        h("a", { href: `mailto:${message.email}`, text: message.email })),
      h("div", { class: "inbox-meta" },
        h("span", { class: "inbox-topic", text: message.role_interest }),
        h("time", { datetime: message.timestamp, text: when }))),
    h("p", { class: "inbox-text", text: message.message }));
}

// ----- start -----------------------------------------------------------------

if (!API) {
  showNotice("The inbox needs the contact backend. Set VITE_BACKEND_URL (see src/config.js) and redeploy.");
} else if (getToken()) {
  renderInbox();
} else {
  renderLogin();
}
