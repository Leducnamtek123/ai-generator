import type { SVGProps } from "react";

const ReactIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 569 512">
    <g fill="none" stroke="#087EA4" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="284.5" cy="255.5" rx="112" ry="42" />
      <ellipse cx="284.5" cy="255.5" rx="112" ry="42" transform="rotate(60 284.5 255.5)" />
      <ellipse cx="284.5" cy="255.5" rx="112" ry="42" transform="rotate(120 284.5 255.5)" />
      <circle cx="284.5" cy="255.5" r="36" fill="#087EA4" stroke="none" />
    </g>
  </svg>
);

export { ReactIcon };
