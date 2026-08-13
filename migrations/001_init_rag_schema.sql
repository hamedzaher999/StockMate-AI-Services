CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature         TEXT NOT NULL UNIQUE,
    module          TEXT NOT NULL,
    requirement_ref TEXT,
    doc_type        TEXT NOT NULL DEFAULT 'procedure',
    actors          TEXT[] NOT NULL DEFAULT '{}',
    related_features TEXT[] NOT NULL DEFAULT '{}',
    tags            TEXT[] NOT NULL DEFAULT '{}',
    raw_content     TEXT NOT NULL,
    source_path     TEXT NOT NULL,
    last_updated    DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_module ON documents (module);
CREATE INDEX idx_documents_actors ON documents USING GIN (actors);
CREATE INDEX idx_documents_tags   ON documents USING GIN (tags);

CREATE TABLE chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    section_heading TEXT NOT NULL,
    section_type    TEXT NOT NULL,
    content         TEXT NOT NULL,
    chunk_index     INT NOT NULL,
    embedding       VECTOR(1024) NOT NULL,
    module          TEXT NOT NULL,
    actors          TEXT[] NOT NULL DEFAULT '{}',
    requirement_ref TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_chunks_embedding ON chunks
    USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_chunks_module ON chunks (module);
CREATE INDEX idx_chunks_actors ON chunks USING GIN (actors);
CREATE INDEX idx_chunks_section_type ON chunks (section_type);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();