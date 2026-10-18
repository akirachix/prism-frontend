"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Page crashed:", error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className={styles.box} role="alert">
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.text}>This page couldn’t be shown. Your saved work is safe.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => window.location.reload()}>
            Reload the page
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => window.location.assign("/")}
          >
            Go to the start page
          </button>
        </div>
      </section>
    );
  }
}
