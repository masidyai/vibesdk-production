import type { SVGProps } from 'react';

/**
 * Masidy "in" glyph mark — transparent background, works on any surface.
 * - Letterform uses currentColor so it's white on dark, dark on light
 * - Lime dot (#7FFF00) is always the brand accent
 */
export function MasidyLogo(props: SVGProps<SVGSVGElement>) {
return (
<svg
viewBox="0 0 120 110"
fill="none"
xmlns="http://www.w3.org/2000/svg"
aria-label="Masidy"
{...props}
>
{/* Lime dot */}
<circle cx="47" cy="20" r="14" fill="#7FFF00" />

{/*
  Combined "in" shape.
  "i": tall rounded pillar on the left with concave top-right cutout
  "n": arch bridge from the i-top, two legs, right leg has inner slot,
       bottom-right corner has a dark inward curl
*/}
<path
fillRule="evenodd"
clipRule="evenodd"
d="
  M 30 84
  L 30 52
  Q 30 38 44 38
  Q 50 38 54 42
  Q 58 36 66 34
  Q 82 30 88 44
  L 90 44
  Q 102 44 104 58
  L 104 84
  Q 104 92 96 92
  L 88 92
  Q 80 92 80 84
  L 80 62
  Q 80 56 74 56
  Q 68 56 68 62
  L 68 84
  Q 68 92 60 92
  L 52 92
  Q 44 92 44 84
  L 44 50
  Q 44 44 38 44
  Q 30 44 30 52
  Z
"
fill="currentColor"
/>

{/* bottom-right curl / shadow of the n */}
<ellipse cx="103" cy="91" rx="11" ry="7" fill="currentColor" opacity="0.35" />
</svg>
);
}