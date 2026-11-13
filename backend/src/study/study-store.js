import { requiredSubjects } from '@mystudy/shared/study-goal'
import { getVietnamDate } from '@mystudy/shared/calendar'
import { schedule } from './schedule.js'

export async function getStudyGoal(pool, profileId) {
  const { rows: [row] } = await pool.query(
    `SELECT p.id AS "planId", p.starts_on::text AS "startsOn", p.strategy,
            g.purpose, g.months_remaining AS months, g.daily_minutes AS "dailyMinutes",
            (SELECT jsonb_object_agg(subject_code, target_score) FROM goal_subjects WHERE goal_id = g.id) AS scores,
            ARRAY(SELECT subject_code FROM goal_subjects
                  WHERE goal_id = g.id AND subject_code NOT IN ('math', 'literature')
                  ORDER BY elective_order, subject_code) AS "electiveCodes",
            ARRAY(SELECT iso_weekday FROM goal_study_days WHERE goal_id = g.id ORDER BY iso_weekday) AS days
     FROM study_plans p JOIN study_goals g ON g.id = p.goal_id
     WHERE p.profile_id = $1 AND p.superseded_at IS NULL`,
    [profileId],
  )
  if (!row) return { goal: null, plan: null }
  const { planId, startsOn, strategy, ...goal } = row
  return { goal, plan: { id: planId, startsOn, strategy } }
}

export async function getStudyTasks(pool, profileId, from, to) {
  const { rows } = await pool.query(
    `SELECT t.id, t.subject_code AS "subjectCode", topics.name AS topic,
            t.scheduled_on::text AS date, t.planned_minutes AS minutes,
            t.learning_content AS content, t.completed_at IS NOT NULL AS completed
     FROM study_tasks t JOIN topics ON topics.id = t.topic_id
     WHERE t.profile_id = $1 AND t.scheduled_on BETWEEN $2 AND $3 AND t.cancelled_at IS NULL
     ORDER BY t.scheduled_on, t.position`,
    [profileId, from, to],
  )
  return rows
}

export async function getStudyOverview(pool, profileId) {
  const today = getVietnamDate()
  const [tasks, { rows: [summary] }] = await Promise.all([
    getStudyTasks(pool, profileId, today, today),
    pool.query(
      `WITH completed_days AS (
         SELECT DISTINCT (completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day
         FROM study_tasks
         WHERE profile_id = $1 AND completed_at IS NOT NULL AND cancelled_at IS NULL
       ), ranked_days AS (
         SELECT day, MAX(day) OVER () AS latest_day, ROW_NUMBER() OVER (ORDER BY day DESC) AS position
         FROM completed_days WHERE day <= $2::date
       )
       SELECT (SELECT MIN(scheduled_on)::text FROM study_tasks
               WHERE profile_id = $1 AND scheduled_on > $2::date AND cancelled_at IS NULL) AS "nextStudyDate",
              (SELECT COUNT(*)::int FROM ranked_days
               WHERE latest_day >= $2::date - 1 AND latest_day - day = position - 1) AS "streakDays"`,
      [profileId, today],
    ),
  ])
  return { today, tasks, ...summary }
}

export async function saveStudyGoal(pool, profileId, goal, requestedStrategy) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Serialize saves for this account so only one plan remains current.
    await client.query('SELECT id FROM profiles WHERE id = $1 FOR UPDATE', [profileId])
    const startsOn = getVietnamDate()
    const { rows: [previous] } = await client.query(
      'UPDATE study_plans SET superseded_at = now() WHERE profile_id = $1 AND superseded_at IS NULL RETURNING strategy',
      [profileId],
    )
    const strategy = requestedStrategy ?? previous?.strategy ?? 'exam_focused'
    await client.query(
      `UPDATE study_tasks SET cancelled_at = now()
       WHERE profile_id = $1 AND scheduled_on >= $2 AND completed_at IS NULL AND cancelled_at IS NULL`,
      [profileId, startsOn],
    )
    const { rows: [{ id: goalId }] } = await client.query(
      'INSERT INTO study_goals (profile_id, purpose, months_remaining, daily_minutes) VALUES ($1, $2, $3, $4) RETURNING id',
      [profileId, goal.purpose, goal.months, goal.dailyMinutes],
    )
    const codes = [...requiredSubjects, ...goal.electiveCodes]
    await client.query(
      `INSERT INTO goal_subjects (goal_id, subject_code, target_score, elective_order)
       SELECT $1, * FROM unnest($2::text[], $3::numeric[], $4::smallint[])`,
      [goalId, codes, codes.map((code) => goal.scores[code]), [null, null, 1, 2]],
    )
    await client.query(
      'INSERT INTO goal_study_days (goal_id, iso_weekday) SELECT $1, unnest($2::smallint[])',
      [goalId, goal.days],
    )
    const { rows: [{ id: planId }] } = await client.query(
      'INSERT INTO study_plans (profile_id, goal_id, strategy, starts_on) VALUES ($1, $2, $3, $4) RETURNING id',
      [profileId, goalId, strategy, startsOn],
    )
    const { rows: topics } = await client.query(
      'SELECT id, name, subject_code FROM topics WHERE subject_code = ANY($1) AND curriculum_order IS NOT NULL ORDER BY curriculum_order',
      [codes],
    )
    const { rows: retained } = await client.query(
      `SELECT scheduled_on::text AS date, position, planned_minutes FROM study_tasks
       WHERE profile_id = $1 AND scheduled_on >= $2 AND completed_at IS NOT NULL`,
      [profileId, startsOn],
    )
    const tasks = schedule(goal, topics, retained, startsOn, strategy)
    await client.query(
      `INSERT INTO study_tasks (plan_id, profile_id, goal_id, subject_code, topic_id,
                                scheduled_on, position, planned_minutes, learning_content)
       SELECT $1, $2, $3, code, "topicId", date, position, minutes, content
       FROM jsonb_to_recordset($4::jsonb)
       AS t(code text, "topicId" uuid, date date, position integer, minutes integer, content text)`,
      [planId, profileId, goalId, JSON.stringify(tasks)],
    )
    await client.query('COMMIT')
    return { goal: {
      purpose: goal.purpose, electiveCodes: goal.electiveCodes,
      scores: Object.fromEntries(codes.map((code) => [code, goal.scores[code]])),
      months: goal.months, dailyMinutes: goal.dailyMinutes, days: [...goal.days].sort((a, b) => a - b),
    }, plan: { id: planId, startsOn, strategy } }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function completeStudyTask(pool, profileId, taskId) {
  const { rowCount } = await pool.query(
    `UPDATE study_tasks SET completed_at = COALESCE(completed_at, now())
     WHERE id = $1 AND profile_id = $2 AND scheduled_on <= $3 AND cancelled_at IS NULL`,
    [taskId, profileId, getVietnamDate()],
  )
  return rowCount > 0
}
