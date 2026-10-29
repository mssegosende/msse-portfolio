import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { setMediaQuery } from "@/test/matchMedia";
import { useMediaQuery } from "./useMediaQuery";

const QUERY = "(max-width: 767px)";

describe("useMediaQuery", () => {
  it("reports the current result and follows changes", () => {
    setMediaQuery(QUERY, true);
    const { result } = renderHook(() => useMediaQuery(QUERY));
    expect(result.current).toBe(true);
    act(() => setMediaQuery(QUERY, false));
    expect(result.current).toBe(false);
  });
});
