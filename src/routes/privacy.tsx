import { MarketingFooter } from '@/components/marketing-footer';

export default function PrivacyPage() {
return (
<div className="min-h-screen bg-kumo-canvas">
<title>Privacy Policy - Masidy</title>
<main className="container mx-auto max-w-3xl px-4 py-12 pb-24">
<div className="mb-10">
<h1 className="text-3xl sm:text-4xl font-bold font-funky-mono text-kumo-strong mb-3">
Privacy Policy
</h1>
<p className="text-kumo-subtle text-sm">Last updated: November 2026</p>
</div>

<div className="prose prose-sm dark:prose-invert max-w-none grid gap-8 text-kumo-default">

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">1. Information We Collect</h2>
<p className="text-kumo-subtle leading-relaxed">We collect information you provide directly to us:</p>
<ul className="list-disc pl-5 grid gap-1.5 text-kumo-subtle">
<li><strong>Account data:</strong> email address, name, and profile information when you register</li>
<li><strong>OAuth data:</strong> profile information from GitHub or Google when you sign in via OAuth</li>
<li><strong>Usage data:</strong> the prompts you submit, apps you create, and how you use the Service</li>
<li><strong>Technical data:</strong> IP address, browser type, device information, and usage logs</li>
</ul>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">2. How We Use Your Information</h2>
<p className="text-kumo-subtle leading-relaxed">We use the information we collect to:</p>
<ul className="list-disc pl-5 grid gap-1.5 text-kumo-subtle">
<li>Provide, maintain, and improve the Service</li>
<li>Process transactions and manage your subscription</li>
<li>Send transactional emails (account confirmation, password reset) from <strong>noreply@masidy.dev</strong></li>
<li>Respond to support requests sent to <strong>support@masidy.dev</strong></li>
<li>Monitor for abuse and enforce our Terms of Service</li>
<li>Analyze usage patterns to improve the AI models and user experience</li>
</ul>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">3. Information Sharing</h2>
<p className="text-kumo-subtle leading-relaxed">
We do not sell your personal information. We may share your information with:
</p>
<ul className="list-disc pl-5 grid gap-1.5 text-kumo-subtle">
<li><strong>Service providers:</strong> Cloudflare (hosting, infrastructure, AI), Stripe (billing)</li>
<li><strong>Legal requirements:</strong> when required by law or to protect our rights</li>
<li><strong>Business transfers:</strong> in connection with a merger or acquisition</li>
</ul>
<p className="text-kumo-subtle leading-relaxed">
Apps you mark as <strong>public</strong> are visible to other users on the Discover page.
Private apps are only accessible to you.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">4. Data Retention</h2>
<p className="text-kumo-subtle leading-relaxed">
We retain your account data for as long as your account is active. You may delete your account
at any time from Settings, which will permanently remove your personal data within 30 days.
App deployments may remain accessible via their URL for a short period after deletion.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">5. Cookies</h2>
<p className="text-kumo-subtle leading-relaxed">
We use essential cookies to maintain your session and provide the Service. We do not use
third-party advertising or tracking cookies. You can control cookies through your browser settings,
but disabling them may affect your ability to use the Service.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">6. Security</h2>
<p className="text-kumo-subtle leading-relaxed">
We implement industry-standard security measures including HTTPS encryption, secure HttpOnly
session cookies, and regular security reviews. No method of transmission over the internet is
100% secure; we cannot guarantee absolute security.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">7. Children&apos;s Privacy</h2>
<p className="text-kumo-subtle leading-relaxed">
The Service is not directed to children under 13. We do not knowingly collect personal information
from children under 13. If you believe we have inadvertently collected such data, contact us at{' '}
<a href="mailto:privacy@masidy.dev" className="text-kumo-brand underline hover:opacity-80">
privacy@masidy.dev
</a>.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">8. Your Rights</h2>
<p className="text-kumo-subtle leading-relaxed">
Depending on your location, you may have the right to access, correct, or delete your personal data,
object to processing, or request data portability. To exercise these rights, contact us at{' '}
<a href="mailto:privacy@masidy.dev" className="text-kumo-brand underline hover:opacity-80">
privacy@masidy.dev
</a>.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">9. Changes to This Policy</h2>
<p className="text-kumo-subtle leading-relaxed">
We may update this Privacy Policy from time to time. We will notify you of significant changes
by email to <strong>your registered @masidy.dev-linked address</strong> or by displaying a notice
in the app. Your continued use of the Service after changes constitutes acceptance.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">10. Contact Us</h2>
<p className="text-kumo-subtle leading-relaxed">
For privacy-related questions or concerns, contact our team at{' '}
<a href="mailto:privacy@masidy.dev" className="text-kumo-brand underline hover:opacity-80">
privacy@masidy.dev
</a>
</p>
</section>
</div>
</main>
<MarketingFooter />
</div>
);
}