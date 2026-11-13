import { useState } from 'react'
import { electives, purposes, requiredSubjects, subjects, validateGoal } from '@mystudy/shared/study-goal'
import { formatNumber, formatScore, getTimeEstimate, initialGoal, parseDecimal, weekdays } from './goal-settings.js'

function NumberField({ id, label, value, onChange, unit, error, integer }) {
  return (
    <div className="goal-field-wrap">
      <div className={'goal-field' + (error ? ' has-error' : '')}>
        <label htmlFor={id}>{label}</label>
        <div className="goal-field-value">
          <input id={id} type="text" inputMode={integer ? 'numeric' : 'decimal'}
            value={value} onChange={(event) => onChange(event.target.value)} maxLength={8}
            aria-invalid={error ? true : undefined} aria-describedby={error ? id + '-error' : undefined}
            style={{ '--value-width': Math.max(value.length, 1) + 'ch' }} />
          <span>{unit}</span>
        </div>
      </div>
      {error && <p className="goal-error" id={id + '-error'}>{error}</p>}
    </div>
  )
}

export function GoalSetup({ savedGoal, saveGoal, onSaved }) {
  const initial = savedGoal ?? initialGoal
  const [purpose, setPurpose] = useState(initial.purpose)
  const [electiveCodes, setElectives] = useState(initial.electiveCodes)
  const [scores, setScores] = useState(() => Object.fromEntries(
    Object.entries(initial.scores).map(([code, value]) => [code, formatScore(value)]),
  ))
  const [months, setMonths] = useState(String(initial.months))
  const [dailyHours, setDailyHours] = useState(formatNumber(initial.dailyMinutes / 60))
  const [days, setDays] = useState(initial.days)
  const [checked, setChecked] = useState(false)
  const [serverErrors, setServerErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const codes = [...requiredSubjects, ...electiveCodes]
  const goal = {
    purpose, electiveCodes, days,
    scores: Object.fromEntries(codes.map((code) => [code, parseDecimal(scores[code] ?? '')])),
    months: /^\d+$/.test(months.trim()) ? Number(months) : NaN,
    dailyMinutes: Math.round(parseDecimal(dailyHours) * 60),
  }
  const issues = validateGoal(goal)
  const errors = checked ? { ...serverErrors, ...issues } : {}
  const weeklyHours = issues.dailyMinutes ? null : goal.dailyMinutes * days.length / 60
  const estimate = issues.months ? null : getTimeEstimate(goal)
  const isShort = weeklyHours !== null && days.length > 0 && estimate !== null && weeklyHours < estimate
  const suggestedDailyHours = isShort ? Math.ceil(estimate / days.length * 10) / 10 : null

  function updateScore(code, value) {
    setScores((current) => ({ ...current, [code]: value }))
  }

  function toggleDay(day) {
    setDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day])
  }

  async function submit(event) {
    event.preventDefault()
    setChecked(true)
    setServerErrors({})
    setNotice('')
    if (Object.keys(issues).length) {
      const [field] = Object.keys(issues)
      document.getElementById('goal-' + field)?.focus()
      return
    }
    setSaving(true)
    try {
      const result = await saveGoal(goal)
      onSaved(result)
    } catch (error) {
      setServerErrors(error.fields ?? {})
      setNotice(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="goal-intro">
        <p>BẮT ĐẦU HÀNH TRÌNH</p>
        <h1>Thiết lập mục tiêu</h1>
        <div>Bạn đặt đích đến. MyStudy chia nhỏ thành từng ngày.</div>
      </header>
      <form className="goal-layout" noValidate method="post" onSubmit={submit} onChange={() => setServerErrors({})}>
        <div className="goal-card goal-options">
          <fieldset disabled={saving}>
            <legend>01&nbsp; Bạn ôn thi để làm gì?</legend>
            <div className="goal-purposes">
              {purposes.map(([code, label], index) => (
                <label className="goal-purpose" key={code}>
                  <input id={index === 0 ? 'goal-purpose' : undefined} type="radio" name="purpose" value={code}
                    checked={purpose === code} onChange={() => setPurpose(code)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {errors.purpose && <p className="goal-error">{errors.purpose}</p>}
          </fieldset>

          <fieldset disabled={saving}>
            <legend>02&nbsp; Môn thi &amp; điểm mục tiêu</legend>
            <p className="goal-hint">Toán và Ngữ văn là bắt buộc. Chọn thêm 2 môn tự chọn.</p>
            <div className="goal-electives">
              {electiveCodes.map((selected, index) => (
                <div className="goal-elective" key={index}>
                  <span aria-hidden="true">{subjects[selected]}</span>
                  <select id={index === 0 ? 'goal-electives' : undefined}
                    aria-label={'Môn tự chọn ' + (index + 1)} value={selected}
                    aria-invalid={errors.electives ? true : undefined}
                    aria-describedby={errors.electives ? 'elective-error' : undefined}
                    onChange={(event) => {
                      const code = event.target.value
                      setElectives((current) => current.map((entry, i) => i === index ? code : entry))
                      setScores((current) => Object.hasOwn(current, code) ? current : { ...current, [code]: '8,0' })
                    }}>
                    {electives.map((code) => <option key={code} value={code}
                      disabled={electiveCodes[1 - index] === code}>{subjects[code]}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {errors.electives && <p className="goal-error" id="elective-error">{errors.electives}</p>}
            <div className="goal-fields">
              {codes.map((code) => <NumberField key={code} id={'goal-' + code} label={subjects[code]}
                value={scores[code] ?? ''} onChange={(value) => updateScore(code, value)}
                unit="điểm" error={errors[code]} />)}
            </div>
          </fieldset>

          <fieldset disabled={saving}>
            <legend>03&nbsp; Thời gian bạn có</legend>
            <div className="goal-fields">
              <NumberField id="goal-months" label="Số tháng còn lại" value={months}
                onChange={setMonths} unit="tháng" error={errors.months} integer />
              <NumberField id="goal-dailyMinutes" label="Giờ học mỗi ngày" value={dailyHours}
                onChange={setDailyHours} unit="giờ" error={errors.dailyMinutes} />
            </div>
            <div className="goal-availability">
              <p className="goal-hint" id="goal-day-label">Ngày có thể học trong tuần</p>
              <div className="goal-days" role="group" aria-labelledby="goal-day-label"
                aria-describedby={errors.days ? 'goal-day-error' : undefined}>
                {weekdays.map(([short, label], index) => (
                  <button id={index === 0 ? 'goal-days' : undefined} key={short} type="button"
                    aria-label={label} aria-pressed={days.includes(index + 1)}
                    onClick={() => { toggleDay(index + 1); setServerErrors({}) }}>{short}</button>
                ))}
              </div>
              {errors.days && <p className="goal-error" id="goal-day-error">{errors.days}</p>}
            </div>
          </fieldset>
          <p className="goal-footnote">Có thể thay đổi mục tiêu bất cứ lúc nào.</p>
        </div>

        <aside className="goal-card goal-summary" aria-labelledby="goal-summary-title">
          <h2 id="goal-summary-title">THỜI GIAN MỖI TUẦN</h2>
          <div aria-live="polite">
            <p className="goal-total">{weeklyHours === null ? '—' : formatNumber(weeklyHours) + ' giờ'}</p>
            <p className="goal-calculation">
              {weeklyHours === null ? 'Nhập số giờ học mỗi ngày để tính.' :
                formatNumber(goal.dailyMinutes / 60) + ' giờ × ' + days.length + ' ngày học'}
            </p>
          </div>
          {isShort && <div className="goal-warning">
            <strong>Quỹ giờ còn hơi thấp</strong>
            <p>Với mục tiêu hiện tại, bạn nên dành khoảng {estimate} giờ/tuần. Hãy tăng lên {formatNumber(suggestedDailyHours)} giờ/ngày hoặc điều chỉnh điểm mục tiêu.</p>
          </div>}
          <p className="goal-summary-note">Lộ trình sẽ ưu tiên phần kiến thức cần thiết và phân bổ theo lịch rảnh của bạn.</p>
          <button className="goal-primary" type="submit" disabled={saving}>
            {saving ? 'Đang lưu và tạo lộ trình…' : 'Lưu và tạo lộ trình'}
          </button>
          {(notice || (checked && Object.keys(issues).length > 0)) &&
            <p className="goal-error goal-save-error" role="alert">{notice || 'Kiểm tra lại các trường được đánh dấu.'}</p>}
          <p className="goal-footnote">Bạn chủ động. MyStudy đồng hành.</p>
        </aside>
      </form>
    </>
  )
}
