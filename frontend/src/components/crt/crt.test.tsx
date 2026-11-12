import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CrtFilters } from "./CrtFilters";
import { Crosshair, CrtFrame, DataRow, TerminalWindow } from "./CrtPieces";

describe("CrtFilters", () => {
  it("defines both palette filters, hidden but not display:none", () => {
    render(<CrtFilters />);
    const svg = screen.getByTestId("crt-filters");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.style.display).not.toBe("none");
    for (const id of ["crt-dark", "crt-light"]) {
      const filter = svg.querySelector(`filter#${id}`)!;
      expect(filter).not.toBeNull();
      expect(filter.getAttribute("color-interpolation-filters")).toBe("sRGB");
      // Luminance first, then one 11-step table per channel.
      expect(filter.querySelector("feColorMatrix")!.getAttribute("values")).toMatch(
        /^0\.299 0\.587 0\.114/,
      );
      for (const fn of ["feFuncR", "feFuncG", "feFuncB"]) {
        const values = filter.querySelector(fn)!.getAttribute("tableValues")!.split(" ");
        expect(values).toHaveLength(11);
      }
    }
    // Spot-check against the spec: dark's brightest blue is 1.000, light's darkest red 0.031.
    expect(svg.querySelector("#crt-dark feFuncB")!.getAttribute("tableValues")).toMatch(/1\.000$/);
    expect(svg.querySelector("#crt-light feFuncR")!.getAttribute("tableValues")).toMatch(/^0\.031/);
  });
});

describe("CRT shared pieces", () => {
  it("a frame has a node on each corner, plus any extra ones", () => {
    const { container } = render(<CrtFrame nodes={[{ left: -4, top: 49 }]}>body</CrtFrame>);
    expect(container.querySelectorAll(".crt-node")).toHaveLength(5);
  });

  it("a crosshair has four corners sized by its props", () => {
    const { container } = render(<Crosshair size={56} thickness={4} offset={-28} />);
    const el = container.querySelector<HTMLElement>(".crt-crosshair")!;
    expect(el.children).toHaveLength(4);
    expect(el.style.getPropertyValue("--ch-size")).toBe("56px");
    expect(el.style.getPropertyValue("--ch-w")).toBe("4px");
    expect(el.style.getPropertyValue("--ch-offset")).toBe("-28px");
  });

  it("a data row shows its label and value", () => {
    render(<DataRow label="FUNCTION">AGENTS</DataRow>);
    expect(screen.getByText("FUNCTION").className).toBe("crt-row__label");
    expect(screen.getByText("AGENTS").className).toBe("crt-row__value");
  });

  it("a terminal window has its title and three circles", () => {
    const { container } = render(<TerminalWindow title="msse@core: ~/projects" />);
    expect(screen.getByText("msse@core: ~/projects")).toBeTruthy();
    expect(container.querySelectorAll(".crt-term__dots > span")).toHaveLength(3);
  });
});
