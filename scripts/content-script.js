/**
 * ./scripts/content-script.js
 * 
 * This content script runs in the context of web pages and handles DOM manipulation,
 * content extraction, and communication with the extension's background processes.
 */

// Use IIFE to prevent global scope pollution
(function() {
    // Private state management with better synchronization
    const state = {
        pageLinks: [],
        processingState: {
            isProcessing: false,
            lastProcessedUrl: null,
            processingPromise: null,
            processingProgress: 0
        },
        observers: {
            mutation: null
        }
    };

    // Enhanced debounce with proper cleanup
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    resolve(func.apply(this, args));
                }, wait);
            });
        };
    }

    /**
     * Update processing progress
     */
    function updateProgress(progress, message) {
        state.processingState.processingProgress = progress;
        chrome.runtime.sendMessage({
            action: "embeddingProgress",
            progress: progress,
            message: message,
            hide: progress >= 100
        });
    }


    /**
     * Process and extract content from the current webpage
     */
    function processPageContent() {
        updateProgress(10, 'Starting content processing...');

        // Get the entire DOM structure
        const domContent = document.documentElement.outerHTML;
        const parser = new DOMParser();
        const doc = parser.parseFromString(domContent, 'text/html');

        updateProgress(20, 'Cleaning document structure...');

        // Remove unwanted elements
        const unwantedSelectors = [
            'script', 'style', 'noscript', 'iframe', 'img',
            'video', 'audio', 'svg', 'canvas', 'nav', 'footer',
            'header', 'aside', '.ad', '.ads', '.advertisement',
            '.social-share', '#comments', '.comments'
        ];

        unwantedSelectors.forEach(selector => {
            doc.querySelectorAll(selector).forEach(el => el.remove());
        });

        updateProgress(30, 'Extracting main content...');

        // Get main content
        const mainContent = doc.querySelector('main, article, .content, #content, [role="main"]');

        // Initialize processed content array
        let processedContent = [];

        // Function to clean text
        function cleanText(text) {
            return text
                .replace(/\s+/g, ' ')
                .replace(/\n+/g, ' ')
                .replace(/\t+/g, ' ')
                .replace(/\r+/g, ' ')
                .replace(/\f+/g, ' ')
                .replace(/\v+/g, ' ')
                .replace(/\u00A0/g, ' ')
                .replace(/\u2028/g, ' ')
                .replace(/\u2029/g, ' ')
                .replace(/[^\S\n]+/g, ' ')
                .trim();
        }

        /**
         * Formats a link element into the desired [LINK]...[/LINK][CONTENT]...[/CONTENT] format.
         * @param {HTMLElement} linkElement - The link element to format.
         * @returns {string} - The formatted link string.
         */
        function formatLink(linkElement) {
            try {
                const href = linkElement.href;
                const text = linkElement.textContent.trim();

                let precedingContext = '';
                let prevNode = linkElement.previousSibling;
                 while (prevNode) {
                    if (prevNode.nodeType === Node.TEXT_NODE) {
                        precedingContext = cleanText(prevNode.textContent);
                        break;
                    } else if (prevNode.nodeType === Node.ELEMENT_NODE) {
                        // If the previous node is an element, get its outerHTML
                        precedingContext = cleanText(prevNode.outerHTML);
                        break;
                    }
                    prevNode = prevNode.previousSibling;
                }


                let succeedingContext = '';
                let nextNode = linkElement.nextSibling;
                while (nextNode) {
                     if (nextNode.nodeType === Node.TEXT_NODE) {
                        succeedingContext = cleanText(nextNode.textContent);
                        break;
                    } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
                        // If the next node is an element, get its outerHTML
                        succeedingContext = cleanText(nextNode.outerHTML);
                        break;
                    }
                    nextNode = nextNode.nextSibling;
                }

                const context = `${precedingContext} ${text} ${succeedingContext}`.trim();


                if (!context) {
                    console.warn(`No context found for link: ${href}`);
                }

                return `[LINK]${href}[/LINK][CONTENT]${context}[/CONTENT]`;
            } catch (error) {
                console.error('Error formatting link:', error, linkElement);
                return `[LINK]${linkElement.href}[/LINK][CONTENT]${cleanText(linkElement.textContent)}[/CONTENT]`;
            }
        }

        // Function to process each element recursively
        function processElement(element) {
            if (!element) return;
            let currentParagraph = '';

            for (let node of element.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = cleanText(node.textContent);
                    if (text) {
                        currentParagraph += (currentParagraph ? ' ' : '') + text;
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (currentParagraph) {
                        processedContent.push(currentParagraph);
                        currentParagraph = '';
                    }
                    if (node.tagName.toLowerCase() === 'a' && node.href.startsWith('http')) {
                        // Handle link with context using the dedicated function
                        const formattedLink = formatLink(node);
                        processedContent.push(formattedLink);
                    } else {
                        // Process other elements
                        const tag = node.tagName.toLowerCase();
                        const tagMap = {
                            'div': 'div',
                            'p': 'p',
                            'li': 'li',
                            'blockquote': 'blockquote',
                            'table': 'table',
                            'pre': 'pre',
                            'code': 'code',
                            'strong': 'strong',
                            'b': 'b',
                            'em': 'em',
                            'i': 'i',
                            'h1': 'h1',
                            'h2': 'h2',
                            'h3': 'h3',
                            'h4': 'h4',
                            'h5': 'h5',
                            'h6': 'h6'
                        };
                        const mappedTag = tagMap[tag];
                        if (mappedTag) {
                            processedContent.push(`[CONTENT]${cleanText(node.outerHTML)}[/CONTENT]`);
                        }
                        // Recursive call
                        processElement(node);
                    }
                }
            }
            if (currentParagraph) {
                processedContent.push(currentParagraph);
            }
        }

        // Special handling for Google search results
        if (window.location.hostname === 'www.google.com' && window.location.pathname === '/search') {
            updateProgress(40, 'Processing search results...');
            processedContent = Array.from(document.querySelectorAll('#search .g'))
                .map((result, index) => {
                    const link = result.querySelector('a');
                    const title = result.querySelector('h3');
                    const snippet = result.querySelector('.VwiC3b');
                    const formattedLink = link ? formatLink(link) : '';
                    const formattedSnippet = snippet ? cleanText(snippet.textContent) : '';
                    return `[Search Result ${index + 1}] ${title ? cleanText(title.textContent) : ''}\n${formattedLink}\n[CONTENT]${formattedSnippet}[/CONTENT]`;
                })
                .filter(result => result.trim().length > 0); // Filter out empty results
        } else {
            updateProgress(40, 'Processing page content...');
            processElement(mainContent || doc.body);
        }

        updateProgress(60, 'Formatting content...');

        // Combine all processed content into a single string with proper newlines
        const combinedContent = processedContent.join('\n').replace(/\n{3,}/g, '\n\n').trim();

        // Split the combined content into lines
        const lines = combinedContent.split('\n');

        // Adjust the chunking to keep [LINK]...[/LINK][CONTENT]...[/CONTENT] together
        const adjustedContent = [];
        let currentChunk = '';

        lines.forEach(line => {
            if (line.startsWith('[LINK]')) {
                // If there's existing content in currentChunk, push it before adding the link
                if (currentChunk) {
                    adjustedContent.push(currentChunk.trim());
                    currentChunk = '';
                }
                // Push the link as a separate chunk to ensure it's not split
                adjustedContent.push(line.trim());
            } else {
                // Append these formatted lines to the current chunk
                if (currentChunk) {
                    currentChunk += ' ' + line.trim();
                } else {
                    currentChunk = line.trim();
                }
            }
        });

        // Push any remaining content
        if (currentChunk) {
            adjustedContent.push(currentChunk.trim());
        }

        // Join all chunks with newlines
        const finalContent = adjustedContent.join('\n');

        updateProgress(80, 'Finalizing content...');

        return finalContent;
    }

    /**
     * Handle clicking links by ID
     */
    function clickLink(linkId) {
        const link = state.pageLinks.find(link => link.id === linkId);
        
        if (link && link.element) {
            try {
                link.element.click();
                return { success: true };
            } catch (error) {
                console.error('Error clicking link:', error);
                return { success: false, error: 'Failed to click link: ' + error.message };
            }
        } else {
            return { success: false, error: "Link not found" };
        }
    }

    /**
     * Synchronized content capture and processing with retries
     */
    async function captureAndSendDOM(retryCount = 0, maxRetries = 3) {
        if (state.processingState.isProcessing) {
            console.log('Content processing already in progress...');
            return state.processingState.processingPromise;
        }
    
        const currentUrl = window.location.href;
    
        if (state.processingState.lastProcessedUrl === currentUrl) {
            console.log('URL already processed. Skipping...');
            return Promise.resolve();
        }
    
        state.processingState.isProcessing = true;
        state.processingState.processingPromise = (async () => {
            try {
                updateProgress(0, 'Starting content processing...');
                const processedContent = processPageContent();
    
                // Send content to extension with retry logic
                try {
                    await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage({
                            action: "processedContent",
                            content: processedContent,
                            url: currentUrl
                        }, response => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve(response);
                            }
                        });
                    });
    
                    updateProgress(100, 'Content processing complete');
                    state.processingState.lastProcessedUrl = currentUrl;
                    return { success: true };
                } catch (error) {
                    console.error('Error sending content:', error);
                    if (retryCount < maxRetries) {
                        console.log(`Retrying (${retryCount + 1}/${maxRetries})...`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                        return captureAndSendDOM(retryCount + 1, maxRetries);
                    }
                    throw error;
                }
            } catch (error) {
                console.error('Error in captureAndSendDOM:', error);
                updateProgress(100, 'Error processing content', true);
                return { success: false, error: error.message };
            } finally {
                state.processingState.isProcessing = false;
                state.processingState.processingPromise = null;
            }
        })();
    
        return state.processingState.processingPromise;
    }

    // Debounced content processing
    const processDOMDebounced = debounce(captureAndSendDOM, 1000);

    // Message handler with proper async handling
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const handleMessage = async () => {
            try {
                switch (request.action) {
                    case "getPageContent":
                        return { content: processPageContent() };
                    case "clickLink":
                        return clickLink(request.linkId);
                    case "processPageContent":
                    case "initializeContext":
                        return processDOMDebounced();
                    case "searchEmbeddings":
                        if (state.processingState.isProcessing) {
                            return {
                                success: false,
                                error: "Content processing in progress. Please wait..."
                            };
                        }
                        return new Promise(resolve => {
                            chrome.runtime.sendMessage({
                                action: "performEmbeddingSearch",
                                query: request.query,
                                url: window.location.href
                            }, resolve);
                        });
                    default:
                        return { success: false, error: "Unknown action" };
                }
            } catch (error) {
                console.error('Error handling message:', error);
                return { success: false, error: error.message };
            }
        };

        // Handle async response
        handleMessage().then(sendResponse);
        return true;
    });

    // Initialize content processing
    processDOMDebounced();

    // Set up mutation observer for Google search results
    if (window.location.hostname === 'www.google.com' && window.location.pathname === '/search') {
        const handleMutations = debounce(() => {
            if (!state.processingState.isProcessing) {
                processDOMDebounced();
            }
        }, 1000);

        state.observers.mutation = new MutationObserver((mutations) => {
            if (mutations.some(mutation => 
                mutation.target.id === 'search' || 
                mutation.target.closest('#search'))) {
                handleMutations();
            }
        });

        state.observers.mutation.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
})();
