import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { useProgress } from '../context/ProgressContext'
import { cn } from '../lib/cn'
import { levelFromXp } from '../lib/gamification'

const GOAL_OPTIONS = [
  { value: 30, label: 'Nhẹ nhàng', hint: '30 XP · khoảng 3 phút' },
  { value: 50, label: 'Vừa sức', hint: '50 XP · khoảng 5 phút' },
  { value: 100, label: 'Nghiêm túc', hint: '100 XP · khoảng 10 phút' },
]

/** Màn hình Profile: tên hiển thị, mục tiêu hằng ngày và tuỳ chọn xoá dữ liệu. */
export function Profile() {
  const { progress, updateName, updateDailyGoal, resetEverything } = useProgress()
  const [name, setName] = useState(progress.name)
  const [saved, setSaved] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)

  const level = levelFromXp(progress.xp)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Cá nhân</h1>

      <section className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-2xl font-bold text-brand-600"
        >
          {progress.name.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <div>
          <p className="text-lg font-bold text-slate-900">{progress.name}</p>
          <p className="text-sm text-slate-500">
            Level {level.level} · {progress.xp} XP
          </p>
        </div>
      </section>

      {/* Tên hiển thị */}
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <label htmlFor="profile-name" className="block font-semibold text-slate-900">
          Tên hiển thị
        </label>
        <div className="mt-3 flex gap-2">
          <input
            id="profile-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setSaved(false)
            }}
            className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 px-4"
          />
          <Button
            disabled={name.trim() === '' || name.trim() === progress.name}
            onClick={() => {
              updateName(name)
              setSaved(true)
            }}
          >
            Lưu
          </Button>
        </div>
        {saved && (
          <p role="status" className="mt-2 text-sm text-emerald-700">
            Đã lưu tên mới.
          </p>
        )}
      </section>

      {/* Mục tiêu hằng ngày */}
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="font-semibold text-slate-900">Mục tiêu mỗi ngày</h2>
        <p className="mt-1 text-sm text-slate-500">
          Đạt mục tiêu là giữ được streak. Chọn mức bạn theo nổi mỗi ngày.
        </p>
        <ul className="mt-4 space-y-2">
          {GOAL_OPTIONS.map((option) => {
            const active = progress.dailyGoal === option.value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => updateDailyGoal(option.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition',
                    active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <span>
                    <span className="block font-semibold text-slate-900">{option.label}</span>
                    <span className="block text-sm text-slate-500">{option.hint}</span>
                  </span>
                  {active && (
                    <span aria-hidden="true" className="text-brand-600">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Dữ liệu */}
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="font-semibold text-slate-900">Dữ liệu học</h2>
        <p className="mt-1 text-sm text-slate-500">
          Toàn bộ tiến độ đang được lưu trên máy bạn. Xoá đi là không lấy lại được.
        </p>
        {confirmingReset ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-amber-800">
              Xoá toàn bộ XP, streak và lịch sử học?
            </p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={resetEverything}>
                Xoá hết
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingReset(false)}>
                Giữ lại
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" className="mt-4" onClick={() => setConfirmingReset(true)}>
            Xoá tiến độ học
          </Button>
        )}
      </section>

      <p className="pb-2 text-center text-xs text-slate-400">
        Chinese Learning App · bản demo Phase 1
      </p>
    </div>
  )
}
