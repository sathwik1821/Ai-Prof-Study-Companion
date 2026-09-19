-- ============================================================
-- V4: Learning entities — concepts, mastery, conversations,
--     quiz, assessment, recommendations, activity events,
--     AI usage, growth snapshots
-- ============================================================

-- Concepts (per project — auto-extracted or user-defined)
CREATE TABLE concepts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_concepts_project_id ON concepts(project_id);
CREATE UNIQUE INDEX idx_concepts_project_name ON concepts(project_id, name);

-- Concept Mastery (estimated mastery per user per concept)
CREATE TABLE concept_mastery (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concept_id       UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    mastery_score    NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    evidence_count   INT NOT NULL DEFAULT 0,
    last_assessed_at TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(concept_id, user_id)
);

CREATE INDEX idx_mastery_user_project ON concept_mastery(user_id, project_id);

-- Growth Snapshots (daily mastery history for trend charts)
CREATE TABLE growth_snapshots (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    concept_id    UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    mastery_score NUMERIC(5,2) NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, project_id, concept_id, snapshot_date)
);

CREATE INDEX idx_growth_user_project ON growth_snapshots(user_id, project_id, snapshot_date DESC);

-- Conversations (Tutor sessions)
CREATE TABLE conversations (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(500),
    message_count INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_project_user ON conversations(project_id, user_id, updated_at DESC);

-- Messages (chat history)
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,  -- USER | ASSISTANT
    content         TEXT NOT NULL,
    sources         JSONB,  -- [{materialName, pageNumber, excerpt}]
    context_used    JSONB,  -- summary of learning context injected
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- Quiz Attempts
CREATE TABLE quiz_attempts (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id           UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status               VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    total_questions      INT NOT NULL DEFAULT 5,
    completed_questions  INT NOT NULL DEFAULT 0,
    correct_count        INT NOT NULL DEFAULT 0,
    started_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at         TIMESTAMP
);

CREATE INDEX idx_quiz_attempts_user_project ON quiz_attempts(user_id, project_id, started_at DESC);

-- Quiz Questions (AI-generated per attempt)
CREATE TABLE quiz_questions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_attempt_id  UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    concept_id       UUID REFERENCES concepts(id) ON DELETE SET NULL,
    question_type    VARCHAR(20) NOT NULL,  -- MULTIPLE_CHOICE | OPEN_ENDED
    question_text    TEXT NOT NULL,
    options          JSONB,  -- [{label:"A", text:"..."}, ...]
    correct_answer   VARCHAR(500),
    difficulty       VARCHAR(10) NOT NULL,  -- EASY | MEDIUM | HARD
    explanation      TEXT,
    order_index      INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_questions_attempt ON quiz_questions(quiz_attempt_id, order_index);

-- Quiz Answers (user responses)
CREATE TABLE quiz_answers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id     UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    quiz_attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    user_answer     TEXT,
    is_correct      BOOLEAN,
    score           NUMERIC(5,2),
    ai_feedback     TEXT,
    answered_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Assessments (open-ended deep evaluations)
CREATE TABLE assessments (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt             TEXT NOT NULL,
    user_response      TEXT NOT NULL,
    score              INT,           -- 0–10
    understanding_level VARCHAR(20),  -- POOR | BASIC | GOOD | EXCELLENT
    concepts_covered   JSONB,
    missing_concepts   JSONB,
    feedback           TEXT,
    ai_model_used      VARCHAR(100),
    created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessments_user_project ON assessments(user_id, project_id, created_at DESC);

-- Recommendations (actionable next steps)
CREATE TABLE recommendations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concept_id  UUID REFERENCES concepts(id) ON DELETE SET NULL,
    type        VARCHAR(30) NOT NULL,  -- REVIEW | QUIZ | ASSESS | PRACTICE
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    priority    INT NOT NULL DEFAULT 5,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | DISMISSED | COMPLETED
    reason      TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMP
);

CREATE INDEX idx_recs_user_project ON recommendations(user_id, project_id, priority DESC, created_at DESC);

-- Activity Events (append-only event log)
CREATE TABLE activity_events (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
    event_type       VARCHAR(50) NOT NULL,
    payload          JSONB,
    idempotency_key  VARCHAR(255) UNIQUE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_user      ON activity_events(user_id, created_at DESC);
CREATE INDEX idx_events_project   ON activity_events(project_id, created_at DESC);
CREATE INDEX idx_events_type      ON activity_events(event_type, created_at DESC);

-- AI Usage / Observability Records
CREATE TABLE ai_usage_records (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id            UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id         UUID REFERENCES projects(id) ON DELETE SET NULL,
    feature            VARCHAR(50) NOT NULL,  -- TUTOR | QUIZ_GEN | ASSESSMENT | EMBEDDING | RECOMMENDATION
    model_name         VARCHAR(100) NOT NULL,
    input_tokens       INT,
    output_tokens      INT,
    latency_ms         BIGINT,
    estimated_cost_usd NUMERIC(12,8),
    status             VARCHAR(20) NOT NULL,  -- SUCCESS | FAILURE | TIMEOUT
    error_message      TEXT,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_feature  ON ai_usage_records(feature, created_at DESC);
CREATE INDEX idx_ai_usage_user     ON ai_usage_records(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_project  ON ai_usage_records(project_id, created_at DESC);
