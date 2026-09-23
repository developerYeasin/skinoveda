/**
 * Photo grading note
 * ------------------
 * The colour grading itself is done by `tools/grade_photos.py`, which reads the
 * raw photos from `uploads/stock/_raw/` and writes the graded versions back to
 * `uploads/stock/`. This file only documents the pipeline so it is not lost.
 *
 *   node src/db/seed-media.js      assigns photos to content
 *   python tools/grade_photos.py   re-grades every photo from _raw
 *
 * The grade is a split-tone that matches the brand reference:
 *   shadows  -> deep purple   #2A0834
 *   midtones -> orchid purple #8A3BA3
 *   highlights -> warm gold   #F0DCB4
 * plus a soft bloom, a gentle vignette and a saturation/contrast lift.
 */
module.exports = {
  grade: {
    shadow: '#2A0834',
    mid: '#8A3BA3',
    highlight: '#F0DCB4',
  },
};
