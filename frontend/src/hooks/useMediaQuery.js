import { useEffect, useState } from "react";

/**
 * Whether a media query matches, kept live. Listens to the query's `change`
 * event (it only fires when the result flips), not to resize: a page that
 * loaded at phone width and was then widened must not keep the phone layout.
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mq.addEventListener("change", onChange);
    setMatches(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
};
