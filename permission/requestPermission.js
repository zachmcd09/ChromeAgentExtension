/** ./permission/requestPermission.js
 * Requests user permission for microphone access.
 * @returns {Promise<void>} A Promise that resolves when permission is granted or rejects with an error.
 */
async function getUserPermission() {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("Microphone access granted");
        
        // Stop the tracks to prevent the recording indicator from being shown
        stream.getTracks().forEach(function (track) {
            track.stop();
        });
        
        // Notify the parent window that permission was granted
        window.parent.postMessage({ type: 'PERMISSION_GRANTED' }, '*');
        
        // Store permission state
        localStorage.setItem('microphonePermission', 'granted');
    } catch (error) {
        console.error("Error requesting microphone permission", error);
        // Notify the parent window that permission was denied
        window.parent.postMessage({ type: 'PERMISSION_DENIED', error: error.message }, '*');
        
        // Store permission state
        localStorage.setItem('microphonePermission', 'denied');
    }
}

// Listen for permission request messages from the parent
window.addEventListener('message', (event) => {
    if (event.data.type === 'REQUEST_PERMISSION') {
        getUserPermission();
    }
});