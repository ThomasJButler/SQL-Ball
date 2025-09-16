// Polyfill for ChromaDB default embeddings
// This avoids the need for the @chroma-core/default-embed package

export class DefaultEmbeddingFunction {
  public name = 'default-embedding';

  async generate(texts: string[]): Promise<number[][]> {
    // Return dummy embeddings since we're using OpenAI embeddings instead
    // This is just to satisfy ChromaDB's internal checks
    return texts.map(() => new Array(384).fill(0));
  }
}

export default DefaultEmbeddingFunction;