/* ==========================================================================
   Chart palette — validated, not eyeballed.

   The brand accent #F2B759 stays exactly as it is for UI chrome (sidebar,
   buttons, focus rings). It is NOT usable as a chart fill on a white panel:
   measured L 0.816 and 1.75:1 contrast, which fails the lightness band and
   the 3:1 floor. So charts use darker steps of the same hue families.

   Department palette #B8841E / #2E74BC / #8C4A28 passes all six checks:
     lightness band PASS · chroma floor PASS · contrast PASS
     CVD separation worst adjacent ΔE 21.6 (deutan) · normal ΔE 23.8

   Baseline vs optimized deliberately pairs the amber against a neutral gray.
   Gray fails the chroma floor by design — it is a reference series, not a
   categorical identity, which is the standard baseline idiom. Separation is
   ΔE 22.4 normal / 19.7 protan and both series carry direct value labels
   plus a legend, so identity never rests on colour alone.
   ========================================================================== */

export const chart = {
  /* Two-series planning comparison */
  baseline: '#55606E',
  optimized: '#B8841E',

  /* Departmental categorical — fixed order, never cycled */
  departments: {
    Engineering: '#B8841E',
    'S&T': '#2E74BC',
    TRD: '#8C4A28',
  },

  /* Structural, recessive */
  grid: '#E5E0D5',
  axis: '#8C867D',
  ink: '#252525',
  surface: '#FFFFFF',
  possession: '#B8841E',
  movement: '#252525',
  slack: '#D6D1C4',
}

export const departmentOrder = ['Engineering', 'S&T', 'TRD']

/** Colour for a department, falling back to the neutral reference. */
export const departmentColor = (name) =>
  chart.departments[name] ?? chart.baseline
