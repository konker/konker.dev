export type KeyboardMode = "notation-only" | "board-aware";

export type KeyboardStatus =
  | "idle"
  | "building"
  | "awaiting-disambiguation"
  | "awaiting-promotion"
  | "complete"
  | "invalid";

export type KeyboardScreenState =
  | "base"
  | "secondary"
  | "destination"
  | "ambiguity"
  | "promotion";

export type KeyboardTurn = "w" | "b";

export type KeyboardOrientation = "white" | "black";

export type KeyboardCheckState = "safe" | "check" | "checkmate";

export type KeyboardPiece = "P" | "N" | "B" | "R" | "Q" | "K";

export type PromotionPiece = "N" | "B" | "R" | "Q";

export type KeyboardFile = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";

export type KeyboardRank = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

export type KeyboardSquare = `${KeyboardFile}${KeyboardRank}`;

export type KeyboardKeyCategory =
  | "piece"
  | "file"
  | "rank"
  | "modifier"
  | "annotation"
  | "promotion"
  | "navigation"
  | "editing"
  | "submission";

export type KeyboardKeyKind = "notation" | "action";

type KeyboardKeyDefinitionShape = {
  readonly category: KeyboardKeyCategory;
  readonly id: string;
  readonly kind: KeyboardKeyKind;
  readonly label: string;
  readonly screenStates: ReadonlyArray<KeyboardScreenState>;
  readonly value: string;
};

// This shared vocabulary is the canonical runtime contract between the headless core and any UI.
export const KEYBOARD_KEYS = [
  {
    id: "piece-knight",
    label: "N",
    value: "N",
    category: "piece",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "piece-bishop",
    label: "B",
    value: "B",
    category: "piece",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "piece-rook",
    label: "R",
    value: "R",
    category: "piece",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "piece-queen",
    label: "Q",
    value: "Q",
    category: "piece",
    kind: "notation",
    screenStates: ["base", "destination", "promotion"],
  },
  {
    id: "piece-king",
    label: "K",
    value: "K",
    category: "piece",
    kind: "notation",
    screenStates: ["base", "destination"],
  },
  {
    id: "file-a",
    label: "a",
    value: "a",
    category: "file",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "file-b",
    label: "b",
    value: "b",
    category: "file",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "file-c",
    label: "c",
    value: "c",
    category: "file",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "file-d",
    label: "d",
    value: "d",
    category: "file",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "file-e",
    label: "e",
    value: "e",
    category: "file",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "file-f",
    label: "f",
    value: "f",
    category: "file",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "file-g",
    label: "g",
    value: "g",
    category: "file",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "file-h",
    label: "h",
    value: "h",
    category: "file",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "rank-1",
    label: "1",
    value: "1",
    category: "rank",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "rank-2",
    label: "2",
    value: "2",
    category: "rank",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "rank-3",
    label: "3",
    value: "3",
    category: "rank",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "rank-4",
    label: "4",
    value: "4",
    category: "rank",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "rank-5",
    label: "5",
    value: "5",
    category: "rank",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "rank-6",
    label: "6",
    value: "6",
    category: "rank",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "rank-7",
    label: "7",
    value: "7",
    category: "rank",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "rank-8",
    label: "8",
    value: "8",
    category: "rank",
    kind: "notation",
    screenStates: ["base", "destination", "ambiguity"],
  },
  {
    id: "capture",
    label: "x",
    value: "x",
    category: "modifier",
    kind: "notation",
    screenStates: ["base", "destination"],
  },
  {
    id: "castle-kingside",
    label: "O-O",
    value: "O-O",
    category: "modifier",
    kind: "notation",
    screenStates: ["secondary"],
  },
  {
    id: "castle-queenside",
    label: "O-O-O",
    value: "O-O-O",
    category: "modifier",
    kind: "notation",
    screenStates: ["secondary"],
  },
  {
    id: "annotation-check",
    label: "+",
    value: "+",
    category: "annotation",
    kind: "notation",
    screenStates: ["secondary"],
  },
  {
    id: "annotation-checkmate",
    label: "#",
    value: "#",
    category: "annotation",
    kind: "notation",
    screenStates: ["secondary"],
  },
  {
    id: "annotation-good",
    label: "!",
    value: "!",
    category: "annotation",
    kind: "notation",
    screenStates: ["secondary"],
  },
  {
    id: "annotation-blunder",
    label: "?",
    value: "?",
    category: "annotation",
    kind: "notation",
    screenStates: ["secondary"],
  },
  {
    id: "annotation-interesting",
    label: "!?",
    value: "!?",
    category: "annotation",
    kind: "notation",
    screenStates: ["secondary"],
  },
  {
    id: "annotation-dubious",
    label: "?!",
    value: "?!",
    category: "annotation",
    kind: "notation",
    screenStates: ["secondary"],
  },
  {
    id: "promotion-equals",
    label: "=",
    value: "=",
    category: "promotion",
    kind: "notation",
    screenStates: ["destination", "promotion"],
  },
  {
    id: "toggle-secondary",
    label: "More",
    value: "",
    category: "navigation",
    kind: "action",
    screenStates: ["base", "secondary"],
  },
  {
    id: "backspace",
    label: "Backspace",
    value: "",
    category: "editing",
    kind: "action",
    screenStates: [
      "base",
      "secondary",
      "destination",
      "ambiguity",
      "promotion",
    ],
  },
  {
    id: "clear-token",
    label: "Clear Token",
    value: "",
    category: "editing",
    kind: "action",
    screenStates: [
      "base",
      "secondary",
      "destination",
      "ambiguity",
      "promotion",
    ],
  },
  {
    id: "clear",
    label: "Clear",
    value: "",
    category: "editing",
    kind: "action",
    screenStates: [
      "base",
      "secondary",
      "destination",
      "ambiguity",
      "promotion",
    ],
  },
  {
    id: "submit",
    label: "Submit",
    value: "",
    category: "submission",
    kind: "action",
    screenStates: [
      "base",
      "secondary",
      "destination",
      "ambiguity",
      "promotion",
    ],
  },
] as const satisfies ReadonlyArray<KeyboardKeyDefinitionShape>;

