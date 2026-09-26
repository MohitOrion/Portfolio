import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Check, Copy, GraduationCap, Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { Chapter, Reveal } from "@/components/Chapter";

const API = `${import.meta.env.VITE_BACKEND_URL || ""}/api`;
const ROLE_OPTIONS = ["Full-Stack Developer Role", "Data Analyst Role", "Freelance Project", "General Inquiry"];

const INFO = [
  {
    icon: Phone,
    label: "Phone",
    value: "+91 80769 00814",
    href: "tel:+918076900814",
    copyValue: "+918076900814",
    testid: "contact-phone-display",
  },
  {
    icon: Mail,
    label: "Email",
    value: "mohitroy319@gmail.com",
    href: "mailto:mohitroy319@gmail.com",
    copyValue: "mohitroy319@gmail.com",
    testid: "contact-email-display",
  },
  { icon: MapPin, label: "Location", value: "India · Open to Remote" },
  { icon: GraduationCap, label: "Institute", value: "IIT Madras" },
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role_interest: ROLE_OPTIONS[0],
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(null);

  const copy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API}/contact`, form);
      toast.success("Signal transmitted — Mohit will get back to you soon.");
      setForm({ name: "", email: "", role_interest: ROLE_OPTIONS[0], message: "" });
    } catch {
      toast.error("Transmission failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const field =
    "w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 outline-none backdrop-blur-sm transition-colors duration-200 focus:border-cyan-400/60";

  return (
    <section id="contact" data-testid="contact-section" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Chapter number="05" name="Transmit Signal" title="Let's Build Something Together" />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <p className="text-base leading-relaxed text-slate-400 sm:text-lg">
              Hiring for a <span className="text-cyan-300">full-stack developer</span> or a{" "}
              <span className="text-indigo-300">data analyst</span>? Have a project that needs both?
              My inbox is always open — send a signal and I'll respond faster than light (almost).
            </p>

            <div className="mt-10 space-y-4">
              {INFO.map((item) => (
                <div
                  key={item.label}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-slate-900/50 px-6 py-5 backdrop-blur-md transition-colors duration-300 hover:border-cyan-500/25"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/70">
                      <item.icon size={18} className="text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                        {item.label}
                      </div>
                      {item.href ? (
                        <a
                          href={item.href}
                          data-testid={item.testid}
                          className="text-sm font-medium text-slate-100 transition-colors hover:text-cyan-300 sm:text-base"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <div className="text-sm font-medium text-slate-100 sm:text-base">{item.value}</div>
                      )}
                    </div>
                  </div>
                  {item.copyValue && (
                    <button
                      data-testid={`copy-${item.label.toLowerCase()}-button`}
                      onClick={() => copy(item.copyValue, item.label)}
                      className="rounded-lg border border-white/10 p-2.5 text-slate-400 transition-all duration-200 hover:border-cyan-400/40 hover:text-cyan-300"
                      aria-label={`Copy ${item.label}`}
                    >
                      {copied === item.label ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <form
              data-testid="contact-form"
              onSubmit={submit}
              className="rounded-3xl border border-white/8 bg-slate-900/50 p-8 backdrop-blur-md sm:p-10"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                    Your Name
                  </label>
                  <input
                    data-testid="contact-name-input"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Recruiter"
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                    Your Email
                  </label>
                  <input
                    data-testid="contact-email-input"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@company.com"
                    className={field}
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  I'm interested in
                </label>
                <select
                  data-testid="contact-role-select"
                  value={form.role_interest}
                  onChange={(e) => setForm({ ...form, role_interest: e.target.value })}
                  className={field}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-slate-950">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5">
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  Message
                </label>
                <textarea
                  data-testid="contact-message-input"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell me about the role or project..."
                  className={`${field} resize-none`}
                />
              </div>

              <button
                data-testid="contact-submit-button"
                type="submit"
                disabled={sending}
                className="group mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-7 py-4 font-medium text-white shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(6,182,212,0.55)] disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                )}
                {sending ? "Transmitting..." : "Send Message"}
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
