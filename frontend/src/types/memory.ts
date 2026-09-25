export interface MemorySearchResultItem {
  chunk_id: string;
  title: string;
  content: string;
  section: string;
  doc_type: string;
  skills: string[];
  score: number;
  source_id?: string;
  created_at?: string;
}

export interface MemorySearchResponse {
  query: string;
  total_found: number;
  results: MemorySearchResultItem[];
}

export interface MemorySearchRequest {
  query: string;
  doc_types?: string[];
  top_k?: number;
  score_threshold?: number;
}

export interface CandidateNoteCreate {
  title: string;
  content: string;
  tags: string[];
}

export interface CandidateNoteResponse {
  chunk_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}

export interface MemoryStatsResponse {
  user_id: string;
  total_chunks: number;
  doc_type_breakdown: Record<string, number>;
  collection_name: string;
  status: string;
}

export interface MemorySyncResponse {
  success: boolean;
  message: string;
  chunks_indexed: number;
  profile_chunks: number;
  resume_chunks: number;
}
