import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import {
  tourVideos,
  VIDEO_GROUPS,
  videoLength,
  videoNumber,
  type TourVideo,
} from "@/data/videosData";
import { getLenis, scrollToTop } from "@/hooks/useLenis";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { closeGallery, pickVideo, useGallery } from "@/lib/gallery";
import { MOBILE_LAYOUT_QUERY } from "@/lib/layout";
import { REDUCED_MOTION_QUERY } from "@/lib/motion";
import { setGalleryOpen } from "@/lib/sceneFocus";
import { bootSweep, duckBackground, setSound, useSound } from "@/lib/sound";
import { Volume2, VolumeX } from "lucide-react";
import s from "./VideoGallery.module.css";

/** How long "NEXT: Ø06 — Title" shows between two videos of the tour, ms. */
const NEXT_MS = 3000;

const indexOf = (v: string | null) => {
  const i = tourVideos.findIndex((x) => x.id === v);
  return i < 0 ? 0 : i;
};

/**
 * The README tour (María Sol, pre-launch): a full-screen overlay in the
 * site's CRT look. Desktop: a main player and a wall of channels, 3 a row,
 * each a muted preview loop (out of sync, the projects' palette filter,
 * scanlines; only those in view, paused while the main video plays; posters
 * with reduced motion). Phones: one video per swipe, posters until played.
 * PLAY THE TOUR plays them all in order with a 3 s "NEXT" card. The URL
 * keeps it (?view=videos&v=05); X, Esc and Back close it, and closing goes
 * to the top of the page. While open: the page behind is inert and does not
 * scroll, GSAP is paused and the Spline scenes idle.
 */
export const VideoGallery = () => {
  const { open, v } = useGallery();
  if (!open) return null;
  return createPortal(<Gallery initial={indexOf(v)} />, document.body);
};

