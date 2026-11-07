import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Button, Input } from '@cloudflare/kumo';
import { apiClient } from '@/lib/api-client';
import { CheckCircle, AlertCircle, EyeIcon, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
const [searchParams] = useSearchParams();
const navigate = useNavigate();
const token = searchParams.get('token') ?? '';

const [password, setPassword] = useState('');
const [confirm, setConfirm] = useState('');
const [showPw, setShowPw] = useState(false);
const [loading, setLoading] = useState(false);
const [done, setDone] = useState(false);
const [error, setError] = useState('');

useEffect(() => {
if (!token) navigate('/', { replace: true });
}, [token, navigate]);

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setError('');
if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
if (password !== confirm) { setError('Passwords do not match.'); return; }
setLoading(true);
try {
const res = await apiClient.resetPassword(token, password);
if (res.success) {
setDone(true);
} else {
setError(res.error?.message ?? 'Something went wrong. The link may have expired.');
}
} catch {
setError('Something went wrong. Please try again.');
} finally {
setLoading(false);
}
};

return (
<div className="min-h-screen bg-kumo-canvas flex items-center justify-center px-4">
<title>Reset Password - Masidy</title>
<div className="w-full max-w-sm bg-kumo-base rounded-2xl ring-1 ring-kumo-line p-8">
{done ? (
<div className="text-center grid gap-4">
<CheckCircle className="size-12 text-green-500 mx-auto" />
<h1 className="text-xl font-semibold text-kumo-strong">Password updated!</h1>
<p className="text-sm text-kumo-subtle">Your password has been reset. All other sessions have been signed out for security.</p>
<Button variant="primary" className="w-full" onClick={() => navigate('/')}>
Sign in
</Button>
</div>
) : (
<>
<div className="mb-6 text-center">
<h1 className="text-xl font-semibold text-kumo-strong mb-1">Set a new password</h1>
<p className="text-sm text-kumo-subtle">Choose a strong password for your Masidy account.</p>
</div>

{error && (
<div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 mb-4">
<AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
<p className="text-xs text-red-500">{error}</p>
</div>
)}

<form onSubmit={handleSubmit} className="grid gap-4">
<div className="relative">
<Input
label="New password"
type={showPw ? 'text' : 'password'}
value={password}
onChange={e => setPassword(e.target.value)}
autoComplete="new-password"
disabled={loading}
/>
<button
type="button"
onClick={() => setShowPw(v => !v)}
className="absolute right-3 top-8 text-kumo-subtle hover:text-kumo-default"
aria-label={showPw ? 'Hide password' : 'Show password'}
>
{showPw ? <EyeOff className="size-4" /> : <EyeIcon className="size-4" />}
</button>
</div>
<Input
label="Confirm password"
type="password"
value={confirm}
onChange={e => setConfirm(e.target.value)}
autoComplete="new-password"
disabled={loading}
/>
<Button variant="primary" type="submit" className="w-full" loading={loading}>
Reset password
</Button>
</form>
</>
)}
</div>
</div>
);
}