export type KeyboardKeyId = (typeof KEYBOARD_KEYS)[number]["id"];

export type KeyboardKeyDefinition = (typeof KEYBOARD_KEYS)[number];

export type KeyboardInputTokenType =
  | "piece"
  | "file"
  | "rank"
  | "capture"
  | "castle"
  | "promotion"
  | "annotation"
  | "unknown";

export type KeyboardInputToken = {
  readonly keyId?: KeyboardKeyId;
  readonly type: KeyboardInputTokenType;
  readonly value: string;
};

export type KeyboardInputBuffer = {
  readonly cursorOffset: number;
  readonly normalized: string;
  readonly raw: string;
  readonly tokens: ReadonlyArray<KeyboardInputToken>;
};

export type KeyboardLegalMove = {
  readonly from?: KeyboardSquare;
  readonly isCapture?: boolean;
  readonly piece?: KeyboardPiece;
  readonly promotion?: PromotionPiece;
  readonly san: string;
  readonly to?: KeyboardSquare;
  readonly uci: string;
};

export type KeyboardContext = {
  readonly checkState?: KeyboardCheckState;
  readonly fen?: string;
  readonly legalMoves?: ReadonlyArray<KeyboardLegalMove>;
  readonly orientation?: KeyboardOrientation;
  readonly turn?: KeyboardTurn;
};

export type MoveCandidateStatus = "exact" | "partial" | "invalid";

export type MoveCandidate = {
  readonly id: string;
  readonly isLegal: boolean;
  readonly missingKeyIds: ReadonlyArray<KeyboardKeyId>;
  readonly san: string;
  readonly source: "input" | "legal-move";
  readonly status: MoveCandidateStatus;
  readonly uci?: string;
};

export type DisambiguationOption = {
  readonly id: string;
  readonly label: string;
  readonly type: "file" | "rank" | "square";
  readonly value: string;
};

export type DisambiguationRequest = {
  readonly destination: KeyboardSquare;
  readonly options: ReadonlyArray<DisambiguationOption>;
  readonly piece: Exclude<KeyboardPiece, "P">;
  readonly sanPrefix: string;
};

export type PromotionRequest = {
  readonly defaultPiece: PromotionPiece;
  readonly destination: KeyboardSquare;
  readonly options: ReadonlyArray<PromotionPiece>;
  readonly sanPrefix: string;
};

export type KeyboardState = {
  readonly canSubmit: boolean;
  readonly candidates: ReadonlyArray<MoveCandidate>;
  readonly context?: KeyboardContext;
  readonly enabledKeys: ReadonlySet<KeyboardKeyId>;
  readonly inputBuffer: KeyboardInputBuffer;
  readonly mode: KeyboardMode;
  readonly normalizedInput: string;
  readonly pendingDisambiguation?: DisambiguationRequest;
  readonly pendingPromotion?: PromotionRequest;
  readonly rawInput: string;
  readonly screenState: KeyboardScreenState;
  readonly selectedCandidateId?: string;
  readonly status: KeyboardStatus;
  readonly tokens: ReadonlyArray<KeyboardInputToken>;
};

export type SubmitResult =
  | {
      readonly candidate: MoveCandidate;
      readonly ok: true;
      readonly state: KeyboardState;
    }
  | {
      readonly error:
        | "ambiguity-required"
        | "incomplete-move"
        | "invalid-move"
        | "promotion-required";
      readonly ok: false;
      readonly state: KeyboardState;
    };

export type KeyboardController = {
  readonly backspace: () => KeyboardState;
  readonly clear: () => KeyboardState;
  readonly clearToken: () => KeyboardState;
  readonly getState: () => KeyboardState;
  readonly pressKey: (keyId: KeyboardKeyId) => KeyboardState;
  readonly reset: () => KeyboardState;
  readonly selectCandidate: (candidateId: string) => KeyboardState;
  readonly setContext: (context?: KeyboardContext) => KeyboardState;
  readonly submit: () => SubmitResult;
  readonly toggleSecondary: () => KeyboardState;
};
