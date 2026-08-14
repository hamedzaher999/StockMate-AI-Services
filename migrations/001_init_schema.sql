
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    feature            text NOT NULL UNIQUE,       
    module             text NOT NULL,               
    doc_type           text NOT NULL,               
    platform           text,                        
    routes             text[] DEFAULT '{}',         
    requires_permission text,                       
    requirement_ref    text,
    actors             text[] DEFAULT '{}',
    related_features   text[] DEFAULT '{}',          
    related_capability text,                        
    related_ui_flows   text[] DEFAULT '{}',         
    related_glossary   text[] DEFAULT '{}',          
    tags               text[] DEFAULT '{}',
    raw_content        text NOT NULL,
    source_path        text NOT NULL,
    last_updated       date,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chunks (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id        uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    section_heading    text NOT NULL,
    section_type       text NOT NULL,             
    content            text NOT NULL,
    chunk_index        int NOT NULL,

    module             text NOT NULL,
    doc_type           text NOT NULL,
    platform           text,
    routes             text[] DEFAULT '{}',
    requires_permission text,
    actors             text[] DEFAULT '{}',
    requirement_ref    text,

    embedding          vector(1024) NOT NULL,       
    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx
    ON chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS chunks_module_idx ON chunks (module);
CREATE INDEX IF NOT EXISTS chunks_doc_type_idx ON chunks (doc_type);
CREATE INDEX IF NOT EXISTS chunks_platform_idx ON chunks (platform);
CREATE INDEX IF NOT EXISTS chunks_actors_gin_idx ON chunks USING gin (actors);
CREATE INDEX IF NOT EXISTS chunks_routes_gin_idx ON chunks USING gin (routes);
CREATE INDEX IF NOT EXISTS chunks_section_type_idx ON chunks (section_type);

CREATE INDEX IF NOT EXISTS documents_feature_idx ON documents (feature);
CREATE INDEX IF NOT EXISTS documents_module_idx ON documents (module);
CREATE INDEX IF NOT EXISTS documents_doc_type_idx ON documents (doc_type);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_set_updated_at ON documents;
CREATE TRIGGER documents_set_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
