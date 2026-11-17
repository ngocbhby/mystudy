CREATE TABLE IF NOT EXISTS uploaded_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    filename text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint NOT NULL,
    data bytea NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uploaded_documents_created_at_idx ON uploaded_documents (created_at);
