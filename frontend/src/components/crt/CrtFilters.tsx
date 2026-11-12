/**
 * The CRT redesign's two palette filters (SPEC-crt-redesign.md §5): the
 * picture's luminance mapped onto the portrait's phosphor blue (dark) or onto
 * blue ink (light), from assets/photo_ramp.json. Used through the
 * .crt-filter-* classes in index.css; mounted once in App.
 *
 * 0x0 and absolutely placed, never display: none, which breaks url(#id)
 * filter references in Safari and Firefox.
 */
const LUMA = "0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0";

const CRT_TABLES = {
  dark: {
    r: "0.000 0.000 0.038 0.106 0.175 0.254 0.338 0.441 0.569 0.733 0.871",
    g: "0.008 0.112 0.226 0.334 0.438 0.539 0.639 0.739 0.827 0.911 0.984",
    b: "0.031 0.235 0.400 0.525 0.649 0.762 0.863 0.944 0.984 0.996 1.000",
  },
  light: {
    r: "0.031 0.053 0.075 0.096 0.118 0.218 0.319 0.420 0.558 0.734 0.910",
    g: "0.102 0.147 0.192 0.237 0.282 0.381 0.480 0.578 0.689 0.813 0.937",
    b: "0.188 0.269 0.349 0.429 0.510 0.602 0.694 0.785 0.859 0.914 0.969",
  },
} as const;

export const CrtFilters = () => (
  <svg
    width="0"
    height="0"
    style={{ position: "absolute" }}
    aria-hidden="true"
    focusable="false"
    data-testid="crt-filters"
  >
    {(["dark", "light"] as const).map((theme) => (
      <filter key={theme} id={`crt-${theme}`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values={LUMA} />
        <feComponentTransfer>
          <feFuncR type="table" tableValues={CRT_TABLES[theme].r} />
          <feFuncG type="table" tableValues={CRT_TABLES[theme].g} />
          <feFuncB type="table" tableValues={CRT_TABLES[theme].b} />
        </feComponentTransfer>
      </filter>
    ))}
  </svg>
);
