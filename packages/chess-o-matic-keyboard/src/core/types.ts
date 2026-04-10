export type KeyboardLayer = 'primary' | 'secondary' | 'settings';

export type KeyboardPiece = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';

export type KeyboardFile = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

export type KeyboardRank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

export type KeyboardOrientation = 'black' | 'white';
export type KeyboardHighlightsMode = 'after-input' | 'always' | 'off';

export type KeyboardKeyCategory =
  | 'piece'
  | 'file'
  | 'rank'
  | 'modifier'
  | 'annotation'
  | 'navigation'
  | 'editing'
  | 'submission'
  | 'settings';

export type KeyboardKeyKind = 'notation' | 'action';

type KeyboardKeyDefinitionShape = {
  readonly category: KeyboardKeyCategory;
  readonly id: string;
  readonly kind: KeyboardKeyKind;
  readonly label: string;
  readonly layers: ReadonlyArray<KeyboardLayer>;
  readonly value: string;
};

export const KEYBOARD_KEYS = [
  { id: 'piece-king', label: 'K', value: 'K', category: 'piece', kind: 'notation', layers: ['primary'] },
  { id: 'piece-queen', label: 'Q', value: 'Q', category: 'piece', kind: 'notation', layers: ['primary'] },
  { id: 'piece-rook', label: 'R', value: 'R', category: 'piece', kind: 'notation', layers: ['primary'] },
  { id: 'piece-bishop', label: 'B', value: 'B', category: 'piece', kind: 'notation', layers: ['primary'] },
  { id: 'piece-knight', label: 'N', value: 'N', category: 'piece', kind: 'notation', layers: ['primary'] },
  { id: 'file-a', label: 'a', value: 'a', category: 'file', kind: 'notation', layers: ['primary'] },
  { id: 'file-b', label: 'b', value: 'b', category: 'file', kind: 'notation', layers: ['primary'] },
  { id: 'file-c', label: 'c', value: 'c', category: 'file', kind: 'notation', layers: ['primary'] },
  { id: 'file-d', label: 'd', value: 'd', category: 'file', kind: 'notation', layers: ['primary'] },
  { id: 'file-e', label: 'e', value: 'e', category: 'file', kind: 'notation', layers: ['primary'] },
  { id: 'file-f', label: 'f', value: 'f', category: 'file', kind: 'notation', layers: ['primary'] },
  { id: 'file-g', label: 'g', value: 'g', category: 'file', kind: 'notation', layers: ['primary'] },
  { id: 'file-h', label: 'h', value: 'h', category: 'file', kind: 'notation', layers: ['primary'] },
  { id: 'rank-1', label: '1', value: '1', category: 'rank', kind: 'notation', layers: ['primary'] },
  { id: 'rank-2', label: '2', value: '2', category: 'rank', kind: 'notation', layers: ['primary'] },
  { id: 'rank-3', label: '3', value: '3', category: 'rank', kind: 'notation', layers: ['primary'] },
  { id: 'rank-4', label: '4', value: '4', category: 'rank', kind: 'notation', layers: ['primary'] },
  { id: 'rank-5', label: '5', value: '5', category: 'rank', kind: 'notation', layers: ['primary'] },
  { id: 'rank-6', label: '6', value: '6', category: 'rank', kind: 'notation', layers: ['primary'] },
  { id: 'rank-7', label: '7', value: '7', category: 'rank', kind: 'notation', layers: ['primary'] },
  { id: 'rank-8', label: '8', value: '8', category: 'rank', kind: 'notation', layers: ['primary'] },
  { id: 'capture', label: 'x', value: 'x', category: 'modifier', kind: 'notation', layers: ['primary'] },
  { id: 'castle-kingside', label: 'O-O', value: 'O-O', category: 'modifier', kind: 'notation', layers: ['secondary'] },
  {
    id: 'castle-queenside',
    label: 'O-O-O',
    value: 'O-O-O',
    category: 'modifier',
    kind: 'notation',
    layers: ['secondary'],
  },
  { id: 'annotation-check', label: '+', value: '+', category: 'annotation', kind: 'notation', layers: ['secondary'] },
  {
    id: 'annotation-checkmate',
    label: '#',
    value: '#',
    category: 'annotation',
    kind: 'notation',
    layers: ['secondary'],
  },
  { id: 'annotation-good', label: '!', value: '!', category: 'annotation', kind: 'notation', layers: ['secondary'] },
  {
    id: 'annotation-brilliant',
    label: '!!',
    value: '!!',
    category: 'annotation',
    kind: 'notation',
    layers: ['secondary'],
  },
  { id: 'annotation-blunder', label: '?', value: '?', category: 'annotation', kind: 'notation', layers: ['secondary'] },
  {
    id: 'annotation-mistake',
    label: '??',
    value: '??',
    category: 'annotation',
    kind: 'notation',
    layers: ['secondary'],
  },
  {
    id: 'annotation-interesting',
    label: '!?',
    value: '!?',
    category: 'annotation',
    kind: 'notation',
    layers: ['secondary'],
  },
  {
    id: 'annotation-dubious',
    label: '?!',
    value: '?!',
    category: 'annotation',
    kind: 'notation',
    layers: ['secondary'],
  },
  { id: 'promotion-equals', label: '=', value: '=', category: 'modifier', kind: 'notation', layers: ['secondary'] },
  { id: 'coordinate-separator', label: '-', value: '-', category: 'modifier', kind: 'notation', layers: ['secondary'] },
  {
    id: 'toggle-secondary',
    label: 'ALT',
    value: '',
    category: 'navigation',
    kind: 'action',
    layers: ['primary', 'secondary'],
  },
  {
    id: 'toggle-settings',
    label: 'Settings',
    value: '',
    category: 'settings',
    kind: 'action',
    layers: ['primary', 'secondary', 'settings'],
  },
  {
    id: 'backspace',
    label: 'Backspace',
    value: '',
    category: 'editing',
    kind: 'action',
    layers: ['primary', 'secondary', 'settings'],
  },
  {
    id: 'clear',
    label: 'Clear',
    value: '',
    category: 'editing',
    kind: 'action',
    layers: ['primary', 'secondary', 'settings'],
  },
  {
    id: 'submit',
    label: 'Submit',
    value: '',
    category: 'submission',
    kind: 'action',
    layers: ['primary', 'secondary', 'settings'],
  },
] as const satisfies ReadonlyArray<KeyboardKeyDefinitionShape>;

