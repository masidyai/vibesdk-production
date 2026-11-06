export default function TermsPage() {
return (
<div className="min-h-screen bg-kumo-canvas">
<title>Terms of Service - Masidy</title>
<main className="container mx-auto max-w-3xl px-4 py-12 pb-24">
<div className="mb-10">
<h1 className="text-3xl sm:text-4xl font-bold font-funky-mono text-kumo-strong mb-3">
Terms of Service
</h1>
<p className="text-kumo-subtle text-sm">Last updated: November 2026</p>
</div>

<div className="prose prose-sm dark:prose-invert max-w-none grid gap-8 text-kumo-default">

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">1. Acceptance of Terms</h2>
<p className="text-kumo-subtle leading-relaxed">
By accessing or using Masidy (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
If you do not agree to these terms, please do not use the Service. These terms apply to all visitors,
users, and others who access or use the Service.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">2. Description of Service</h2>
<p className="text-kumo-subtle leading-relaxed">
Masidy is an AI-powered application builder that lets you describe, generate, and deploy web applications
using natural language. The Service is provided &quot;as is&quot; and we reserve the right to modify,
suspend, or discontinue it at any time with reasonable notice.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">3. User Accounts</h2>
<p className="text-kumo-subtle leading-relaxed">
You are responsible for maintaining the confidentiality of your account credentials and for all
activities that occur under your account. You must notify us immediately at{' '}
<a href="mailto:support@masidy.dev" className="text-kumo-brand underline hover:opacity-80">
support@masidy.dev
</a>{' '}
of any unauthorized use of your account.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">4. Acceptable Use</h2>
<p className="text-kumo-subtle leading-relaxed">You agree not to use the Service to:</p>
<ul className="list-disc pl-5 grid gap-1.5 text-kumo-subtle">
<li>Generate or distribute malicious code, malware, or harmful content</li>
<li>Violate any applicable laws or regulations</li>
<li>Infringe on intellectual property rights of others</li>
<li>Attempt to gain unauthorized access to our systems or other users&apos; data</li>
<li>Engage in any activity that interferes with or disrupts the Service</li>
<li>Generate content that is abusive, harassing, or discriminatory</li>
</ul>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">5. Intellectual Property</h2>
<p className="text-kumo-subtle leading-relaxed">
You retain ownership of all content you create using the Service. By using Masidy, you grant us a
limited, non-exclusive license to host, display, and operate your applications as part of providing
the Service. The Masidy platform, branding, and underlying technology remain our property.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">6. Billing and Subscriptions</h2>
<p className="text-kumo-subtle leading-relaxed">
Paid plans are billed monthly. You may cancel at any time; cancellation takes effect at the end
of the current billing period. We do not offer refunds for partial months. Prices may change with
30 days&apos; notice.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">7. Disclaimer of Warranties</h2>
<p className="text-kumo-subtle leading-relaxed">
The Service is provided &quot;as is&quot; without warranty of any kind, express or implied.
We do not warrant that the Service will be uninterrupted, error-free, or that AI-generated code
will be suitable for any particular purpose. Use AI-generated applications at your own risk.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">8. Limitation of Liability</h2>
<p className="text-kumo-subtle leading-relaxed">
To the fullest extent permitted by law, Masidy shall not be liable for any indirect, incidental,
special, or consequential damages arising from your use of the Service, even if advised of the
possibility of such damages.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">9. Changes to Terms</h2>
<p className="text-kumo-subtle leading-relaxed">
We reserve the right to modify these terms at any time. We will notify users of material changes
via email to the address associated with your account or by posting a notice on the Service.
Continued use of the Service after changes constitutes acceptance of the new terms.
</p>
</section>

<section className="grid gap-3">
<h2 className="text-xl font-semibold text-kumo-strong">10. Contact</h2>
<p className="text-kumo-subtle leading-relaxed">
Questions about these Terms of Service should be sent to{' '}
<a href="mailto:legal@masidy.dev" className="text-kumo-brand underline hover:opacity-80">
legal@masidy.dev
</a>
</p>
</section>
</div>
</main>
</div>
);
}