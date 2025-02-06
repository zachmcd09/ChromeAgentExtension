/**
 * sendToEndpoint.js
 * 
 * DESCRIPTION:
 * Handles the user interface side of sending queries to LMStudio, displaying results in the chat,
 * and embedding assistant responses. We now ensure that assistant embeddings are only stored if
 * a currentUrl is available, so that similarity searches can include them.
 * 
 * FLOW:
 * 1. The user enters a query or command.
 * 2. sendToOpenAI is called, which:
 *    - Displays the user's message in the chat (appendToChat).
 *    - Builds conversation history and sends it to LMStudio.
 *    - Receives the assistant's reply and displays it.
 *    - After the assistant's final message is displayed, we store embeddings for that output.
 * 3. parseAndExecuteCommands detects any browser commands and executes them.
 * 4. handleDirectCommand can handle shorthand user instructions.
 * 5. Continually updates progress, context, and embeddings for a richer conversational experience.
 * 
 * CHANGES:
 * - Removed fallback `agent://chromie-output`. If there's no `currentUrl`, skip embedding assistant output.
 * - Ensured no extra initialize calls here.
 * - Assistant outputs are now always stored under `browserAgent.state.currentUrl` if available.
 */

import { marked } from './marked-setup.js';
import { toggleSpeechRecognition } from './speechHandler.js';
import { browserController } from './browserControl.js';
import { browserAgent } from './browserAgent.js';
import { vectorStore } from './vectorStore.js';

export const chromieSystemPrompt = `I am Chromie, your Chrome browser assistant with direct control over browser actions.
I specialize in executing browser commands and providing clear, action-oriented responses.
If I ever need to use any of my function calling capabilities, I ALWAYS begin my response with the necessary function call defined below.

CAPABILITIES:

1. Navigation Commands:
   - Open new tab: <[newTab]> or <[newTab:https://example.com]>
   - Close current tab: <[closeTab]>
   - Navigate history: <[goBack]> or <[goForward]>
   - Reload page: <[reload]> or <[hardReload]>
   - Open windows: <[newWindow]> or <[incognito]>

2. Search Functions:
   - Google search: <[googleSearch:your search query]>
   - YouTube search: <[youtubeSearch:your search query]>

3. Page Interaction:
   - Click links: <[clickLink:1]> (where 1 is the link ID)
   - Scroll down: <[scrollDown]>
   - Scroll up: <[scrollUp]>
   - Scroll to top of page: <[scrollTop]>
   - Scroll to bottom of page: <[scrollBottom]>

4. Content Analysis:
   - Browser Agent Call Format:
     <[callBrowserAgent: [LINK]domain.com[/LINK] [CONTENT]search query[/CONTENT]]>
   - Examples:
    EXAMPLE 1:
     - USER: "Can you open the space.com link about what causes the northern lights?"
     - REPSONSE: "Find article: <[callBrowserAgent: [LINK]space.com[/LINK] [CONTENT]what causes northern lights[/CONTENT]]>"

    EXAMPLE 2:
     - USER: "Can you explain how aurora's work?"
     - RESPONSE: "Search content: <[callBrowserAgent: [CONTENT] aurora's work work by [/CONTENT]]>"

    EXAMPLE 3:
     - USER: "Can you open the space.com aurora guide link?"
     - RESPONSE: "Find specific link: <[callBrowserAgent: [LINK]space.com/aurora-guide[/LINK]]>"

FUNCTION CALL RULES:

1. Browser Agent Calls:
   - For finding links: Always include [LINK] tags with the domain
   - For content search: Always include [CONTENT] tags with the query
   - Can combine both for targeted searches
   - Never use free-form text in callBrowserAgent

2. Command Execution:
   - Use exactly one command per response
   - Always use the proper command syntax with square brackets
   - Include required parameters after the colon
   - Verify command success before proceeding

3. Response Format:
   - Start with the command in proper syntax
   - Follow with a brief explanation if needed
   - Keep responses concise and action-focused

4. Error Handling:
   - If a command fails, acknowledge the error
   - Suggest alternative actions when appropriate
   - Maintain clear communication about command status

5. Navigation Flow Rules:
   - When asked to open or click a specific link, ALWAYS use callBrowserAgent first to find the link
   - Only after getting the link from callBrowserAgent, use newTab or clickLink
   - Never construct URLs directly - always find them through embedding search
   - Example flow:
     1. User: "Open the Space.com article about northern lights"
     2. Assistant: <[callBrowserAgent: [LINK]space.com[/LINK] [CONTENT]northern lights article[/CONTENT]]>
     3. Wait for results
     4. Then use <[newTab:actual_url]> or <[clickLink:link_id]>
Example Responses:
    - "Finding article: <[callBrowserAgent: [LINK]space.com[/LINK] [CONTENT]what causes northern lights[/CONTENT]]>"
    - "Opening link: <[newTab:https://www.space.com/found-url]>"
    - "Searching Google: <[googleSearch:how to make pasta]>"
    - "Clicking link: <[clickLink:1]>"

I will always:
- Use proper browser agent call format with [LINK] and [CONTENT] tags
- Execute commands directly without suggesting manual actions
- Use proper command syntax
- Provide clear success/failure feedback
- Maintain focus on browser control tasks`;


