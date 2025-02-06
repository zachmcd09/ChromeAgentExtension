/**
 * ./scripts/speechHandler.js
 * 
 * This module manages speech recognition and text-to-speech functionality for the extension,
 * enabling voice interaction with the AI assistant.
 * 
 * Key Features:
 * - Speech recognition initialization and management
 * - Microphone permission handling
 * - Text-to-speech conversion
 * - Conversation mode support
 * 
 * Core Components:
 * 1. Permission Management
 *    - Handles microphone access requests
 *    - Manages permission state
 *    - Coordinates with permission iframe
 * 
 * 2. Speech Recognition
 *    - Initializes recognition engine
 *    - Manages recognition states
 *    - Handles continuous listening
 *    - Processes recognition results
 * 
 * 3. Text-to-Speech
 *    - Manages speech synthesis
 *    - Handles voice selection
 *    - Controls speaking states
 * 
 * 4. Conversation Mode
 *    - Toggles between single and continuous recognition
 *    - Manages conversation state
 *    - Handles silence detection
 */

// Speech recognition setup
let recognition = null;
let isListening = false;
let permissionGranted = false;
let silenceTimer = null;
let isSpeaking = false;
let conversationMode = false;

// Function to find the permissions iframe
function getPermissionsIframe() {
    return document.querySelector('#permissionsIFrame') || 
           window.parent.document.querySelector('#permissionsIFrame');
}

// Function to request permission through the iframe
function requestPermissionThroughIframe() {
    const iframe = getPermissionsIframe();
    if (iframe) {
        iframe.contentWindow.postMessage({ type: 'REQUEST_PERMISSION' }, '*');
    } else {
        console.error('Permissions iframe not found');
        document.getElementById('textInput').value = 'Error: Could not request microphone permission';
    }
}

// Listen for permission messages from the iframe
window.addEventListener('message', (event) => {
    console.log('Received message:', event.data);
    if (event.data.type === 'PERMISSION_GRANTED') {
        permissionGranted = true;
        console.log('Microphone permission granted');
        const micButton = document.getElementById('micButton');
        if (micButton && micButton.classList.contains('listening')) {
            initializeSpeechRecognition(); // Initialize before starting
            startListening();
        }
    } else if (event.data.type === 'PERMISSION_DENIED') {
        permissionGranted = false;
        console.error('Microphone permission denied:', event.data.error);
        document.getElementById('textInput').value = 'Microphone access denied. Please check your browser settings.';
        stopListening();
    }
});

// Initialize speech recognition based on browser support
function initializeSpeechRecognition() {
    if (recognition) return true; // Already initialized

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            document.getElementById('textInput').value = transcript;
            
            // Reset silence timer
            if (silenceTimer) clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
                if (isListening) {
                    const inputText = document.getElementById('textInput').value.trim();
                    if (inputText) {
                        document.getElementById('sendDataButton').click();
                    }
                    if (!conversationMode) {
                        stopListening();
                    }
                }
            }, 1500); // 1.5 seconds of silence triggers send
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                document.getElementById('textInput').value = 'Please allow microphone access and try again';
                document.getElementById('textInput').select();
                permissionGranted = false;
            }
            stopListening();
        };

        recognition.onend = () => {
            if (isListening && !isSpeaking && conversationMode) {
                // Restart recognition if we're in conversation mode
                try {
                    recognition.start();
                } catch (error) {
                    console.error('Error restarting recognition:', error);
                    stopListening();
                }
            }
        };
        return true;
    }
    return false;
}

// Toggle speech recognition
async function toggleSpeechRecognition() {
    const micButton = document.getElementById('micButton');
    
    if (isListening) {
        stopListening();
        return;
    }

    if (!recognition && !initializeSpeechRecognition()) {
        document.getElementById('textInput').value = 'Speech recognition is not supported in your browser';
        return;
    }

    micButton.classList.add('listening');
    
    if (!permissionGranted) {
        document.getElementById('textInput').value = 'Requesting microphone permission...';
        requestPermissionThroughIframe();
        return;
    }
    
    startListening();
}

function startListening() {
    if (!permissionGranted) {
        console.log('Cannot start listening without permission');
        return;
    }

    if (!recognition) {
        if (!initializeSpeechRecognition()) {
            console.error('Failed to initialize speech recognition');
            return;
        }
    }

    const micButton = document.getElementById('micButton');
    micButton.classList.add('listening');
    isListening = true;
    
    try {
        recognition.start();
        document.getElementById('textInput').value = 'Listening...';
    } catch (error) {
        console.error('Speech recognition start error:', error);
        stopListening();
        document.getElementById('textInput').value = 'Error starting speech recognition. Please try again.';
    }
}

function stopListening() {
    const micButton = document.getElementById('micButton');
    micButton.classList.remove('listening');
    isListening = false;
    if (recognition) {
        try {
            recognition.stop();
        } catch (error) {
            console.error('Speech recognition stop error:', error);
        }
    }
    if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }
}

// Text-to-Speech setup
function speak(text) {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
        console.error('Text-to-speech not supported');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get the system's default voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        // Try to find a system voice
        const systemVoice = voices.find(voice => 
            voice.name.includes('System') || 
            voice.name.includes('Default') ||
            voice.name.includes('Siri')
        );
        if (systemVoice) {
            utterance.voice = systemVoice;
        }
    }

    // Set up event handlers for the utterance
    utterance.onstart = () => {
        isSpeaking = true;
        if (isListening) {
            stopListening();
        }
    };

    utterance.onend = () => {
        isSpeaking = false;
        if (conversationMode) {
            startListening();
        }
    };

    window.speechSynthesis.speak(utterance);
}

// Initialize voices when they're loaded
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

// Initialize permission state and conversation mode
window.addEventListener('load', () => {
    // Initialize speech recognition early
    initializeSpeechRecognition();

    const iframe = getPermissionsIframe();
    if (iframe) {
        requestPermissionThroughIframe();
    }

    // Load conversation mode state
    const savedMode = localStorage.getItem('conversationMode');
    if (savedMode) {
        conversationMode = savedMode === 'true';
        document.getElementById('conversationMode').checked = conversationMode;
    }

    // Add conversation mode toggle listener
    document.getElementById('conversationMode').addEventListener('change', (e) => {
        conversationMode = e.target.checked;
        localStorage.setItem('conversationMode', conversationMode);
        
        if (!conversationMode && isListening) {
            stopListening();
        }
    });
});

export { toggleSpeechRecognition, speak };
