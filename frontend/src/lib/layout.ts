// Phone layout: narrow screens, plus a phone held sideways. The site is
// portrait-only (RotateLock), and switching a rotated phone to the desktop
// layout would mount the four desktop scenes, more than iOS can hold.
export const MOBILE_LAYOUT_QUERY =
  "(max-width: 767px), (hover: none) and (pointer: coarse) and (orientation: landscape) and (max-height: 500px)";
