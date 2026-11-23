// ---------------------------------------------------------------------------
//  Contact ("Signal"): contact details with copy buttons, social links, the
//  pulsar plot, and the contact form.
//
//  The form POSTs the message to the contact backend ({API}/contact, see
//  api/contact.js). If the backend can't be reached, it opens the visitor's
//  email app with the message already written, so nothing is lost.
// ---------------------------------------------------------------------------
import { $, copyText, h } from "../lib/dom.js";
import { reducedMotion } from "../lib/motion.js";
import { mountPulsar } from "../canvas/pulsar.js";
import { API } from "../config.js";
import { CONTACT_TOPICS, PROFILE, SOCIALS } from "../data.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function renderSignal() {
  renderChannels();
  renderSocials();
  setupForm();

  const css = getComputedStyle(document.documentElement);
  mountPulsar($("#pulsar"), {
    reducedMotion,
    ink: css.getPropertyValue("--ink").trim() || "#eceef6",
    accent: css.getPropertyValue("--accretion").trim() || "#ffb46a",
  });
}

/** Email, phone and location rows. */
function renderChannels() {
  const list = $("#channels");
  const rows = [
    { label: "Email", value: PROFILE.email, href: `mailto:${PROFILE.email}`, copy: PROFILE.email },
    { label: "Phone", value: PROFILE.phone, href: `tel:${PROFILE.phoneHref}`, copy: PROFILE.phoneHref },
    { label: "Based in", value: PROFILE.location },
  ];

  for (const row of rows) {
    const value = row.href
      ? h("a", { href: row.href, "data-copy-target": true, text: row.value })
      : h("span", { text: row.value });
    const button = row.copy
      ? h("button", { class: "copy", type: "button", "aria-label": `Copy ${row.label.toLowerCase()}`, text: "Copy" })
      : h("span");
    if (row.copy) button.addEventListener("click", () => copyText(row.copy, button));

    list.append(
      h("li", { class: "channel", "data-copy-scope": true },
        h("span", { class: "k", text: row.label }),
        h("span", { class: "v" }, value),
        button));
  }
}

function renderSocials() {
  const list = $("#socials");
  for (const social of SOCIALS) {
    list.append(
      h("li", {},
        h("a", { href: social.href, target: "_blank", rel: "noopener noreferrer" },
          social.label,
          h("small", { text: social.handle }))));
  }
}

function setupForm() {
  const form = $("#contactForm");
  const status = $("#formStatus");
  const submit = $("button[type=submit]", form);
  const fields = {
    name: $("#cf-name"),
    email: $("#cf-email"),
    topic: $("#cf-topic"),
    message: $("#cf-message"),
    trap: $("#cf-website"), // hidden from people; only bots fill it in
  };

  for (const topic of CONTACT_TOPICS) fields.topic.append(h("option", { value: topic, text: topic }));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const values = {
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      topic: fields.topic.value,
      message: fields.message.value.trim(),
      website: fields.trap.value,
    };

    const problem = validate(values, fields);
    if (problem) {
      status.textContent = problem;
      return;
    }

    submit.disabled = true;
    status.textContent = "Sending…";
    const result = await sendToBackend(values);
    submit.disabled = false;

    if (result.ok) {
      status.textContent = `Thanks, ${values.name}. Your message has arrived and I'll reply soon.`;
      form.reset();
    } else if (result.status === 400 || result.status === 429) {
      // The server explained what's wrong (invalid field, or too many messages).
      status.textContent = result.detail;
    } else {
      // Server down or not set up yet: fall back to email so the message isn't lost.
      openEmailApp(values, status);
    }
  });
}

/** Mark invalid fields and return a message describing the first problem, or "". */
function validate(values, fields) {
  const emailOk = EMAIL_PATTERN.test(values.email);
  fields.name.setAttribute("aria-invalid", String(!values.name));
  fields.email.setAttribute("aria-invalid", String(!emailOk));
  fields.message.setAttribute("aria-invalid", String(!values.message));
  if (!values.name) return "Add your name so I know who's writing.";
  if (!emailOk) return "Check your email address so I can reply.";
  if (!values.message) return "Add a short message before sending.";
  return "";
}

/** POST the message. Returns { ok, status, detail }. */
async function sendToBackend(values) {
  try {
    const response = await fetch(`${API}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        role_interest: values.topic,
        message: values.message,
        website: values.website,
      }),
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, detail: data.detail || "" };
  } catch {
    return { ok: false, status: 0, detail: "" };
  }
}

function openEmailApp(values, status) {
  const subject = `[Portfolio] ${values.topic} from ${values.name}`;
  const body = `${values.message}\n\n${values.name}\n${values.email}`;
  const fullText = `To: ${PROFILE.email}\nSubject: ${subject}\n\n${body}`;

  const copyButton = h("button", { class: "copy", type: "button", text: "Copy message" });
  copyButton.addEventListener("click", () => copyText(fullText, copyButton));
  status.replaceChildren(
    "The message service didn't respond, so your email app should open with this message ready to send. If nothing opened, copy it and email ",
    h("span", { class: "status-email", text: PROFILE.email }),
    ".",
    copyButton);

  window.location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
