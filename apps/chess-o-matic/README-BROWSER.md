# Chess Voice Recognition for Web Browsers

A TypeScript/JavaScript implementation of chess move voice recognition using Vosk that runs entirely in the browser.

## Features

- ✅ **Runs in the browser** - No server required
- ✅ **TypeScript support** - Fully typed for better developer experience
- ✅ **Real-time recognition** - Low-latency voice recognition
- ✅ **Custom grammar** - Optimized for chess moves
- ✅ **Both notations** - Supports symbolic (e4, Nf3) and English (knight to f3)
- ✅ **Privacy-friendly** - All processing happens locally in the browser
- ✅ **No GPU required** - Runs on CPU using Web Audio API

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

This installs:
- `vosk-browser` - Vosk speech recognition for browsers
- `vite` - Fast development server and build tool
- `typescript` - TypeScript compiler

### 2. Download Vosk Model

Download a browser-compatible Vosk model:

**Recommended models:**
- [vosk-model-small-en-us-0.15](https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip) (~40MB)
- [vosk-model-en-us-0.22-lgraph](https://alphacephei.com/vosk/models/vosk-model-en-us-0.22-lgraph.zip) (~128MB)

Extract to your project directory, e.g., `./vosk-model-small-en-us-0.15/`

### 3. Development Mode

Start the Vite dev server with hot module replacement:

```bash
pnpm dev
```

This will:
- Start a dev server with HTTPS (required for microphone access)
- Automatically open your browser at `https://localhost:3000`
- Provide hot module replacement for instant updates
- Show helpful error messages

**Note:** You may need to accept the self-signed certificate in your browser.

### 4. Production Build

Build for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

### 5. Type Checking

Run TypeScript type checking without emitting files:

```bash
pnpm typecheck
```

## Project Structure

```
.
├── src/
│   └── chess-voice-recognition.ts  # Main TypeScript implementation
├── index.html                      # Demo web page (entry point)
├── vite.config.ts                  # Vite configuration
├── package.json                    # NPM dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── vosk-model-small-en-us-0.15/    # Vosk model (you download this)
└── dist/                           # Production build output (generated)
    ├── index.html
    └── assets/
        └── *.js                    # Bundled JavaScript
```

## Usage

### Basic Usage in HTML

With Vite, you can import TypeScript files directly:

```html
<script type="module">
  import { ChessVoiceRecognizer, generateChessGrammar } from './src/chess-voice-recognition.ts';

  const recognizer = new ChessVoiceRecognizer();
  const grammar = generateChessGrammar();

  // Initialize
  await recognizer.initialize('./vosk-model-small-en-us-0.15', grammar);

  // Start listening
  await recognizer.startListening(
    (move) => console.log('Move:', move),
    (partial) => console.log('Partial:', partial)
  );

  // Stop listening
  recognizer.stopListening();
</script>
```

In production builds, the TypeScript will be compiled and bundled automatically.

### Integration with Chess.js

```typescript
import { Chess } from 'chess.js';
import { ChessVoiceRecognizer, convertToStandardNotation, generateChessGrammar } from './chess-voice-recognition';

const chess = new Chess();
const recognizer = new ChessVoiceRecognizer();

// Initialize with dynamic grammar based on legal moves
function getLegalMovesGrammar() {
  const legalMoves = chess.moves({ verbose: true });
  const grammar = ['[unk]'];
  
  for (const move of legalMoves) {
    // Add SAN notation
    grammar.push(move.san.toLowerCase());
    
    // Add spoken form
    const spoken = convertSanToSpoken(move.san);
    grammar.push(spoken);
  }
  
  return grammar;
}

await recognizer.initialize('./vosk-model-small-en-us-0.15', getLegalMovesGrammar());

recognizer.startListening((spokenMove) => {
  const notation = convertToStandardNotation(spokenMove);
  
  try {
    const move = chess.move(notation);
    console.log('Move made:', move);
    
    // Update grammar for next move
    const newGrammar = getLegalMovesGrammar();
    // Note: You'll need to recreate the recognizer with new grammar
  } catch (error) {
    console.error('Illegal move:', notation);
  }
});
```

### React Component Example

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { ChessVoiceRecognizer, generateChessGrammar } from './chess-voice-recognition';

export function ChessVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [moves, setMoves] = useState<string[]>([]);
  const recognizerRef = useRef<ChessVoiceRecognizer | null>(null);

  useEffect(() => {
    const recognizer = new ChessVoiceRecognizer();
    recognizerRef.current = recognizer;

    async function init() {
      const grammar = generateChessGrammar();
      await recognizer.initialize('./vosk-model-small-en-us-0.15', grammar);
    }

    init();

    return () => {
      recognizer.destroy();
    };
  }, []);

  const startListening = async () => {
    if (!recognizerRef.current) return;

    await recognizerRef.current.startListening(
      (move) => {
        setMoves((prev) => [...prev, move]);
        setPartial('');
      },
      (partial) => setPartial(partial)
    );

    setIsListening(true);
  };

  const stopListening = () => {
    recognizerRef.current?.stopListening();
    setIsListening(false);
    setPartial('');
  };

  return (
    <div>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? 'Stop' : 'Start'} Listening
      </button>
      <div>Listening: {partial}</div>
      <ul>
        {moves.map((move, i) => (
          <li key={i}>{move}</li>
        ))}
      </ul>
    </div>
  );
}
```

## API Reference

### ChessVoiceRecognizer

```typescript
class ChessVoiceRecognizer {
  // Initialize the model
  async initialize(modelUrl: string, grammar?: string[]): Promise<void>

