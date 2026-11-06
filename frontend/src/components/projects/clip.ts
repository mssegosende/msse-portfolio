/** Start a clip at its project's offset (startAt), wrapped into its length. */
export const seekToStart = (v: HTMLVideoElement, startAt = 0) => {
  if (startAt > 0 && Number.isFinite(v.duration) && v.duration > 0)
    v.currentTime = startAt % v.duration;
};
