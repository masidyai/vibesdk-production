import React from 'react';

/**
 * Masidy logo mark — the "in" glyph with lime dot.
 * Uses currentColor for the letterform so it adapts to light/dark mode.
 * The lime dot is always #7FFF00 (brand accent).
 *
 * variant="glyph"  — icon only (default)
 * variant="wordmark" — icon + "MASIDY" text side by side
 */
export interface MasidyLogoProps extends React.SVGProps<SVGSVGElement> {
variant?: 'glyph' | 'wordmark';
}

export function MasidyLogo({ variant = 'glyph', className, ...props }: MasidyLogoProps) {
if (variant === 'wordmark') {
return (
<svg
viewBox="0 0 160 48"
fill="none"
xmlns="http://www.w3.org/2000/svg"
aria-label="Masidy"
className={className}
{...props}
>
{/* Glyph mark */}
<g transform="translate(0,0) scale(0.195)">
{/* Lime dot */}
<circle cx="118" cy="52" r="38" fill="#7FFF00" />
{/* "i" stem — left pillar */}
<rect x="68" y="100" width="44" height="148" rx="22" fill="currentColor" />
{/* "i" base arc connector */}
<path d="M68 220 Q68 248 96 248 L112 248 Q140 248 140 220 L140 100 Q140 72 112 72 L96 72 Q68 72 68 100 Z" fill="currentColor" />
{/* "n" hump — arch */}
<path d="M140 100 Q140 56 184 56 Q228 56 228 100 L228 248 L184 248 L184 108 Q184 96 172 96 Q160 96 160 108 L160 248 L140 248 Z" fill="currentColor" />
{/* "n" right leg */}
<rect x="184" y="100" width="44" height="148" rx="10" fill="currentColor" />
{/* bottom-right curl shadow */}
<ellipse cx="238" cy="248" rx="28" ry="20" fill="currentColor" opacity="0.35" />
</g>
{/* "MASIDY" wordmark */}
<text
x="56"
y="32"
fontFamily="system-ui, -apple-system, sans-serif"
fontWeight="900"
fontSize="22"
letterSpacing="1.5"
fill="currentColor"
>
MASIDY
</text>
</svg>
);
}

// Glyph only
return (
<svg
viewBox="0 0 300 260"
fill="none"
xmlns="http://www.w3.org/2000/svg"
aria-label="Masidy"
className={className}
{...props}
>
{/* Lime dot */}
<circle cx="118" cy="52" r="38" fill="#7FFF00" />
{/* "i" body */}
<path
d="M68 220 Q68 248 96 248 L112 248 Q140 248 140 220 L140 100 Q140 72 112 72 L96 72 Q68 72 68 100 Z"
fill="currentColor"
/>
{/* "n" arch + legs */}
<path
d="M148 100 Q148 56 192 56 Q236 56 236 100 L236 248 L192 248 L192 108 Q192 98 180 98 Q168 98 168 108 L168 220 Q168 248 140 248 L140 100 Z"
fill="currentColor"
/>
{/* bottom-right curl */}
<ellipse cx="240" cy="252" rx="30" ry="18" fill="currentColor" opacity="0.3" />
</svg>
);
}