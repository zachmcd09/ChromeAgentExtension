/**
 * ./scripts/vectorStore.js
 * 
 * This module now uses moo instead of tiktoken. We define a custom moo lexer to tokenize
 * the DOM-like content, focusing on isolating links and the text around them into their own chunks.
 * 
 * Steps:
 * 1. Tokenize with moo.
 * 2. Identify links ([LINK]...[/LINK]) and their associated content ([CONTENT]...[/CONTENT]).
 * 3. If text is unrelated to links, chunk it into maxTokensPerChunk-character segments.
 * 4. Return these chunks. The embeddings are still done later by the vector store.
 */

import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import moo from 'moo';

class CustomVectorStore {
    constructor() {
        // Map to store vector stores for different URLs
        this.vectorStores = new Map();
        // Flag to indicate if the vector store is initialized
        this.initialized = false;
        // Maximum characters per chunk
        this.maxTokensPerChunk = 500;
        // Debug flag
        this.debug = true;
        // Promise for initialization
        this.initializationPromise = null;
        // Maximum number of retries for API calls
        this.maxRetries = 3;
        // Delay between retries in milliseconds
        this.retryDelay = 2000;
        // Base URL for LM Studio API
        this.baseUrl = "http://127.0.0.1:1234";
        // Model to use for embeddings
        this.model = "text-embedding-all-minilm-l6-v2-embedding";
        // Map to store pending requests
        this.pendingRequests = new Map();
        // Map to store document metadata
        this.documentMap = new Map();

        // Embeddings object with methods for generating embeddings
        this.embeddings = {
            // Method to generate embeddings for multiple texts
            embedDocuments: async (texts) => {
                return await this.retryOperation(async () => {
                    // Batch size for processing texts
                    const batchSize = 5;
                    const results = [];
                    // Loop through texts in batches
                    for (let i = 0; i < texts.length; i += batchSize) {
                        const batch = texts.slice(i, i + batchSize);
                        // Abort controller for fetch requests
                        const controller = new AbortController();
                        const requestId = Date.now().toString() + i;
                        this.pendingRequests.set(requestId, controller);

                        try {
                            // Fetch embeddings from LM Studio API
                            const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ model: this.model, input: batch }),
                                signal: controller.signal
                            });

                            if (!response.ok) {
                                throw new Error(`Failed to generate embeddings: ${response.status}`);
                            }

                            const data = await response.json();
                            // Extract embeddings from response
                            results.push(...data.data.map(item => item.embedding));

                            // Send progress update to extension
                            const progress = Math.round((i + batch.length) / texts.length * 100);
                            chrome.runtime.sendMessage({
                                action: "embeddingProgress",
                                progress: progress,
                                message: `Processing embeddings: ${progress}%`
                            });
                        } finally {
                            // Remove request from pending requests
                            this.pendingRequests.delete(requestId);
                        }

                        // Add a small delay between batches
                        if (i + batchSize < texts.length) {
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }

                    // Send completion message to extension
                    chrome.runtime.sendMessage({
                        action: "embeddingProgress",
                        progress: 100,
                        message: "Embedding processing complete",
                        hide: true
                    });

                    return results;
                });
            },
            // Method to generate embedding for a single query
            embedQuery: async (text) => {
                return await this.retryOperation(async () => {
                    // Abort controller for fetch request
                    const controller = new AbortController();
                    const requestId = Date.now().toString();
                    this.pendingRequests.set(requestId, controller);

                    try {
                        // Fetch embedding from LM Studio API
                        const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ model: this.model, input: text }),
                            signal: controller.signal
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to generate embedding: ${response.status}`);
                        }

                        const data = await response.json();
                        // Extract embedding from response
                        return data.data[0].embedding;
                    } finally {
                        // Remove request from pending requests
                        this.pendingRequests.delete(requestId);
                    }
                });
            }
        };
    }

    // Method to retry an operation with exponential backoff
    async retryOperation(operation, maxRetries = this.maxRetries) {
        let lastError = null;
        // Loop through retries
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Attempt the operation
                return await operation();
            } catch (error) {
                // Store the error
                lastError = error;
                console.warn(`Attempt ${attempt + 1} failed:`, error);
                // Wait before retrying
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
                }
            }
        }
        // Throw the last error if all retries failed
        throw lastError;
    }

    // Method to check if the LM Studio server is running
    async checkServerStatus() {
        try {
            // Fetch models from LM Studio API
            const response = await fetch(`${this.baseUrl}/v1/models`, { method: 'GET' });
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const data = await response.json();
            // Check if models are available
            if (!data.data || !data.data.length) {
                throw new Error('No models available from LMStudio');
            }
            return true;
        } catch (error) {
            console.error('LMStudio server is not running or not accessible:', error);
            return false;
        }
    }

    // Method to initialize the vector store
    async initialize() {
        // If already initialized, return
        if (this.initialized) return;
        // If initialization is in progress, return the promise
        if (this.initializationPromise) return this.initializationPromise;

        // Create a promise for initialization
        this.initializationPromise = (async () => {
            // Check if the server is running
            const serverRunning = await this.checkServerStatus();
            if (!serverRunning) {
                throw new Error('LMStudio server is not running');
            }

            // Fetch models from LM Studio API
            const response = await fetch(`${this.baseUrl}/v1/models`);
            if (!response.ok) {
                throw new Error(`Failed to connect to LMStudio: ${response.status}`);
            }

            const data = await response.json();
            // Check if models are available
            if (!data.data || !data.data.length) {
                throw new Error('No models available from LMStudio');
            }

            // Check if the specified model is available
            const modelAvailable = data.data.some(m => m.id === this.model);
            if (!modelAvailable) {
                console.warn(`Model ${this.model} not found, using first available model`);
                this.model = data.data[0].id;
            }

            // Set initialized flag to true
            this.initialized = true;
            console.log('Vector store initialized successfully');
        })();

        return this.initializationPromise;
    }

    // Method to get or create a vector store for a given URL
    async getOrCreateVectorStore(url) {
        // Initialize the vector store
        await this.initialize();
        // Get the vector store from the map
        let store = this.vectorStores.get(url);
        // If the store doesn't exist, create a new one
        if (!store) {
            store = new MemoryVectorStore(this.embeddings);
            this.vectorStores.set(url, store);
        }
        return store;
    }

    // Define a moo lexer to tokenize the formatted content
    createLexer() {
        return moo.compile({
            // Match start of link format tag
            linkFormatStart: { match: /\[LINK\]/, lineBreaks: false },
            // Match end of link format tag
            linkFormatEnd: { match: /\[\/LINK\]/, lineBreaks: false },
            // Match start of content format tag
            contentFormatStart: { match: /\[CONTENT\]/, lineBreaks: false },
            // Match end of content format tag
            contentFormatEnd: { match: /\[\/CONTENT\]/, lineBreaks: false },
            // Match any text that is not a tag
            text:       { match: /[^<]+/, lineBreaks: true },
            // Match whitespace
            WS:         { match: /\s+/, lineBreaks: true },
        });
    }

        /**
         * Updated parsing logic:
         *  - If we encounter a [LINK] block, we parse it fully until [/LINK].
         *  - After we finish parsing the link block, we check if the next token is [CONTENT].
         *    If yes, we parse that [CONTENT] block immediately and combine it with the link block
         *    into a single chunk.
         * 
         * This ensures sequences like [LINK]...[/LINK][CONTENT]...[/CONTENT] remain atomic and are
         * not split across multiple chunks, preserving link continuity.
         */
    createChunksFromTokens(tokens) {
        const chunks = [];
        let textBuffer = '';
    
        const flushTextBuffer = () => {
            let txt = textBuffer.trim();
            textBuffer = '';
            while (txt.length > 0) {
                const piece = txt.slice(0, this.maxTokensPerChunk);
                txt = txt.slice(this.maxTokensPerChunk);
                chunks.push({ pageContent: `[CONTENT]${piece.trim()}[/CONTENT]` });
            }
        };
    
        let i = 0;
        while (i < tokens.length) {
            const tok = tokens[i];
    
            if (tok.type === 'contentFormatStart') {
                // Flush outside text before reading content block
                if (textBuffer.trim().length > 0) {
                    flushTextBuffer();
                }
                i++;
                let contentText = '';
                while (i < tokens.length && tokens[i].type !== 'contentFormatEnd') {
                    contentText += tokens[i].value;
                    i++;
                }
    
                // Close CONTENT
                if (i < tokens.length && tokens[i].type === 'contentFormatEnd') {
                    i++;
                }
                chunks.push({ pageContent: `[CONTENT]${contentText.trim()}[/CONTENT]` });
    
            } else if (tok.type === 'linkFormatStart') {
                // Flush outside text before reading link block
                if (textBuffer.trim().length > 0) {
                    flushTextBuffer();
                }
                i++;
                let linkText = '';
                while (i < tokens.length && tokens[i].type !== 'linkFormatEnd') {
                    linkText += tokens[i].value;
                    i++;
                }
    
                // Close LINK
                if (i < tokens.length && tokens[i].type === 'linkFormatEnd') {
                    i++;
                }
                let combinedChunk = `[LINK]${linkText.trim()}[/LINK]`;
    
                // Check if next token is [CONTENT]. If so, parse it immediately and append.
                if (i < tokens.length && tokens[i].type === 'contentFormatStart') {
                    i++;
                    let contentText = '';
                    while (i < tokens.length && tokens[i].type !== 'contentFormatEnd') {
                        contentText += tokens[i].value;
                        i++;
                    }
                    // Close CONTENT
                    if (i < tokens.length && tokens[i].type === 'contentFormatEnd') {
                        i++;
                    }
                    combinedChunk += `[CONTENT]${contentText.trim()}[/CONTENT]`;
                }
    
                // Push the combined [LINK][CONTENT] chunk
                chunks.push({ pageContent: combinedChunk });
    
            } else if (tok.type === 'text' || tok.type === 'WS') {
                // Accumulate text outside LINK/CONTENT blocks
                textBuffer += tok.value;
                i++;
            } else {
                // Unknown token type, treat as text
                textBuffer += tok.value;
                i++;
            }
        }
    
        // Flush remaining text as [CONTENT] if any
        if (textBuffer.trim().length > 0) {
            flushTextBuffer();
        }
    
        return chunks;
    }

    // Method to add documents to the vector store
    async addDocuments(url, content, metadata = {}) {
        // Check if content is empty
        if (!content) {
            throw new Error('Content must not be empty');
        }

        // Initialize the vector store
        await this.initialize();

        // Use moo to tokenize
        const lexer = this.createLexer();
        lexer.reset(content);
        const tokens = Array.from(lexer);

        // Create chunks from tokens
        const documents = this.createChunksFromTokens(tokens);

        // Get the vector store for the given URL
        const vectorStore = await this.getOrCreateVectorStore(url);
        // Add documents to the vector store
        await this.retryOperation(async () => {
            documents.forEach(doc => {
                doc.metadata = { url, ...metadata };
            });
            await vectorStore.addDocuments(documents);
        });

        // Update the document map
        const existingDocs = this.documentMap.get(url) || [];
        this.documentMap.set(url, existingDocs.concat(documents));

        return {
            status: 'completed',
            chunks: documents.length
        };
    }

    // Method to perform an embedding search
    async performEmbeddingSearch(queryText, url, numResults = 5) {
        // Initialize the vector store
        await this.initialize();
        // Get the vector store for the given URL
        const vectorStore = await this.getOrCreateVectorStore(url);
        // Generate embedding for the query
        const queryEmbedding = await this.embeddings.embedQuery(queryText);
        // Perform similarity search
        const similaritySearchWithScoreResults = await vectorStore.similaritySearchVectorWithScore(queryEmbedding, numResults);

        // Map the results to the desired format
        return similaritySearchWithScoreResults.map(([doc, _score]) => ({
            link: doc.metadata.url,
            content: doc.pageContent
        }));
    }

    // Method to delete a collection from the vector store
    async deleteCollection(url) {
        // Get the vector store for the given URL
        const store = this.vectorStores.get(url);
        // If the store exists, delete it
        if (store) {
            this.vectorStores.delete(url);
        }
        // Delete the document map for the given URL
        this.documentMap.delete(url);
    }

    // Method to reset the vector store
    async reset() {
        // Abort all pending requests
        for (const controller of this.pendingRequests.values()) {
            controller.abort();
        }
        // Clear pending requests
        this.pendingRequests.clear();
        // Clear vector stores
        this.vectorStores.clear();
        // Clear document map
        this.documentMap.clear();
        // Reset initialized flag
        this.initialized = false;
        // Reset initialization promise
        this.initializationPromise = null;
    }

    // Method to update settings
    async updateSettings(settings) {
        let needsReset = false;

        // Update max tokens per chunk if provided
        if (settings.maxTokensPerChunk) {
            this.maxTokensPerChunk = settings.maxTokensPerChunk;
            needsReset = true;
        }
        // Update LM Studio endpoint if provided
        if (settings.lmStudioEndpoint) {
            this.baseUrl = settings.lmStudioEndpoint;
            needsReset = true;
        }
        // Update LM Studio model if provided
        if (settings.lmStudioModel) {
            this.model = settings.lmStudioModel;
            needsReset = true;
        }

        // If any settings were updated, reset the vector store
        if (needsReset) {
            await this.reset();
            await this.initialize();
        }
    }

    // Method to check if embeddings exist for a given URL
    async hasEmbeddings(url) {
        const docs = this.documentMap.get(url);
        return docs && docs.length > 0;
    }
}

// Export the vector store instance
export const vectorStore = new CustomVectorStore();
