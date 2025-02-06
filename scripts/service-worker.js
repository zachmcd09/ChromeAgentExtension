/**
 * service-worker.js
 * 
 * DESCRIPTION:
 * The background service worker initializes the vector store once, handles requests to generate embeddings,
 * and perform embedding searches. It keeps track of active pages and their embeddings.
 * 
 * CHANGES:
 * - Only calls vectorStore.initialize() once, no multiple init attempts.
 * - Ensures after generating embeddings, we mark the URL as active.
 * - No internal calls to initialize() in vector store methods now, so no repeated health checks.
 */

import { vectorStore } from './vectorStore.js';

const DEBUG = true;
function log(...args) {
    if (DEBUG) {
        console.log('[Service Worker]', ...args);
    }
}

const state = {
    isInitialized: false,
    activeEmbeddings: new Map(),
    embeddingTimestamps: new Map(),
    tabStates: new Map(),
    pendingRequests: new Map(),
    activePages: new Set()
};

const DEFAULT_ENDPOINT = 'http://localhost:1234';
const DEFAULT_MODEL = 'qwen2.5-coder-7b-instruct-mlx';

async function initialize() {
    if (state.isInitialized) return; // Avoid multiple init calls
    try {
        log('Initializing vector store...');
        await vectorStore.initialize(); // single call here
        log('Vector store initialized successfully');
        state.isInitialized = true;
        chrome.alarms.create('cleanupAlarm', { periodInMinutes: 15 });
    } catch (error) {
        console.error('Failed to initialize vector store:', error);
    }
}

initialize().catch(console.error);

/**
 * queryLMStudio
 * Queries the LMStudio API for chat completions.
 */
async function queryLMStudio(messages, endpoint = DEFAULT_ENDPOINT, model = DEFAULT_MODEL, temperature = 0.2) {
    const requestId = Date.now().toString();
    const controller = new AbortController();
    state.pendingRequests.set(requestId, controller);

    try {
        log('Sending LMStudio query:', { messages });
        const response = await fetch(`${endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: temperature,
                max_tokens: 512,
                stream: false
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LMStudio API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid response format from LMStudio API');
        }

        log('Received LMStudio response:', data.choices[0].message.content);
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error querying LMStudio:', error);
        throw error;
    } finally {
        state.pendingRequests.delete(requestId);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const handleRequest = async () => {
        if (!state.isInitialized) {
            console.warn('Vector store not initialized yet, waiting...');
            // Wait until initialized (if needed)
            let attempts = 0;
            while (!state.isInitialized && attempts < 10) {
                await new Promise(r => setTimeout(r, 500));
                attempts++;
            }
            if (!state.isInitialized) {
                return { success: false, error: 'Vector store not initialized.' };
            }
        }

        switch (request.action) {
            case "generateEmbeddings": {
                const url = request.url;
                if (state.activeEmbeddings.has(url)) {
                    return { success: true, result: 'Embeddings are already in progress or completed.' };
                }

                state.activeEmbeddings.set(url, true);
                try {
                    const cleanedContent = request.content.trim();
                    const hasExisting = await vectorStore.hasEmbeddings(url);
                    if (hasExisting) {
                        state.activePages.add(url);
                        state.embeddingTimestamps.set(url, Date.now());
                        return { success: true, result: 'Embeddings already exist.' };
                    }

                    // Use addDocuments directly now
                    await vectorStore.addDocuments(url, cleanedContent);
                    state.activePages.add(url);
                    state.embeddingTimestamps.set(url, Date.now());
                    return { success: true, result: 'Embeddings generated successfully.' };
                } catch (error) {
                    console.error('Error generating embeddings:', error);
                    return { success: false, error: error.message };
                } finally {
                    state.activeEmbeddings.delete(url);
                }
            }

            case "performEmbeddingSearch": {
                const url = request.url;
                log('Performing embedding search for URL:', url);

                if (!url || !state.activePages.has(url)) {
                    log('No active page for URL:', url);
                    return { success: false, error: "No active page. Process page content first." };
                }

                try {
                    const results = await vectorStore.performEmbeddingSearch(request.query, url, 4);
                    log('Search results:', results);
                    return { success: true, results };
                } catch (error) {
                    console.error('Error performing embedding search:', error);
                    return { success: false, error: error.message };
                }
            }

            case "queryLMStudio": {
                try {
                    log('Querying LMStudio:', request.messages);
                    const response = await queryLMStudio(
                        request.messages,
                        request.endpoint || DEFAULT_ENDPOINT,
                        request.model || DEFAULT_MODEL,
                        request.temperature
                    );
                    return { success: true, content: response };
                } catch (error) {
                    console.error('Error querying LMStudio:', error);
                    return { success: false, error: error.message };
                }
            }

            default:
                return { success: false, error: `Unknown action: ${request.action}` };
        }
    };

    handleRequest().then(response => {
        sendResponse(response);
    }).catch(error => {
        console.error('Error in request handler:', error);
        sendResponse({ success: false, error: error.message });
    });

    return true; 
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanupAlarm') {
        cleanupEmbeddings();
    }
});

async function cleanupEmbeddings() {
    try {
        if (!state.isInitialized) {
            // Wait initialization if needed
            await initialize();
        }

        const CLEANUP_INTERVAL = 30 * 60 * 1000;
        const cutoff = Date.now() - CLEANUP_INTERVAL;

        for (const [url, timestamp] of state.embeddingTimestamps) {
            if (timestamp < cutoff) {
                await vectorStore.deleteCollection(url);
                state.embeddingTimestamps.delete(url);
                state.activePages.delete(url);
                log(`Cleaned up old embeddings for URL: ${url}`);
            }
        }
    } catch (error) {
        console.error('Error during periodic cleanup:', error);
    }
}

self.addEventListener('unload', () => {
    for (const controller of state.pendingRequests.values()) {
        controller.abort();
    }
});

// Enable toggling the side panel on action icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
