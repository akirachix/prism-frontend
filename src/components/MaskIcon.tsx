"use client";

import styles from "./MaskIcon.module.css";

interface MaskIconProps {
  src: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export default function MaskIcon({ src, width, height, className = "" }: MaskIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.icon} ${className}`}
      style={{
        width,
        height,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
      }}
    />
  );
}
