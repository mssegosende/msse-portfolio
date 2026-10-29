// jsdom has no matchMedia. This one answers from a table the tests set, and
// fires `change` on the queries whose result flips, like the real one.

type Listener = (e: MediaQueryListEvent) => void;

const results = new Map<string, boolean>();
const listeners = new Map<string, Set<Listener>>();

export const setMediaQuery = (query: string, matches: boolean): void => {
  if (results.get(query) === matches) return;
  results.set(query, matches);
  listeners.get(query)?.forEach((l) => l({ matches, media: query } as MediaQueryListEvent));
};

export const resetMediaQueries = (): void => {
  results.clear();
  listeners.clear();
};

export const matchMedia = (query: string): MediaQueryList => {
  const subscribers = () => {
    let set = listeners.get(query);
    if (!set) listeners.set(query, (set = new Set()));
    return set;
  };
  return {
    media: query,
    get matches() {
      return results.get(query) ?? false;
    },
    onchange: null,
    addEventListener: (_type: string, l: Listener) => subscribers().add(l),
    removeEventListener: (_type: string, l: Listener) => subscribers().delete(l),
    addListener: (l: Listener) => subscribers().add(l),
    removeListener: (l: Listener) => subscribers().delete(l),
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
};
