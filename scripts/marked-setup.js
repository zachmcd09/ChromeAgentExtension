/**
 * ./scripts/marked-setup.js
 * 
 * This module provides a simple wrapper for the marked markdown parser library.
 * It imports the ESM version of marked and re-exports it for use in the extension.
 * 
 * Key Features:
 * 1. ESM module import support
 * 2. Markdown parsing functionality
 * 3. Centralized marked configuration
 * 
 * The marked library is used throughout the extension for converting markdown
 * formatted text to HTML, particularly in chat responses and documentation display.
 * 
 * @module marked-setup
 */

// Import marked from the ESM build
import { marked } from '../node_modules/marked/lib/marked.esm.js';

// Re-export marked for use in other modules
export { marked };
