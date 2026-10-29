import { useLayoutEffect, useRef } from "react";

/**
 * A box for one Spline mount that reports when it really goes away. The GPU
 * context is released by the caller from the canvas it recorded at LOAD, not
 * from whatever canvas is in the box: under StrictMode the dev build mounts,
 * unmounts and remounts every component once, and releasing on that first
 * pretend-unmount handed react-spline an already-lost context -- the scene
 * then failed to load and took the whole app down with it.
 */
export const ReleasingBox = ({ onGone, children, ...rest }) => {
  const goneRef = useRef(onGone);
  goneRef.current = onGone;
  useLayoutEffect(() => () => goneRef.current?.(), []);
  return <div {...rest}>{children}</div>;
};
