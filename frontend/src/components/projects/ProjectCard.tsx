import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import { projectLinks, type ShowcaseProject } from "@/data/projectsData";
import { Num } from "../Num";
import s from "./projects.module.css";

/** Type sizes per card format, from the mocks (desktop values in mock units, pre-zoom). */
export type CardFormat = "featured" | "row" | "phone";

const TYPE: Record<
  CardFormat,
  {
    tag: CSSProperties;
    titleTop: number;
    /** Between the Ø number and the name below it. */
    nameTop: number;
    name: number;
    num: number;
    statusTop: number;
    status: number;
    bodyTop: number;
    body: CSSProperties;
    chipsTop: number;
    chipGap: number;
    chip: CSSProperties;
    chipBorder?: string;
  }
> = {
  featured: {
    tag: {},
    titleTop: 24,
    nameTop: 10,
    name: 40,
    num: 30,
    statusTop: 10,
    status: 13,
    bodyTop: 16,
    body: { fontSize: 16, lineHeight: 1.65 },
    chipsTop: 20,
    chipGap: 8,
    chip: { fontSize: 12.5, padding: "6px 12px" },
  },
  row: {
    tag: { padding: "6px 11px", fontSize: 10 },
    titleTop: 12,
    nameTop: 6,
    name: 24,
    num: 20,
    statusTop: 6,
    status: 12.5,
    bodyTop: 10,
    body: { fontSize: 13.5, lineHeight: 1.5 },
    chipsTop: 12,
    chipGap: 6,
    chip: { fontSize: 12, padding: "5px 10px" },
  },
  phone: {
    tag: { padding: "6px 10px", fontSize: 9.5 },
    titleTop: 14,
    nameTop: 6,
    name: 24,
    num: 18,
    statusTop: 6,
    status: 12,
    bodyTop: 12,
    body: { fontSize: 13.5, lineHeight: 1.6 },
    chipsTop: 12,
    chipGap: 6,
    chip: { fontSize: 11.5, padding: "5px 10px" },
    chipBorder: "rgba(255,255,255,0.32)",
  },
};

/** Subtitle label, name + Ø number, status, paragraphs and tag chips. */
export const CardText = ({
  project,
  format,
  tagsTop = 0,
}: {
  project: ShowcaseProject;
  format: CardFormat;
  tagsTop?: number;
}) => {
  const t = TYPE[format];
  return (
    <>
      <div style={{ marginTop: tagsTop, display: "flex" }}>
        <span className={s.tag} style={t.tag}>
          {project.subtitle}
        </span>
      </div>
      {/* The Ø number on its own line, so a name that wraps keeps it clear. */}
      <div className={s.num} style={{ marginTop: t.titleTop, fontSize: t.num }}>
        <Num value={project.num} />
      </div>
      <FitName
        as="h3"
        name={project.name}
        size={t.name}
        className={s.name}
        style={{ marginTop: t.nameTop }}
      />
      {project.status && (
        <div className={s.status} style={{ marginTop: t.statusTop, fontSize: t.status }}>
          {project.status}
        </div>
      )}
      {project.paragraphs.map((p) => (
        <p key={p.slice(0, 32)} className={s.body} style={{ marginTop: t.bodyTop, ...t.body }}>
          {p}
        </p>
      ))}
      <ul
        className={s.chips}
        style={{ marginTop: t.chipsTop, gap: t.chipGap, padding: 0, listStyle: "none" }}
        aria-label="Stack"
      >
        {project.tags.map((c) => (
          <li
            key={c}
            className={s.chip}
            style={{ ...t.chip, ...(t.chipBorder ? { borderColor: t.chipBorder } : {}) }}
          >
            {c}
          </li>
        ))}
      </ul>
    </>
  );
};

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

/**
 * The black framed card (CARD-SPEC): outline, graphite bezel, gap, dark panel
 * and the bottom tab `MSSE:// │ Code ↗ Live ↗`. Links without a URL are not
 * shown; with none, the tab carries only the mark.
 */
export const ProjectFrame = ({
  project,
  contentStyle,
  children,
}: {
  project: ShowcaseProject;
  contentStyle?: CSSProperties;
  children: ReactNode;
}) => {
  const links = projectLinks(project);
  return (
    <>
      <div aria-hidden="true" className={s.outline} />
      <div aria-hidden="true" className={s.bezel} />
      <div aria-hidden="true" className={s.gap} />
      <div aria-hidden="true" className={s.panel} />
      <div className={s.content} style={contentStyle}>
        {children}
      </div>
      <div className={s.tab}>
        <span aria-hidden="true" className={s.tabOutline} />
        <span aria-hidden="true" className={s.tabBezel} />
        <span className={s.tabRow}>
          <span className={s.tabMark}>MSSE://</span>
          {links.length > 0 && <span aria-hidden="true" className={s.tabDivider} />}
          {links.map((l) => (
            <a
              key={l.label}
              className={s.tabLink}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${project.name}: ${l.label} (opens in a new tab)`}
              data-testid={`project-${l.label.toLowerCase()}-link-${project.id}`}
            >
              {l.label} ↗
            </a>
          ))}
        </span>
      </div>
    </>
  );
};
