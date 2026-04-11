import { describe, expect, it } from 'vitest';

import { initGameModel } from './index';
import {
  GAME_MOVE_ILLEGAL_REASON_AMBIGUOUS,
  GAME_MOVE_ILLEGAL_REASON_INVALID,
  GAME_MOVE_STATUS_ILLEGAL,
  GAME_MOVE_STATUS_OK,
  playMove,
  playMoveCandidates,
} from './move';
import { GAME_INPUT_PARSE_STATUS_OK_COORDS, GAME_INPUT_PARSE_STATUS_OK_SAN } from './read';

describe('move', () => {
  describe('playMove (SAN, single candidate)', () => {
    it('returns ok for a legal SAN move', async () => {
      const model = await initGameModel();
      const result = playMove(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_SAN,
        input: 'e4',
        sanitized: 'e4',
        parsed: undefined,
        san: { candidates: ['e4'] },
      });
      expect(result.status).toBe(GAME_MOVE_STATUS_OK);
      if (result.status === GAME_MOVE_STATUS_OK) {
        expect(result.move).toHaveLength(2);
        expect(result.move[0]).toBe('e2');
        expect(result.move[1]).toBe('e4');
      }
    });

    it('advances the cursor and adds the move to history', async () => {
      const model = await initGameModel();
      playMove(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_SAN,
        input: 'e4',
        sanitized: 'e4',
        parsed: undefined,
        san: { candidates: ['e4'] },
      });
      expect(model.currentPly).toBe(1);
      expect(model.moveHistory).toHaveLength(1);
      expect(model.moveHistory[0]?.san).toBe('e4');
    });

    it('returns illegal for an invalid SAN in the current position', async () => {
      const model = await initGameModel();
      // e5 is a Black pawn move — illegal for White at start
      const result = playMove(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_SAN,
        input: 'e5',
        sanitized: 'e5',
        parsed: undefined,
        san: { candidates: ['e5'] },
      });
      expect(result.status).toBe(GAME_MOVE_STATUS_ILLEGAL);
      if (result.status === GAME_MOVE_STATUS_ILLEGAL) {
        expect(result.reason).toBe(GAME_MOVE_ILLEGAL_REASON_INVALID);
      }
    });

    it('does not change model state when the move is illegal', async () => {
      const model = await initGameModel();
      playMove(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_SAN,
        input: 'e5',
        sanitized: 'e5',
        parsed: undefined,
        san: { candidates: ['e5'] },
      });
      expect(model.currentPly).toBe(0);
      expect(model.moveHistory).toHaveLength(0);
    });
  });

  describe('playMove (coordinates)', () => {
    it('returns ok for a legal coordinate move', async () => {
      const model = await initGameModel();
      const result = playMove(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_COORDS,
        input: 'e2 e4',
        sanitized: 'e2 e4',
        parsed: '["e2","e4"]',
        coords: ['e2', 'e4'],
      });
      expect(result.status).toBe(GAME_MOVE_STATUS_OK);
      if (result.status === GAME_MOVE_STATUS_OK) {
        expect(result.move[0]).toBe('e2');
        expect(result.move[1]).toBe('e4');
      }
    });

    it('returns illegal for coordinates that produce an illegal move', async () => {
      const model = await initGameModel();
      // e2->e5 is not a legal pawn move
      const result = playMove(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_COORDS,
        input: 'e2 e5',
        sanitized: 'e2 e5',
        parsed: '["e2","e5"]',
        coords: ['e2', 'e5'],
      });
      expect(result.status).toBe(GAME_MOVE_STATUS_ILLEGAL);
      if (result.status === GAME_MOVE_STATUS_ILLEGAL) {
        expect(result.reason).toBe(GAME_MOVE_ILLEGAL_REASON_INVALID);
      }
    });
  });

  describe('playMove (SAN, multiple candidates routed to playMoveCandidates)', () => {
    it('returns illegal/ambiguous when multiple candidates are legal', async () => {
      const model = await initGameModel();
      // Both e4 and d4 are legal from starting position
      const result = playMove(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_SAN,
        input: 'e4',
        sanitized: 'e4',
        parsed: undefined,
        san: { candidates: ['e4', 'd4'] },
      });
      expect(result.status).toBe(GAME_MOVE_STATUS_ILLEGAL);
      if (result.status === GAME_MOVE_STATUS_ILLEGAL) {
        expect(result.reason).toBe(GAME_MOVE_ILLEGAL_REASON_AMBIGUOUS);
      }
    });

    it('returns ok when exactly one candidate is legal', async () => {
      const model = await initGameModel();
      // e4 is legal, e5 is not — exactly one legal candidate
      const result = playMove(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_SAN,
        input: 'e4',
        sanitized: 'e4',
        parsed: undefined,
        san: { candidates: ['e4', 'e5'] },
      });
      expect(result.status).toBe(GAME_MOVE_STATUS_OK);
    });
  });

  describe('playMoveCandidates', () => {
    it('returns ok and plays the single legal candidate', async () => {
      const model = await initGameModel();
      const result = playMoveCandidates(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_SAN,
        input: 'e4',
        sanitized: 'e4',
        parsed: undefined,
        san: { candidates: ['e4', 'e5'] },
      });
      expect(result.status).toBe(GAME_MOVE_STATUS_OK);
      expect(model.moveHistory[0]?.san).toBe('e4');
    });

    it('returns illegal/ambiguous when multiple candidates are legal', async () => {
      const model = await initGameModel();
      const result = playMoveCandidates(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_SAN,
        input: 'pawn',
        sanitized: 'pawn',
        parsed: undefined,
        san: { candidates: ['e4', 'd4'] },
      });
      expect(result.status).toBe(GAME_MOVE_STATUS_ILLEGAL);
      if (result.status === GAME_MOVE_STATUS_ILLEGAL) {
        expect(result.reason).toBe(GAME_MOVE_ILLEGAL_REASON_AMBIGUOUS);
      }
    });

    it('returns illegal/invalid when no candidates are legal', async () => {
      const model = await initGameModel();
      // e5 and d5 are both illegal for White at start
      const result = playMoveCandidates(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_SAN,
        input: 'pawn',
        sanitized: 'pawn',
        parsed: undefined,
        san: { candidates: ['e5', 'd5'] },
      });
      expect(result.status).toBe(GAME_MOVE_STATUS_ILLEGAL);
      if (result.status === GAME_MOVE_STATUS_ILLEGAL) {
        expect(result.reason).toBe(GAME_MOVE_ILLEGAL_REASON_INVALID);
      }
    });
  });
});
