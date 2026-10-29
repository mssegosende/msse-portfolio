import { Component } from "react";

/**
 * One per Spline mount. react-spline has no onError and rethrows load
 * failures from render, so without this one failed scene takes the page
 * down. It releases no GPU context: a failed scene never recorded one.
 */
export class SceneBoundary extends Component {
  state = { dead: false };

  static getDerivedStateFromError() {
    return { dead: true };
  }

  componentDidCatch(error) {
    console.warn(`Spline scene failed to load (${this.props.name}):`, error);
    this.props.onFail?.();
  }

  render() {
    return this.state.dead ? null : this.props.children;
  }
}
