import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, Inbox as InboxIcon, Loader2, Lock, LogOut, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import Starfield from "@/components/Starfield";

const API = `${import.meta.env.VITE_BACKEND_URL || ""}/api`;

const formatApiError = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || "").filter(Boolean).join(" ");
  return String(detail);
};

export default function Inbox() {
  const [token, setToken] = useState(() => localStorage.getItem("inbox_token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (tok, silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const res = await axios.get(`${API}/contact`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        setMessages(res.data);
      } catch (e) {
        if (e.response?.status === 401) {
          localStorage.removeItem("inbox_token");
          setToken(null);
          setMessages(null);
        } else {
          toast.error("Could not load messages");
        }
      } finally {
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (token) load(token, true);
  }, [token, load]);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      localStorage.setItem("inbox_token", data.token);
      setToken(data.token);
      toast.success("Welcome back, Commander Mohit");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("inbox_token");
    setToken(null);
    setMessages(null);
    toast.success("Logged out");
  };

  const field =
    "w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 outline-none backdrop-blur-sm transition-colors duration-200 focus:border-cyan-400/60";

  return (
    <div data-testid="inbox-page" className="relative min-h-screen bg-[#030712] font-body text-slate-200">
      <Starfield />
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-10 flex items-center justify-between">
          <Link
            to="/"
            data-testid="inbox-back-link"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-cyan-300"
          >
            <ArrowLeft size={15} /> Back to Portfolio
          </Link>
          <span className="font-mono text-sm font-semibold tracking-[0.2em] text-white">
            MOHIT<span className="text-cyan-400">.DEV</span>
          </span>
        </div>

        {!token ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-16 max-w-md"
          >
            <form
              data-testid="inbox-login-form"
              onSubmit={login}
              className="rounded-3xl border border-white/8 bg-slate-900/50 p-8 backdrop-blur-xl sm:p-10"
            >
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/25 bg-cyan-950/30">
                  <Lock size={22} className="text-cyan-400" />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/80">
                  Restricted Airspace
                </div>
                <h1 className="mt-2 font-display text-2xl font-bold text-white">Mission Control Access</h1>
                <p className="mt-2 text-sm text-slate-400">Sign in to read your contact transmissions.</p>
              </div>

              <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Email</label>
              <input
                data-testid="inbox-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@galaxy.com"
                className={field}
              />
              <label className="mb-2 mt-5 block font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Password
              </label>
              <input
                data-testid="inbox-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={field}
              />

              {error && (
                <div data-testid="inbox-login-error" className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                data-testid="inbox-login-button"
                type="submit"
                disabled={loading}
                className="mt-7 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-7 py-3.5 font-medium text-white shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-300 hover:shadow-[0_0_45px_rgba(6,182,212,0.55)] disabled:opacity-60"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                {loading ? "Verifying..." : "Unlock Inbox"}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/80">Mission Inbox</div>
                <h1 className="mt-2 font-display text-3xl font-bold text-white">
                  Contact Transmissions{" "}
                  <span className="font-mono text-lg text-cyan-300">
                    {messages ? `(${messages.length})` : ""}
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  data-testid="inbox-refresh-button"
                  onClick={() => load(token)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
                >
                  <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
                </button>
                <button
                  data-testid="inbox-logout-button"
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:border-red-400/40 hover:text-red-300"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </div>

            {messages === null ? (
              <div className="flex items-center justify-center py-24 text-slate-400">
                <Loader2 size={22} className="animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div data-testid="inbox-empty-state" className="rounded-3xl border border-white/8 bg-slate-900/50 py-20 text-center backdrop-blur-xl">
                <InboxIcon size={36} className="mx-auto text-slate-600" />
                <p className="mt-4 text-slate-400">No transmissions yet. Share your portfolio to get signals.</p>
              </div>
            ) : (
              <div data-testid="inbox-message-list" className="space-y-5">
                {messages.map((m, i) => (
                  <motion.article
                    key={m.id}
                    data-testid={`inbox-message-card-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    className="rounded-2xl border border-white/8 bg-slate-900/50 p-6 backdrop-blur-md transition-colors duration-300 hover:border-cyan-500/25"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-display text-lg font-bold text-white">{m.name}</div>
                        <a
                          href={`mailto:${m.email}`}
                          className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-cyan-300/90 hover:text-cyan-200"
                        >
                          <Mail size={13} /> {m.email}
                        </a>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full border border-indigo-400/30 bg-indigo-950/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-indigo-300">
                          {m.role_interest}
                        </span>
                        <div className="mt-2 font-mono text-[11px] text-slate-500">
                          {new Date(m.timestamp).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 border-t border-white/5 pt-4 text-sm leading-relaxed text-slate-300">
                      {m.message}
                    </p>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
