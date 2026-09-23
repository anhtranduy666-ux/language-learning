import { NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'

const ITEMS = [
  { to: '/', label: 'Trang chủ', icon: '🏠', end: true },
  { to: '/learn', label: 'Học', icon: '📖', end: false },
  { to: '/progress', label: 'Tiến độ', icon: '📊', end: false },
  { to: '/profile', label: 'Cá nhân', icon: '👤', end: false },
]

/** Thanh điều hướng dưới màn hình — bốn mục theo đúng mục 4 của bản thiết kế. */
export function BottomNav() {
  return (
    <nav
      aria-label="Điều hướng chính"
      className="surface-nav fixed inset-x-0 bottom-0 z-20 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition',
                  isActive
                    ? 'text-brand-600 dark:text-brand-300'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
                )
              }
            >
              <span aria-hidden="true" className="text-xl leading-none">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
