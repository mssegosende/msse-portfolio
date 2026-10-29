import { Component, type ReactNode } from "react";

interface SceneBoundaryProps {
  /** For the console warning. */
  name: string;
  onFail?: () => void;
  children?: ReactNode;
}

/**
 * One per Spline mount. react-spline has no onError and rethrows load
 * failures from render, so without this one failed scene takes the page
 * down. It releases no GPU context: a failed scene never recorded one.
 */
export class SceneBoundary extends Component<SceneBoundaryProps, { dead: boolean }> {
  state = { dead: false };

  static getDerivedStateFromError() {
    return { dead: true };
  }

  componentDidCatch(error: unknown) {
    console.warn(`Spline scene failed to load (${this.props.name}):`, error);
    this.props.onFail?.();
  }

  render() {
    return this.state.dead ? null : this.props.children;
  }
}
