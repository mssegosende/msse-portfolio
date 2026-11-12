import type { CSSProperties, ReactNode } from "react";

// The CRT redesign's shared pieces (SPEC-crt-redesign.md §1, "Shared pieces").
// Styles live in index.css (.crt-*), colours in the --crt-* tokens, so each
// piece follows the page theme.

/** A 7px glowing dot; place it where a divider meets a frame. */
export const Node = ({ style }: { style: CSSProperties }) => (
  <span aria-hidden="true" className="crt-node" style={style} />
);

/** Frame with nodes: 1px line, panel fill, a dot on each corner. */
export const CrtFrame = ({
  children,
  className = "",
  style,
  nodes = [],
}: {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Extra dots, e.g. `{ left: -4, top: 49 }` where a divider meets the frame. */
  nodes?: CSSProperties[];
}) => (
  <div className={`crt-frame ${className}`} style={style}>
    {[
      { left: -4, top: -4 },
      { right: -4, top: -4 },
      { left: -4, bottom: -4 },
      { right: -4, bottom: -4 },
      ...nodes,
    ].map((pos, i) => (
      <Node key={i} style={pos} />
    ))}
    {children}
  </div>
);

/**
 * Crosshair corners: four L corners around the thing in focus. Sits inside a
 * positioned box; a negative `offset` puts the corners outside it.
 */
export const Crosshair = ({
  size = 24,
  thickness = 2,
  offset = 0,
  className = "",
}: {
  size?: number;
  /** 3-4px desktop, 2-3px phones. */
  thickness?: number;
  offset?: number;
  className?: string;
}) => (
  <div
    aria-hidden="true"
    className={`crt-crosshair ${className}`}
    style={
      {
        "--ch-size": `${size}px`,
        "--ch-w": `${thickness}px`,
        "--ch-offset": `${offset}px`,
      } as CSSProperties
    }
  >
    <span />
    <span />
    <span />
    <span />
  </div>
);

/** Data row: VT323 label left, value right, divider below. */
export const DataRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="crt-row">
    <span className="crt-row__label">{label}</span>
    <span className="crt-row__value">{children}</span>
  </div>
);

/** Terminal window: a `msse@…: ~/…` title bar with three circles, the last filled. */
export const TerminalWindow = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children?: ReactNode;
  className?: string;
}) => (
  <div className={`crt-term ${className}`}>
    <div className="crt-term__bar">
      <span>{title}</span>
      <span aria-hidden="true" className="crt-term__dots">
        <span />
        <span />
        <span />
      </span>
    </div>
    {children}
  </div>
);
