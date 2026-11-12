import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import s from "./projects.module.css";

/**
 * A project name that never loses a letter: it wraps between words, and where
 * one word is still wider than its column (a narrow phone, a long name) its
 * font steps down until the word fits, down to half its size.
 */
export const FitName = ({
  name,
  size,
  as: Tag = "span",
  className,
  style,
}: {
  name: string;
  size: number;
  as?: "h3" | "span";
  className?: string;
  style?: CSSProperties;
}) => {
  const ref = useRef<HTMLElement>(null);
  const [fit, setFit] = useState(size);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let width = -1;
    const measure = (force = false) => {
      // Only a new column width (or new fonts) changes the fit; the steps
      // below change the height, which must not measure again.
      if (!force && el.clientWidth === width) return;
      width = el.clientWidth;
      let next = size;
      el.style.fontSize = `${next}px`;
      while (el.scrollWidth > el.clientWidth + 0.5 && next > size / 2) {
        next = Math.max(size / 2, next - 0.5);
        el.style.fontSize = `${next}px`;
      }
      setFit(next);
    };
    measure(true);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => measure());
    ro?.observe(el);
    let live = true;
    void document.fonts?.ready.then(() => live && measure(true));
    return () => {
      live = false;
      ro?.disconnect();
    };
  }, [size, name]);

  return (
    <Tag
      ref={ref as Ref<never>}
      className={className}
      style={{ ...style, fontSize: fit }}
      data-testid="project-name"
    >
      {name}
    </Tag>
  );
};

/**
 * A text column that scrolls inside its card when the copy is longer than
 * the card (fonts never shrink, text is never cut), with a soft fade at the
 * bottom while there is more below.
 */
export const ScrollText = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ overflows: false, more: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const overflows = el.scrollHeight - el.clientHeight > 1;
      const more = overflows && el.scrollHeight - el.scrollTop - el.clientHeight > 2;
      setState((cur) =>
        cur.overflows === overflows && cur.more === more ? cur : { overflows, more },
      );
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    // The box and its content both change size (fonts loading, resize).
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${s.scrollText} ${state.more ? s.fade : ""}`}
      style={style}
      // Lenis leaves the wheel to this box only when it actually scrolls.
      data-lenis-prevent={state.overflows ? "" : undefined}
      tabIndex={state.overflows ? 0 : undefined}
      data-overflows={state.overflows ? "true" : undefined}
    >
      <div>{children}</div>
    </div>
  );
};
