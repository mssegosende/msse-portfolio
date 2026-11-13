import { INTRO_VIDEO } from "./introVideo";

/**
 * The README tour: the video gallery's channels (María Sol, pre-launch).
 *
 * An entry with a recording points at its files in public/videos/ (built by
 * scripts/build-tour-videos.mjs: <id>.mp4, <id>-preview.mp4, <id>.jpg and
 * <id>.vtt when there are captions), with its real length.
 * The projects' card recordings stay in Projects (María Sol); here each
 * project is a narrated scene 4 video, added as it is recorded, never a
 * placeholder with its name. TODO(content): 04-08 still show the intro
 * placeholder until her clips for them exist.
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

/** A recording in public/videos/: its length in seconds, and whether it has captions. */
interface Recording {
  duration: number;
  captions?: boolean;
}

const entry = (
  id: string,
  group: VideoGroup,
  title: string,
  description: string,
  recording?: Recording,
): TourVideo =>
  recording
    ? {
        id,
        group,
        title,
        description,
        duration: recording.duration,
        src: `/videos/${id}.mp4`,
        preview: `/videos/${id}-preview.mp4`,
        poster: `/videos/${id}.jpg`,
        captions: recording.captions ? `/videos/${id}.vtt` : undefined,
      }
    : {
        id,
        group,
        title,
        description,
        duration: PLACEHOLDER_S,
        src: INTRO_VIDEO.src,
        preview: INTRO_VIDEO.src,
        poster: INTRO_VIDEO.poster,
      };

export const tourVideos: TourVideo[] = [
  // README scenes 1 and 2 at 1.10x; 02 is scene 3, parts 1-3, at 1.25x. The
  // sound cleaned and evened out, the parts cross-faded
  // (scripts/build-tour-videos.mjs --map <clips>=<id> --speed <x> --clean).
  entry("01", "INTRO", "Hello", "Who I am and what this tour covers.", { duration: 41 }),
  entry("02", "INTRO", "Tech stack", "The tools I build with, and why.", { duration: 125 }),
  // Scene 4, the projects: one narrated video each (clip_scene4_<n>_<project>),
  // added as they are recorded; then the one about what is not shipped.
  // clip_scene4_<n>_<project> at 1.10x, the sound cleaned.
  entry("03", "SHIPPED", "Polaris", "A RAG assistant for BCRA banking regulations.", {
    duration: 45,
  }),
  entry("04", "SHIPPED", "Alphecca", "An LLM selection and cost calculator.", { duration: 47 }),
  entry("05", "SHIPPED", "Ethos", "A clinic booking app, full stack.", { duration: 55 }),
  entry("06", "SHIPPED", "Lynx", "Fraud and elder-exploitation detection.", { duration: 46 }),
  entry("07", "SHIPPED", "Built, not deployed yet", "Work that runs, but is not live."),
  entry("08", "FROM MARCH TO NOW", "March to June", "What I built in those months."),
  entry("09", "FROM MARCH TO NOW", "July to November", "What I built in those months."),
  entry("10", "THE SERIES", "The series, on the shelf", "The cheat-sheet series."),
  entry("11", "THE SERIES", "Thank you", "Thanks for watching."),
];

/** "Ø05"-style number (the slashed zero, as the rest of the site). */
export const videoNumber = (v: TourVideo) => `Ø${v.id}`;

/** 90 -> "1:30". */
export const videoLength = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
