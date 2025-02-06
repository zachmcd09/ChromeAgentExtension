/**
 * ./scripts/browserAgentSetup.js
 * 
 * This module configures the browser agent with settings and context management.
 */

class BrowserAgent {
    constructor() {
        this.systemPrompt = `I am a browser assistant that helps users navigate and interact with web content.
I can search for information, analyze page content, and help users find what they're looking for.
I maintain context of our conversation and can perform various browser actions to assist users.`;
        
        this.contextSize = 4000; // Default context window size
        this.currentContextSize = 0;
        this.settings = {
            apiEndpoint: 'http://localhost:1234',
            embeddingsEndpoint: 'http://localhost:1234/v1/embeddings',
            embeddingsModel: 'text-embedding-all-minilm-l6-v2-embedding',
        };
    }

    updateSettings(settings) {
        if (settings.contextWindow) {
            this.contextSize = parseInt(settings.contextWindow);
        }
        if (settings.apiEndpoint) {
            this.settings.apiEndpoint = settings.apiEndpoint;
        }
        if (settings.embeddingsEndpoint) {
            this.settings.embeddingsEndpoint = settings.embeddingsEndpoint;
        }
        if (settings.embeddingsModel) {
            this.settings.embeddingsModel = settings.embeddingsModel;
        }

    }

    checkContextSize(text) {
        const textSize = text.length;
        if (this.currentContextSize + textSize > this.contextSize) {
            return {
                canAdd: false,
                message: "Context window limit reached. Starting new conversation."
            };
        }
        return {
            canAdd: true,
            message: null
        };
    }

    updateContextSize(text) {
        this.currentContextSize += text.length;
    }

    resetContext() {
        this.currentContextSize = 0;
    }

    getSettings() {
        return this.settings;
    }
}

export const browserAgent = new BrowserAgent();
