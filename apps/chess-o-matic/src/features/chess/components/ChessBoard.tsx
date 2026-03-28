import type { JSX } from 'solid-js';

type ChessBoardProps = {
  readonly boardRef: (element: HTMLElement) => void;
  readonly promotionDialogRef: (element: HTMLDivElement) => void;
};

export function ChessBoard(props: ChessBoardProps): JSX.Element {
  return (
    <div class="board-frame">
      <g-chess-board class="board" id="board" ref={props.boardRef} />
      <div class="promotion-dialog" data-open="false" id="promotion-dialog" ref={props.promotionDialogRef}>
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
