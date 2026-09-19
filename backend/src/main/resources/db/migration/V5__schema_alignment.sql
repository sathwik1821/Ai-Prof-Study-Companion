-- ============================================================
-- V5: Schema alignment — rename columns to match entity mappings
-- The Java entities use _json suffix for serialized JSON fields,
-- but V4 created these columns with shorter names (JSONB).
-- ============================================================

-- activity_events: payload (JSONB) -> payload_json (TEXT)
ALTER TABLE activity_events RENAME COLUMN payload TO payload_json;
ALTER TABLE activity_events ALTER COLUMN payload_json TYPE TEXT USING payload_json::TEXT;

-- messages: sources (JSONB) -> sources_json (TEXT)
ALTER TABLE messages RENAME COLUMN sources TO sources_json;
ALTER TABLE messages ALTER COLUMN sources_json TYPE TEXT USING sources_json::TEXT;

-- messages: context_used (JSONB) -> context_used_json (TEXT)
ALTER TABLE messages RENAME COLUMN context_used TO context_used_json;
ALTER TABLE messages ALTER COLUMN context_used_json TYPE TEXT USING context_used_json::TEXT;

-- quiz_questions: options (JSONB) -> options_json (TEXT)
ALTER TABLE quiz_questions RENAME COLUMN options TO options_json;
ALTER TABLE quiz_questions ALTER COLUMN options_json TYPE TEXT USING options_json::TEXT;

-- assessments: concepts_covered (JSONB) -> concepts_covered_json (TEXT)
ALTER TABLE assessments RENAME COLUMN concepts_covered TO concepts_covered_json;
ALTER TABLE assessments ALTER COLUMN concepts_covered_json TYPE TEXT USING concepts_covered_json::TEXT;

-- assessments: missing_concepts (JSONB) -> missing_concepts_json (TEXT)
ALTER TABLE assessments RENAME COLUMN missing_concepts TO missing_concepts_json;
ALTER TABLE assessments ALTER COLUMN missing_concepts_json TYPE TEXT USING missing_concepts_json::TEXT;

-- document_chunks: embedding (vector) -> embedding_json (TEXT)
-- Entity stores embeddings as serialized JSON float arrays rather than pgvector native type
ALTER TABLE document_chunks RENAME COLUMN embedding TO embedding_json;
ALTER TABLE document_chunks ALTER COLUMN embedding_json TYPE TEXT USING embedding_json::TEXT;

-- background_jobs: payload (JSONB) -> payload (TEXT, entity maps as String)
ALTER TABLE background_jobs ALTER COLUMN payload TYPE TEXT USING payload::TEXT;