const Gallery = ({ initial }: { initial: number }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const phone = useMediaQuery(MOBILE_LAYOUT_QUERY);
  const reduced = useMediaQuery(REDUCED_MOTION_QUERY);
  const [current, setCurrent] = useState(initial);
  // Main video playing (the previews rest, the sound's background steps
  // back), and the tour running.
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    duckBackground(playing);
    return () => duckBackground(false);
  }, [playing]);
  const [tour, setTour] = useState(false);
  // "NEXT: Ø06 — Title" between two videos of the tour.
  const [nextCard, setNextCard] = useState<number | null>(null);
  // Bumped to make the current video start (a pick, the tour).
  const [playToken, setPlayToken] = useState(0);
  // SOUND here too (María Sol, pre-launch: the dock is behind the overlay).
  const sound = useSound();

  // Open: a modal dialog over an inert, still page.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (!dialog.open) dialog.showModal();
    const root = document.getElementById("root");
    const html = document.documentElement;
    const lenis = getLenis();
    lenis?.stop();
    html.style.overflow = "hidden";
    html.dataset.gallery = "open";
    setGalleryOpen(true);
    gsap.globalTimeline.pause();
    bootSweep();
    // The page behind stops painting once the overlay covers it.
    const hide = window.setTimeout(() => {
      if (root) root.style.visibility = "hidden";
    }, 300);
    return () => {
      window.clearTimeout(hide);
      if (root) root.style.visibility = "";
      html.style.overflow = "";
      delete html.dataset.gallery;
      setGalleryOpen(false);
      gsap.globalTimeline.resume();
      lenis?.start();
      if (dialog.open) dialog.close();
      // Closing lands at the top of the page.
      scrollToTop();
    };
  }, []);

  // The tour's hand-over: the NEXT card, then the next video.
  useEffect(() => {
    if (nextCard === null) return undefined;
    const t = window.setTimeout(() => {
      setCurrent(nextCard);
      pickVideo(tourVideos[nextCard]!.id);
      setNextCard(null);
      setPlayToken((n) => n + 1);
    }, NEXT_MS);
    return () => window.clearTimeout(t);
  }, [nextCard]);

  const pick = (i: number, play = true) => {
    setNextCard(null);
    setCurrent(i);
    pickVideo(tourVideos[i]!.id);
    if (play) setPlayToken((n) => n + 1);
  };
  const playTour = () => {
    setTour(true);
    pick(0);
  };
  const onEnded = () => {
    setPlaying(false);
    if (!tour) return;
    if (current + 1 < tourVideos.length) setNextCard(current + 1);
    else setTour(false);
  };

  const video = tourVideos[current]!;
  const next = nextCard === null ? null : tourVideos[nextCard]!;

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="gallery-title"
      data-testid="video-gallery"
      className={s.dialog}
      onCancel={(e) => {
        // Esc: close through the URL, like X and Back.
        e.preventDefault();
        closeGallery();
      }}
    >
      <div aria-hidden="true" className={`crt-grid ${s.grid}`} />
      <header className={s.head}>
        <h2 id="gallery-title" className={`crt-section-label ${s.label}`}>
          INDEX // README TOUR
        </h2>
        <button
          type="button"
          className={`crt-button ${s.tourBtn}`}
          onClick={playTour}
          data-testid="gallery-play-tour"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M3 2 L12 7 L3 12 Z" fill="currentColor" />
          </svg>
          PLAY THE TOUR
        </button>
        <button
          type="button"
          className={s.soundBtn}
          onClick={() => setSound(!sound)}
          aria-pressed={sound}
          aria-label={sound ? "Sound on: turn it off" : "Sound off: turn it on"}
          data-testid="gallery-sound"
        >
          {sound ? (
            <Volume2 size={16} aria-hidden="true" />
          ) : (
            <VolumeX size={16} aria-hidden="true" />
          )}
          <span className={s.soundLabel}>SOUND: {sound ? "ON" : "OFF"}</span>
        </button>
        <button
          type="button"
          className={s.close}
          onClick={closeGallery}
          aria-label="Close the video gallery"
          data-testid="gallery-close"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </header>

      {phone ? (
        <PhoneReel
          current={current}
          onCurrent={(i) => pick(i, false)}
          playToken={playToken}
          onPlaying={setPlaying}
          onEnded={onEnded}
        />
      ) : (
        <div className={s.body}>
          <section className={s.main} aria-label={`Now showing: ${video.title}`}>
            <MainPlayer
              video={video}
              playToken={playToken}
              onPlaying={setPlaying}
              onEnded={onEnded}
            />
            <div className={s.mainInfo}>
              <span className={s.num}>{videoNumber(video)}</span>
              <h3 className={s.mainTitle}>{video.title}</h3>
              <span className={s.dur}>{videoLength(video.duration)}</span>
            </div>
            <p className={s.desc}>{video.description}</p>
          </section>
          <div className={s.wall} data-testid="gallery-wall">
            {VIDEO_GROUPS.map((g) => (
              <section key={g} aria-label={g} className={s.group}>
                <h3 className={s.groupLabel}>{g}</h3>
                <ul className={s.tiles}>
                  {tourVideos.map((t, i) =>
                    t.group === g ? (
                      <li key={t.id}>
                        <Channel
                          video={t}
                          index={i}
                          active={i === current}
                          resting={playing || reduced}
                          onPick={() => pick(i)}
                        />
                      </li>
                    ) : null,
                  )}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}

      {next && (
        <div className={s.next} role="status" data-testid="gallery-next">
          NEXT: {videoNumber(next)} — {next.title}
        </div>
      )}
      <div aria-hidden="true" className={`crt-scanlines ${s.scan}`} />
    </dialog>
  );
};

/** The main player: the full video, with sound, captions when there are any. */
const MainPlayer = ({
  video,
  playToken,
  onPlaying,
  onEnded,
}: {
  video: TourVideo;
  playToken: number;
  onPlaying: (on: boolean) => void;
  onEnded: () => void;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (playToken) void ref.current?.play().catch(() => {});
  }, [playToken, video.id]);
  return (
    <div className={s.screen}>
      <video
        key={video.id}
        ref={ref}
        className={s.video}
        src={video.src}
        poster={video.poster}
        controls
        playsInline
        preload="metadata"
        onPlay={() => onPlaying(true)}
        onPause={() => onPlaying(false)}
        onEnded={onEnded}
        data-testid="gallery-main-video"
      >
        {video.captions && (
          <track kind="captions" src={video.captions} srcLang="en" label="English" default />
        )}
      </video>
    </div>
  );
};

/**
 * A channel on the wall: a small screen with its muted preview loop, each
 * starting at its own offset so the wall runs out of sync. Only while in view
 * and not resting (the main video playing, or reduced motion: the poster).
 */
const Channel = ({
  video,
  index,
  active,
  resting,
  onPick,
}: {
  video: TourVideo;
  index: number;
  active: boolean;
  resting: boolean;
  onPick: () => void;
}) => {
  const boxRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const run = inView && !resting;
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (run) void v.play().catch(() => {});
    else v.pause();
  }, [run]);
  return (
    <button
      ref={boxRef}
      type="button"
      className={s.channel}
      data-active={active}
      aria-current={active ? "true" : undefined}
      onClick={onPick}
      aria-label={`${videoNumber(video)} ${video.title}, ${videoLength(video.duration)}`}
      data-testid={`gallery-channel-${video.id}`}
    >
      <span className={s.thumb}>
        <span className={`crt-media-filter ${s.thumbInner}`}>
          <img src={video.poster} alt="" className={s.fill} />
          {/* Muted preview, from its own offset; poster-only while resting
              and never loaded before it is first in view. */}
          {(inView || run) && !resting && (
            <video
              ref={ref}
              className={s.fill}
              src={video.preview}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              tabIndex={-1}
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d) && d > 0) e.currentTarget.currentTime = (index * 1.9) % d;
              }}
            />
          )}
        </span>
        <span aria-hidden="true" className="crt-scanlines crt-scanlines--media absolute inset-0" />
      </span>
      <span className={s.channelInfo}>
        <span className={s.num}>{videoNumber(video)}</span>
        <span className={s.channelTitle}>{video.title}</span>
        <span className={s.dur}>{videoLength(video.duration)}</span>
      </span>
    </button>
  );
};

