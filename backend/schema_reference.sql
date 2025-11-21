-- 1. users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT,
    email           TEXT UNIQUE NOT NULL,
    university      TEXT,
    major           TEXT,
    desired_roles   TEXT[],
    job_axis_raw    TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. life_events
CREATE TABLE life_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    age             INTEGER,
    school_year     TEXT,
    category        TEXT,
    title           TEXT,
    description     TEXT,
    context         TEXT,
    action          TEXT,
    result          TEXT,
    learned         TEXT,
    emotion         TEXT,
    impact_level    INTEGER,
    tags            TEXT[],
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. episodes
CREATE TABLE episodes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT,
    purpose         TEXT,
    situation       TEXT,
    task            TEXT,
    action          TEXT,
    result          TEXT,
    learning        TEXT,
    life_event_ids  UUID[],
    confidence      INTEGER,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. strengths
CREATE TABLE strengths (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID REFERENCES users(id) ON DELETE CASCADE,
    name                    TEXT,
    description             TEXT,
    evidence_episode_ids    UUID[],
    consistency_score       INTEGER,
    ai_generated            BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. value_axes
CREATE TABLE value_axes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID REFERENCES users(id) ON DELETE CASCADE,
    name                    TEXT,
    description             TEXT,
    priority                INTEGER,
    evidence_episode_ids    UUID[],
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. ai_insights
CREATE TABLE ai_insights (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    life_summary        TEXT,
    strengths_summary   TEXT,
    value_axes_summary  TEXT,
    risk_points         TEXT,
    growth_pattern      TEXT,
    related_event_ids   UUID[],
    version             INTEGER DEFAULT 1,
    previous_version_id UUID,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. ai_logs
CREATE TABLE ai_logs (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID REFERENCES users(id) ON DELETE CASCADE,
    request_text              TEXT,
    ai_output_text            TEXT,
    referenced_episode_ids    UUID[],
    referenced_strength_ids   UUID[],
    need_more_info            BOOLEAN DEFAULT FALSE,
    followup_questions        TEXT[],
    created_at                TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. chat_logs
CREATE TABLE chat_logs (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID REFERENCES users(id) ON DELETE CASCADE,
    user_message            TEXT,
    ai_message              TEXT,
    used_episode_ids        UUID[],
    used_insight_ids        UUID[],
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RAG
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE rag_embeddings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    source_type     TEXT,
    source_id       UUID,
    embedding       vector(1536),
    content         TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX ON rag_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
