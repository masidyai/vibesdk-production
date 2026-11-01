import { useEffect, useState } from 'react';

export interface MasidyLogoProps {
className?: string;
}

/**
 * Masidy logo mark using the actual brand PNGs.
 * mix-blend-mode removes the baked-in background on any surface:
 *   dark mode  → "screen"   makes dark pixels transparent
 *   light mode → "multiply" makes light pixels transparent
 */
export function MasidyLogo({ className }: MasidyLogoProps) {
const [isDark, setIsDark] = useState(
() => typeof document !== 'undefined'
? document.documentElement.dataset.mode !== 'light'
: true,
);

useEffect(() => {
const el = document.documentElement;
const check = () => setIsDark(el.dataset.mode !== 'light');
check();
const observer = new MutationObserver(check);
observer.observe(el, { attributes: true, attributeFilter: ['data-mode'] });
return () => observer.disconnect();
}, []);

return (
<img
src={isDark ? '/masidy-glyph-dark.png' : '/masidy-glyph-light.png'}
alt="Masidy"
className={className}
draggable={false}
style={{
objectFit: 'contain',
mixBlendMode: isDark ? 'screen' : 'multiply',
}}
/>
);
}