"use client";

import styles from "./AuthHero.module.css";

export const AUTH_IMG = "/images/sign-in";

function Picture({
  mobile,
  desktop,
  className,
}: {
  mobile: string;
  desktop: string;
  className?: string;
}) {
  return (
    <picture>
      <source media="(min-width: 1024px)" srcSet={`${AUTH_IMG}/${desktop}`} />
      <img src={`${AUTH_IMG}/${mobile}`} alt="" className={className} />
    </picture>
  );
}

export function HeroLogo() {
  return (
    <div className={styles.logo}>
      <span className={styles.logoMark} aria-hidden="true">
        <Picture
          mobile="logo-dot-left.svg"
          desktop="d-logo-dot.svg"
          className={styles.logoDotLeft}
        />
        <Picture
          mobile="logo-dot-right.svg"
          desktop="d-logo-dot.svg"
          className={styles.logoDotRight}
        />
        <Picture mobile="logo-body.svg" desktop="d-logo-body.svg" className={styles.logoBody} />
      </span>
      <span className={styles.logoText}>mirai</span>
    </div>
  );
}

export function DesktopHeroDecor() {
  const img = (name: string, className?: string) => (
    <img src={`${AUTH_IMG}/${name}`} alt="" className={`${styles.decor} ${className}`} />
  );
  return (
    <div aria-hidden="true">
      {img("d-circle-red-top.svg", styles.circleRedTop)}
      {img("d-ring-red.svg", styles.ringRed)}
      {img("d-ring-white.svg", styles.ringWhiteLeft)}
      {img("d-ring-white.svg", styles.ringWhiteEdge)}
      {img("d-ring-orange.svg", styles.ringOrange)}
      {img("d-circle-orange-bottom.svg", styles.circleOrangeBottom)}
      {img("d-circle-red-small.svg", styles.circleRedSmall)}
      <span className={`${styles.decor} ${styles.squiggleOrange}`}>
        <img src={`${AUTH_IMG}/d-squiggle-orange.svg`} alt="" />
      </span>
      <span className={`${styles.decor} ${styles.squiggleWhite}`}>
        <img src={`${AUTH_IMG}/d-squiggle-white.svg`} alt="" />
      </span>
    </div>
  );
}
