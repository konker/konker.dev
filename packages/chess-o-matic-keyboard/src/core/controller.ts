/* eslint-disable fp/no-nil,fp/no-mutation,fp/no-let */
import type {
  KeyboardContext,
  KeyboardController,
  KeyboardInputBuffer,
  KeyboardInputToken,
  KeyboardKeyDefinition,
  KeyboardKeyId,
  KeyboardScreenState,
  KeyboardState,
  MoveCandidate,
  SubmitResult,
} from "./types.js";
import { KEYBOARD_KEYS } from "./types.js";

const KEYBOARD_KEY_MAP = new Map<KeyboardKeyId, KeyboardKeyDefinition>(
  KEYBOARD_KEYS.map((key) => [key.id, key]),
);

const EMPTY_INPUT_BUFFER: KeyboardInputBuffer = {
  cursorOffset: 0,
  normalized: "",
  raw: "",
  tokens: [],
};

const EMPTY_STATE: KeyboardState = {
  canSubmit: false,
  candidates: [],
  enabledKeys: new Set<KeyboardKeyId>(),
  inputBuffer: EMPTY_INPUT_BUFFER,
  mode: "notation-only",
  normalizedInput: "",
  rawInput: "",
  screenState: "base",
  status: "idle",
  tokens: [],
};

export function createKeyboardController(
  initialContext?: KeyboardContext,
): KeyboardController {
  let context = initialContext;
  let screenState: KeyboardScreenState = "base";
  let state = deriveState("", context, screenState);

  return {
    backspace() {
      state = deriveState(
        state.rawInput.slice(0, -1),
        context,
        normalizeScreenState(state.rawInput.slice(0, -1), screenState),
      );
      screenState = state.screenState;
      return state;
    },

    clear() {
      screenState = "base";
      state = deriveState("", context, screenState);
      return state;
    },

    clearToken() {
      const nextInput = state.tokens
        .slice(0, -1)
        .map((token) => token.value)
        .join(" ");
      screenState = normalizeScreenState(nextInput, screenState);
      state = deriveState(nextInput, context, screenState);
      return state;
    },

    getState() {
      return state;
    },

    pressKey(keyId: KeyboardKeyId) {
      const key = KEYBOARD_KEY_MAP.get(keyId);

      if (key === undefined) {
        return state;
      }

      if (key.kind === "action") {
        state = applyActionKey(key.id, state, context);
        screenState = state.screenState;
        return state;
      }

      state = deriveState(
        `${state.rawInput}${key.value}`,
        context,
        deriveNextScreenState(screenState, key.id),
      );
      screenState = state.screenState;
      return state;
    },

    reset() {
      screenState = "base";
      state = deriveState("", context, screenState);
      return state;
    },

    selectCandidate(candidateId: string) {
      const candidate = state.candidates.find(
        (item) => item.id === candidateId,
      );

      if (candidate === undefined) {
        return state;
      }

      screenState = "base";
      state = {
        ...deriveState(candidate.san, context, screenState),
        canSubmit: true,
        candidates: [candidate],
        selectedCandidateId: candidate.id,
        status: "complete",
      };
      return state;
    },

    setContext(nextContext?: KeyboardContext) {
      context = nextContext;
      state = deriveState(state.rawInput, context, screenState);
      return state;
    },

    submit() {
      return submitState(state);
    },

    toggleSecondary() {
      screenState = screenState === "secondary" ? "base" : "secondary";
      state = deriveState(state.rawInput, context, screenState);
      return state;
    },
  };
}

function applyActionKey(
  keyId: KeyboardKeyId,
  state: KeyboardState,
  context?: KeyboardContext,
): KeyboardState {
  switch (keyId) {
    case "toggle-secondary":
      return deriveState(
        state.rawInput,
        context,
        state.screenState === "secondary" ? "base" : "secondary",
      );
    case "backspace":
      return deriveState(
        state.rawInput.slice(0, -1),
        context,
        normalizeScreenState(state.rawInput.slice(0, -1), state.screenState),
      );
    case "clear-token":
      return deriveState(
        state.tokens
          .slice(0, -1)
          .map((token) => token.value)
          .join(" "),
        context,
        state.screenState,
      );
    case "clear":
      return deriveState("", context, "base");
  }
  return state;
}

