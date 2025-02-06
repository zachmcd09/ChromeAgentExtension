/**
 * browserAgent.js
 * 
 * DESCRIPTION:
 * The BrowserAgent handles processing page content and preparing embeddings, as well as performing
 * embedding searches when requested by Chromie's function calls.
 * 
 * CHANGES:
 * - No calls to vectorStore.initialize() here.
 * - Ensure that embeddings are always associated with the same URL for searches.
 * - Remove references to storeEmbeddings(); now we only have addDocuments().
 * - No use of lastProcessedUrl.
 * - No attempt to call similaritySearchByVector directly.
 * - The search logic remains the same, we trust service-worker and vectorStore to do correct queries.
 * - Ensure final link is trimmed and correct.
 * - Do not append results to chat here; just return them.
 */

import { browserController } from './browserControl.js';
import { vectorStore } from './vectorStore.js';

const DEBUG = true;
function log(...args) {
    if (DEBUG) {
        console.log('[Browser Agent]', ...args);
    }
}

const BROWSER_AGENT_PROMPT = `I am a Browser Agent specialized in processing and formatting webpage content search results. My role is to:

1. Process Search Results:
- Analyze embedding search results from the current webpage
- Extract and format the most relevant information
- Combine related content for better context
- Always maintain proper formatting with tags

2. Link Analysis:
- Find and extract relevant URLs from search results
- Understand link context and relevance
- Return complete, untruncated URLs
- Preserve link text and surrounding context

3. Response Format:
For navigation queries (when [LINK] tag is in query):
- Find the most relevant URL from search results
- Format: [LINK]full_url[/LINK]\n[CONTENT]surrounding context[/CONTENT]
- Always return complete, untruncated URLs

For content queries (when [CONTENT] tag is in query):
- Extract relevant content sections from search results
- Format: [CONTENT]relevant content[/CONTENT]
- Combine related information for better context
- Focus on answering the specific query

4. Context Rules:
- Always provide complete URLs, never truncate
- Include surrounding context for better understanding
- Preserve exact link text and descriptions
- Maintain proper formatting with tags

Example Outputs:
For navigation query "[LINK]space.com[/LINK] [CONTENT]what causes northern lights[/CONTENT]":
[LINK]https://www.space.com/15139-northern-lights-auroras-earth-facts-sdcmp.html[/LINK]
[CONTENT]What causes the northern lights? This comprehensive guide explains how the Sun's charged particles interact with Earth's magnetic field to create the aurora borealis.[/CONTENT]

For content query "[CONTENT]explain how aurora works[/CONTENT]":
[CONTENT]The aurora borealis occurs when charged particles from the Sun collide with atoms in Earth's atmosphere. These collisions cause the atoms to release photons of light, creating the colorful displays we see. The different colors come from different types of atoms: oxygen produces green and red, while nitrogen creates blue and purple hues.[/CONTENT]`;


class BrowserAgent {
    constructor() {
        this.settings = {
            contextWindow: 4000,
            maxTokensPerChunk: 500,
            maxResults: 4
        };

        this.state = {
            currentUrl: null,
            pageContent: null,
            contentProcessed: false,
            processingUrls: new Set(),
            linkMap: new Map(),
            currentContextSize: 0,
            contextHistory: [],
            pageChunks: []
        };
    }

    async processPageContent(content, url) {
        log('Starting processPageContent with URL:', url);
        if (!content || !url) {
            throw new Error('Content and URL are required');
        }

        if (this.state.processingUrls.has(url)) {
            log('Content processing already in progress for:', url);
            await this.waitForEmbeddingsReady(url);
            return null;
        }

        this.state.processingUrls.add(url);
        this.state.currentUrl = url;
        this.state.pageContent = content;
        this.state.contentProcessed = false;
        this.state.linkMap.clear();

        const hasExisting = await vectorStore.hasEmbeddings(url);
        if (hasExisting) {
            log('Embeddings already exist for URL:', url);
            this.state.contentProcessed = true;
            this.state.processingUrls.delete(url);
            return null;
        }

        const formattedContent = this._formatDOMContent(content);
        log('Formatted content length:', formattedContent.length);

        const response = await chrome.runtime.sendMessage({
            action: "generateEmbeddings",
            url: url,
            content: formattedContent
        });

        if (!response.success) {
            if (response.error && response.error.includes("already being generated")) {
                await this.waitForEmbeddingsReady(url);
            } else {
                console.error('Failed to generate embeddings:', response.error);
                this.state.processingUrls.delete(url);
                throw new Error(response.error);
            }
        } else {
            log('Embeddings generated for:', url);
        }

        // Embeddings ready
        this.state.contentProcessed = true;
        this.state.currentUrl = url;
        this.state.processingUrls.delete(url);
        return response.result;
    }

