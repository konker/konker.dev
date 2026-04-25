import { describe, expect, it } from 'vitest';

import {
  GAME_MODEL_CONTROL_ACTION_FLIP,
  GAME_MODEL_CONTROL_ACTION_RESIGN,
  GAME_MODEL_CONTROL_ACTION_UNDO,
  GAME_MODEL_EVALUATE_STATUS_CONTROL,
  GAME_MODEL_EVALUATE_STATUS_IGNORE,
  GAME_MODEL_EVALUATE_STATUS_ILLEGAL,
  GAME_MODEL_EVALUATE_STATUS_OK,
  gameModelEvaluate,
} from './evaluate';
import { initGameModel } from './index';
import {
  GAME_INPUT_PARSE_STATUS_CONTROL_ACTION,
  GAME_INPUT_PARSE_STATUS_IGNORE,
  GAME_INPUT_PARSE_STATUS_OK_COORDS,
  GAME_INPUT_PARSE_STATUS_OK_SAN,
} from './read';

describe('evaluate', () => {
  describe('gameModelEvaluate', () => {
    it('returns ignore for a parse status of ignore', async () => {
      const model = await initGameModel();
      const result = gameModelEvaluate(model, {
        status: GAME_INPUT_PARSE_STATUS_IGNORE,
        input: 'hello',
        sanitized: 'hello',
        parsed: undefined,
      });
      expect(result.status).toBe(GAME_MODEL_EVALUATE_STATUS_IGNORE);
      expect(result.input).toBe('hello');
    });

    it('returns control/undo for an undo control action', async () => {
      const model = await initGameModel();
      const result = gameModelEvaluate(model, {
        status: GAME_INPUT_PARSE_STATUS_CONTROL_ACTION,
        input: 'undo',
        sanitized: 'undo',
        parsed: 'undo',
        action: 'undo',
      });
      expect(result.status).toBe(GAME_MODEL_EVALUATE_STATUS_CONTROL);
      if (result.status === GAME_MODEL_EVALUATE_STATUS_CONTROL) {
        expect(result.action).toBe(GAME_MODEL_CONTROL_ACTION_UNDO);
      }
    });

    it('returns control/flip for a flip control action', async () => {
      const model = await initGameModel();
      const result = gameModelEvaluate(model, {
        status: GAME_INPUT_PARSE_STATUS_CONTROL_ACTION,
        input: 'flip',
        sanitized: 'flip',
        parsed: 'flip',
        action: 'flip',
      });
      expect(result.status).toBe(GAME_MODEL_EVALUATE_STATUS_CONTROL);
      if (result.status === GAME_MODEL_EVALUATE_STATUS_CONTROL) {
        expect(result.action).toBe(GAME_MODEL_CONTROL_ACTION_FLIP);
      }
    });

    it('returns control/resign for a resign control action', async () => {
      const model = await initGameModel();
      const result = gameModelEvaluate(model, {
        status: GAME_INPUT_PARSE_STATUS_CONTROL_ACTION,
        input: 'resign',
        sanitized: 'resign',
        parsed: 'resign',
        action: 'resign',
      });
      expect(result.status).toBe(GAME_MODEL_EVALUATE_STATUS_CONTROL);
      if (result.status === GAME_MODEL_EVALUATE_STATUS_CONTROL) {
        expect(result.action).toBe(GAME_MODEL_CONTROL_ACTION_RESIGN);
      }
    });

    it('returns ignore for an unknown control action', async () => {
      const model = await initGameModel();
      const result = gameModelEvaluate(model, {
        status: GAME_INPUT_PARSE_STATUS_CONTROL_ACTION,
        input: 'start',
        sanitized: 'start',
        parsed: 'start',
        action: 'start' as never,
      });
      expect(result.status).toBe(GAME_MODEL_EVALUATE_STATUS_IGNORE);
    });

    it('returns ok for a legal SAN move', async () => {
      const model = await initGameModel();
      const result = gameModelEvaluate(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_SAN,
        input: 'e4',
        sanitized: 'e4',
        parsed: undefined,
        san: { candidates: ['e4'] },
      });
      expect(result.status).toBe(GAME_MODEL_EVALUATE_STATUS_OK);
      if (result.status === GAME_MODEL_EVALUATE_STATUS_OK) {
        expect(result.move).toEqual(['e2', 'e4']);
      }
    });

    it('returns illegal for an illegal SAN move', async () => {
      const model = await initGameModel();
      const result = gameModelEvaluate(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_SAN,
        input: 'e5',
        sanitized: 'e5',
        parsed: undefined,
        san: { candidates: ['e5'] },
      });
      expect(result.status).toBe(GAME_MODEL_EVALUATE_STATUS_ILLEGAL);
    });

    it('returns ok for a legal coordinate move', async () => {
      const model = await initGameModel();
      const result = gameModelEvaluate(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_COORDS,
        input: 'e2 e4',
        sanitized: 'e2 e4',
        parsed: '["e2","e4"]',
        coords: ['e2', 'e4'],
      });
      expect(result.status).toBe(GAME_MODEL_EVALUATE_STATUS_OK);
      if (result.status === GAME_MODEL_EVALUATE_STATUS_OK) {
        expect(result.move).toEqual(['e2', 'e4']);
      }
    });

    it('returns illegal for an illegal coordinate move', async () => {
      const model = await initGameModel();
      const result = gameModelEvaluate(model, {
        status: GAME_INPUT_PARSE_STATUS_OK_COORDS,
        input: 'e2 e5',
        sanitized: 'e2 e5',
        parsed: '["e2","e5"]',
        coords: ['e2', 'e5'],
      });
      expect(result.status).toBe(GAME_MODEL_EVALUATE_STATUS_ILLEGAL);
    });
  });
});
