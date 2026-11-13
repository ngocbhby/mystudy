const metadata = `
  SELECT e.id, e.title, e.kind, e.subject_code AS "subjectCode", e.exam_year AS year,
         e.duration_minutes AS "durationMinutes", e.source_name AS source,
         e.paper_url AS "paperUrl", e.answer_guide_url AS "answerUrl",
         v.id AS "versionId", COALESCE(v.question_count, 0)::int AS "questionCount"
  FROM exams e
  LEFT JOIN LATERAL (
    SELECT v.id, (SELECT count(*) FROM exam_questions WHERE version_id = v.id) AS question_count
    FROM exam_versions v
    WHERE v.exam_id = e.id AND v.published_at <= now()
    ORDER BY v.version_number DESC LIMIT 1
  ) v ON true`

export async function listExams(pool, subject, year) {
  const [{ rows: exams }, { rows: filters }] = await Promise.all([
    pool.query(metadata + `
      WHERE ($1::text IS NULL OR e.subject_code = $1)
        AND ($2::smallint IS NULL OR e.exam_year = $2)
      ORDER BY (v.question_count > 0) DESC NULLS LAST, e.exam_year DESC NULLS LAST,
        CASE e.subject_code WHEN 'math' THEN 0 WHEN 'literature' THEN 1 ELSE 2 END, e.title, e.id`, [subject, year]),
    pool.query('SELECT DISTINCT subject_code AS "subjectCode", exam_year AS year FROM exams'),
  ])
  return {
    exams: exams.map(({ versionId, ...exam }) => exam),
    subjects: [...new Set(filters.map((row) => row.subjectCode))],
    years: [...new Set(filters.map((row) => row.year).filter(Boolean))].sort((a, b) => b - a),
  }
}

export async function getOnlineExam(pool, id) {
  const { rows: [exam] } = await pool.query(metadata + ' WHERE e.id = $1 AND v.question_count > 0', [id])
  return exam
}

export async function getQuestions(pool, versionId, includeAnswers = false) {
  const { rows } = await pool.query(`
    SELECT q.question_number AS number, q.prompt,
      (SELECT json_agg(json_build_object('number', o.option_number, 'text', o.content) ORDER BY o.option_number)
       FROM exam_options o WHERE (o.version_id, o.question_number) = (q.version_id, q.question_number)) AS options
      ${includeAnswers ? `, (SELECT correct_option_number FROM exam_answer_keys k
        WHERE (k.version_id, k.question_number) = (q.version_id, q.question_number)) AS "correctOption"` : ''}
    FROM exam_questions q WHERE q.version_id = $1 ORDER BY q.question_number`, [versionId])
  return rows
}
