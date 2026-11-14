
CREATE TABLE profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid text NOT NULL UNIQUE CHECK (length(firebase_uid) BETWEEN 1 AND 128),
    display_name text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subjects (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE
);

INSERT INTO subjects (code, name) VALUES
    ('math', 'Toán'),
    ('literature', 'Ngữ văn');

CREATE TABLE topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code text NOT NULL REFERENCES subjects (code),
    name text NOT NULL,
    UNIQUE (subject_code, name),
    UNIQUE (id, subject_code)
);

CREATE TABLE study_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES profiles (id),
    purpose text NOT NULL CHECK (purpose IN ('graduation', 'university_admission')),
    months_remaining integer NOT NULL CHECK (months_remaining > 0),
    daily_minutes integer NOT NULL CHECK (daily_minutes > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (id, profile_id)
);

CREATE TABLE goal_subjects (
    goal_id uuid NOT NULL REFERENCES study_goals (id),
    subject_code text NOT NULL REFERENCES subjects (code),
    target_score numeric NOT NULL CHECK (target_score BETWEEN 0 AND 10),
    PRIMARY KEY (goal_id, subject_code)
);

CREATE TABLE goal_study_days (
    goal_id uuid NOT NULL REFERENCES study_goals (id),
    iso_weekday smallint NOT NULL CHECK (iso_weekday BETWEEN 1 AND 7),
    PRIMARY KEY (goal_id, iso_weekday)
);

CREATE TABLE study_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES profiles (id),
    goal_id uuid NOT NULL,
    strategy text NOT NULL CHECK (strategy IN ('exam_focused', 'foundation_first')),
    starts_on date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    superseded_at timestamptz,
    FOREIGN KEY (goal_id, profile_id) REFERENCES study_goals (id, profile_id),
    UNIQUE (id, profile_id, goal_id)
);

CREATE UNIQUE INDEX study_plans_one_current_per_profile
    ON study_plans (profile_id) WHERE superseded_at IS NULL;

CREATE TABLE study_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    goal_id uuid NOT NULL,
    subject_code text NOT NULL,
    topic_id uuid NOT NULL,
    scheduled_on date NOT NULL,
    iso_weekday smallint GENERATED ALWAYS AS (extract(isodow FROM scheduled_on)::smallint) STORED,
    position integer NOT NULL CHECK (position > 0),
    planned_minutes integer NOT NULL CHECK (planned_minutes > 0),
    learning_content text NOT NULL,
    completed_at timestamptz,
    cancelled_at timestamptz,
    FOREIGN KEY (plan_id, profile_id, goal_id) REFERENCES study_plans (id, profile_id, goal_id),
    FOREIGN KEY (goal_id, subject_code) REFERENCES goal_subjects (goal_id, subject_code),
    FOREIGN KEY (goal_id, iso_weekday) REFERENCES goal_study_days (goal_id, iso_weekday),
    FOREIGN KEY (topic_id, subject_code) REFERENCES topics (id, subject_code),
    CHECK (completed_at IS NULL OR cancelled_at IS NULL)
);

CREATE UNIQUE INDEX study_tasks_visible_schedule
    ON study_tasks (profile_id, scheduled_on, position) WHERE cancelled_at IS NULL;

CREATE TABLE exams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code text NOT NULL REFERENCES subjects (code),
    title text NOT NULL,
    kind text NOT NULL CHECK (kind IN ('past_paper', 'mystudy_practice')),
    exam_year smallint CHECK (exam_year > 0),
    duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
    source_name text NOT NULL,
    paper_url text NOT NULL,
    answer_guide_url text NOT NULL,
    CHECK (kind <> 'past_paper' OR exam_year IS NOT NULL)
);

CREATE INDEX exams_by_subject_year ON exams (subject_code, exam_year);
CREATE INDEX exams_by_year ON exams (exam_year);

CREATE TABLE worked_examples (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code text NOT NULL,
    topic_id uuid NOT NULL,
    title text NOT NULL,
    exercise_type text NOT NULL,
    prompt text NOT NULL,
    model_solution text NOT NULL,
    solution_note text NOT NULL,
    source_name text NOT NULL,
    FOREIGN KEY (topic_id, subject_code) REFERENCES topics (id, subject_code)
);

CREATE INDEX worked_examples_by_subject_topic ON worked_examples (subject_code, topic_id);

CREATE TABLE exam_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES exams (id),
    version_number integer NOT NULL CHECK (version_number > 0),
    published_at timestamptz,
    UNIQUE (exam_id, version_number)
);

CREATE TABLE exam_questions (
    version_id uuid NOT NULL REFERENCES exam_versions (id),
    question_number integer NOT NULL CHECK (question_number > 0),
    prompt text NOT NULL,
    PRIMARY KEY (version_id, question_number)
);

CREATE TABLE exam_options (
    version_id uuid NOT NULL,
    question_number integer NOT NULL,
    option_number integer NOT NULL CHECK (option_number > 0),
    content text NOT NULL,
    PRIMARY KEY (version_id, question_number, option_number),
    FOREIGN KEY (version_id, question_number) REFERENCES exam_questions (version_id, question_number)
);

CREATE TABLE exam_answer_keys (
    version_id uuid NOT NULL,
    question_number integer NOT NULL,
    correct_option_number integer NOT NULL,
    PRIMARY KEY (version_id, question_number),
    FOREIGN KEY (version_id, question_number, correct_option_number)
        REFERENCES exam_options (version_id, question_number, option_number)
);

CREATE TABLE exam_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id uuid NOT NULL REFERENCES exam_versions (id),
    profile_id uuid REFERENCES profiles (id),
    guest_token_hash bytea,
    started_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    question_count integer NOT NULL CHECK (question_count > 0),
    submitted_at timestamptz,
    submission_reason text CHECK (submission_reason IN ('manual', 'time_expired')),
    correct_count integer CHECK (correct_count >= 0),
    incorrect_count integer CHECK (incorrect_count >= 0),
    blank_count integer CHECK (blank_count >= 0),
    UNIQUE (id, version_id),
    CHECK ((profile_id IS NULL) <> (guest_token_hash IS NULL)),
    CHECK (guest_token_hash IS NULL OR octet_length(guest_token_hash) = 32),
    CHECK (expires_at > started_at),
    CHECK (
        (submitted_at IS NULL AND submission_reason IS NULL
            AND correct_count IS NULL AND incorrect_count IS NULL AND blank_count IS NULL)
        OR
        (submitted_at IS NOT NULL AND submitted_at >= started_at AND submission_reason IS NOT NULL
            AND correct_count IS NOT NULL AND incorrect_count IS NOT NULL AND blank_count IS NOT NULL
            AND correct_count + incorrect_count + blank_count = question_count
            AND ((submission_reason = 'manual' AND submitted_at < expires_at)
                OR (submission_reason = 'time_expired' AND submitted_at >= expires_at)))
    )
);

CREATE INDEX exam_attempts_by_profile ON exam_attempts (profile_id, started_at DESC);
CREATE INDEX exam_attempts_pending_expiration ON exam_attempts (expires_at) WHERE submitted_at IS NULL;

CREATE TABLE exam_attempt_answers (
    attempt_id uuid NOT NULL,
    version_id uuid NOT NULL,
    question_number integer NOT NULL,
    option_number integer NOT NULL,
    PRIMARY KEY (attempt_id, question_number),
    FOREIGN KEY (attempt_id, version_id) REFERENCES exam_attempts (id, version_id),
    FOREIGN KEY (version_id, question_number, option_number)
        REFERENCES exam_options (version_id, question_number, option_number)
);

