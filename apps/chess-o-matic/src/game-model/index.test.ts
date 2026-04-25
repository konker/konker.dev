import { describe, expect, it } from 'vitest';

import {
  exitGameModel,
  gameModelCanGoBackward,
  gameModelCanGoForward,
  gameModelCurrentMove,
  gameModelGoToEnd,
  gameModelGoToPly,
  gameModelGoToStart,
  gameModelLoadState,
  gameModelPushHistoryMove,
  gameModelSnapshotState,
  gameModelStepBackward,
  gameModelStepForward,
  initGameModel,
} from './index';

const MOVE_E4 = { from: 'e2', san: 'e4', to: 'e4' } as const;
const MOVE_E5 = { from: 'e7', san: 'e5', to: 'e5' } as const;
const MOVE_NF3 = { from: 'g1', san: 'Nf3', to: 'f3' } as const;
const MOVE_NC6 = { from: 'b8', san: 'Nc6', to: 'c6' } as const;

describe('game-model', () => {
  describe('initGameModel', () => {
    it('creates an empty model with cursor at 0', async () => {
      const model = await initGameModel();
      expect(model.currentPly).toBe(0);
      expect(model.moveHistory).toHaveLength(0);
      expect(model.locked).toBe(false);
    });
  });

  describe('exitGameModel', () => {
    it('resolves without error', async () => {
      const model = await initGameModel();
      await expect(exitGameModel(model)).resolves.toBeUndefined();
    });
  });

  describe('gameModelCanGoBackward', () => {
    it('returns false on empty model', async () => {
      const model = await initGameModel();
      expect(gameModelCanGoBackward(model)).toBe(false);
    });

    it('returns false when cursor is at start', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 0, moveHistory: [MOVE_E4, MOVE_E5] });
      expect(gameModelCanGoBackward(model)).toBe(false);
    });

    it('returns true when cursor is past start', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 1, moveHistory: [MOVE_E4, MOVE_E5] });
      expect(gameModelCanGoBackward(model)).toBe(true);
    });
  });

  describe('gameModelCanGoForward', () => {
    it('returns false when cursor is at end', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 2, moveHistory: [MOVE_E4, MOVE_E5] });
      expect(gameModelCanGoForward(model)).toBe(false);
    });

    it('returns true when cursor is before end', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 1, moveHistory: [MOVE_E4, MOVE_E5] });
      expect(gameModelCanGoForward(model)).toBe(true);
    });
  });

  describe('gameModelGoToStart', () => {
    it('sets cursor to 0', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 2, moveHistory: [MOVE_E4, MOVE_E5] });
      gameModelGoToStart(model);
      expect(model.currentPly).toBe(0);
    });

    it('rebuilds chess to the starting position', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 2, moveHistory: [MOVE_E4, MOVE_E5] });
      gameModelGoToStart(model);
      expect(model.chess.history()).toHaveLength(0);
    });
  });

  describe('gameModelStepBackward', () => {
    it('decrements cursor by one', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 2, moveHistory: [MOVE_E4, MOVE_E5] });
      gameModelStepBackward(model);
      expect(model.currentPly).toBe(1);
    });

    it('does nothing when cursor is already at 0', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 0, moveHistory: [MOVE_E4, MOVE_E5] });
      gameModelStepBackward(model);
      expect(model.currentPly).toBe(0);
    });
  });

  describe('gameModelStepForward', () => {
    it('increments cursor by one', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 1, moveHistory: [MOVE_E4, MOVE_E5] });
      gameModelStepForward(model);
      expect(model.currentPly).toBe(2);
    });

    it('does nothing when cursor is already at end', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 2, moveHistory: [MOVE_E4, MOVE_E5] });
      gameModelStepForward(model);
      expect(model.currentPly).toBe(2);
    });
  });

  describe('gameModelGoToEnd', () => {
    it('sets cursor to the history length', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 0, moveHistory: [MOVE_E4, MOVE_E5, MOVE_NF3, MOVE_NC6] });
      gameModelGoToEnd(model);
      expect(model.currentPly).toBe(4);
    });
  });

  describe('gameModelGoToPly', () => {
    it('sets cursor to the specified ply', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 0, moveHistory: [MOVE_E4, MOVE_E5, MOVE_NF3, MOVE_NC6] });
      gameModelGoToPly(model, 2);
      expect(model.currentPly).toBe(2);
    });

    it('clamps to 0 for negative ply', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 2, moveHistory: [MOVE_E4, MOVE_E5] });
      gameModelGoToPly(model, -5);
      expect(model.currentPly).toBe(0);
    });

    it('clamps to history length when ply exceeds history', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 1, moveHistory: [MOVE_E4, MOVE_E5] });
      gameModelGoToPly(model, 100);
      expect(model.currentPly).toBe(2);
    });
  });

  describe('gameModelCurrentMove', () => {
    it('returns undefined when cursor is at ply 0', async () => {
      const model = await initGameModel();
      expect(gameModelCurrentMove(model)).toBeUndefined();
    });

    it('returns the move at the cursor position', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 2, moveHistory: [MOVE_E4, MOVE_E5] });
      expect(gameModelCurrentMove(model)?.san).toBe('e5');
    });

    it('returns the first move when cursor is at ply 1', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 1, moveHistory: [MOVE_E4, MOVE_E5] });
      expect(gameModelCurrentMove(model)?.san).toBe('e4');
    });
  });

  describe('gameModelPushHistoryMove', () => {
    it('appends a move to history and advances the cursor', async () => {
      const model = await initGameModel();
      const moveResult = model.chessMoveSafe('e4');
      if (!moveResult.ok) throw new Error('Expected legal move');
      gameModelPushHistoryMove(model, moveResult.move);
      expect(model.moveHistory).toHaveLength(1);
      expect(model.moveHistory[0]?.san).toBe('e4');
      expect(model.currentPly).toBe(1);
    });

    it('truncates future history when branching from an earlier cursor position', async () => {
      const model = await initGameModel();
      // Load 4-move history with cursor at ply 2 (after e4, e5)
      gameModelLoadState(model, {
        currentPly: 2,
        moveHistory: [MOVE_E4, MOVE_E5, MOVE_NF3, MOVE_NC6],
      });
      // Chess is now at the position after e4, e5 — play a different third move
      const moveResult = model.chessMoveSafe('d4');
      if (!moveResult.ok) throw new Error('Expected legal move');
      gameModelPushHistoryMove(model, moveResult.move);
      expect(model.moveHistory).toHaveLength(3);
      expect(model.moveHistory[2]?.san).toBe('d4');
      expect(model.currentPly).toBe(3);
    });
  });

  describe('gameModelSnapshotState', () => {
    it('returns copies of history and cursor', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 2, moveHistory: [MOVE_E4, MOVE_E5] });
      const snapshot = gameModelSnapshotState(model);
      expect(snapshot.currentPly).toBe(2);
      expect(snapshot.moveHistory).toHaveLength(2);
      // Verify it's a copy, not the same reference
      expect(snapshot.moveHistory).not.toBe(model.moveHistory);
    });
  });

  describe('gameModelLoadState', () => {
    it('loads move history and sets the cursor', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 1, moveHistory: [MOVE_E4, MOVE_E5] });
      expect(model.moveHistory).toHaveLength(2);
      expect(model.currentPly).toBe(1);
    });

    it('clamps cursor when it exceeds history length', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: 99, moveHistory: [MOVE_E4] });
      expect(model.currentPly).toBe(1);
    });

    it('rebuilds the chess instance from history up to the cursor', async () => {
      const model = await initGameModel();
      // Load with cursor at ply 1 — only e4 should be in chess history
      gameModelLoadState(model, { currentPly: 1, moveHistory: [MOVE_E4, MOVE_E5] });
      expect(model.chess.history()).toEqual(['e4']);
    });

    it('sets cursor to 0 when given negative currentPly', async () => {
      const model = await initGameModel();
      gameModelLoadState(model, { currentPly: -1, moveHistory: [MOVE_E4] });
      expect(model.currentPly).toBe(0);
    });
  });
});
