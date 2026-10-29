import { Component } from "react";

/**
 * One per Spline mount. react-spline has no onError: a failed load is
 * rethrown from its render (`if (i) throw i`), and without a boundary that
 * takes the whole page down. This catches it, renders nothing in that
 * scene's place and tells the owner which one died. No GPU context is
 * released here: react-spline disposes its own Application on unmount, and
 * ours are only ever released from canvases registered at LOAD (see
 * ReleasingBox) -- a scene that failed never registered one.
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
