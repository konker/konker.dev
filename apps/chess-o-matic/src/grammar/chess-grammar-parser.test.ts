import { describe, expect, it } from 'vitest';

import * as unit from './chess-grammar-parser';

describe('chess-grammar-parser', () => {
  describe('sanitizeInputString', () => {
    it('should remove stop words and normalize input', () => {
      expect(unit.sanitizeInputString(' a  PAWN ')).toEqual('a p');
      expect(unit.sanitizeInputString('a three pawn KNIGHT  bishop check')).toEqual('a 3 p n b');
      expect(unit.sanitizeInputString('kniGHT checkmate')).toEqual('n');
      expect(unit.sanitizeInputString('')).toEqual('');
    });
  });

  describe('parseRanks', () => {
    it('should parse rank words into numbers as expected', () => {
      expect(unit.parseRanks('one')).toEqual('1');
      expect(unit.parseRanks('one two three')).toEqual('1 2 3');
      expect(unit.parseRanks('onetwothree')).toEqual('123');
      expect(unit.parseRanks('a one')).toEqual('a 1');
      expect(unit.parseRanks('a king')).toEqual('a king');
      expect(unit.parseRanks('')).toEqual('');
    });
  });

  describe('parsePieces', () => {
    it('should parse piece words into symbols as expected', () => {
      expect(unit.parsePieces('pawn')).toEqual('p');
      expect(unit.parsePieces('a pawn')).toEqual('a p');
      expect(unit.parsePieces('a pawn knight bishop')).toEqual('a p n b');
      expect(unit.parsePieces('pawnknightbishop')).toEqual('pnb');
      expect(unit.parsePieces('a five')).toEqual('a five');
      expect(unit.parseRanks('')).toEqual('');
    });
  });
  describe('matchControlInstruction', () => {
    it('should match control instructions', () => {
      expect(unit.matchControlInstruction('undo')).toEqual('undo');
      expect(unit.matchControlInstruction('flip')).toEqual('flip');
      expect(unit.matchControlInstruction('resign')).toEqual('resign');
      expect(unit.matchControlInstruction('a 1')).toEqual(undefined);
    });
  });

  describe('matchPawnMove', () => {
    it('should match pawn moves correctly', () => {
      expect(unit.matchPawnMove('a 2')).toEqual('a2');
      expect(unit.matchPawnMove('h 7')).toEqual('h7');
      expect(unit.matchPawnMove('a takes b 1')).toEqual('axb1');
      expect(unit.matchPawnMove('a captures b 1')).toEqual('axb1');
      expect(unit.matchPawnMove('a8')).toEqual(undefined);
      expect(unit.matchPawnMove('8a')).toEqual(undefined);
      expect(unit.matchPawnMove('invalid')).toEqual(undefined);
    });
  });

  describe('matchCoordsMove', () => {
    it('should match coordinate moves correctly', () => {
      expect(unit.matchCoordMove('a 2 to a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchCoordMove('a 2 2 a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchCoordMove('a 2 takes a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchCoordMove('a 2 captures a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchCoordMove('a2toa3')).toStrictEqual(undefined);
      expect(unit.matchCoordMove('to a 3')).toStrictEqual(undefined);
      expect(unit.matchCoordMove('a 3 to')).toStrictEqual(undefined);
    });
  });

  describe('matchPieceMove', () => {
    it('should match piece moves correctly', () => {
      // Concise moves
      expect(unit.matchPieceMove('n a 3')).toStrictEqual('Na3');
      expect(unit.matchPieceMove('r d 3')).toStrictEqual('Rd3');

      // Verbose moves
      expect(unit.matchPieceMove('b to a 3')).toStrictEqual('Ba3');
      expect(unit.matchPieceMove('b 2 a 3')).toStrictEqual('Ba3');
      expect(unit.matchPieceMove('r 2 a 3')).toStrictEqual('Ra3');
      expect(unit.matchPieceMove('k takes d 3')).toStrictEqual('Kxd3');
      expect(unit.matchPieceMove('k captures d 3')).toStrictEqual('Kxd3');

      // Pice with file
      expect(unit.matchPieceMove('r a d 3')).toStrictEqual('Rad3');
      expect(unit.matchPieceMove('r a takes d 3')).toStrictEqual('Raxd3');
      expect(unit.matchPieceMove('r a captures d 3')).toStrictEqual('Raxd3');
      expect(unit.matchPieceMove('r a to d 3')).toStrictEqual('Rad3');
      expect(unit.matchPieceMove('r a 2 d 3')).toStrictEqual('Rad3');

      expect(unit.matchPieceMove('b a d 3')).toStrictEqual('Bad3');
      expect(unit.matchPieceMove('b a takes d 3')).toStrictEqual('Baxd3');
      expect(unit.matchPieceMove('b a captures d 3')).toStrictEqual('Baxd3');
      expect(unit.matchPieceMove('b a to d 3')).toStrictEqual('Bad3');
      expect(unit.matchPieceMove('b a 2 d 3')).toStrictEqual('Bad3');

      // Pice with rank
      // expect(unit.matchPieceMove('r 2 d 3')).toStrictEqual('R2d3'); // [FIXME: ambiguous]
      expect(unit.matchPieceMove('r 2 takes d 3')).toStrictEqual('R2xd3');
      expect(unit.matchPieceMove('r 2 captures d 3')).toStrictEqual('R2xd3');
      expect(unit.matchPieceMove('r 2 to d 3')).toStrictEqual('R2d3');
      expect(unit.matchPieceMove('r 2 2 d 3')).toStrictEqual('R2d3');

      // expect(unit.matchPieceMove('b 2 d 3')).toStrictEqual('B2d3'); // [FIXME: ambiguous]
      expect(unit.matchPieceMove('b 2 takes d 3')).toStrictEqual('B2xd3');
      expect(unit.matchPieceMove('b 2 captures d 3')).toStrictEqual('B2xd3');
      expect(unit.matchPieceMove('b 2 to d 3')).toStrictEqual('B2d3');
      expect(unit.matchPieceMove('b 2 2 d 3')).toStrictEqual('B2d3');
    });
  });

  describe('matchCastleMove', () => {
    it('should match castle moves correctly', () => {
      expect(unit.matchCastleMove('castle k side')).toEqual('O-O');
      expect(unit.matchCastleMove('castle q side')).toEqual('O-O-O');
      expect(unit.matchCastleMove('k side castle')).toEqual('O-O');
      expect(unit.matchCastleMove('long castle')).toEqual('O-O-O');
      expect(unit.matchCastleMove('castle long')).toEqual('O-O-O');
      expect(unit.matchCastleMove('q side castle')).toEqual('O-O-O');
      expect(unit.matchCastleMove('short castle')).toEqual('O-O');
      expect(unit.matchCastleMove('castle short')).toEqual('O-O');
    });
  });

  describe('matchPawnPromotionMove', () => {
    it('should match pawn promotion moves correctly', () => {
      expect(unit.matchPawnPromotionMove('a 8 promote')).toStrictEqual('a8=Q');
      expect(unit.matchPawnPromotionMove('a 8 b promotion')).toStrictEqual('a8=B');
      expect(unit.matchPawnPromotionMove('a 8 promote to r')).toStrictEqual('a8=R');
      expect(unit.matchPawnPromotionMove('a 8 promote to q')).toStrictEqual('a8=Q');
      expect(unit.matchPawnPromotionMove('a takes b 8 promote')).toStrictEqual('axb8=Q');
      expect(unit.matchPawnPromotionMove('a captures b 8 promote')).toStrictEqual('axb8=Q');
      expect(unit.matchPawnPromotionMove('a takes b 8 n promotion')).toStrictEqual('axb8=N');
      expect(unit.matchPawnPromotionMove('a captures b 8 promote to r')).toStrictEqual('axb8=R');
    });
  });

  describe('matchMove', () => {
    it('should match moves correctly', () => {
      expect(unit.matchMove('undo')).toEqual('undo');
      expect(unit.matchMove('flip')).toEqual('flip');
      expect(unit.matchMove('resign')).toEqual('resign');
      expect(unit.matchMove('a 2')).toEqual('a2');
      expect(unit.matchMove('h 7')).toEqual('h7');
      expect(unit.matchMove('a takes b 1')).toEqual('axb1');
      expect(unit.matchMove('a captures b 1')).toEqual('axb1');
      expect(unit.matchMove('a8')).toEqual(undefined);
      expect(unit.matchMove('8a')).toEqual(undefined);
      expect(unit.matchMove('invalid')).toEqual(undefined);

      // Concise moves
      expect(unit.matchMove('n a 3')).toStrictEqual('Na3');
      expect(unit.matchMove('r d 3')).toStrictEqual('Rd3');

      // Verbose moves
      expect(unit.matchMove('b to a 3')).toStrictEqual('Ba3');
      expect(unit.matchMove('b 2 a 3')).toStrictEqual('Ba3');
      expect(unit.matchMove('r 2 a 3')).toStrictEqual('Ra3');
      expect(unit.matchMove('k takes d 3')).toStrictEqual('Kxd3');
      expect(unit.matchMove('k captures d 3')).toStrictEqual('Kxd3');

      // Pice with file
      expect(unit.matchMove('r a d 3')).toStrictEqual('Rad3');
      expect(unit.matchMove('r a takes d 3')).toStrictEqual('Raxd3');
      expect(unit.matchMove('r a captures d 3')).toStrictEqual('Raxd3');
      expect(unit.matchMove('r a to d 3')).toStrictEqual('Rad3');
      expect(unit.matchMove('r a 2 d 3')).toStrictEqual('Rad3');

      expect(unit.matchMove('b a d 3')).toStrictEqual('Bad3');
      expect(unit.matchMove('b a takes d 3')).toStrictEqual('Baxd3');
      expect(unit.matchMove('b a captures d 3')).toStrictEqual('Baxd3');
      expect(unit.matchMove('b a to d 3')).toStrictEqual('Bad3');
      expect(unit.matchMove('b a 2 d 3')).toStrictEqual('Bad3');

      // Pice with rank
      expect(unit.matchMove('r 2 takes d 3')).toStrictEqual('R2xd3');
      expect(unit.matchMove('r 2 captures d 3')).toStrictEqual('R2xd3');
      expect(unit.matchMove('r 2 to d 3')).toStrictEqual('R2d3');
      expect(unit.matchMove('r 2 2 d 3')).toStrictEqual('R2d3');

      expect(unit.matchMove('b 2 takes d 3')).toStrictEqual('B2xd3');
      expect(unit.matchMove('b 2 captures d 3')).toStrictEqual('B2xd3');
      expect(unit.matchMove('b 2 to d 3')).toStrictEqual('B2d3');
      expect(unit.matchMove('b 2 2 d 3')).toStrictEqual('B2d3');

      expect(unit.matchMove('castle k side')).toEqual('O-O');
      expect(unit.matchMove('castle q side')).toEqual('O-O-O');
      expect(unit.matchMove('k side castle')).toEqual('O-O');
      expect(unit.matchMove('long castle')).toEqual('O-O-O');
      expect(unit.matchMove('castle long')).toEqual('O-O-O');
      expect(unit.matchMove('q side castle')).toEqual('O-O-O');
      expect(unit.matchMove('short castle')).toEqual('O-O');
      expect(unit.matchMove('castle short')).toEqual('O-O');
      expect(unit.matchMove('a 8 promote')).toStrictEqual('a8=Q');
      expect(unit.matchMove('a 8 b promotion')).toStrictEqual('a8=B');
      expect(unit.matchMove('a 8 promote to r')).toStrictEqual('a8=R');
      expect(unit.matchMove('a 8 promote to q')).toStrictEqual('a8=Q');
      expect(unit.matchMove('a takes b 8 promote')).toStrictEqual('axb8=Q');
      expect(unit.matchMove('a captures b 8 promote')).toStrictEqual('axb8=Q');
      expect(unit.matchMove('a takes b 8 n promotion')).toStrictEqual('axb8=N');
      expect(unit.matchMove('a captures b 8 promote to r')).toStrictEqual('axb8=R');
    });
  });

  describe('parse', () => {
    it('should parse moves correctly', () => {
      expect(unit.parse('undo')).toEqual('undo');
      expect(unit.parse('flip')).toEqual('flip');
      expect(unit.parse('resign')).toEqual('resign');
      expect(unit.parse('a two')).toEqual('a2');
      expect(unit.parse('h seven')).toEqual('h7');
      expect(unit.parse('a takes b one')).toEqual('axb1');
      expect(unit.parse('a captures b one')).toEqual('axb1');
      expect(unit.parse('aeight')).toEqual(undefined);
      expect(unit.parse('eighta')).toEqual(undefined);
      expect(unit.parse('invalid')).toEqual(undefined);
      expect(unit.parse('a two to a three')).toStrictEqual(['a2', 'a3']);
      expect(unit.parse('a two two a three')).toStrictEqual(['a2', 'a3']);
      expect(unit.parse('a two takes a three')).toStrictEqual(['a2', 'a3']);
      expect(unit.parse('a two captures a three')).toStrictEqual(['a2', 'a3']);
      expect(unit.parse('atweotoathree')).toStrictEqual(undefined);
      expect(unit.parse('to a three')).toStrictEqual(undefined);
      expect(unit.parse('a three to')).toStrictEqual(undefined);
      expect(unit.parse('n a three')).toStrictEqual('Na3');
      expect(unit.parse('r d three')).toStrictEqual('Rd3');
      expect(unit.parse('r a d three')).toStrictEqual('Rad3');
      expect(unit.parse('r a takes d three')).toStrictEqual('Raxd3');
      expect(unit.parse('r a captures d three')).toStrictEqual('Raxd3');
      expect(unit.parse('r two takes d three')).toStrictEqual('R2xd3');
      expect(unit.parse('r two captures d three')).toStrictEqual('R2xd3');
      expect(unit.parse('b to a three')).toStrictEqual('Ba3');
      expect(unit.parse('b two a three')).toStrictEqual('Ba3');
      expect(unit.parse('r two a three')).toStrictEqual('Ra3');
      expect(unit.parse('k takes d three')).toStrictEqual('Kxd3');
      expect(unit.parse('k captures d three')).toStrictEqual('Kxd3');
      expect(unit.parse('castle king side')).toEqual('O-O');
      expect(unit.parse('castle queen side')).toEqual('O-O-O');
      expect(unit.parse('king side castle')).toEqual('O-O');
      expect(unit.parse('long castle')).toEqual('O-O-O');
      expect(unit.parse('castle long')).toEqual('O-O-O');
      expect(unit.parse('queen side castle')).toEqual('O-O-O');
      expect(unit.parse('short castle')).toEqual('O-O');
      expect(unit.parse('castle short')).toEqual('O-O');
      expect(unit.parse('a eight promote')).toStrictEqual('a8=Q');
      expect(unit.parse('a eight b promotion')).toStrictEqual('a8=B');
      expect(unit.parse('a eight promote to r')).toStrictEqual('a8=R');
      expect(unit.parse('a eight promote to q')).toStrictEqual('a8=Q');
      expect(unit.parse('a takes b eight promote')).toStrictEqual('axb8=Q');
      expect(unit.parse('a captures b eight promote')).toStrictEqual('axb8=Q');
      expect(unit.parse('a takes b eight n promotion')).toStrictEqual('axb8=N');
      expect(unit.parse('a captures b eight promote to r')).toStrictEqual('axb8=R');
    });
  });
});
