import type { AudioOutputResources } from '../audio-output';
import {
  boardAdapterUpdateControlSounds,
  boardAdapterUpdateMovedSoundsInvalid,
  boardAdapterUpdateMovedSoundsOk,
} from '../audio-output';
import type { GameModelResources } from '../game-model';
import type {
  GameModelEvaluateResultControl,
  GameModelEvaluateResultIgnore,
  GameModelEvaluateResultIllegal,
  GameModelEvaluateResultOk,
} from '../game-model/evaluate.js';
import { GAME_MODEL_CONTROL_ACTION_FLIP } from '../game-model/evaluate.js';
import type { ComSettings } from '../settings';
import { GchessboardBoardViewAdapter } from './GchessboardBoardViewAdapter';
import type { BoardAdapterMountElements, BoardView } from './types.js';

export type { BoardAdapterMountElements, BoardView } from './types.js';

// --------------------------------------------------------------------------
export type BoardAdapterResources = {
  readonly board: BoardView;
};

// --------------------------------------------------------------------------
export async function initBoardAdapter(
  gameModelResources: GameModelResources,
  elements: BoardAdapterMountElements
): Promise<BoardAdapterResources> {
  return {
    board: GchessboardBoardViewAdapter(gameModelResources, elements),
  };
}

// --------------------------------------------------------------------------
export async function exitBoardAdapter(boardAdapterResources: BoardAdapterResources): Promise<void> {
  boardAdapterResources.board.dispose();
  return;
}

// --------------------------------------------------------------------------
export async function boardAdapterUpdateMovedOk(
  settings: ComSettings,
  boardAdapterResources: BoardAdapterResources,
  gameModelResources: GameModelResources,
  audioOutputResources: AudioOutputResources,
  evaluateResult: GameModelEvaluateResultOk
): Promise<void> {
  if (gameModelResources.locked) {
    return;
  }
  boardAdapterResources.board.move([evaluateResult.move[0], evaluateResult.move[1]], gameModelResources.chess.fen());
  await boardAdapterUpdateMovedSoundsOk(settings, audioOutputResources, evaluateResult);
}

// --------------------------------------------------------------------------
export async function boardAdapterUpdateMovedInvalid(
  settings: ComSettings,
  _boardAdapterResources: BoardAdapterResources,
  gameModelResources: GameModelResources,
  audioOutputResources: AudioOutputResources,
  evaluateResult: GameModelEvaluateResultIgnore | GameModelEvaluateResultIllegal
): Promise<void> {
  if (gameModelResources.locked) {
    return;
  }
  await boardAdapterUpdateMovedSoundsInvalid(settings, audioOutputResources, evaluateResult);
}

// --------------------------------------------------------------------------
export async function boardAdapterUpdateControl(
  settings: ComSettings,
  boardAdapterResources: BoardAdapterResources,
  gameModelResources: GameModelResources,
  audioOutputResources: AudioOutputResources,
  evaluateResult: GameModelEvaluateResultControl
): Promise<void> {
  if (gameModelResources.locked) {
    return;
  }

  switch (evaluateResult.action) {
    case GAME_MODEL_CONTROL_ACTION_FLIP:
      boardAdapterResources.board.toggleOrientation();
      break;
  }
  await boardAdapterUpdateControlSounds(settings, audioOutputResources, evaluateResult);
}
