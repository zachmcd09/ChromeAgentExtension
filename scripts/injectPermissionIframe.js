/**
 * ./scripts/injectPermissionIframe.js
 * 
 * This module handles the injection of a hidden iframe used for requesting
 * microphone permissions in the Chrome extension. The iframe serves as a bridge
 * for handling permission requests in a way that persists across page reloads.
 * 
 * Key Features:
 * 1. Iframe injection for permission handling
 * 2. Microphone permission management
 * 3. Cross-frame communication support
 * 
 * @module injectPermissionIframe
 */

/**
 * Injects a hidden iframe into the page for handling microphone permissions.
 * The iframe is configured with the necessary attributes and permissions
 * to request and manage microphone access.
 * 
 * Key attributes:
 * - hidden: Keeps the iframe invisible to users
 * - id: Unique identifier for the iframe
 * - allow: Specifies allowed permissions (microphone)
 * - src: Points to the permission request page
 */
function injectMicrophonePermissionIframe() {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("hidden", "hidden");
    iframe.setAttribute("id", "permissionsIFrame");
    iframe.setAttribute("allow", "microphone");
    iframe.src = chrome.runtime.getURL("permission/index.html");
    document.body.appendChild(iframe);
}

// Inject iframe when the page loads
window.addEventListener('load', injectMicrophonePermissionIframe);
