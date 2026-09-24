import { useState } from 'react'
import { BubbleSwitch } from '../components/ui/BubbleSwitch'
import { Button } from '../components/ui/Button'
import { useProgress } from '../context/ProgressContext'
import { useScene } from '../context/SceneContext'
import { useTheme } from '../context/ThemeContext'
import { levelFromXp } from '../lib/gamification'
import type { SceneChoice } from '../lib/scene'
import type { ThemeChoice } from '../lib/theme'
import { currentPlatform, shouldOfferInstall } from '../lib/install'

const GOAL_OPTIONS = [
  { value: 30, label: 'Nhẹ nhàng', hint: '30 XP · khoảng 3 phút mỗi ngày' },
  { value: 50, label: 'Vừa sức', hint: '50 XP · khoảng 5 phút mỗi ngày' },
  { value: 100, label: 'Nghiêm túc', hint: '100 XP · khoảng 10 phút mỗi ngày' },
]

const THEME_OPTIONS: Array<{ value: ThemeChoice; label: string; icon: string }> = [
  { value: 'light', label: 'Sáng', icon: '☀️' },
  { value: 'dark', label: 'Tối', icon: '🌙' },
  { value: 'system', label: 'Theo máy', icon: '🌓' },
]

const SCENE_OPTIONS: Array<{ value: SceneChoice; label: string; icon: string }> = [
  { value: 'full', label: 'Đầy đủ', icon: '🦋' },
  { value: 'still', label: 'Tĩnh', icon: '🏞️' },
  { value: 'off', label: 'Tắt', icon: '🚫' },
]

/** Màn hình Profile: tên hiển thị, mục tiêu hằng ngày, giao diện và tuỳ chọn xoá dữ liệu. */
export function Profile() {
  const { progress, updateName, updateDailyGoal, resetEverything } = useProgress()
  const { choice, setChoice } = useTheme()
  const { choice: sceneChoice, setChoice: setSceneChoice } = useScene()
  const [name, setName] = useState(progress.name)
  const [saved, setSaved] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)

  // Máy và trình duyệt không đổi giữa chừng, nên hỏi đúng một lần lúc dựng.
  const [offerInstall] = useState(() => shouldOfferInstall(currentPlatform()))

  const level = levelFromXp(progress.xp)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cá nhân</h1>

      <section className="surface flex items-center gap-4 p-5">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-2xl font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
        >
          {progress.name.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{progress.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Level {level.level} · {progress.xp} XP
          </p>
        </div>
      </section>

      {/* Hướng dẫn cài lên màn hình chính.
          Safari không tự mời cài như Chrome trên Android, nên app phải tự nhắc
          — nhưng nhắc ở đây chứ không chắn ngang lúc đang học. */}
      {offerInstall && (
        <section className="rounded-3xl bg-brand-50 p-5 ring-1 ring-brand-100 dark:bg-brand-500/15 dark:ring-brand-500/25">
          <h2 className="font-semibold text-brand-700 dark:text-brand-300">
            Cài vào màn hình chính
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Mở được như một app thật, chạy toàn màn hình và dùng được cả khi không có mạng.
          </p>
          <ol className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
            <li>1. Bấm nút Chia sẻ ở thanh dưới Safari</li>
            <li>2. Kéo xuống chọn “Thêm vào MH chính”</li>
            <li>3. Bấm “Thêm” ở góc trên bên phải</li>
          </ol>
        </section>
      )}

      {/* Tên hiển thị */}
      <section className="surface p-5">
        <label htmlFor="profile-name" className="block font-semibold text-slate-900 dark:text-slate-100">
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
            className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 dark:border-slate-700 dark:bg-slate-800"
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
          <p role="status" className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
            Đã lưu tên mới.
          </p>
        )}
      </section>

      {/* Mục tiêu hằng ngày */}
      <section className="surface p-5">
        <h2 id="goal-label" className="font-semibold text-slate-900 dark:text-slate-100">
          Mục tiêu mỗi ngày
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Đạt mục tiêu là giữ được streak. Chọn mức bạn theo nổi mỗi ngày.
        </p>
        <BubbleSwitch
          labelledBy="goal-label"
          options={GOAL_OPTIONS}
          value={progress.dailyGoal}
          onChange={updateDailyGoal}
          className="mt-4"
        />
        {/* Ba mức vừa đủ chỗ cho tên, không đủ cho phần giải thích — nên chỉ
            giải thích mức đang chọn, ngay bên dưới. Mục tiêu cũ ngoài ba mức
            này (dữ liệu lưu từ trước) thì không có dòng nào, thay vì đoán bừa. */}
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
          {GOAL_OPTIONS.find((option) => option.value === progress.dailyGoal)?.hint}
        </p>
      </section>

      {/* Giao diện */}
      <section className="surface p-5">
        <h2 id="theme-label" className="font-semibold text-slate-900 dark:text-slate-100">
          Giao diện
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Học buổi tối thì chế độ tối đỡ chói mắt hơn.
        </p>
        <BubbleSwitch
          labelledBy="theme-label"
          options={THEME_OPTIONS}
          value={choice}
          onChange={setChoice}
          className="mt-4"
        />

        {/* Nền động.
            Ba mức chứ không phải công tắc bật/tắt: máy yếu thì cảnh vẫn nên ở
            lại, chỉ là đứng yên. Hệ điều hành bật "giảm chuyển động" thì app
            tự về mức Tĩnh mà không đụng tới lựa chọn đang lưu ở đây. */}
        <h3 id="scene-label" className="mt-6 font-semibold text-slate-900 dark:text-slate-100">
          Nền động
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Khu vườn ban ngày, bầu trời sao ban đêm — nở dần theo tiến độ hôm nay.
        </p>
        <BubbleSwitch
          labelledBy="scene-label"
          options={SCENE_OPTIONS}
          value={sceneChoice}
          onChange={setSceneChoice}
          className="mt-4"
        />
      </section>

      {/* Dữ liệu */}
      <section className="surface p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Dữ liệu học</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Toàn bộ tiến độ đang được lưu trên máy bạn. Xoá đi là không lấy lại được.
        </p>
        {confirmingReset ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
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

      <p className="pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
        Chinese Learning App · bản demo Phase 1
      </p>
    </div>
  )
}
