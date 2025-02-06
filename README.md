# Chrome Extension with AI-Powered Browser Assistant

This Chrome extension implements an AI-powered browser assistant that helps users interact with web content through natural language, vector embeddings, and sophisticated browser control capabilities.

## Architecture Overview

The application is built with several key components that work together to provide an intelligent browsing experience:

### 1. Core Components

#### Browser Agent (`browserAgent.js`)

**BrowserAgent Class**
- **Properties:**
  - `maxContextSize` (number): Maximum allowed context window size (4000 tokens)
  - `currentContextSize` (number): Current size of the context window
  - `maxTokensPerChunk` (number): Maximum tokens per content chunk (512)
  - `currentUrl` (string): Currently processed URL
  - `processingUrls` (Set): Set of URLs currently being processed
  - `systemPrompt` (string): System prompt defining agent behavior

**Key Functions:**
- `handleEmbeddingStateUpdate(url, state)`: Updates UI components with embedding generation progress
  - Parameters:
    - `url`: URL being processed
    - `state`: Current state of embedding generation
  - Returns: Promise<void>

- `extractWebContent(document, url)`: Extracts and processes web content
  - Parameters:
    - `document`: DOM document to process
    - `url`: URL of the webpage
  - Returns: Object containing processed content or null

- `cleanText(text)`: Cleans text content by removing excess whitespace
  - Parameters:
    - `text`: Text to clean
  - Returns: Cleaned text string

- `tokenizeText(text)`: Splits text into manageable chunks
  - Parameters:
    - `text`: Text to tokenize
  - Returns: Array of text chunks

#### Browser Control (`browserControl.js`)

**BrowserController Class**
- **Properties:**
  - `DEBUG` (boolean): Debug mode flag

**Key Functions:**
- `executeCommand(command, params)`: Executes browser commands
  - Parameters:
    - `command`: Command to execute (e.g., 'youtubeSearch', 'googleSearch')
    - `params`: Command parameters
  - Returns: Promise<boolean>

#### Vector Store (`vectorStore.js`)

**VectorStore Class**
- **Properties:**
  - `chromaClient`: ChromaDB client instance
  - `embeddings`: Embeddings generator instance
  - `initialized` (boolean): Initialization state
  - `batchSize` (number): Size of processing batches
  - `collectionCache` (Map): Cache of collection instances
  - `embeddingState` (Map): State of embedding operations

**Key Functions:**
- `initialize()`: Initializes the vector store
  - Returns: Promise<void>

- `addDocuments(url, documents, metadata)`: Adds documents to collection
  - Parameters:
    - `url`: Collection identifier
    - `documents`: Array of documents
    - `metadata`: Optional metadata
  - Returns: Promise<Object>

- `queryCollection(url, queryText, numResults)`: Queries collection
  - Parameters:
    - `url`: Collection to query
    - `queryText`: Query string
    - `numResults`: Number of results to return
  - Returns: Promise<Object>

### 2. Server Components

#### ChromaDB Server (`chromaServer.js`)

**ChromaServerManager Class**
- **Properties:**
  - `serverUrl` (string): URL where ChromaDB server runs
  - `isRunning` (boolean): Current server running state
  - `startupAttempts` (number): Count of startup attempts
  - `maxStartupAttempts` (number): Maximum allowed startup attempts
  - `checkInterval` (number|null): Health check interval ID

**Key Functions:**
- `checkServer()`: Checks server health
  - Returns: Promise<boolean>

- `startServer()`: Starts ChromaDB server
  - Returns: Promise<boolean>

- `ensureServerRunning()`: Ensures server is running
  - Returns: Promise<boolean>

#### ChromaDB Setup (`chromaSetup.js`)

**ChromaManager Class**
- **Properties:**
  - `client`: ChromaDB client instance
  - `collections` (Map): Cache of collection instances
  - `initializationPromise`: Tracks initialization state
  - `retryAttempts` (number): Number of retry attempts
  - `retryDelay` (number): Delay between retry attempts

**Key Functions:**
- `initialize()`: Initializes ChromaDB connection
  - Returns: Promise<boolean>

- `ensureCollection(collectionId, metadata)`: Creates/gets collection
  - Parameters:
    - `collectionId`: Collection identifier
    - `metadata`: Optional metadata
  - Returns: Promise<Object>

### 3. Content Processing

#### Content Script (`content-script.js`)

**Global State:**
- `pageLinks` (Array): Stores page link information
- `isProcessingEmbeddings` (boolean): Processing state flag
- `lastProcessedUrl` (string|null): Last processed URL

**Key Functions:**
- `processPageContent()`: Processes webpage content
  - Returns: string (processed content)

- `clickLink(linkId)`: Handles link clicking
  - Parameters:
    - `linkId`: ID of link to click
  - Returns: Object (click result)

- `scrollToContent(position)`: Handles content scrolling
  - Parameters:
    - `position`: Position to scroll to
  - Returns: boolean

#### Service Worker (`service-worker.js`)

**Key Functions:**
- `cleanText(text)`: Normalizes text content
  - Parameters:
    - `text`: Text to clean
  - Returns: string

