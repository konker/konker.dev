import type { JSX } from 'solid-js';
import { onCleanup, onMount } from 'solid-js';

import type { BoardAdapterMountElements } from '../../../board-adapter/types';

type ChessBoardProps = {
  readonly mountBoard: (elements: BoardAdapterMountElements) => Promise<void> | void;
  readonly unmountBoard: () => Promise<void> | void;
};

export function ChessBoard(props: ChessBoardProps): JSX.Element {
  let boardEl: HTMLElement | undefined;
  let promotionDialogEl: HTMLDivElement | undefined;

  onMount(() => {
    if (!boardEl || !promotionDialogEl) {
      return;
    }

    void props.mountBoard({
      boardEl,
      promotionDialogEl,
    });
  });

  onCleanup(() => {
    void props.unmountBoard();
  });

  return (
    <div class="board-frame">
      <g-chess-board class="board" id="board" ref={boardEl} />
      <div class="promotion-dialog" data-open="false" id="promotion-dialog" ref={promotionDialogEl}>
        <div class="promotion-panel">
          <button class="promo-choice" data-piece="q" title="Queen" type="button" />
          <button class="promo-choice" data-piece="r" title="Rook" type="button" />
          <button class="promo-choice" data-piece="b" title="Bishop" type="button" />
          <button class="promo-choice" data-piece="n" title="Knight" type="button" />
        </div>
      </div>
    </div>
  );
}