function deriveState(
  rawInput: string,
  context: KeyboardContext | undefined,
  requestedScreenState: KeyboardScreenState,
): KeyboardState {
  const normalizedInput = normalizeInput(rawInput);
  const tokens = tokenizeInput(normalizedInput);
  const inputBuffer: KeyboardInputBuffer = {
    cursorOffset: normalizedInput.length,
    normalized: normalizedInput,
    raw: rawInput,
    tokens,
  };
  const mode = hasBoardAwareContext(context) ? "board-aware" : "notation-only";
  const candidate = buildInputCandidate(
    normalizedInput,
    mode === "board-aware",
  );
  const candidates = candidate === undefined ? [] : [candidate];
  const screenState = normalizeScreenState(
    normalizedInput,
    requestedScreenState,
  );

  const nextState: KeyboardState = {
    ...EMPTY_STATE,
    canSubmit: normalizedInput.length > 0 && candidate?.status !== "invalid",
    candidates,
    enabledKeys: getEnabledKeys(screenState),
    inputBuffer,
    mode,
    normalizedInput,
    rawInput,
    screenState,
    status: deriveStatus(normalizedInput, screenState, candidate),
    tokens,
  };

  return context === undefined ? nextState : { ...nextState, context };
}

function buildInputCandidate(
  normalizedInput: string,
  isLegal: boolean,
): MoveCandidate | undefined {
  if (normalizedInput.length === 0) {
    return undefined;
  }

  return {
    id: normalizedInput,
    isLegal,
    missingKeyIds: [],
    san: normalizedInput,
    source: "input",
    status: "exact",
  };
}

function deriveNextScreenState(
  currentState: KeyboardScreenState,
  keyId: KeyboardKeyId,
): KeyboardScreenState {
  if (keyId === "toggle-secondary") {
    return currentState === "secondary" ? "base" : "secondary";
  }

  const key = KEYBOARD_KEY_MAP.get(keyId);

  if (key?.category === "piece" || key?.category === "file") {
    return "destination";
  }

  if (currentState === "secondary") {
    return "base";
  }

  return currentState;
}

function deriveStatus(
  normalizedInput: string,
  screenState: KeyboardScreenState,
  candidate?: MoveCandidate,
): KeyboardState["status"] {
  if (normalizedInput.length === 0) {
    return "idle";
  }

  if (screenState === "ambiguity") {
    return "awaiting-disambiguation";
  }

  if (screenState === "promotion") {
    return "awaiting-promotion";
  }

  if (candidate?.status === "invalid") {
    return "invalid";
  }

  return "building";
}

function getEnabledKeys(
  screenState: KeyboardScreenState,
): ReadonlySet<KeyboardKeyId> {
  return new Set(
    KEYBOARD_KEYS.filter((key) =>
      key.screenStates.some((candidateState) => candidateState === screenState),
    ).map((key) => key.id),
  );
}

function hasBoardAwareContext(context?: KeyboardContext): boolean {
  return Boolean(context?.fen) || Boolean(context?.legalMoves?.length);
}

function normalizeInput(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function normalizeScreenState(
  normalizedInput: string,
  requestedScreenState: KeyboardScreenState,
): KeyboardScreenState {
  if (normalizedInput.length === 0 && requestedScreenState !== "secondary") {
    return "base";
  }

  return requestedScreenState;
}

function submitState(state: KeyboardState): SubmitResult {
  if (state.pendingDisambiguation !== undefined) {
    return {
      error: "ambiguity-required",
      ok: false,
      state,
    };
  }

  if (state.pendingPromotion !== undefined) {
    return {
      error: "promotion-required",
      ok: false,
      state,
    };
  }

  const candidate = state.candidates[0];

  if (!state.canSubmit || candidate === undefined) {
    return {
      error: "incomplete-move",
      ok: false,
      state,
    };
  }

  return {
    candidate,
    ok: true,
    state: {
      ...state,
      selectedCandidateId: candidate.id,
      status: "complete",
    },
  };
}

function tokenizeInput(
  normalizedInput: string,
): ReadonlyArray<KeyboardInputToken> {
  if (normalizedInput.length === 0) {
    return [];
  }

  return (
    normalizedInput
      .match(/O-O-O|O-O|!\?|\?!|[KQRBN]|[a-h]|[1-8]|x|=|[+#!?]/g)
      ?.map((value) => {
        const keyId = findKeyIdByValue(value);

        return keyId === undefined
          ? { type: classifyToken(value), value }
          : { keyId, type: classifyToken(value), value };
      }) ?? [{ type: "unknown", value: normalizedInput }]
  );
}

function classifyToken(value: string): KeyboardInputToken["type"] {
  if (value === "O-O" || value === "O-O-O") {
    return "castle";
  }

  if (value === "x") {
    return "capture";
  }

  if (value === "=") {
    return "promotion";
  }

  if (
    value === "+" ||
    value === "#" ||
    value === "!" ||
    value === "?" ||
    value === "!?" ||
    value === "?!"
  ) {
    return "annotation";
  }

  if (["K", "Q", "R", "B", "N"].includes(value)) {
    return "piece";
  }

  if (/^[a-h]$/.test(value)) {
    return "file";
  }

  if (/^[1-8]$/.test(value)) {
    return "rank";
  }

  return "unknown";
}

function findKeyIdByValue(value: string): KeyboardKeyId | undefined {
  return KEYBOARD_KEYS.find(
    (key) => key.value === value && key.kind === "notation",
  )?.id;
}
