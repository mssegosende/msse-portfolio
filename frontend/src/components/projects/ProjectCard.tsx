import type { CSSProperties, ReactNode } from "react";
import type { ShowcaseProject } from "@/data/projectsData";
import { Num } from "../Num";
import s from "./projects.module.css";

/** Type sizes per card format, from the mocks (desktop values in mock units, pre-zoom). */
export type CardFormat = "featured" | "row" | "phone";

const TYPE: Record<
  CardFormat,
  {
    tag: CSSProperties;
    tagGap: number;
    titleTop: number;
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
    tagGap: 10,
    titleTop: 24,
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
    tagGap: 8,
    titleTop: 12,
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
    tagGap: 8,
    titleTop: 14,
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

/** Tags, name + Ø number, status, text and chips. */
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
      <div style={{ marginTop: tagsTop, display: "flex", flexWrap: "wrap", gap: t.tagGap }}>
        {project.tags.map((tag) => (
          <span key={tag} className={s.tag} style={t.tag}>
            {tag}
          </span>
        ))}
      </div>
      <div
        style={{
          marginTop: t.titleTop,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h3 className={s.name} style={{ fontSize: t.name }}>
          {project.name}
        </h3>
        <span className={s.num} style={{ fontSize: t.num }}>
          <Num value={project.num} />
        </span>
      </div>
      {project.status && (
        <div className={s.status} style={{ marginTop: t.statusTop, fontSize: t.status }}>
          {project.status}
        </div>
      )}
      <p className={s.body} style={{ marginTop: t.bodyTop, ...t.body }}>
        {project.body}
      </p>
      <ul
        className={s.chips}
        style={{ marginTop: t.chipsTop, gap: t.chipGap, padding: 0, listStyle: "none" }}
        aria-label="Stack"
      >
        {project.chips.map((c) => (
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

/** PR DIFF → AGENTS · RULES → RATING → < THRESHOLD · HUMAN */
export const Flow = ({ steps, compact = false }: { steps: string[]; compact?: boolean }) => (
  <div
    className={s.flow}
    style={compact ? { marginTop: 12, gap: 5, fontSize: 9, letterSpacing: "0.04em" } : undefined}
    aria-label={`Flow: ${steps.join(", then ")}`}
    role="img"
  >
    {steps.map((step, i) => {
      const last = i === steps.length - 1;
      const cls = last ? s.flowEnd : i === steps.length - 2 ? s.flowStrong : "";
      return (
        <span key={step} style={{ display: "contents" }}>
          {i > 0 && (
            <span className={s.flowArrow} aria-hidden="true">
              →
            </span>
          )}
          <span className={cls} style={compact ? { padding: "5px 7px" } : undefined}>
            {step}
          </span>
        </span>
      );
    })}
  </div>
);

/**
 * The black framed card (CARD-SPEC): outline, graphite bezel, gap, dark panel
 * and the bottom tab `MSSE:// │ label`. The tab is a link only with an href.
 */
export const ProjectFrame = ({
  tabLabel,
  href,
  contentStyle,
  children,
}: {
  tabLabel: string;
  href?: string;
  contentStyle?: CSSProperties;
  children: ReactNode;
}) => {
  const tab = (
    <>
      <span aria-hidden="true" className={s.tabOutline} />
      <span aria-hidden="true" className={s.tabBezel} />
      <span className={s.tabRow}>
        <span className={s.tabMark}>MSSE://</span>
        <span aria-hidden="true" className={s.tabDivider} />
        <span className={s.tabLabel}>{tabLabel}</span>
      </span>
    </>
  );
  return (
    <>
      <div aria-hidden="true" className={s.outline} />
      <div aria-hidden="true" className={s.bezel} />
      <div aria-hidden="true" className={s.gap} />
      <div aria-hidden="true" className={s.panel} />
      <div className={s.content} style={contentStyle}>
        {children}
      </div>
      {href ? (
        <a
          className={s.tab}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {tab}
        </a>
      ) : (
        <div className={s.tab}>{tab}</div>
      )}
    </>
  );
};