  // Start listening to microphone
  async startListening(
    onResult: (move: string) => void,
    onPartial?: (partial: string) => void
  ): Promise<void>

  // Stop listening
  stopListening(): void

  // Check if currently listening
  getIsListening(): boolean

  // Clean up resources
  destroy(): void
}
```

### Utility Functions

```typescript
// Convert spoken move to standard notation
function convertToStandardNotation(spokenMove: string): string | null

// Generate comprehensive chess grammar
function generateChessGrammar(): string[]
```

## Browser Compatibility

The Vosk browser implementation requires:
- ✅ Modern browsers (Chrome 57+, Firefox 52+, Safari 11+, Edge 79+)
- ✅ Web Audio API support
- ✅ MediaDevices API (for microphone access)
- ✅ Web Workers support
- ✅ WebAssembly support

**Note:** Does not work in:
- ❌ Internet Explorer
- ❌ Very old mobile browsers
- ❌ file:// protocol (must use http:// or https://)

## Performance Optimization

### Reduce Model Size

For faster loading, use the smallest model that meets your accuracy needs:
- **vosk-model-small-en-us-0.15** (~40MB) - Fast, good accuracy
- **vosk-model-en-us-0.22-lgraph** (~128MB) - Better accuracy

### Dynamic Grammar

Update grammar based on legal moves in current position:

```typescript
function getPositionGrammar(chess: Chess): string[] {
  const legalMoves = chess.moves();
  const grammar = ['[unk]'];
  
  for (const move of legalMoves) {
    grammar.push(move.toLowerCase());
    // Add spoken variations
  }
  
  return grammar;
}

// When position changes, recreate recognizer with new grammar
```

### Caching

Cache the model in browser storage:

```typescript
// Service Worker caching example
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('vosk-models').then((cache) => {
      return cache.addAll([
        '/vosk-model-small-en-us-0.15/model.tar.gz',
        // other model files
      ]);
    })
  );
});
```

## Troubleshooting

### Model Loading Fails

**Problem:** CORS errors when loading model files

**Solution:** Ensure model files are served from same origin, or configure CORS headers:
```
Access-Control-Allow-Origin: *
```

### Microphone Access Denied

**Problem:** Browser blocks microphone access

**Solution:** 
- Use HTTPS (required for production)
- Check browser permissions
- User must explicitly grant permission

### Poor Recognition Accuracy

**Solutions:**
1. Use a larger model
2. Ensure good microphone quality
3. Reduce background noise
4. Use custom grammar with only legal moves
5. Speak clearly and at moderate pace

### High Memory Usage

**Solutions:**
1. Use smaller model
2. Limit grammar size
3. Destroy recognizer when not needed
4. Use dynamic grammar based on position

### Works Locally but Not in Production

**Common issues:**
- Not using HTTPS (required for microphone access)
- Model files not properly deployed
- CORS issues with model files
- File paths incorrect in production

## Advanced Features

### Confidence Scores

Access word-level confidence scores:

```typescript
recognizer.startListening((move) => {
  // Parse the result to get confidence scores
  const result = JSON.parse(/* result string */);
  if (result.result) {
    for (const word of result.result) {
      console.log(`${word.word}: ${word.conf}`);
    }
  }
});
```

### Voice Commands

Extend grammar with game commands:

```typescript
const extendedGrammar = [
  ...generateChessGrammar(),
  'new game',
  'undo move',
  'show hints',
  'flip board',
  'resign',
  'offer draw'
];
```

### Multi-language Support

Use language-specific models:
- Spanish: vosk-model-small-es-0.42
- French: vosk-model-small-fr-0.22
- German: vosk-model-small-de-0.15

## Resources

- [Vosk Browser GitHub](https://github.com/ccoreilly/vosk-browser)
- [Vosk Models](https://alphacephei.com/vosk/models)
- [Vosk Documentation](https://alphacephei.com/vosk/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Chess.js](https://github.com/jhlywa/chess.js)

## License

MIT

## Notes

- Vosk browser implementation uses WebAssembly for efficient CPU processing
- All processing happens locally - no data sent to servers
- First load will be slower due to model download
- Consider implementing progressive web app (PWA) for offline support
