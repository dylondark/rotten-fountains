export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

// Map a numeric 0-10 rating to a letter grade. This is a simple mapping and
// can be adjusted to taste.
export function numberToGrade(n: number | null | undefined): Grade | '—' {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const v = Number(n);
  if (v > 9.5) return 'A+';
  if (v > 9.0) return 'A';
  if (v > 8.5) return 'A-';
  if (v > 8.0) return 'B+';
  if (v > 7.0) return 'B';
  if (v > 6.5) return 'B-';
  if (v > 6.0) return 'C+';
  if (v > 5.0) return 'C';
  if (v > 4.0) return 'C-';
  if (v > 2.0) return 'D';
  return 'F';
}

// Map a letter grade to a representative numeric score (0-10). We send this
// numeric value to the backend which still expects a number.
export function gradeToNumber(g: Grade): number {
  switch (g) {
    case 'A+': return 10;
    case 'A': return 9.5;
    case 'A-': return 9.0;
    case 'B+': return 8.5;
    case 'B': return 8.0;
    case 'B-': return 7.0;
    case 'C+': return 6.5;
    case 'C': return 6.0;
    case 'C-': return 5.0;
    case 'D': return 3.0;
    case 'F': return 0;
    default: return 0;
  }
}

export const ALL_GRADES: Grade[] = ['A+','A','A-','B+','B','B-','C+','C','C-','D','F'];
