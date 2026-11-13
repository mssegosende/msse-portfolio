import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";
import { S_PATH } from "./logoMark";

// The y range of an absolute SVG path (M, L, Q, H, V, Z), control points included.
const yRange = (d: string) => {
  const ys: number[] = [];
  for (const [, cmd, args] of d.matchAll(/([MLQHVZ])([^MLQHVZ]*)/g)) {
    const n = (args!.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    if (cmd === "V") ys.push(...n);
    else if (cmd !== "H") ys.push(...n.filter((_, i) => i % 2 === 1));
  }
  return { minY: Math.min(...ys), maxY: Math.max(...ys) };
};

describe("Logo", () => {
  it("lockup: the mark and MSSE:// in Michroma, the :// in --crt-phosphor", () => {
    render(<Logo />);
    const logo = screen.getByTestId("logo");
    expect(logo).toHaveAccessibleName("MSSE://");
    expect(logo).toHaveTextContent("MSSE://");
    expect(screen.getByText("://")).toHaveClass("text-crt-phosphor");
    expect(screen.getByTestId("logo-mark")).toBeInTheDocument();
  });

  it("mark only: no wordmark", () => {
    render(<Logo variant="mark" />);
    expect(screen.getByTestId("logo")).not.toHaveTextContent("MSSE");
  });

  it("draws in the theme's tokens: brackets --crt-text, S --crt-core, crosshair --crt-phosphor at 0.4", () => {
    render(<Logo variant="mark" size={40} />);
    const [crosshair, brackets, s] = Array.from(
      screen.getByTestId("logo-mark").querySelectorAll("path"),
    );
    expect(crosshair!.style.stroke).toBe("var(--crt-phosphor)");
    expect(crosshair!.style.strokeOpacity).toBe("0.4");
    expect(brackets!.style.stroke).toBe("var(--crt-text)");
    expect(s!.style.fill).toBe("var(--crt-core)");
    // At 40px the brackets keep a 1.25px floor (3.75 of 120 units).
    expect(Number(brackets!.style.strokeWidth)).toBeCloseTo(3.75);
  });

  it("is static: no animation class anywhere in it", () => {
    render(<Logo />);
    expect(screen.getByTestId("logo").outerHTML).not.toMatch(/animate-|flicker|typing/);
  });

  it("the S is Michroma's glyph at the hand-drawn S's height and centre", () => {
    const { minY, maxY } = yRange(S_PATH);
    // Quadratic control points can sit a little outside the curve.
    expect(minY).toBeGreaterThanOrEqual(47);
    expect(maxY).toBeLessThanOrEqual(73);
    expect((minY + maxY) / 2).toBeCloseTo(60, 0);
    expect(S_PATH).toMatch(/^M[\d.]+ [\d.]+Q/); // a filled outline, not strokes
  });
});
