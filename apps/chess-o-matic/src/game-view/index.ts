import type { AudioOutputResources } from '../audio-resources/output';
import { resolveAudioOutputSoundEvent } from '../audio-resources/output';
import { playAudioOutputEventSound } from '../audio-resources/output';
import { AUDIO_OUTPUT_EVENT_INVALID, AUDIO_OUTPUT_EVENT_MOVE_BOTTOM } from '../audio-resources/output/events';
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
import type { BoardView } from './types.js';

// --------------------------------------------------------------------------
export type GameViewResources = {
  readonly board: BoardView;
  readonly inputEl: HTMLElement;
  readonly pgnEl: HTMLElement;
};

// --------------------------------------------------------------------------
export function initGameView(
  gameModelResources: GameModelResources,
  boardEl: HTMLElement,
  inputEl: HTMLElement,
  pgnEl: HTMLElement
): GameViewResources {
  return {
    board: GchessboardBoardViewAdapter(gameModelResources, boardEl),
    inputEl,
    pgnEl,
  };
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
  const soundEvent = resolveAudioOutputSoundEvent(evaluateResult.flags);
  await playAudioOutputEventSound(settings, audioOutputResources, soundEvent);
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
  await playAudioOutputEventSound(settings, audioOutputResources, AUDIO_OUTPUT_EVENT_INVALID);
}

// --------------------------------------------------------------------------
export function gameViewUpdateControl(
  gameViewResources: GameViewResources,
  gameModelResources: GameModelResources,
  evaluateResult: GameModelEvaluateResultControl
): void {
  if (gameModelResources.locked) {
    return;
  }

  switch (evaluateResult.action) {
    case GAME_MODEL_CONTROL_ACTION_FLIP:
      gameViewResources.board.toggleOrientation();
      break;
  }
}

// --------------------------------------------------------------------------
export function exitGameView(_gameViewResource: GameViewResources): void {
  return;
}