/** Scroll the reel to slide i (set, not scrollIntoView: idempotent). */
const showSlide = (list: HTMLElement | null, i: number) => {
  const slide = list?.children[i] as HTMLElement | undefined;
  if (list && slide) list.scrollTop = slide.offsetTop;
};

/**
 * Phones: one video per swipe (scroll snap), its poster until played. The
 * slide on screen is the current one (and goes into the URL).
 */
const PhoneReel = ({
  current,
  onCurrent,
  playToken,
  onPlaying,
  onEnded,
}: {
  current: number;
  onCurrent: (i: number) => void;
  playToken: number;
  onPlaying: (on: boolean) => void;
  onEnded: () => void;
}) => {
  const listRef = useRef<HTMLUListElement>(null);
  const [started, setStarted] = useState<number | null>(null);
  // A pick or the tour: that slide plays (set while rendering, React's way
  // to follow a prop) and comes into view.
  const [seenToken, setSeenToken] = useState(playToken);
  if (playToken !== seenToken) {
    setSeenToken(playToken);
    setStarted(current);
  }
  useEffect(() => {
    if (playToken) showSlide(listRef.current, current);
    // Only on a new pick, not on every swipe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playToken]);
  // The slide on screen becomes the current one.
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) onCurrent(Number((e.target as HTMLElement).dataset.index));
      },
      { root: list, threshold: 0.6 },
    );
    Array.from(list.children).forEach((c) => io.observe(c));
    return () => io.disconnect();
    // onCurrent changes every render; the slides do not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Opened on a video (?v=): start there, once the dialog's layout has
  // settled (set earlier, the snap moved it on by as much again).
  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => showSlide(listRef.current, current));
    });
    return () => cancelAnimationFrame(raf);
    // Once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <ul ref={listRef} className={s.reel} data-testid="gallery-reel">
      {tourVideos.map((v, i) => (
        <li key={v.id} className={s.slide} data-index={i}>
          <span className={s.slideGroup}>{v.group}</span>
          <div className={s.screen}>
            {started === i ? (
              <PhoneVideo video={v} onPlaying={onPlaying} onEnded={onEnded} />
            ) : (
              <button
                type="button"
                className={s.poster}
                onClick={() => setStarted(i)}
                aria-label={`Play ${videoNumber(v)} ${v.title}`}
                data-testid={`gallery-slide-${v.id}`}
              >
                <img src={v.poster} alt="" className={`crt-media-filter ${s.fill}`} />
                <span aria-hidden="true" className={s.playMark}>
                  <svg width="40" height="40" viewBox="0 0 44 44">
                    <path
                      d="M14 10 L34 22 L14 34 Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
              </button>
            )}
          </div>
          <div className={s.mainInfo}>
            <span className={s.num}>{videoNumber(v)}</span>
            <h3 className={s.mainTitle}>{v.title}</h3>
            <span className={s.dur}>{videoLength(v.duration)}</span>
          </div>
          <p className={s.desc}>{v.description}</p>
        </li>
      ))}
    </ul>
  );
};

const PhoneVideo = ({
  video,
  onPlaying,
  onEnded,
}: {
  video: TourVideo;
  onPlaying: (on: boolean) => void;
  onEnded: () => void;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    void ref.current?.play().catch(() => {});
  }, []);
  return (
    <video
      ref={ref}
      className={s.video}
      src={video.src}
      poster={video.poster}
      controls
      playsInline
      preload="metadata"
      onPlay={() => onPlaying(true)}
      onPause={() => onPlaying(false)}
      onEnded={onEnded}
    >
      {video.captions && (
        <track kind="captions" src={video.captions} srcLang="en" label="English" default />
      )}
    </video>
  );
};
