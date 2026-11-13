// The constellations SIGNAL draws in Let's Talk (María Sol, 13 Nov), in this
// order and only these six: POLARIS (Ursa Minor), ALPHECCA (Corona Borealis),
// LYNX (Lynx), HELVETIOS (51 Pegasi, in Pegasus), LARAWAG (epsilon Scorpii,
// in Scorpius), ARCTURUS (alpha Bootis, in Bootes).
//
// Real positions, not drawn shapes:
// - Star positions (right ascension in hours, declination in degrees, J2000)
//   and visual magnitudes: the HYG Database v4.1, hygdata_v41.csv,
//   https://github.com/astronexus/HYG-Database (David Nash; CC BY-SA 4.0),
//   by Hipparcos (HIP) number.
// - The stick figures (which stars connect, in order): Stellarium's "modern"
//   sky culture, skycultures/modern/index.json,
//   https://github.com/Stellarium/stellarium, as polylines of HIP numbers.
// Lynx has no named star in its figure: its signal star is alpha Lyncis, the
// brightest. 51 Pegasi (Helvetios) is not on Pegasus's lines: it is shown as
// its own dot, the named one. Projected to 2D in lib/constellations.ts.

export interface Star {
  hip: number;
  /** Right ascension, hours. */
  ra: number;
  /** Declination, degrees. */
  dec: number;
  /** Visual magnitude (smaller is brighter). */
  mag: number;
}

export interface Constellation {
  /** The name typed after "SIGNAL: ". */
  signal: string;
  /** IAU abbreviation. */
  con: string;
  /** The named star (drawn a little larger and brighter). */
  named: number;
  stars: Star[];
  /** The stick figure: polylines of HIP numbers, in drawing order. */
  lines: number[][];
}

