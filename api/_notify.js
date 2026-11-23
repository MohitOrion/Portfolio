// ---------------------------------------------------------------------------
//  Optional: email me when a new message arrives, using Resend (resend.com).
//
//  Set RESEND_API_KEY in Vercel to turn it on. Emails go to NOTIFY_EMAIL, or
//  ADMIN_EMAIL if that isn't set. On Resend's free plan without a verified
//  domain, you can only send to the email address you signed up with.
//  Replying to the notification replies straight to the visitor.
// ---------------------------------------------------------------------------

export const hasNotifications = () => Boolean(process.env.RESEND_API_KEY && (process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL));

/** Send the notification. Never throws: a failed email must not lose the message. */
export async function notifyNewMessage(message) {
  if (!hasNotifications()) return;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "Portfolio <onboarding@resend.dev>",
        to: [process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL],
        reply_to: message.email,
        subject: `New message: ${message.role_interest} from ${message.name}`,
        text: `${message.message}\n\n${message.name}\n${message.email}\n\nRead all messages at /inbox`,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error("Resend notification failed", response.status, await response.text());
  } catch (error) {
    console.error("Resend notification failed", error);
  }
}
