-- ============================================================
-- V3: Materials, document chunks (RAG), background jobs
-- ============================================================

-- Materials (uploaded PDFs)
CREATE TABLE materials (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(500) NOT NULL,
    storage_path      VARCHAR(1000) NOT NULL,
    file_size_bytes   BIGINT,
    processing_status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
    processing_error  TEXT,
    page_count        INT,
    chunk_count       INT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_materials_project_id ON materials(project_id);
CREATE INDEX idx_materials_user_id    ON materials(user_id);
CREATE INDEX idx_materials_status     ON materials(processing_status);

-- Document chunks (RAG index — stores embeddings)
CREATE TABLE document_chunks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_number INT,
    chunk_text  TEXT NOT NULL,
    token_count INT,
    embedding   vector(768),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chunks_material_id ON document_chunks(material_id);
CREATE INDEX idx_chunks_project_id  ON document_chunks(project_id);
-- IVFFlat index for approximate nearest-neighbor search
-- (created after data is loaded — placeholder for now)
-- CREATE INDEX idx_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Background Jobs (PostgreSQL-backed job queue)
CREATE TABLE background_jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type        VARCHAR(50)  NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'QUEUED',
    reference_id    UUID,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
    attempt_count   INT NOT NULL DEFAULT 0,
    max_attempts    INT NOT NULL DEFAULT 3,
    payload         JSONB,
    error_message   TEXT,
    queued_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    next_retry_at   TIMESTAMP
);

CREATE INDEX idx_jobs_status        ON background_jobs(status, queued_at);
CREATE INDEX idx_jobs_reference_id  ON background_jobs(reference_id);
CREATE INDEX idx_jobs_user_id       ON background_jobs(user_id);