export const CONSTELLATIONS: readonly Constellation[] = [
  {
    signal: "POLARIS",
    con: "UMi",
    named: 11767,
    stars: [
      { hip: 11767, ra: 2.52975, dec: 89.2641, mag: 1.97 }, // Polaris
      { hip: 85822, ra: 17.53692, dec: 86.5865, mag: 4.35 }, // Yildun
      { hip: 82080, ra: 16.76616, dec: 82.0373, mag: 4.21 }, // Eps UMi
      { hip: 77055, ra: 15.7343, dec: 77.7945, mag: 4.29 }, // Zet UMi
      { hip: 79822, ra: 16.29179, dec: 75.7553, mag: 4.95 }, // Eta UMi
      { hip: 75097, ra: 15.34548, dec: 71.834, mag: 3.0 }, // Pherkad
      { hip: 72607, ra: 14.84511, dec: 74.1555, mag: 2.07 }, // Kochab
    ],
    lines: [[11767, 85822, 82080, 77055, 79822, 75097, 72607, 77055]],
  },
  {
    signal: "ALPHECCA",
    con: "CrB",
    named: 76267,
    stars: [
      { hip: 76127, ra: 15.54883, dec: 31.3591, mag: 4.14 }, // The CrB
      { hip: 75695, ra: 15.46382, dec: 29.1057, mag: 3.66 }, // Nusakan
      { hip: 76267, ra: 15.57813, dec: 26.7147, mag: 2.22 }, // Alphecca
      { hip: 76952, ra: 15.71238, dec: 26.2956, mag: 3.81 }, // Gam CrB
      { hip: 77512, ra: 15.82657, dec: 26.0684, mag: 4.59 }, // Del CrB
      { hip: 78159, ra: 15.95979, dec: 26.8779, mag: 4.14 }, // Eps CrB
      { hip: 78493, ra: 16.02405, dec: 29.8511, mag: 4.98 }, // Iot CrB
    ],
    lines: [[76127, 75695, 76267, 76952, 77512, 78159, 78493]],
  },
  {
    signal: "LYNX",
    con: "Lyn",
    named: 45860,
    stars: [
      { hip: 45860, ra: 9.35093, dec: 34.3926, mag: 3.14 }, // Alp Lyn
      { hip: 45688, ra: 9.31407, dec: 36.8026, mag: 3.82 }, // HIP 45688
      { hip: 44700, ra: 9.10882, dec: 38.4522, mag: 4.56 }, // HIP 44700
      { hip: 44248, ra: 9.01069, dec: 41.7829, mag: 3.96 }, // HIP 44248
      { hip: 41075, ra: 8.38059, dec: 43.1881, mag: 4.25 }, // Alsciaukat
      { hip: 36145, ra: 7.44524, dec: 49.2115, mag: 4.61 }, // HIP 36145
      { hip: 33449, ra: 6.95461, dec: 58.4228, mag: 4.35 }, // HIP 33449
      { hip: 30060, ra: 6.32705, dec: 59.011, mag: 4.44 }, // HIP 30060
    ],
    lines: [[45860, 45688, 44700, 44248, 41075, 36145, 33449, 30060]],
  },
  {
    signal: "HELVETIOS",
    con: "Peg",
    named: 113357,
    stars: [
      { hip: 1067, ra: 0.2206, dec: 15.1836, mag: 2.83 }, // Algenib
      { hip: 113963, ra: 23.07935, dec: 15.2053, mag: 2.49 }, // Markab
      { hip: 113881, ra: 23.0629, dec: 28.0828, mag: 2.44 }, // Scheat
      { hip: 112158, ra: 22.7167, dec: 30.2212, mag: 2.93 }, // Matar
      { hip: 109352, ra: 22.15379, dec: 33.1723, mag: 5.58 }, // Pi-1 Peg
      { hip: 112748, ra: 22.83338, dec: 24.6016, mag: 3.51 }, // Sadalbari
      { hip: 112440, ra: 22.77552, dec: 23.5657, mag: 3.97 }, // Lam Peg
      { hip: 109176, ra: 22.11685, dec: 25.3451, mag: 3.77 }, // Iot Peg
      { hip: 107354, ra: 21.74409, dec: 25.645, mag: 4.14 }, // Kap Peg
      { hip: 112447, ra: 22.77822, dec: 12.1729, mag: 4.2 }, // Xi Peg
      { hip: 112029, ra: 22.69103, dec: 10.8314, mag: 3.41 }, // Homam
      { hip: 109427, ra: 22.17, dec: 6.1979, mag: 3.52 }, // Biham
      { hip: 107315, ra: 21.73643, dec: 9.875, mag: 2.38 }, // Enif
      { hip: 677, ra: 0.13979, dec: 29.0904, mag: 2.07 }, // Alpheratz
      { hip: 113357, ra: 22.95777, dec: 20.7688, mag: 5.45 }, // Helvetios
    ],
    lines: [
      [1067, 113963],
      [113881, 112158, 109352],
      [113881, 112748, 112440, 109176, 107354],
      [113963, 112447, 112029, 109427, 107315],
      [677, 113881],
      [677, 1067],
      [113881, 113963],
    ],
  },
  {
    signal: "LARAWAG",
    con: "Sco",
    named: 82396,
    stars: [
      { hip: 85927, ra: 17.56014, dec: -37.1038, mag: 1.62 }, // Shaula
      { hip: 86670, ra: 17.70813, dec: -39.03, mag: 2.39 }, // Kap Sco
      { hip: 87073, ra: 17.79308, dec: -40.127, mag: 2.99 }, // Iot-1 Sco
      { hip: 86228, ra: 17.62198, dec: -42.9978, mag: 1.86 }, // Sargas
      { hip: 84143, ra: 17.20255, dec: -43.2392, mag: 3.32 }, // Eta Sco
      { hip: 82671, ra: 16.89992, dec: -42.362, mag: 4.7 }, // Zet-1 Sco
      { hip: 82514, ra: 16.86451, dec: -38.0474, mag: 3.0 }, // Xamidimura
      { hip: 82396, ra: 16.83608, dec: -34.2932, mag: 2.29 }, // Larawag
      { hip: 81266, ra: 16.59804, dec: -28.216, mag: 2.82 }, // Paikauhale
      { hip: 80763, ra: 16.49013, dec: -26.432, mag: 1.06 }, // Antares
      { hip: 78401, ra: 16.00556, dec: -22.6217, mag: 2.29 }, // Dschubba
      { hip: 78265, ra: 15.98086, dec: -26.1141, mag: 2.89 }, // Fang
      { hip: 78820, ra: 16.09062, dec: -19.8055, mag: 2.56 }, // Acrab
    ],
    lines: [
      [85927, 86670, 87073, 86228, 84143, 82671, 82514, 82396, 81266, 80763, 78401],
      [80763, 78265],
      [80763, 78820],
    ],
  },
  {
    signal: "ARCTURUS",
    con: "Boo",
    named: 69673,
    stars: [
      { hip: 71795, ra: 14.68582, dec: 13.7283, mag: 3.78 }, // Zet Boo
      { hip: 69673, ra: 14.26103, dec: 19.1824, mag: -0.05 }, // Arcturus
      { hip: 72105, ra: 14.74978, dec: 27.0742, mag: 2.35 }, // Izar
      { hip: 74666, ra: 15.25838, dec: 33.3148, mag: 3.46 }, // Del Boo
      { hip: 73555, ra: 15.03244, dec: 40.3906, mag: 3.49 }, // Nekkar
      { hip: 71075, ra: 14.53464, dec: 38.3083, mag: 3.04 }, // Seginus
      { hip: 71053, ra: 14.5305, dec: 30.3714, mag: 3.57 }, // Rho Boo
      { hip: 67927, ra: 13.91141, dec: 18.3977, mag: 2.68 }, // Muphrid
      { hip: 67459, ra: 13.82462, dec: 15.7979, mag: 4.05 }, // Ups Boo
    ],
    lines: [[71795, 69673, 72105, 74666, 73555, 71075, 71053, 69673, 67927, 67459]],
  },
];