let conversationHistory = [];
let chatInitialized = false; 
let eventListenersAdded = false;

function toggleLoadingBubble(show) {
    const loadingBubble = document.getElementById('loadingBubble');
    if (loadingBubble) {
        if (show) {
            loadingBubble.classList.add('visible');
        } else {
            loadingBubble.classList.remove('visible');
        }
    }
}

function updateProgressBar(percent, message, hide = false) {
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (!progressContainer || !progressBar || !progressText) return;

    if (hide) {
        progressContainer.classList.remove('visible');
        return;
    }
    
    const progress = Math.min(100, Math.max(0, parseInt(percent) || 0));
    progressContainer.classList.add('visible');
    progressBar.style.width = `${progress}%`;
    progressBar.innerHTML = `${progress}%`;
    progressText.textContent = message || 'Processing...';
    
    if (progress >= 100) {
        setTimeout(() => {
            progressContainer.classList.remove('visible');
        }, 1000);
    }
}

function sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

function parseMarkdown(text) {
    try {
        return marked(text);
    } catch (error) {
        console.error('Markdown parsing error:', error);
        return text;
    }
}

function getSuccessMessage(command, params) {
    switch (command) {
        case 'youtubeSearch': return `✓ Searching for "${params.query}" on YouTube...`;
        case 'googleSearch': return `✓ Searching for "${params.query}" on Google...`;
        case 'newTab': return `✓ ${params.url ? `Opening ${params.url} in a new tab...` : 'Opening new tab...'}`;
        case 'closeTab': return '✓ Closing current tab...';
        case 'newWindow': return '✓ Opening new window...';
        case 'incognito': return '✓ Opening new incognito window...';
        case 'reload': return '✓ Reloading page...';
        case 'hardReload': return '✓ Force reloading page...';
        case 'goBack': return '✓ Going back to previous page...';
        case 'goForward': return '✓ Going forward to next page...';
        case 'clickLink': return `✓ Clicking link ${params.linkId}...`;
        case 'scrollDown': return '✓ Scrolling down the page...';
        case 'scrollUp': return '✓ Scrolling up the page...';
        case 'scrollTop': return '✓ Scrolling to top of the page...';
        case 'scrollBottom': return '✓ Scrolling to bottom of the page...';
        default: return `✓ ${command} executed successfully`;
    }
}

