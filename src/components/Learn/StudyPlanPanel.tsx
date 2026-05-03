import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'

interface Task { id: string; label: string; day: string }

const TASKS: Task[] = [
  { id: 'd1_strategy', day: 'Day 1 — Wednesday', label: 'CX Strategy — full study' },
  { id: 'd1_voc', day: 'Day 1 — Wednesday', label: 'Voice of Customer — full study' },
  { id: 'd1_drill', day: 'Day 1 — Wednesday', label: '20Q Mini Drill' },
  { id: 'd1_review', day: 'Day 1 — Wednesday', label: 'Review wrong answers' },
  { id: 'd2_design', day: 'Day 2 — Thursday', label: 'Experience Design — full study' },
  { id: 'd2_metrics', day: 'Day 2 — Thursday', label: 'Metrics & Measurement — full study' },
  { id: 'd2_culture', day: 'Day 2 — Thursday', label: 'Customer-Centric Culture — overview + flashcards' },
  { id: 'd2_mock', day: 'Day 2 — Thursday', label: 'Full 100Q timed mock exam' },
  { id: 'd2_review', day: 'Day 2 — Thursday', label: 'Review wrong answers' },
  { id: 'd3_adoption', day: 'Day 3 — Friday', label: 'Organizational Adoption — full study' },
  { id: 'd3_mock2', day: 'Day 3 — Friday', label: 'Second full 100Q timed exam' },
  { id: 'd3_weak', day: 'Day 3 — Friday', label: 'Review weak domains' },
  { id: 'd3_frameworks', day: 'Day 3 — Friday', label: 'Key frameworks quick review' },
  { id: 'exam_flash', day: 'Saturday — Exam Day', label: 'Flashcard review only (30 min max)' },
  { id: 'exam_nonew', day: 'Saturday — Exam Day', label: 'No new material' },
]

function planKey(): string {
  const userId = useAuthStore.getState().user?.id ?? 'anonymous'
  return `${userId}_plan_checks`
}

function loadChecks(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(planKey()) ?? '{}') } catch { return {} }
}

export default function StudyPlanPanel() {
  const [checks, setChecks] = useState<Record<string, boolean>>(loadChecks)

  useEffect(() => {
    localStorage.setItem(planKey(), JSON.stringify(checks))
  }, [checks])

  const days = [...new Set(TASKS.map(t => t.day))]
  const total = TASKS.length
  const done = Object.values(checks).filter(Boolean).length

  return (
    <div className="bg-ink rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-cream font-serif text-xl">3-Day Study Plan</h2>
        <span className="text-mist text-sm">{done}/{total} completed</span>
      </div>

      <div className="h-1.5 bg-navy rounded-full mb-6">
        <div className="h-1.5 bg-gold rounded-full transition-all" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      <div className="space-y-6">
        {days.map(day => (
          <div key={day}>
            <h3 className="text-gold text-sm font-semibold uppercase tracking-wider mb-3">{day}</h3>
            <div className="space-y-2">
              {TASKS.filter(t => t.day === day).map(task => (
                <label key={task.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!checks[task.id]}
                    onChange={e => setChecks(p => ({ ...p, [task.id]: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/30 bg-navy text-gold accent-gold"
                  />
                  <span className={`text-sm transition-colors ${checks[task.id] ? 'line-through text-mist/50' : 'text-mist group-hover:text-cream'}`}>
                    {task.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
