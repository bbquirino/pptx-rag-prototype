CREATE TABLE documents (
  id uuid PRIMARY KEY,
  filename text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  chunk_count int,
  file_size_kb float,
  tags text[],
  uploader text,
  status text
);

CREATE TABLE chunks (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES documents(id),
  content text,
  embedding vector(1536)
);

CREATE INDEX ON chunks USING ivfflat (embedding vector_cosine_ops);
