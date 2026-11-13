import { INTRO_VIDEO } from "./introVideo";

/**
 * The README tour: the video gallery's channels (María Sol, pre-launch).
 *
 * TODO(content): every entry points at the intro placeholder until the real
 * clips exist. When they do, each gets its own full file (`src`), a short
 * muted preview loop (`preview`), a poster and captions (WebVTT), generated
 * from María Sol's recordings; replace the paths and durations here.
 */
export type VideoGroup = "INTRO" | "SHIPPED" | "FROM MARCH TO NOW" | "THE SERIES";

export interface TourVideo {
  /** Two digits, shown as Ø05; also the ?v= of the gallery's URL. */
  id: string;
  group: VideoGroup;
  title: string;
  description: string;
  /** Seconds. */
  duration: number;
  /** The full video, with sound. */
  src: string;
  /** A short muted loop for the channel wall. */
  preview: string;
  poster: string;
  /** WebVTT captions, when there are any. */
  captions?: string;
}

export const VIDEO_GROUPS: VideoGroup[] = ["INTRO", "SHIPPED", "FROM MARCH TO NOW", "THE SERIES"];

// The placeholder's own length (public/intro/intro.mp4).
const PLACEHOLDER_S = 8;

const entry = (id: string, group: VideoGroup, title: string, description: string): TourVideo => ({
  id,
  group,
  title,
  description,
  duration: PLACEHOLDER_S,
  src: INTRO_VIDEO.src,
  preview: INTRO_VIDEO.src,
  poster: INTRO_VIDEO.poster,
});

export const tourVideos: TourVideo[] = [
  entry("01", "INTRO", "Hello", "Who I am and what this tour covers."),
  entry("02", "INTRO", "Tech stack", "The tools I build with, and why."),
  entry("03", "SHIPPED", "Polaris", "A RAG assistant for BCRA banking regulations."),
  entry("04", "SHIPPED", "Alphecca", "An LLM selection and cost calculator."),
  entry("05", "SHIPPED", "Ethos", "A clinic booking app, full stack."),
  entry("06", "SHIPPED", "Lynx", "Fraud and elder-exploitation detection."),
  entry("07", "SHIPPED", "Marvel Characters", "My first React and TypeScript app."),
  entry("08", "SHIPPED", "Blaze", "An AI co-authoring Markdown editor."),
  entry("09", "FROM MARCH TO NOW", "Built, not deployed yet", "Work that runs, but is not live."),
  entry("10", "FROM MARCH TO NOW", "March to June", "What I built in those months."),
  entry("11", "FROM MARCH TO NOW", "July to November", "What I built in those months."),
  entry("12", "THE SERIES", "The series, on the shelf", "The cheat-sheet series."),
  entry("13", "THE SERIES", "Thank you", "Thanks for watching."),
];

/** "Ø05"-style number (the slashed zero, as the rest of the site). */
export const videoNumber = (v: TourVideo) => `Ø${v.id}`;

/** 90 -> "1:30". */
export const videoLength = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
