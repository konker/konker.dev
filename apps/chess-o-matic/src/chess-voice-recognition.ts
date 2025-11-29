// chess-voice-recognition.ts
// Chess move voice recognition using Vosk in the browser

import { createModel, KaldiRecognizer } from 'vosk-browser';

interface RecognitionResult {
  result?: Array<{
    conf: number;
    end: number;
    start: number;
    word: string;
  }>;
  text?: string;
}

interface PartialResult {
  partial: string;
}

export class ChessVoiceRecognizer {
  private model: any = null;
  private recognizer: KaldiRecognizer | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isListening: boolean = false;

  /**
   * Initialize the Vosk model
   * @param modelUrl URL to the Vosk model (must be served from same origin or with CORS)
   * @param grammar Optional chess move grammar to constrain recognition
   */
  async initialize(modelUrl: string, grammar?: string[]): Promise<void> {
    console.log('Loading Vosk model...');
    
    try {
      // Load the model
      this.model = await createModel(modelUrl);
      console.log('Model loaded successfully');

      // Create recognizer with or without grammar
      if (grammar && grammar.length > 0) {
        this.recognizer = new this.model.KaldiRecognizer(16000, JSON.stringify(grammar));
        console.log(`Recognizer created with grammar (${grammar.length} phrases)`);
      } else {
        this.recognizer = new this.model.KaldiRecognizer(16000);
        console.log('Recognizer created without grammar');
      }
    } catch (error) {
      console.error('Failed to initialize model:', error);
      throw error;
    }
  }

  /**
   * Start listening to microphone input
   * @param onResult Callback for final recognition results
   * @param onPartial Callback for partial recognition results (optional)
   */
  async startListening(
    onResult: (move: string) => void,
    onPartial?: (partial: string) => void
  ): Promise<void> {
    if (!this.recognizer) {
      throw new Error('Model not initialized. Call initialize() first.');
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    try {
      // Set up event listeners for results
      this.recognizer.on('result', (message) => {
        if ('result' in message && 'text' in message.result) {
          onResult(message.result.text);
        }
      });

      if (onPartial) {
        this.recognizer.on('partialresult', (message) => {
          if ('result' in message && 'partial' in message.result) {
            onPartial(message.result.partial);
          }
        });
      }

      this.recognizer.on('error', (message) => {
        console.error('Recognition error:', message);
      });

      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Load and create AudioWorklet processor
      await this.audioContext.audioWorklet.addModule(
        new URL('./audio-processor.worklet.ts', import.meta.url).href
      );

      this.workletNode = new AudioWorkletNode(
        this.audioContext,
        'audio-capture-processor'
      );

      // Handle audio data from worklet
      this.workletNode.port.onmessage = (event) => {
        if (!this.recognizer || !this.isListening) return;

        if (event.data.type === 'audio') {
          const audioData = event.data.data;
          // Send Float32Array directly to recognizer
          this.recognizer.acceptWaveformFloat(audioData, this.audioContext!.sampleRate);
        }
      };

      source.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination);

      this.isListening = true;
      console.log('Started listening');
    } catch (error) {
      console.error('Failed to start listening:', error);
      throw error;
    }
  }

  /**
   * Stop listening to microphone input
   */
  stopListening(): void {
    if (!this.isListening) {
      console.warn('Not currently listening');
      return;
    }

    // Retrieve final result before stopping (triggers a result event)
    if (this.recognizer) {
      this.recognizer.retrieveFinalResult();
    }

    // Clean up audio resources
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.onmessage = null;
      this.workletNode = null;
    }

    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.isListening = false;
    console.log('Stopped listening');
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopListening();
    this.recognizer = null;
    this.model = null;
  }
}

/**
 * Convert spoken chess move to standard algebraic notation
 */
