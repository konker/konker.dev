import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';

import { chessIsLegalMove, chessMoveSafe } from './extras';

describe('extras', () => {
  describe('chessIsLegalMove', () => {
    it('should return true for a legal SAN move', () => {
      const chess = new Chess();
      const isLegal = chessIsLegalMove(chess);
      expect(isLegal('e4')).toBe(true);
    });

    it('should return true for a legal coordinate move', () => {
      const chess = new Chess();
      const isLegal = chessIsLegalMove(chess);
      expect(isLegal(['e2', 'e4'])).toBe(true);
    });

    it('should return false for an illegal SAN move', () => {
      const chess = new Chess();
      const isLegal = chessIsLegalMove(chess);
      expect(isLegal('e5')).toBe(false);
    });

    it('should return false for an illegal coordinate move', () => {
      const chess = new Chess();
      const isLegal = chessIsLegalMove(chess);
      expect(isLegal(['e2', 'e5'])).toBe(false);
    });

    it('should not mutate the board state', () => {
      const chess = new Chess();
      const isLegal = chessIsLegalMove(chess);
      const fenBefore = chess.fen();
      isLegal('e4');
      expect(chess.fen()).toBe(fenBefore);
    });

    it('should return false for nonsense input', () => {
      const chess = new Chess();
      const isLegal = chessIsLegalMove(chess);
      expect(isLegal('xyz')).toBe(false);
    });
  });

  describe('chessMoveSafe', () => {
    it('should return ok for a legal SAN move', () => {
      const chess = new Chess();
      const chessMoveSafeFn = chessMoveSafe(chess);
      const result = chessMoveSafeFn('e4');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.move.san).toBe('e4');
        expect(result.move.from).toBe('e2');
        expect(result.move.to).toBe('e4');
      }
    });

    it('should return ok for a legal coordinate move', () => {
      const chess = new Chess();
      const chessMoveSafeFn = chessMoveSafe(chess);
      const result = chessMoveSafeFn({ from: 'e2', to: 'e4' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.move.san).toBe('e4');
      }
    });

    it('should mutate the board state on success', () => {
      const chess = new Chess();
      const chessMoveSafeFn = chessMoveSafe(chess);
      const fenBefore = chess.fen();
      const result = chessMoveSafeFn('e4');
      expect(result.ok).toBe(true);
      expect(chess.fen()).not.toBe(fenBefore);
    });

    it('should not mutate the board state on failure', () => {
      const chess = new Chess();
      const chessMoveSafeFn = chessMoveSafe(chess);
      const fenBefore = chess.fen();
      const result = chessMoveSafeFn('e5');
      expect(result.ok).toBe(false);
      expect(chess.fen()).toBe(fenBefore);
    });

    it('should return not ok for an illegal SAN move', () => {
      const chess = new Chess();
      const chessMoveSafeFn = chessMoveSafe(chess);
      const result = chessMoveSafeFn('e5');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBeDefined();
      }
    });

    it('should return not ok for an illegal coordinate move', () => {
      const chess = new Chess();
      const chessMoveSafeFn = chessMoveSafe(chess);
      const result = chessMoveSafeFn({ from: 'e2', to: 'e5' });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBeDefined();
      }
    });

    it('should return not ok for nonsense input', () => {
      const chess = new Chess();
      const chessMoveSafeFn = chessMoveSafe(chess);
      const result = chessMoveSafeFn('xyz');
      expect(result.ok).toBe(false);
    });

    it('should handle pawn promotion via coordinates', () => {
      const chess = new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
      const chessMoveSafeFn = chessMoveSafe(chess);
      const result = chessMoveSafeFn({ from: 'a7', to: 'a8', promotion: 'q' });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.move.promotion).toBe('q');
      }
    });

    it('should handle pawn promotion via SAN', () => {
      const chess = new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
      const chessMoveSafeFn = chessMoveSafe(chess);
      const result = chessMoveSafeFn('a8=Q');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.move.san).toBe('a8=Q+');
      }
    });

    it('should handle capture moves', () => {
      const chess = new Chess();
      chess.move('e4');
      chess.move('d5');
      const chessMoveSafeFn = chessMoveSafe(chess);
      const result = chessMoveSafeFn('exd5');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.move.san).toBe('exd5');
        expect(result.move.captured).toBe('p');
      }
    });
  });
});
