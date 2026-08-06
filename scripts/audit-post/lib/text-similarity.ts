/**
 * Local, dependency-free text similarity utilities for the post-corrections
 * audit. No network calls, no AI APIs — everything here is plain string
 * processing (normalization, n-grams, Jaccard, TF-IDF cosine).
 */

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[0-9]+/g, "#")
    .replace(/[^a-z#\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((token) => token.length > 1);
}

export function ngrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return tokens.length ? [tokens.join("_")] : [];
  const grams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i += 1) grams.push(tokens.slice(i, i + n).join("_"));
  return grams;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

export interface Document {
  id: string;
  text: string;
}

export interface TfidfIndex {
  ids: string[];
  vectors: Map<string, number>[];
  norms: number[];
}

/** Bag-of-words TF-IDF over unigrams+bigrams, no external dependency. */
export function buildTfidf(documents: Document[]): TfidfIndex {
  const tokenSets = documents.map((doc) => {
    const tokens = tokenize(doc.text);
    return [...tokens, ...ngrams(tokens, 2)];
  });
  const documentFrequency = new Map<string, number>();
  for (const tokens of tokenSets) {
    for (const term of new Set(tokens)) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }
  const totalDocs = documents.length;
  const vectors = tokenSets.map((tokens) => {
    const termFrequency = new Map<string, number>();
    for (const term of tokens) termFrequency.set(term, (termFrequency.get(term) ?? 0) + 1);
    const vector = new Map<string, number>();
    for (const [term, tf] of termFrequency) {
      const df = documentFrequency.get(term) ?? 1;
      const idf = Math.log((1 + totalDocs) / (1 + df)) + 1;
      vector.set(term, tf * idf);
    }
    return vector;
  });
  const norms = vectors.map((vector) =>
    Math.sqrt([...vector.values()].reduce((sum, weight) => sum + weight * weight, 0)),
  );
  return { ids: documents.map((doc) => doc.id), vectors, norms };
}

export function cosineSimilarity(index: TfidfIndex, i: number, j: number): number {
  const vecA = index.vectors[i]!;
  const vecB = index.vectors[j]!;
  const normA = index.norms[i]!;
  const normB = index.norms[j]!;
  if (normA === 0 || normB === 0) return 0;
  const [smaller, larger] = vecA.size <= vecB.size ? [vecA, vecB] : [vecB, vecA];
  let dot = 0;
  for (const [term, weight] of smaller) {
    const other = larger.get(term);
    if (other !== undefined) dot += weight * other;
  }
  return dot / (normA * normB);
}

/**
 * Greedy connected-components clustering: two documents are linked if their
 * cosine similarity (TF-IDF) is >= threshold. Returns clusters of size >= 2
 * sorted by size descending. O(n^2) — fine for the few hundred docs here.
 */
export function clusterBySimilarity(
  documents: Document[],
  threshold: number,
): { clusters: string[][]; pairSimilarities: Array<{ a: string; b: string; similarity: number }> } {
  const index = buildTfidf(documents);
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    let root = id;
    while (parent.get(root) && parent.get(root) !== root) root = parent.get(root)!;
    return root;
  };
  for (const doc of documents) parent.set(doc.id, doc.id);
  const union = (a: string, b: string) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootA, rootB);
  };

  const pairSimilarities: Array<{ a: string; b: string; similarity: number }> = [];
  for (let i = 0; i < documents.length; i += 1) {
    for (let j = i + 1; j < documents.length; j += 1) {
      const similarity = cosineSimilarity(index, i, j);
      if (similarity >= threshold) {
        pairSimilarities.push({ a: documents[i]!.id, b: documents[j]!.id, similarity });
        union(documents[i]!.id, documents[j]!.id);
      }
    }
  }

  const groups = new Map<string, string[]>();
  for (const doc of documents) {
    const root = find(doc.id);
    groups.set(root, [...(groups.get(root) ?? []), doc.id]);
  }
  const clusters = [...groups.values()]
    .filter((group) => group.length >= 2)
    .sort((a, b) => b.length - a.length);
  pairSimilarities.sort((a, b) => b.similarity - a.similarity);
  return { clusters, pairSimilarities };
}

export function exactAndNormalizedCounts(texts: string[]): {
  exactUnique: number;
  normalizedUnique: number;
  total: number;
} {
  const exact = new Set(texts);
  const normalized = new Set(texts.map(normalize));
  return { exactUnique: exact.size, normalizedUnique: normalized.size, total: texts.length };
}