export type KeyboardKeyId = (typeof KEYBOARD_KEYS)[number]['id'];

export type KeyboardKeyDefinition = (typeof KEYBOARD_KEYS)[number];

export type KeyboardContext = {
  readonly legalMovesSan?: ReadonlyArray<string>;
};

export type KeyboardBehaviorSettings = {
  readonly autoSubmit: boolean;
  readonly candidateBar: boolean;
  readonly keyHighlightsMode: KeyboardHighlightsMode;
  readonly orientation: KeyboardOrientation;
  readonly showReadout: boolean;
};

export const DEFAULT_KEYBOARD_BEHAVIOR_SETTINGS: KeyboardBehaviorSettings = {
  autoSubmit: true,
  candidateBar: true,
  keyHighlightsMode: 'always',
  orientation: 'white',
  showReadout: true,
};

export type KeyboardState = {
  readonly autoSubmitMatch?: string;
  readonly exactMatches: ReadonlyArray<string>;
  readonly highlightedKeyIds: ReadonlySet<KeyboardKeyId>;
  readonly input: string;
  readonly layer: KeyboardLayer;
  readonly legalMovesSan: ReadonlyArray<string>;
  readonly matchingMoves: ReadonlyArray<string>;
  readonly selectedCandidateId?: string;
  readonly settings: KeyboardBehaviorSettings;
  readonly shouldAutoSubmit: boolean;
};

export type KeyboardModel = {
  readonly context?: KeyboardContext;
  readonly state: KeyboardState;
};

export type KeyboardAction =
  | { readonly type: 'backspace' }
  | { readonly type: 'clear' }
  | { readonly keyId: KeyboardKeyId; readonly type: 'press-key' }
  | { readonly type: 'reset' }
  | { readonly candidate: string; readonly type: 'select-candidate' }
  | { readonly context?: KeyboardContext; readonly type: 'set-context' }
  | { readonly input: string; readonly type: 'set-input' }
  | { readonly layer: KeyboardLayer; readonly type: 'set-layer' }
  | { readonly settings: Partial<KeyboardBehaviorSettings>; readonly type: 'set-settings' }
  | { readonly type: 'toggle-secondary' }
  | { readonly type: 'toggle-settings' };

export type KeyboardSubmitSource = 'auto' | 'candidate' | 'manual';

export type KeyboardSubmitEvent = {
  readonly exactLegalMatch?: string;
  readonly input: string;
  readonly matchingMoves: ReadonlyArray<string>;
  readonly source: KeyboardSubmitSource;
  readonly state: KeyboardState;
};

export type KeyboardController = {
  readonly backspace: () => KeyboardState;
  readonly clear: () => KeyboardState;
  readonly getModel: () => KeyboardModel;
  readonly getState: () => KeyboardState;
  readonly pressKey: (keyId: KeyboardKeyId) => KeyboardState;
  readonly reset: () => KeyboardState;
  readonly selectCandidate: (candidate: string) => KeyboardState;
  readonly setContext: (context?: KeyboardContext) => KeyboardState;
  readonly setInput: (input: string) => KeyboardState;
  readonly setLayer: (layer: KeyboardLayer) => KeyboardState;
  readonly setSettings: (settings: Partial<KeyboardBehaviorSettings>) => KeyboardState;
  readonly submit: (source?: KeyboardSubmitSource) => KeyboardSubmitEvent;
  readonly toggleSecondary: () => KeyboardState;
};
