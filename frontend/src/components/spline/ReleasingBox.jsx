import { useLayoutEffect, useRef } from "react";

/**
 * Wraps one Spline mount and calls `onGone` on a real unmount. The caller
 * releases the GPU context from the canvas it recorded at load: releasing
 * whatever canvas is in the box breaks under StrictMode's mount, unmount,
 * remount, which would hand the remounted scene a lost context.
 */
export const ReleasingBox = ({ onGone, children, ...rest }) => {
  const goneRef = useRef(onGone);
  goneRef.current = onGone;
  useLayoutEffect(() => () => goneRef.current?.(), []);
  return <div {...rest}>{children}</div>;
};
