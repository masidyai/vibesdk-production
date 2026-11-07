import { useNavigate } from 'react-router';
import { Button } from '@cloudflare/kumo';
import { MasidyLogo } from '@/components/icons/MasidyLogo';

export default function NotFoundPage() {
const navigate = useNavigate();
return (
<div className="min-h-screen bg-kumo-canvas flex flex-col items-center justify-center px-4 text-center">
<title>404 - Page not found - Masidy</title>
<MasidyLogo className="size-12 mb-6 opacity-40" />
<h1 className="text-6xl font-black font-funky-mono text-kumo-brand mb-3">404</h1>
<p className="text-xl font-semibold text-kumo-strong mb-2">Page not found</p>
<p className="text-kumo-subtle text-sm mb-8 max-w-sm">
The page you are looking for does not exist or has been moved.
</p>
<div className="flex gap-3">
<Button variant="primary" onClick={() => navigate('/')}>Go home</Button>
<Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>
</div>
</div>
);
}