export interface DocRecord {
  url: string;
  title: string;
  headings: string[];
  content: string;
  codeSamples: string[];
  metadata: {
    depth: number;
    discoveredFrom?: string | null;
    hash: string;
  };
  collectedAt: string;
}

export interface DocCacheFile {
  version: string;
  lastUpdated: string;
  records: DocRecord[];
}

export interface DocSearchResult {
  url: string;
  title: string;
  snippet: string;
  score: number;
  headings: string[];
}

export interface FetchDocResult {
  record: DocRecord;
  links: string[];
}
