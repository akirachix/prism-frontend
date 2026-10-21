import Link from "next/link";
import { ArrowLeftIcon } from "../icons";
import { Squiggle } from "../ui/Squiggle";

interface Props {
  title: string;
  mobileTitle?: string;
  /** Show a back arrow that links here. */
  back?: string;
  /** Show a back arrow that runs this instead (e.g. "previous question"). */
  onBack?: () => void;
  decor?: boolean;
  hideOnDesktop?: boolean;
}

/** Page title: mobile header bar + desktop heading with the orange squiggle. */
export function PageHeader({
  title,
  mobileTitle,
  back,
  onBack,
  decor,
  hideOnDesktop,
}: Props) {
  const arrow = back ? (
    <Link href={back} className="pageheader__back" aria-label="Go back">
      <ArrowLeftIcon size={16} />
    </Link>
  ) : onBack ? (
    <button
      type="button"
      className="pageheader__back"
      aria-label="Go back"
      onClick={onBack}
    >
      <ArrowLeftIcon size={16} />
    </button>
  ) : null;

  return (
    <>
      <header className={`mhead ${decor ? "mhead--decor" : ""}`}>
        <h1 className="mhead__title">
          {arrow}
          {mobileTitle ?? title}
        </h1>
      </header>
      {!hideOnDesktop && (
        <div className="dhead">
          <h1 className="dhead__title">
            {arrow}
            {title}
          </h1>
          <Squiggle className="dhead__squiggle" />
        </div>
      )}
    </>
  );
}
