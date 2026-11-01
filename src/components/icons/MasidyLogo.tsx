import { useEffect, useState } from 'react';

export interface MasidyLogoProps {
className?: string;
}

/**
 * Masidy glyph mark.
 * Reads the data-mode attribute on <html> (set by the theme toggle)
 * and switches between the dark/light PNG variants accordingly.
 * Falls back to dark variant on SSR/initial render.
 */
export function MasidyLogo({ className }: MasidyLogoProps) {
const [isDark, setIsDark] = useState(
() => document.documentElement.dataset.mode !== 'light',
);

useEffect(() => {
const observer = new MutationObserver(() => {
setIsDark(document.documentElement.dataset.mode !== 'light');
});
observer.observe(document.documentElement, {
attributes: true,
attributeFilter: ['data-mode'],
});
return () => observer.disconnect();
}, []);

return (
<img
src={isDark ? '/masidy-glyph-dark.png' : '/masidy-glyph-light.png'}
alt="Masidy"
className={className}
draggable={false}
style={{ objectFit: 'contain' }}
/>
);
}