export function convertToStandardNotation(spokenMove: string): string | null {
  const move = spokenMove.trim().toLowerCase();

  // Handle castling
  if (
    move.includes('castle kingside') ||
    move.includes('castle king side') ||
    move.includes('kingside castle') ||
    move.includes('king side castle') ||
    move.includes('short castle')
  ) {
    return 'O-O';
  }
  if (
    move.includes('castle queenside') ||
    move.includes('castle queen side') ||
    move.includes('queenside castle') ||
    move.includes('queen side castle') ||
    move.includes('long castle')
  ) {
    return 'O-O-O';
  }

  // Convert spoken numbers to digits
  const wordToDigit: { [key: string]: string } = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8'
  };

  let processedMove = move;
  for (const [word, digit] of Object.entries(wordToDigit)) {
    processedMove = processedMove.replace(new RegExp(`\\b${word}\\b`, 'g'), digit);
  }

  // Clean up spaces and [unk] tokens to reconstruct moves
  // This handles cases like "e 4" or "e [unk]" -> "e4"
  const cleanedMove = processedMove.replace(/\[unk]/g, '').replace(/\s+/g, '');

  // Simple symbolic notation (already correct)
  if (/^[a-h][1-8]$/.test(cleanedMove)) {
    return cleanedMove;
  }

  // Piece moves with symbols (e.g., "nf3", "qd4")
  const pieceMap: { [key: string]: string } = {
    n: 'N',
    b: 'B',
    r: 'R',
    q: 'Q',
    k: 'K',
  };

  // Check for symbolic notation like "nf3"
  if (cleanedMove.length === 3 && pieceMap[cleanedMove[0]] && /^[a-h][1-8]$/.test(cleanedMove.slice(1))) {
    return pieceMap[cleanedMove[0]] + cleanedMove.slice(1);
  }

  // Handle "piece to square" format
  const pieceNames = ['knight', 'bishop', 'rook', 'queen', 'king', 'pawn'];

  for (const pieceName of pieceNames) {
    if (processedMove.startsWith(pieceName)) {
      const piece = pieceName === 'pawn' ? '' : pieceName[0].toUpperCase();

      // "knight takes f3" or "knight captures f3"
      if (processedMove.includes('takes') || processedMove.includes('captures')) {
        const parts = processedMove.split(/takes|captures/);
        if (parts.length === 2) {
          const square = parts[1].trim().replace(/\s/g, '');
          if (/^[a-h][1-8]$/.test(square)) {
            return `${piece}x${square}`;
          }
        }
      }

      // "knight to f3"
      if (processedMove.includes(' to ')) {
        const parts = processedMove.split(' to ');
        if (parts.length === 2) {
          const square = parts[1].trim().replace(/\s/g, '');
          if (/^[a-h][1-8]$/.test(square)) {
            return `${piece}${square}`;
          }
        }
      }
    }
  }

  // Handle pawn captures like "e takes d5"
  const captureMatch = processedMove.match(/^([a-h])\s*(?:takes|captures)\s*([a-h][1-8])$/);
  if (captureMatch) {
    return `${captureMatch[1]}x${captureMatch[2]}`;
  }

  // Special commands
  const commands: { [key: string]: string } = {
    check: '+',
    checkmate: '#',
    mate: '#',
    undo: 'UNDO',
    resign: 'RESIGN',
    draw: 'DRAW',
  };

  if (commands[cleanedMove]) {
    return commands[cleanedMove];
  }

  return null;
}

/**
 * Generate a comprehensive chess grammar for Vosk
 */
export function generateChessGrammar(): string[] {
  const grammar: string[] = ['[unk]'];

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const rankWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  const pieces = [
    { name: 'knight', symbol: 'n' },
    { name: 'bishop', symbol: 'b' },
    { name: 'rook', symbol: 'r' },
    { name: 'queen', symbol: 'q' },
    { name: 'king', symbol: 'k' },
  ];

  // Add individual files and rank words to vocabulary
  for (const file of files) {
    grammar.push(file);
  }
  for (const rankWord of rankWords) {
    grammar.push(rankWord);
  }

  // Add common chess terms
  grammar.push('to', 'takes', 'captures', 'castle', 'kingside', 'queenside');
  grammar.push('short', 'long', 'check', 'checkmate', 'mate');
  grammar.push('undo', 'resign', 'draw', 'pawn');

  // Add piece names
  for (const piece of pieces) {
    grammar.push(piece.name);
    grammar.push(piece.symbol);
  }

  // Generate all squares
  for (const file of files) {
    for (let i = 0; i < ranks.length; i++) {
      const rankWord = rankWords[i];
      const squareSpoken = `${file} ${rankWord}`;

      // Pawn moves (spoken form: "e four")
      grammar.push(squareSpoken);

      // Piece moves with spoken squares
      for (const piece of pieces) {
        // Symbolic notation spoken: "n f three"
        grammar.push(`${piece.symbol} ${file} ${rankWord}`);

        // English forms: "knight to e four"
        grammar.push(`${piece.name} to ${file} ${rankWord}`);
        grammar.push(`${piece.name} ${file} ${rankWord}`);

        // Captures: "knight takes e four"
        grammar.push(`${piece.name} takes ${file} ${rankWord}`);
        grammar.push(`${piece.name} captures ${file} ${rankWord}`);
      }

      // Pawn captures
      for (const file2 of files) {
        if (file !== file2) {
          const file2Square = `${file2} ${rankWord}`;
          grammar.push(`${file} takes ${file2Square}`);
          grammar.push(`pawn takes ${file} ${rankWord}`);
        }
      }
    }
  }

  // Special moves
  grammar.push('castle kingside', 'castle queenside');
  grammar.push('castle king side', 'castle queen side');
  grammar.push('short castle', 'long castle');
  grammar.push('kingside castle', 'queenside castle');
  grammar.push('king side castle', 'queen side castle');
  grammar.push('check', 'checkmate', 'mate');
  grammar.push('undo', 'resign', 'draw');

  return grammar;
}
