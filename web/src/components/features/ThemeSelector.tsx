import { useMemo } from 'react';

import { THEMES, isThemeLocked } from '../../lib/themes';
import { useUserStore } from '../../stores/user.store';

export function ThemeSelector() {
  const themeId = useUserStore((s) => s.themeId);
  const daysActive = useUserStore((s) => s.stats.daysActive);
  const setThemeId = useUserStore((s) => s.setThemeId);

  const themeItems = useMemo(() => {
    return THEMES.map((theme) => ({
      ...theme,
      locked: theme.isLocked ? isThemeLocked(theme.id, daysActive) : false,
    }));
  }, [daysActive]);

  return (
    <div className="rounded border border-border bg-surface p-4 space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-ink">Theme Realms</h2>
        <p className="text-sm text-ink opacity-70">
          Unlock Bright & Fun after 30 active days. Days active: {daysActive}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {themeItems.map((theme) => {
          const isSelected = theme.id === themeId;
          return (
            <button
              key={theme.id}
              type="button"
              className={`rounded border px-3 py-2 text-left text-sm ${
                isSelected
                  ? 'border-accent text-ink'
                  : 'border-border text-ink opacity-80'
              } ${theme.locked ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (theme.locked) return;
                setThemeId(theme.id);
              }}
              disabled={theme.locked}
            >
              <div className="font-medium">{theme.label}</div>
              <div className="text-xs text-ink opacity-70">{theme.description}</div>
              {theme.locked && (
                <div className="text-xs text-ink opacity-70 mt-1">Locked</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
