/**
 * ./scripts/browserControl.js
 * 
 * This module provides browser control functionality for the Chrome extension.
 */

import { browserAgent } from './browserAgent.js';

class BrowserController {
    constructor() {
        this.activeTab = null;
        this.pendingRequests = new Map();
        this.contentProcessingDebounce = new Map();
        this.setupTabListeners();
    }

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    setupTabListeners() {
        // Debounced content processing function
        const processPageDebounced = this.debounce((tabId, tab) => {
            if (tab.url?.includes('google.com/search')) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['dist/content-script.bundle.js']
                }).then(() => {
                    // Send message to content script to process page
                    chrome.tabs.sendMessage(tabId, { action: 'processPage' });
                }).catch(error => {
                    console.error('Error injecting content script:', error);
                });
            }
        }, 1000); // 1 second debounce

        // Listen for tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                processPageDebounced(tabId, tab);
            }
        });

        // Listen for content script messages
        chrome.runtime.onMessage.addListener((message, sender) => {
            if (message.action === "processedContent") {
                browserAgent.processPageContent(message.content, message.url).catch(error => {
                    console.error('Error processing content:', error);
                });
            }
            // Must return true for async message handling
            return true;
        });
    }

    async executeCommand(command, params = {}) {
        // Generate unique request ID
        const requestId = Date.now().toString();
        
        // Cancel any existing request for this command
        if (this.pendingRequests.has(command)) {
            const controller = this.pendingRequests.get(command);
            controller.abort();
            this.pendingRequests.delete(command);
        }

        // Create new AbortController for this request
        const controller = new AbortController();
        this.pendingRequests.set(command, controller);

        try {
            switch (command) {
                case 'googleSearch':
                    return await this.googleSearch(params.query);
                case 'youtubeSearch':
                    return await this.youtubeSearch(params.query);
                case 'newTab':
                    return await this.openNewTab(params.url);
                case 'closeTab':
                    return await this.closeCurrentTab();
                case 'newWindow':
                    return await this.openNewWindow();
                case 'incognito':
                    return await this.openIncognitoWindow();
                case 'reload':
                    return await this.reloadPage();
                case 'hardReload':
                    return await this.hardReloadPage();
                case 'goBack':
                    return await this.goBack();
                case 'goForward':
                    return await this.goForward();
                case 'callBrowserAgent':
                    if (!params.query) throw new Error('Query is required for callBrowserAgent');
                    return await browserAgent.searchEmbeddings(params.query);
                case 'scrollDown':
                    return await this.scrollDown();
                case 'scrollUp':
                    return await this.scrollUp();
                case 'scrollTop':
                    return await this.scrollTop();
                case 'scrollBottom':
                    return await this.scrollBottom();
                case 'clickLink':
                    if (!params.url) throw new Error('URL is required for clickLink');
                    return await this.clickLink(params.url);
                default:
                    throw new Error(`Unknown command: ${command}`);
            }
        } catch (error) {
            console.error(`Error executing command ${command}:`, error);
            throw error;
        } finally {
            // Clean up AbortController
            if (this.pendingRequests.get(command) === controller) {
                this.pendingRequests.delete(command);
            }
        }
    }

    // Debounced Google search
    googleSearch = this.debounce(async (query) => {
        if (!query) throw new Error('Search query is required');
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const tab = await this.openNewTab(url);
        this.activeTab = tab;
        return tab;
    }, 1000);

    // Debounced YouTube search
    youtubeSearch = this.debounce(async (query) => {
        if (!query) throw new Error('Search query is required');
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        return await this.openNewTab(url);
    }, 1000);

    async openNewTab(url) {
        return new Promise((resolve, reject) => {
            try {
                chrome.tabs.create({ url: url || 'chrome://newtab' }, (tab) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        this.activeTab = tab;
                        resolve(tab);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async closeCurrentTab() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (tabs[0]) {
                    chrome.tabs.remove(tabs[0].id, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }

    async openNewWindow() {
        return new Promise((resolve, reject) => {
            chrome.windows.create({}, (window) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(window);
                }
            });
        });
    }

    async openIncognitoWindow() {
        return new Promise((resolve, reject) => {
            chrome.windows.create({ incognito: true }, (window) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(window);
                }
            });
        });
    }

    async reloadPage() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (tabs[0]) {
                    chrome.tabs.reload(tabs[0].id, {}, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }

    async hardReloadPage() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (tabs[0]) {
                    chrome.tabs.reload(tabs[0].id, { bypassCache: true }, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }

    async goBack() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (tabs[0]) {
                    chrome.tabs.goBack(tabs[0].id, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }

    async goForward() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (tabs[0]) {
                    chrome.tabs.goForward(tabs[0].id, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }

    async scrollDown() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (tabs[0]) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function: () => {
                            document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32, which: 32 }));
                            document.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', keyCode: 32, which: 32 }));
                        }
                    }, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }

    async scrollUp() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (tabs[0]) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function: () => {
                            document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32, which: 32, shiftKey: true }));
                            document.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', keyCode: 32, which: 32, shiftKey: true }));
                        }
                    }, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }

    async scrollTop() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (tabs[0]) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function: () => {
                            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38, which: 38, metaKey: true }));
                            document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38, which: 38, metaKey: true }));
                        }
                    }, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }

    async scrollBottom() {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (tabs[0]) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function: () => {
                            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, metaKey: true }));
                            document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40, metaKey: true }));
                        }
                    }, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }

    async clickLink(url) {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }
                if (tabs[0]) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        function(url) {
                            const link = document.querySelector(`a[href="${url}"]`);
                            if (link) {
                                link.click();
                            } else {
                                throw new Error(`Link with URL ${url} not found`);
                            }
                        },
                        args: [url]
                    }, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(new Error('No active tab found'));
                }
            });
        });
    }
}

export const browserController = new BrowserController();
