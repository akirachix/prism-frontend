import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const MailIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </Svg>
);
export const InfoIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 11v6" />
    <circle cx="12" cy="7.6" r=".6" fill="currentColor" />
  </Svg>
);
export const CheckCircleIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="m8 12.3 2.8 2.8L16.2 9.5" />
  </Svg>
);
export const ClipboardIcon = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4h6v3H9z" />
    <path d="M8.5 12h7M8.5 16h5" />
  </Svg>
);
export const ClipboardCheckIcon = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4h6v3H9z" />
    <path d="m9 14 2.2 2.2L15.5 12" />
  </Svg>
);
export const LogoutIcon = (p: P) => (
  <Svg {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    <path d="M10 8l-4 4 4 4M6 12h10" />
  </Svg>
);
export const UserIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6" />
  </Svg>
);
export const HomeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
  </Svg>
);
export const DocIcon = (p: P) => (
  <Svg {...p}>
    <path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Svg>
);
export const BookIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 6.5C10.5 5.3 8 4.5 4 4.5v13c4 0 6.5.8 8 2 1.5-1.2 4-2 8-2v-13c-4 0-6.5.8-8 2z" />
    <path d="M12 6.5v13" />
  </Svg>
);
export const ChecklistIcon = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4h6v3H9z" />
    <path d="m9 13.5 2 2 4-4" />
  </Svg>
);
export const EyeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
export const EyeOffIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.5 7.6A16.5 16.5 0 0 0 2 12s3.6 7 10 7c1.5 0 2.8-.4 4-.9" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);
export const ChevronRightIcon = (p: P) => (
  <Svg {...p}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);
export const ArrowLeftIcon = (p: P) => (
  <Svg {...p}>
    <path d="M19 12H5M11 5l-7 7 7 7" />
  </Svg>
);
export const PhoneIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
  </Svg>
);
export const HeartIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z" />
  </Svg>
);
export const LockIcon = (p: P) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);

export function FaceIcon({
  value,
  size = 33,
}: {
  value: number;
  size?: number;
}) {
  const mouth: Record<number, string> = {
    [-2]: "M8 16.5c1-1.8 2.4-2.6 4-2.6s3 .8 4 2.6",
    [-1]: "M8.5 16c1-1.1 2.2-1.6 3.5-1.6s2.5.5 3.5 1.6",
    0: "M8.5 15.5h7",
    1: "M8 14c1 1.8 2.4 2.6 4 2.6s3-.8 4-2.6",
    2: "M7.6 13.6h8.8c-.4 2.6-2 4-4.4 4s-4-1.4-4.4-4z",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.6" />
      <circle cx="9" cy="9.5" r=".7" fill="currentColor" />
      <circle cx="15" cy="9.5" r=".7" fill="currentColor" />
      <path d={mouth[value] ?? mouth[0]} />
    </svg>
  );
}
