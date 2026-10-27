"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import Button from "./ui/Button";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const noopSubscribe = () => () => {};

function subscribeDisplayMode(callback: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function getIsIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallEvent | null>(null);
  const [justInstalled, setJustInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const standalone = useSyncExternalStore(
    subscribeDisplayMode,
    getStandalone,
    () => false,
  );
  const isIos = useSyncExternalStore(noopSubscribe, getIsIos, () => false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallEvent);
    };
    const onInstalled = () => {
      setJustInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || justInstalled) return null;
  if (!promptEvent && !isIos) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      setPromptEvent(null);
    } else {
      setShowHelp((v) => !v);
    }
  }

  return (
    <>
      <Button variant="orange" block onClick={install}>
        Install app
      </Button>
      {showHelp && (
        <p role="note" className="home__text">
          Tap the Share icon in Safari, then choose &ldquo;Add to Home
          Screen&rdquo;.
        </p>
      )}
    </>
  );
}