    async waitForEmbeddingsReady(url) {
        let attempts = 0;
        while (!(await vectorStore.hasEmbeddings(url))) {
            attempts++;
            if (attempts > 30) {
                throw new Error('Timed out waiting for embeddings to be ready.');
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.state.contentProcessed = true;
    }

    async searchEmbeddings(query) {
        log('Starting searchEmbeddings with query:', query);
        if (!this.state.contentProcessed || !this.state.currentUrl) {
            log('No active page. Process page content first.');
            throw new Error('No active page. Process page content first.');
        }

        const parsedCommand = this.parseCommand(query);
        let searchQuery = '';
        if (parsedCommand.link) searchQuery += `URL: ${parsedCommand.link} `;
        if (parsedCommand.content) searchQuery += parsedCommand.content;
        if (!searchQuery) searchQuery = query;

        log('Searching embeddings with query:', searchQuery);
        const response = await chrome.runtime.sendMessage({
            action: "performEmbeddingSearch",
            url: this.state.currentUrl,
            query: searchQuery
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to search embeddings');
        }

        log('Received search results:', response.results);
        const formattedResults = await this.formatSearchResults(response.results, parsedCommand);
        log('Formatted results:', formattedResults);

        return formattedResults;
    }

    async formatSearchResults(results, parsedCommand) {
        if (!results || results.length === 0) {
            return 'No relevant results found.';
        }

        log('Formatting search results:', { results, parsedCommand });

        const messages = [
            { role: "system", content: BROWSER_AGENT_PROMPT },
            {
                role: "system",
                content: `Current webpage content from embedding search:\n\n${results.map(r => r.content).join('\n\n')}`
            },
            {
                role: "user",
                content: parsedCommand.link ?
                    `Find and format the most relevant link about: ${parsedCommand.content}` :
                    `Extract and format relevant content about: ${parsedCommand.content}`
            }
        ];

        log('Sending format request to LMStudio');
        const response = await chrome.runtime.sendMessage({
            action: "queryLMStudio",
            messages: messages
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to format results');
        }

        let formattedContent = response.content.trim();
        // Ensure no trailing spaces in the URL
        formattedContent = formattedContent.replace(/\s+\[\/LINK\]/, '[/LINK]');

        log('Received formatted content:', formattedContent);
        return formattedContent;
    }

    parseCommand(command) {
        log('Parsing command:', command);
        const linkMatch = command.match(/\[LINK\](.*?)\[\/LINK\]/);
        const contentMatch = command.match(/\[CONTENT\](.*?)\[\/CONTENT\]/);

        const parsed = {
            link: linkMatch ? linkMatch[1].trim() : null,
            content: contentMatch ? contentMatch[1].trim() : null
        };
        log('Parsed command:', parsed);
        return parsed;
    }

    _formatDOMContent(content) {
        log('Formatting DOM content...');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;

        tempDiv.querySelectorAll('a').forEach((link, index) => {
            const url = link.href;
            const text = link.textContent.trim();
            const placeholder = `[LINK_${index}]`;
            this.state.linkMap.set(placeholder, { url, text });
            link.replaceWith(placeholder);
        });

        tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
            const level = heading.tagName[1];
            const text = heading.textContent.trim();
            heading.replaceWith(`\n\n[HEADING${level}] ${text}\n\n`);
        });

        tempDiv.querySelectorAll('ul, ol').forEach(list => {
            const items = Array.from(list.querySelectorAll('li'))
                .map(item => `• ${item.textContent.trim()}`)
                .join('\n');
            list.replaceWith(`\n${items}\n`);
        });

        let processedContent = tempDiv.textContent;

        this.state.linkMap.forEach((linkData, placeholder) => {
            processedContent = processedContent.replace(
                placeholder,
                `${linkData.text} [LINK] ${linkData.url} [/LINK]]`
            );
        });

        processedContent = processedContent
            .replace(/\s+/g, ' ')
            .replace(/\[LINK:/g, '\n[LINK:')
            .replace(/\[HEADING/g, '\n\n[HEADING')
            .replace(/•/g, '\n•')
            .trim();

        log('Final processed content:', processedContent);
        return processedContent;
    }

    async executeCommand(command, params = {}) {
        log('Delegating command execution to browserController:', { command, params });
        return await browserController.executeCommand(command, params);
    }

    updateSettings(settings) {
        log('Updating settings:', settings);
        this.settings = { ...this.settings, ...settings };
        vectorStore.updateSettings(settings);
        log('Settings updated:', this.settings);
    }

    checkContextSize(text) {
        const estimatedTokens = Math.ceil(text.length / 4);
        const newSize = this.state.currentContextSize + estimatedTokens;
        return {
            canAdd: newSize <= this.settings.contextWindow,
            message: newSize > this.settings.contextWindow ?
                'Context window full. Clearing history to continue.' : null
        };
    }

    updateContextSize(text) {
        const estimatedTokens = Math.ceil(text.length / 4);
        this.state.currentContextSize += estimatedTokens;
        this.state.contextHistory.push({ text, tokens: estimatedTokens });

        while (this.state.currentContextSize > this.settings.contextWindow && this.state.contextHistory.length > 0) {
            const removed = this.state.contextHistory.shift();
            this.state.currentContextSize -= removed.tokens;
        }
    }

    resetContext() {
        log('Resetting context tracking.');
        this.state.currentContextSize = 0;
        this.state.contextHistory = [];
        this.state.pageContent = null;
        this.state.pageChunks = [];
        this.state.contentProcessed = false;
        this.state.linkMap.clear();
    }
}

export const browserAgent = new BrowserAgent();

const globalScope = typeof window !== 'undefined' ? window : self;
globalScope.browserAgent = browserAgent;