- `tokenizeText(text, maxTokensPerChunk)`: Splits text into chunks
  - Parameters:
    - `text`: Text to tokenize
    - `maxTokensPerChunk`: Maximum tokens per chunk
  - Returns: Array<string>

- `withCollectionLock(url, operation)`: Ensures atomic operations
  - Parameters:
    - `url`: Operation identifier
    - `operation`: Function to execute
  - Returns: Promise<any>

### 4. User Interface Components

#### Speech Handler (`speechHandler.js`)

**Global State:**
- `recognition`: Speech recognition instance
- `isListening` (boolean): Listening state
- `permissionGranted` (boolean): Permission state
- `silenceTimer`: Silence detection timer
- `isSpeaking` (boolean): Speaking state
- `conversationMode` (boolean): Conversation mode state

**Key Functions:**
- `toggleSpeechRecognition()`: Toggles speech recognition
  - Returns: Promise<void>

- `speak(text)`: Converts text to speech
  - Parameters:
    - `text`: Text to speak
  - Returns: void

#### Permission Management (`injectPermissionIframe.js`)

**Key Functions:**
- `injectMicrophonePermissionIframe()`: Injects permission iframe
  - Returns: void

### 5. Communication Layer

#### OpenAI/LMStudio Integration (`sendToOpenAI.js`)

**Key Functions:**
- `queryLMStudio(messages, temperature)`: Queries LMStudio API
  - Parameters:
    - `messages`: Conversation messages
    - `temperature`: Generation temperature
  - Returns: Promise<string>

- `parseAndExecuteCommands(text)`: Processes commands
  - Parameters:
    - `text`: Text to parse
  - Returns: Promise<string>

#### LMStudio Embeddings (`lmstudio.js`)

**LMStudioEmbeddings Class**
- **Properties:**
  - `model` (string): Model identifier
  - `baseUrl` (string): API endpoint
  - `maxRetries` (number): Maximum retry attempts
  - `retryDelay` (number): Delay between retries
  - `maxTokensPerRequest` (number): Token limit
  - `embeddingDimension` (number): Embedding size

**Key Functions:**
- `embedQuery(text)`: Generates query embedding
  - Parameters:
    - `text`: Query text
  - Returns: Promise<number[]>

- `embedDocuments(texts)`: Generates document embeddings
  - Parameters:
    - `texts`: Array of texts
  - Returns: Promise<number[][]>

#### ChromaDB Client (`chromadb/index.js`)

**ChromaClient Class**
- **Properties:**
  - `endpoint` (string): Server endpoint
  - `collections` (Map): Collection cache
  - `debug` (boolean): Debug mode flag
  - `initLocks` (Map): Initialization locks

**Key Functions:**
- `heartbeat()`: Checks server health
  - Returns: Promise<Object>

- `createCollection(params)`: Creates new collection
  - Parameters:
    - `name`: Collection name
    - `metadata`: Optional metadata
  - Returns: Promise<Object>

- `query(params)`: Queries collection
  - Parameters:
    - `queryEmbeddings`: Query vectors
    - `nResults`: Number of results
    - `where`: Query filters
    - `include`: Result fields
  - Returns: Promise<Object>

## Error Handling

The application implements comprehensive error handling through:

1. **Retry Mechanisms**
   - Automatic retry for failed operations with exponential backoff
   - Maximum retry limits with configurable attempts
   - State recovery after failures

2. **Validation**
   - Input data validation for all operations
   - Embedding format verification
   - API response checking and error recovery

3. **State Management**
   - Collection state tracking and recovery
   - Connection management and reestablishment
   - Cache invalidation and rebuilding

## Performance Optimization

1. **Batch Processing**
   - Document chunking for optimal processing
   - Batched embedding generation
   - Efficient ChromaDB operations

2. **Caching**
   - Collection and embedding state caching
   - Result caching for improved performance
   - Efficient memory management

3. **Resource Management**
   - Automatic cleanup of old collections
   - Memory optimization strategies
   - Connection pooling and reuse

## Security Considerations

1. **Permission Management**
   - Secure microphone access handling
   - Iframe-based permission requests
   - State persistence and validation

2. **Data Validation**
   - Input sanitization and validation
   - Embedding format verification
   - API response validation

3. **Error Prevention**
   - Comprehensive error checking
   - Secure state management
   - Protected communication channels

## Dependencies

- ChromaDB: Vector database for embedding storage
- LMStudio: Embedding generation and LLM integration
- Chrome Extension APIs: Browser integration
- Web Speech API: Voice interaction capabilities

## Future Improvements

1. **Enhanced Language Models**
   - Multiple LLM provider support
   - Improved context handling
   - Advanced conversation management

2. **Advanced Browser Control**
   - Sophisticated navigation patterns
   - Enhanced interaction capabilities
   - Improved command processing

3. **Optimized Storage**
   - Embedding compression techniques
   - Advanced cache management
   - Enhanced collection handling

4. **Extended Features**
   - Multi-language support
   - Advanced voice interaction
   - Improved semantic search capabilities
