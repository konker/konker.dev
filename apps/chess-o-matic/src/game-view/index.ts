import type { AudioOutputResources } from '../audio-output';
import {
  gameViewUpdateControlSounds,
  gameViewUpdateMovedSoundsInvalid,
  gameViewUpdateMovedSoundsOk,
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
import type { BoardView, BoardViewMountElements } from './types.js';

// --------------------------------------------------------------------------
export type GameViewResources = {
  readonly board: BoardView;
};

export type GameViewElements = BoardViewMountElements;

// --------------------------------------------------------------------------
export async function initGameView(
  gameModelResources: GameModelResources,
  elements: GameViewElements
): Promise<GameViewResources> {
  return {
    board: GchessboardBoardViewAdapter(gameModelResources, elements),
  };
}

// --------------------------------------------------------------------------
export async function exitGameView(_gameViewResource: GameViewResources): Promise<void> {
  _gameViewResource.board.dispose();
  return;
}

// --------------------------------------------------------------------------
export async function gameViewUpdateMovedOk(
  settings: ComSettings,
  gameViewResources: GameViewResources,
  gameModelResources: GameModelResources,
  audioOutputResources: AudioOutputResources,
  evaluateResult: GameModelEvaluateResultOk
): Promise<void> {
  if (gameModelResources.locked) {
    return;
  }
  gameViewResources.board.move([evaluateResult.move[0], evaluateResult.move[1]], gameModelResources.chess.fen());
  await gameViewUpdateMovedSoundsOk(settings, audioOutputResources, evaluateResult);
}

// --------------------------------------------------------------------------
export async function gameViewUpdateMovedInvalid(
  settings: ComSettings,
  _gameViewResources: GameViewResources,
  gameModelResources: GameModelResources,
  audioOutputResources: AudioOutputResources,
  evaluateResult: GameModelEvaluateResultIgnore | GameModelEvaluateResultIllegal
): Promise<void> {
  if (gameModelResources.locked) {
    return;
  }
  await gameViewUpdateMovedSoundsInvalid(settings, audioOutputResources, evaluateResult);
}

// --------------------------------------------------------------------------
export async function gameViewUpdateControl(
  settings: ComSettings,
  gameViewResources: GameViewResources,
  gameModelResources: GameModelResources,
  audioOutputResources: AudioOutputResources,
  evaluateResult: GameModelEvaluateResultControl
): Promise<void> {
  if (gameModelResources.locked) {
    return;
  }

  switch (evaluateResult.action) {
    case GAME_MODEL_CONTROL_ACTION_FLIP:
      gameViewResources.board.toggleOrientation();
      break;
  }
  await gameViewUpdateControlSounds(settings, audioOutputResources, evaluateResult);
}
