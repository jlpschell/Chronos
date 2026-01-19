// ============================================================================
// AppLayout Component
// Main application shell with navigation
// ============================================================================

import { NavLink, Outlet } from 'react-router-dom';
import { ThemeSelector } from '../features';

const navItems = [
  { to: '/timeline', label: 'Timeline', icon: '📅' },
  { to: '/voice', label: 'Voice', icon: '🎙️' },
  { to: '/calendar', label: 'Calendar', icon: '🔗' },
  { to: '/summary', label: 'Summary', icon: '📝' },
  { to: '/ralph', label: 'Ralph', icon: '🧠' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-semibold">Chronos</h1>
              <p className="text-xs text-ink/60">Time GPS</p>
            </div>

            <nav className="flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'hover:bg-ink/5'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <ThemeSelector />
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
