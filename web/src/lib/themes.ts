import type { ThemeId } from '../types';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  isLocked?: boolean;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'moonlit',
    label: 'Moonlit Silvery',
    description: 'Deep focus, high contrast, night work.',
  },
  {
    id: 'sepia',
    label: 'Earthy Sepia',
    description: 'Calm, grounded, low eye strain.',
  },
  {
    id: 'warm',
    label: 'Warm Sunset',
    description: 'Cozy, reflective, winding down.',
  },
  {
    id: 'cool',
    label: 'Deep Ocean',
    description: 'Flow state, crisp and professional.',
  },
  {
    id: 'fun',
    label: 'Bright & Fun',
    description: 'High energy, pop art clarity.',
    isLocked: true,
  },
];

export function isThemeLocked(themeId: ThemeId, daysActive: number): boolean {
  if (themeId === 'fun' && daysActive < 30) return true;
  return false;
}
