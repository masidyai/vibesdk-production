/**
 * ResendService — sends transactional emails via the Resend API.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 *
 * Requires RESEND_API_KEY in the Worker environment.
 * From address is always noreply@masidy.dev — set up the domain in Resend
 * dashboard before enabling.
 */

import { createLogger } from '../../logger';

const logger = createLogger('ResendService');

const FROM = 'Masidy <noreply@masidy.dev>';
const RESEND_API = 'https://api.resend.com/emails';

interface SendOptions {
    to: string;
    subject: string;
    html: string;
    text: string;
}

export class ResendService {
    private readonly apiKey: string;

    constructor(env: { RESEND_API_KEY?: string }) {
        if (!env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured');
        }
        this.apiKey = env.RESEND_API_KEY;
    }

    /** Returns true if Resend is configured in the environment. */
    static isConfigured(env: { RESEND_API_KEY?: string }): boolean {
        return !!env.RESEND_API_KEY;
    }

    async send(opts: SendOptions): Promise<void> {
        const response = await fetch(RESEND_API, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM,
                to: opts.to,
                subject: opts.subject,
                html: opts.html,
                text: opts.text,
            }),
        });

        if (!response.ok) {
            const body = await response.text().catch(() => '');
            logger.error('Resend API error', { status: response.status, body });
            throw new Error(`Failed to send email (${response.status})`);
        }

        logger.info('Email sent via Resend', { to: opts.to, subject: opts.subject });
    }

    /** Password reset email */
    async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
        return this.send({
            to,
            subject: 'Reset your Masidy password',
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#141414;border-radius:12px;overflow:hidden;border:1px solid #222">
    <div style="padding:32px;border-bottom:1px solid #222;text-align:center">
      <img src="https://masidy.dev/masidy-glyph-dark.png" width="40" height="40" alt="Masidy" style="margin-bottom:16px" />
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff">Reset your password</h1>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;color:#999;line-height:1.6">
        We received a request to reset the password for your Masidy account.
        Click the button below to set a new password. This link expires in <strong style="color:#e5e5e5">1 hour</strong>.
      </p>
      <a href="${resetUrl}" style="display:block;text-align:center;background:#7FFF00;color:#000;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;text-decoration:none;margin:24px 0">
        Reset password
      </a>
      <p style="margin:0;color:#555;font-size:13px;line-height:1.6">
        If you didn't request this, you can safely ignore this email.
        Your password won't change until you click the link above.
      </p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #222;text-align:center">
      <p style="margin:0;color:#444;font-size:12px">
        &copy; 2026 Masidy &bull;
        <a href="https://masidy.dev/privacy" style="color:#555">Privacy</a> &bull;
        <a href="https://masidy.dev/terms" style="color:#555">Terms</a>
      </p>
    </div>
  </div>
</body>
</html>`,
            text: `Reset your Masidy password\n\nClick the link below to set a new password. This link expires in 1 hour:\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.\n\n© 2026 Masidy`,
        });
    }

    /** Welcome email sent on new registration */
    async sendWelcome(to: string, name: string): Promise<void> {
        const firstName = name.split(' ')[0] || name;
        return this.send({
            to,
            subject: 'Welcome to Masidy!',
            html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#141414;border-radius:12px;border:1px solid #222">
    <div style="padding:32px;border-bottom:1px solid #222;text-align:center">
      <img src="https://masidy.dev/masidy-glyph-dark.png" width="40" height="40" alt="Masidy" style="margin-bottom:16px"/>
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff">Welcome to Masidy, ${firstName}!</h1>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;color:#999;line-height:1.6">You are all set. Describe what you want to build and the AI takes it from there.</p>
      <a href="https://masidy.dev" style="display:block;text-align:center;background:#7FFF00;color:#000;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;text-decoration:none;margin:24px 0">Start building</a>
      <p style="margin:0;color:#555;font-size:13px">Questions? <a href="mailto:support@masidy.dev" style="color:#666">support@masidy.dev</a></p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #222;text-align:center">
      <p style="margin:0;color:#444;font-size:12px">&copy; 2026 Masidy</p>
    </div>
  </div>
</body></html>`,
            text: `Welcome to Masidy, ${firstName}!\n\nYou are all set. Start building at https://masidy.dev\n\nQuestions? support@masidy.dev`,
        });
    }
}