function convertBrowserAgentFormat(command) {
    const linkMatch = command.match(/Link:\s*([^\s\[]+)/);
    const contentMatch = command.match(/\[CONTENT\](.*?)\[\/CONTENT\]/);

    if (linkMatch) {
        const domain = linkMatch[1].trim();
        const content = contentMatch ? contentMatch[1].trim() : '';
        return `[LINK]${domain}[/LINK] [CONTENT]${content}[/CONTENT]`;
    }

    return command;
}

/**
 * parseAndExecuteCommands
 * When encountering a callBrowserAgent command, we now:
 * - Call browserAgent.searchEmbeddings() to get results
 * - Instead of appending results directly to chat, we will use these results as user input for Chromie
 *   so Chromie can respond with the `newTab` command.
 */
async function parseAndExecuteCommands(text) {
    const commandRegex = /<\[(\w+):(.*?)\]>/;
    const commandMatch = text.match(commandRegex);
    
    if (commandMatch && commandMatch[1]) {
        const command = commandMatch[1];
        const param = commandMatch[2].trim();

        if (command === 'callBrowserAgent') {
            const convertedParam = convertBrowserAgentFormat(param);
            const formattedResults = await browserAgent.searchEmbeddings(convertedParam);
            // Return these results so caller can handle them by re-prompting Chromie
            return { browserAgentResults: formattedResults };
        } else if ([ 'googleSearch', 'youtubeSearch', 'newTab', 'closeTab', 'newWindow', 
            'incognito', 'reload', 'hardReload', 'goBack', 'goForward', 'clickLink', 
            'scrollDown', 'scrollUp', 'scrollTop', 'scrollBottom'
        ].includes(command)) {
            let args = {};
            if (command === 'newTab') args.url = param;
            if (command === 'googleSearch' || command === 'youtubeSearch') args.query = param;
            if (command === 'clickLink') {
                const linkId = parseInt(param);
                if (isNaN(linkId)) throw new Error('Link ID must be a number');
                args.linkId = linkId;
            }

            await browserController.executeCommand(command.trim(), args);
            return getSuccessMessage(command.trim(), args);
        }
    }

    return text;
}

async function appendToChat(text, role = 'assistant', isError = false) {
    const responseContainer = document.getElementById('responseContainer');
    if (!responseContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role} ${isError ? 'error' : ''}`;
    
    const contextCheck = browserAgent.checkContextSize(text);
    if (!contextCheck.canAdd) {
        clearChat();
        appendToChat(contextCheck.message, 'assistant');
        return;
    }
    
    let processedText = text;
    if (role === 'assistant' && !isError) {
        const result = await parseAndExecuteCommands(text);
        if (result && result.browserAgentResults) {
            // Instead of showing these directly, feed them to Chromie as user input:
            await sendToOpenAI(result.browserAgentResults, false);
            return;
        } else if (typeof result === 'string') {
            processedText = result;
        }

        const sanitizedText = sanitizeHTML(processedText);
        try {
            messageDiv.innerHTML = parseMarkdown(sanitizedText);
        } catch (error) {
            console.error('Error parsing markdown:', error);
            messageDiv.textContent = processedText;
        }
    } else {
        messageDiv.textContent = processedText;
    }
    
    responseContainer.appendChild(messageDiv);
    responseContainer.scrollTop = responseContainer.scrollHeight;
    browserAgent.updateContextSize(text);

    if (role === 'assistant' && !isError && browserAgent.state.currentUrl) {
        try {
            await vectorStore.addDocuments(browserAgent.state.currentUrl, processedText);
            console.error('Stored embeddings for Chromie agent output under:', browserAgent.state.currentUrl);
        } catch (embedErr) {
            console.error('Error embedding Chromie agent output:', embedErr);
        }
    }
}

function clearChat() {
    const responseContainer = document.getElementById('responseContainer');
    if (responseContainer) {
        responseContainer.innerHTML = '';
    }
    conversationHistory = [];
    browserAgent.resetContext();
    chatInitialized = false;
    initializeChat();
}

function initializeChat() {
    if (!chatInitialized) {
        appendToChat("Hello! I'm Chromie, your Chrome browser assistant. How can I help you surf web today?", 'assistant');
        chatInitialized = true;
    }
}

async function handleDirectCommand(inputText) {
    if (inputText.toLowerCase().startsWith('search ')) {
        const query = inputText.slice(7).trim();
        await browserController.executeCommand('googleSearch', { query });
        return getSuccessMessage('googleSearch', { query });
    }
    return null;
}

/**
 * sendToOpenAI
 * 
 * If second parameter showUserMessage=false, we do not append the user's message to chat (used when injecting browser agent results).
 */
const sendToOpenAI = async (inputText, showUserMessage = true) => {
    toggleLoadingBubble(true);
    try {
        if (showUserMessage) {
            await appendToChat(inputText, 'user');
        }

        const directResult = await handleDirectCommand(inputText);
        if (directResult) {
            await appendToChat(directResult, 'assistant');
            return;
        }

        conversationHistory.push({ role: "user", content: inputText });

        const messages = [
            { role: "system", content: chromieSystemPrompt },
            ...conversationHistory
        ];

        const response = await chrome.runtime.sendMessage({
            action: "queryLMStudio",
            messages: messages
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to get response from LMStudio');
        }

        const finalContent = response.content;
        if (finalContent) {
            conversationHistory.push({ role: "assistant", content: finalContent });
            await appendToChat(finalContent, 'assistant');
        }
    } catch (error) {
        console.error('Error:', error);
        appendToChat(`Error: ${error.message}. Please check your settings and try again.`, 'assistant', true);
    } finally {
        toggleLoadingBubble(false);
    }
};

// Settings management
function saveSettings() {
    const settings = {
        contextWindow: document.getElementById('contextWindow').value,
        embeddingsEndpoint: document.getElementById('embeddingsEndpoint').value,
        embeddingsModel: document.getElementById('embeddingsModel').value
    };
    
    localStorage.setItem('chromieSettings', JSON.stringify(settings));
    chrome.storage.local.set({ chromieSettings: JSON.stringify(settings) });
    
    browserAgent.updateSettings({
        contextWindow: parseInt(settings.contextWindow),
        lmStudioEndpoint: settings.embeddingsEndpoint,
        lmStudioModel: settings.embeddingsModel
    });
    
    console.log('Settings saved:', settings);
}

// function loadSettings() {
//     const settings = JSON.parse(localStorage.getItem('chromieSettings'));
//     if (settings) {
//         document.getElementById('contextWindow').value = settings.contextWindow || '4000';
//         document.getElementById('embeddingsEndpoint').value = settings.embeddingsEndpoint || 'http://127.0.0.1:1234';
//         document.getElementById('embeddingsModel').value = settings.embeddingsModel || 'text-embedding-all-minilm-l6-v2-embedding';
        
//         browserAgent.updateSettings({
//             contextWindow: parseInt(settings.contextWindow),
//             lmStudioEndpoint: settings.embeddingsEndpoint,
//             lmStudioModel: settings.embeddingsModel
//         });
//     } else {
//         document.getElementById('embeddingsEndpoint').value = 'http://127.0.0.1:1234';
//         document.getElementById('embeddingsModel').value = 'text-embedding-all-minilm-l6-v2-embedding';
//         saveSettings();
//     }
// }

// Event Listeners
let microphonePermission = localStorage.getItem('microphonePermission');

document.addEventListener('DOMContentLoaded', () => {
    if (!chatInitialized) {
        initializeChat();
    }

    if (!eventListenersAdded) {
        eventListenersAdded = true;

        // Listen for messages from the iframe
        window.addEventListener('message', (event) => {
            if (event.data.type === 'PERMISSION_GRANTED') {
                localStorage.setItem('microphonePermission', 'granted');
                microphonePermission = 'granted';
                toggleSpeechRecognition();
            } else if (event.data.type === 'PERMISSION_DENIED') {
                localStorage.setItem('microphonePermission', 'denied');
                microphonePermission = 'denied';
                console.error('Microphone permission denied:', event.data.error);
            }
        });

        const micButton = document.getElementById('micButton');
        if (micButton) {
            micButton.addEventListener('click', async (e) => {
                e.preventDefault();
                // If permission not granted, request via iframe
                if (microphonePermission !== 'granted') {
                    let iframe = document.getElementById('permissionsIFrame');
                    if (!iframe) {
                        console.log('Permissions iframe not found, dispatching load event...');
                        // Dispatch the load event to trigger injectPermissionIframe.js
                        window.dispatchEvent(new Event('load'));
                        // Wait a short moment for the iframe to be injected
                        await new Promise(resolve => setTimeout(resolve, 200));
                        iframe = document.getElementById('permissionsIFrame');
                    }
        
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({ type: 'REQUEST_PERMISSION' }, '*');
                    } else {
                        console.error('Permissions iframe not found even after load event');
                    }
                } else {
                    // If already granted, just toggle recognition
                    toggleSpeechRecognition();
                }
            });
        }
        const settingsIcon = document.getElementById('settingsIcon');
        if (settingsIcon) {
            settingsIcon.addEventListener('click', function() {
                const settingsPanel = document.getElementById('settingsPanel');
                if (settingsPanel) {
                    settingsPanel.classList.toggle('visible');
                }
            });
        }

        document.addEventListener('click', function(event) {
            const settingsPanel = document.getElementById('settingsPanel');
            const settingsIcon = document.getElementById('settingsIcon');
            
            if (settingsPanel && settingsIcon && !settingsPanel.contains(event.target) && event.target !== settingsIcon) {
                settingsPanel.classList.remove('visible');
            }
        });

        ['contextWindow', 'embeddingsEndpoint', 'embeddingsModel'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', saveSettings);
            }
        });

        let sendTimeout;
        const sendDataButton = document.getElementById('sendDataButton');
        const textInput = document.getElementById('textInput');
        
        if (sendDataButton && textInput) {
            sendDataButton.addEventListener('click', function() {
                const inputData = textInput.value.trim();
                if (inputData) {
                    clearTimeout(sendTimeout);
                    sendTimeout = setTimeout(() => {
                        sendToOpenAI(inputData).then(() => {
                            textInput.value = '';
                        }).catch(error => {
                            console.error('Failed to send message:', error);
                            textInput.value = '';
                        });
                    }, 300);
                }
            });

            textInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const inputData = textInput.value.trim();
                    if (inputData) {
                        clearTimeout(sendTimeout);
                        sendTimeout = setTimeout(() => {
                            sendToOpenAI(inputData).then(() => {
                                textInput.value = '';
                            }).catch(error => {
                                console.error('Failed to send message:', error);
                                textInput.value = '';
                            });
                        }, 300);
                    }
                }
            });
        }

        const clearChatButton = document.getElementById('clearChatButton');
        if (clearChatButton) {
            clearChatButton.addEventListener('click', clearChat);
        }
    }
});

// Message listeners
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "processedContent") {
        lastProcessedUrl = message.url;
        console.error('sendToEndpoint.js - SUCCESS: Received DOM content');

        // Wait for embeddings to be ready
        browserAgent.processPageContent(message.content, message.url)
            .then(() => {
                console.error('sendToEndpoint.js - SUCCESS: Content processed and embeddings ready for:', message.url);
                // Now any callBrowserAgent command will work as contentProcessed = true       
                })
            .catch(error => {
                console.error('sendToEndpoint.js - ERROR: Failed to process content for URL:', message.url, error);
            });
    }

    if (message.action === "embeddingProgress") {
        updateProgressBar(message.progress, message.message, message.hide);
    }
});

// Exports
export const sendToEndpoint = {
    sendToOpenAI
};
