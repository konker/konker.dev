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

  describe('adjacentFiles', () => {
    it('should return adjacent files', () => {
      expect(unit.adjacentFiles('a')).toStrictEqual(['b']);
      expect(unit.adjacentFiles('b')).toStrictEqual(['a', 'c']);
      expect(unit.adjacentFiles('d')).toStrictEqual(['c', 'e']);
      expect(unit.adjacentFiles('h')).toStrictEqual(['g']);
      expect(unit.adjacentFiles('x')).toStrictEqual([]);
    });
  });

  describe('matchPawnMove', () => {
    it('should match pawn moves correctly', () => {
      // Simple pawn moves
      expect(unit.matchPawnMove('a 2')).toStrictEqual({ candidates: ['a2'] });
      expect(unit.matchPawnMove('b 2')).toStrictEqual({ candidates: ['b2'] });
      expect(unit.matchPawnMove('e 4')).toStrictEqual({ candidates: ['e4'] });
      expect(unit.matchPawnMove('d 5')).toStrictEqual({ candidates: ['d5'] });
      expect(unit.matchPawnMove('h 7')).toStrictEqual({ candidates: ['h7'] });

      // Pawn captures
      expect(unit.matchPawnMove('a takes b 1')).toStrictEqual({ candidates: ['axb1'] });
      expect(unit.matchPawnMove('a captures b 1')).toStrictEqual({ candidates: ['axb1'] });
      expect(unit.matchPawnMove('e takes d 5')).toStrictEqual({ candidates: ['exd5'] });
      expect(unit.matchPawnMove('e captures d 5')).toStrictEqual({ candidates: ['exd5'] });

      // En passant
      expect(unit.matchPawnMove('a takes b 3 en passant')).toStrictEqual({ candidates: ['axb3'] });
      expect(unit.matchPawnMove('a captures b 3 en passant')).toStrictEqual({ candidates: ['axb3'] });
      expect(unit.matchPawnMove('e takes d 6 en passant')).toStrictEqual({ candidates: ['exd6'] });

      // Non-matches
      expect(unit.matchPawnMove('a8')).toEqual(undefined);
      expect(unit.matchPawnMove('8a')).toEqual(undefined);
      expect(unit.matchPawnMove('invalid')).toEqual(undefined);
      expect(unit.matchPawnMove('n a 3')).toEqual(undefined);
      expect(unit.matchPawnMove('a 2 to a 3')).toEqual(undefined);
    });
  });

  describe('matchCoordsMove', () => {
    it('should match coordinate moves correctly', () => {
      expect(unit.matchCoordMove('a 2 to a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchCoordMove('a 2 2 a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchCoordMove('e 2 to e 4')).toStrictEqual(['e2', 'e4']);
      expect(unit.matchCoordMove('h 1 2 h 2')).toStrictEqual(['h1', 'h2']);
      expect(unit.matchCoordMove('a 2 takes a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchCoordMove('a 2 captures a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchCoordMove('g 7 takes g 6')).toStrictEqual(['g7', 'g6']);
      expect(unit.matchCoordMove('d 7 captures e 6')).toStrictEqual(['d7', 'e6']);

      // Non-matches
      expect(unit.matchCoordMove('a2toa3')).toStrictEqual(undefined);
      expect(unit.matchCoordMove('to a 3')).toStrictEqual(undefined);
      expect(unit.matchCoordMove('a 3 to')).toStrictEqual(undefined);
      expect(unit.matchCoordMove('a 2')).toStrictEqual(undefined);
      expect(unit.matchCoordMove('n a 3')).toStrictEqual(undefined);
    });
  });

  describe('matchPieceMove', () => {
    it('should match piece moves correctly', () => {
      // Concise moves
      expect(unit.matchPieceMove('n a 3')).toStrictEqual({ candidates: ['Na3'] });
      expect(unit.matchPieceMove('n b 3')).toStrictEqual({ candidates: ['Nb3'] });
      expect(unit.matchPieceMove('r d 3')).toStrictEqual({ candidates: ['Rd3'] });
      expect(unit.matchPieceMove('q d 1')).toStrictEqual({ candidates: ['Qd1'] });
      expect(unit.matchPieceMove('p d 3')).toStrictEqual({ candidates: ['d3'] });

      // Verbose moves
      expect(unit.matchPieceMove('b to a 3')).toStrictEqual({ candidates: ['Ba3'] });
      expect(unit.matchPieceMove('b 2 a 3')).toStrictEqual({ candidates: ['Ba3', 'B2a3'] });
      expect(unit.matchPieceMove('b 2 b 3')).toStrictEqual({ candidates: ['Bb3', 'B2b3'] });
      expect(unit.matchPieceMove('r 2 a 3')).toStrictEqual({ candidates: ['Ra3', 'R2a3'] });
      expect(unit.matchPieceMove('q to d 1')).toStrictEqual({ candidates: ['Qd1'] });
      expect(unit.matchPieceMove('p to b 2')).toStrictEqual({ candidates: ['b2'] });
      expect(unit.matchPieceMove('p 2 b 2')).toStrictEqual({ candidates: ['b2'] });
      expect(unit.matchPieceMove('k takes d 3')).toStrictEqual({ candidates: ['Kxd3'] });
      expect(unit.matchPieceMove('k captures d 3')).toStrictEqual({ candidates: ['Kxd3'] });
      expect(unit.matchPieceMove('q takes d 3')).toStrictEqual({ candidates: ['Qxd3'] });
      expect(unit.matchPieceMove('q captures d 3')).toStrictEqual({ candidates: ['Qxd3'] });

      // Pawn captures (generates candidates from adjacent files)
      expect(unit.matchPieceMove('p takes h 8')).toStrictEqual({ candidates: ['gxh8'] });
      expect(unit.matchPieceMove('p captures h 8')).toStrictEqual({ candidates: ['gxh8'] });
      expect(unit.matchPieceMove('p takes a 4')).toStrictEqual({ candidates: ['bxa4'] });
      expect(unit.matchPieceMove('p captures a 4')).toStrictEqual({ candidates: ['bxa4'] });
      expect(unit.matchPieceMove('p takes e 5')).toStrictEqual({ candidates: ['dxe5', 'fxe5'] });
      expect(unit.matchPieceMove('p captures e 5')).toStrictEqual({ candidates: ['dxe5', 'fxe5'] });

      // Piece with file
      expect(unit.matchPieceMove('r a d 3')).toStrictEqual({ candidates: ['Rad3'] });
      expect(unit.matchPieceMove('r a takes d 3')).toStrictEqual({ candidates: ['Raxd3'] });
      expect(unit.matchPieceMove('r a captures d 3')).toStrictEqual({ candidates: ['Raxd3'] });
      expect(unit.matchPieceMove('r a to d 3')).toStrictEqual({ candidates: ['Rad3'] });
      expect(unit.matchPieceMove('r a 2 d 3')).toStrictEqual({ candidates: ['Rad3'] });

      expect(unit.matchPieceMove('b a d 3')).toStrictEqual({ candidates: ['Bad3'] });
      expect(unit.matchPieceMove('b a b 2')).toStrictEqual({ candidates: ['Bab2'] });
      expect(unit.matchPieceMove('b b b 2')).toStrictEqual({ candidates: ['Bbb2'] });
      expect(unit.matchPieceMove('b a takes d 3')).toStrictEqual({ candidates: ['Baxd3'] });
      expect(unit.matchPieceMove('b a captures d 3')).toStrictEqual({ candidates: ['Baxd3'] });
      expect(unit.matchPieceMove('b a to d 3')).toStrictEqual({ candidates: ['Bad3'] });
      expect(unit.matchPieceMove('b a 2 d 3')).toStrictEqual({ candidates: ['Bad3'] });
      expect(unit.matchPieceMove('b a 2 b 3')).toStrictEqual({ candidates: ['Bab3'] });

      // Piece with rank
      expect(unit.matchPieceMove('r 2 d 3')).toStrictEqual({ candidates: ['Rd3', 'R2d3'] });
      expect(unit.matchPieceMove('r 3 d 3')).toStrictEqual({ candidates: ['R3d3'] });
      expect(unit.matchPieceMove('b 3 b 3')).toStrictEqual({ candidates: ['B3b3'] });
      expect(unit.matchPieceMove('r 2 takes d 3')).toStrictEqual({ candidates: ['R2xd3'] });
      expect(unit.matchPieceMove('r 2 captures d 3')).toStrictEqual({ candidates: ['R2xd3'] });
      expect(unit.matchPieceMove('r 2 to d 3')).toStrictEqual({ candidates: ['R2d3'] });
      expect(unit.matchPieceMove('r 2 2 d 3')).toStrictEqual({ candidates: ['R2d3'] });

      expect(unit.matchPieceMove('b 2 d 3')).toStrictEqual({ candidates: ['Bd3', 'B2d3'] });
      expect(unit.matchPieceMove('b 3 d 3')).toStrictEqual({ candidates: ['B3d3'] });
      expect(unit.matchPieceMove('b 2 takes d 3')).toStrictEqual({ candidates: ['B2xd3'] });
      expect(unit.matchPieceMove('b 2 captures d 3')).toStrictEqual({ candidates: ['B2xd3'] });
      expect(unit.matchPieceMove('b 2 to d 3')).toStrictEqual({ candidates: ['B2d3'] });
      expect(unit.matchPieceMove('b 2 2 b 2')).toStrictEqual({ candidates: ['B2b2'] });

      // Non-matches
      expect(unit.matchPieceMove('a 2')).toEqual(undefined);
      expect(unit.matchPieceMove('castle k side')).toEqual(undefined);
      expect(unit.matchPieceMove('invalid')).toEqual(undefined);
    });
  });

  describe('matchCastleMove', () => {
    it('should match castle moves correctly', () => {
      expect(unit.matchCastleMove('castle k side')).toStrictEqual({ candidates: ['O-O'] });
      expect(unit.matchCastleMove('castle q side')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.matchCastleMove('k side castle')).toStrictEqual({ candidates: ['O-O'] });
      expect(unit.matchCastleMove('long castle')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.matchCastleMove('castle long')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.matchCastleMove('q side castle')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.matchCastleMove('short castle')).toStrictEqual({ candidates: ['O-O'] });
      expect(unit.matchCastleMove('castle short')).toStrictEqual({ candidates: ['O-O'] });
    });
  });

  describe('matchPawnPromotionMove', () => {
    it('should match pawn promotion moves correctly', () => {
      expect(unit.matchPawnPromotionMove('a 8 promote')).toStrictEqual({ candidates: ['a8=Q'] });
      expect(unit.matchPawnPromotionMove('a 8 b promotion')).toStrictEqual({ candidates: ['a8=B'] });
      expect(unit.matchPawnPromotionMove('a 8 promote to r')).toStrictEqual({ candidates: ['a8=R'] });
      expect(unit.matchPawnPromotionMove('a 8 promote to q')).toStrictEqual({ candidates: ['a8=Q'] });
      expect(unit.matchPawnPromotionMove('a takes b 8 promote')).toStrictEqual({ candidates: ['axb8=Q'] });
      expect(unit.matchPawnPromotionMove('a captures b 8 promote')).toStrictEqual({ candidates: ['axb8=Q'] });
      expect(unit.matchPawnPromotionMove('a takes b 8 n promotion')).toStrictEqual({ candidates: ['axb8=N'] });
      expect(unit.matchPawnPromotionMove('a captures b 8 promote to r')).toStrictEqual({ candidates: ['axb8=R'] });
    });
  });

  describe('matchMove', () => {
    it('should match moves correctly', () => {
      // matchControlInstruction
      expect(unit.matchMove('undo')).toEqual('undo');
      expect(unit.matchMove('flip')).toEqual('flip');
      expect(unit.matchMove('resign')).toEqual('resign');

      // matchPawnMove: simple pawn moves
      expect(unit.matchMove('a 2')).toStrictEqual({ candidates: ['a2'] });
      expect(unit.matchMove('b 2')).toStrictEqual({ candidates: ['b2'] });
      expect(unit.matchMove('e 4')).toStrictEqual({ candidates: ['e4'] });
      expect(unit.matchMove('d 5')).toStrictEqual({ candidates: ['d5'] });
      expect(unit.matchMove('h 7')).toStrictEqual({ candidates: ['h7'] });

      // matchPawnMove: pawn captures
      expect(unit.matchMove('a takes b 1')).toStrictEqual({ candidates: ['axb1'] });
      expect(unit.matchMove('a captures b 1')).toStrictEqual({ candidates: ['axb1'] });
      expect(unit.matchMove('e takes d 5')).toStrictEqual({ candidates: ['exd5'] });
      expect(unit.matchMove('e captures d 5')).toStrictEqual({ candidates: ['exd5'] });

      // matchPawnMove: en passant
      expect(unit.matchMove('a takes b 3 en passant')).toStrictEqual({ candidates: ['axb3'] });
      expect(unit.matchMove('a captures b 3 en passant')).toStrictEqual({ candidates: ['axb3'] });
      expect(unit.matchMove('e takes d 6 en passant')).toStrictEqual({ candidates: ['exd6'] });

      // matchPawnMove: non-matches
      expect(unit.matchMove('a8')).toEqual(undefined);
      expect(unit.matchMove('8a')).toEqual(undefined);
      expect(unit.matchMove('invalid')).toEqual(undefined);

      // matchPieceMove: concise moves
      expect(unit.matchMove('n a 3')).toStrictEqual({ candidates: ['Na3'] });
      expect(unit.matchMove('n b 3')).toStrictEqual({ candidates: ['Nb3'] });
      expect(unit.matchMove('r d 3')).toStrictEqual({ candidates: ['Rd3'] });
      expect(unit.matchMove('q d 1')).toStrictEqual({ candidates: ['Qd1'] });
      expect(unit.matchMove('p d 3')).toStrictEqual({ candidates: ['d3'] });

      // matchPieceMove: verbose moves
      expect(unit.matchMove('b to a 3')).toStrictEqual({ candidates: ['Ba3'] });
      expect(unit.matchMove('b 2 a 3')).toStrictEqual({ candidates: ['Ba3', 'B2a3'] });
      expect(unit.matchMove('b 2 b 3')).toStrictEqual({ candidates: ['Bb3', 'B2b3'] });
      expect(unit.matchMove('r 2 a 3')).toStrictEqual({ candidates: ['Ra3', 'R2a3'] });
      expect(unit.matchMove('q to d 1')).toStrictEqual({ candidates: ['Qd1'] });
      expect(unit.matchMove('p to b 2')).toStrictEqual({ candidates: ['b2'] });
      expect(unit.matchMove('p 2 b 2')).toStrictEqual({ candidates: ['b2'] });
      expect(unit.matchMove('k takes d 3')).toStrictEqual({ candidates: ['Kxd3'] });
      expect(unit.matchMove('k captures d 3')).toStrictEqual({ candidates: ['Kxd3'] });
      expect(unit.matchMove('q takes d 3')).toStrictEqual({ candidates: ['Qxd3'] });
      expect(unit.matchMove('q captures d 3')).toStrictEqual({ candidates: ['Qxd3'] });

      // matchPieceMove: pawn captures (generates candidates from adjacent files)
      expect(unit.matchMove('p takes h 8')).toStrictEqual({ candidates: ['gxh8'] });
      expect(unit.matchMove('p captures h 8')).toStrictEqual({ candidates: ['gxh8'] });
      expect(unit.matchMove('p takes a 4')).toStrictEqual({ candidates: ['bxa4'] });
      expect(unit.matchMove('p captures a 4')).toStrictEqual({ candidates: ['bxa4'] });
      expect(unit.matchMove('p takes e 5')).toStrictEqual({ candidates: ['dxe5', 'fxe5'] });
      expect(unit.matchMove('p captures e 5')).toStrictEqual({ candidates: ['dxe5', 'fxe5'] });

      // matchPieceMove: piece with file
      expect(unit.matchMove('r a d 3')).toStrictEqual({ candidates: ['Rad3'] });
      expect(unit.matchMove('r a takes d 3')).toStrictEqual({ candidates: ['Raxd3'] });
      expect(unit.matchMove('r a captures d 3')).toStrictEqual({ candidates: ['Raxd3'] });
      expect(unit.matchMove('r a to d 3')).toStrictEqual({ candidates: ['Rad3'] });
      expect(unit.matchMove('r a 2 d 3')).toStrictEqual({ candidates: ['Rad3'] });

      expect(unit.matchMove('b a d 3')).toStrictEqual({ candidates: ['Bad3'] });
      expect(unit.matchMove('b a b 2')).toStrictEqual({ candidates: ['Bab2'] });
      expect(unit.matchMove('b b b 2')).toStrictEqual({ candidates: ['Bbb2'] });
      expect(unit.matchMove('b a takes d 3')).toStrictEqual({ candidates: ['Baxd3'] });
      expect(unit.matchMove('b a captures d 3')).toStrictEqual({ candidates: ['Baxd3'] });
      expect(unit.matchMove('b a to d 3')).toStrictEqual({ candidates: ['Bad3'] });
      expect(unit.matchMove('b a 2 d 3')).toStrictEqual({ candidates: ['Bad3'] });
      expect(unit.matchMove('b a 2 b 3')).toStrictEqual({ candidates: ['Bab3'] });

      // matchPieceMove: piece with rank
      expect(unit.matchMove('r 2 d 3')).toStrictEqual({ candidates: ['Rd3', 'R2d3'] });
      expect(unit.matchMove('r 3 d 3')).toStrictEqual({ candidates: ['R3d3'] });
      expect(unit.matchMove('b 3 b 3')).toStrictEqual({ candidates: ['B3b3'] });
      expect(unit.matchMove('r 2 takes d 3')).toStrictEqual({ candidates: ['R2xd3'] });
      expect(unit.matchMove('r 2 captures d 3')).toStrictEqual({ candidates: ['R2xd3'] });
      expect(unit.matchMove('r 2 to d 3')).toStrictEqual({ candidates: ['R2d3'] });
      expect(unit.matchMove('r 2 2 d 3')).toStrictEqual({ candidates: ['R2d3'] });

      expect(unit.matchMove('b 2 d 3')).toStrictEqual({ candidates: ['Bd3', 'B2d3'] });
      expect(unit.matchMove('b 3 d 3')).toStrictEqual({ candidates: ['B3d3'] });
      expect(unit.matchMove('b 2 takes d 3')).toStrictEqual({ candidates: ['B2xd3'] });
      expect(unit.matchMove('b 2 captures d 3')).toStrictEqual({ candidates: ['B2xd3'] });
      expect(unit.matchMove('b 2 to d 3')).toStrictEqual({ candidates: ['B2d3'] });
      expect(unit.matchMove('b 2 2 b 2')).toStrictEqual({ candidates: ['B2b2'] });

      // matchCoordMove
      expect(unit.matchMove('a 2 to a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchMove('a 2 2 a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchMove('e 2 to e 4')).toStrictEqual(['e2', 'e4']);
      expect(unit.matchMove('h 1 2 h 2')).toStrictEqual(['h1', 'h2']);
      expect(unit.matchMove('a 2 takes a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchMove('a 2 captures a 3')).toStrictEqual(['a2', 'a3']);
      expect(unit.matchMove('g 7 takes g 6')).toStrictEqual(['g7', 'g6']);
      expect(unit.matchMove('d 7 captures e 6')).toStrictEqual(['d7', 'e6']);

      // matchCastleMove
      expect(unit.matchMove('castle k side')).toStrictEqual({ candidates: ['O-O'] });
      expect(unit.matchMove('castle q side')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.matchMove('k side castle')).toStrictEqual({ candidates: ['O-O'] });
      expect(unit.matchMove('long castle')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.matchMove('castle long')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.matchMove('q side castle')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.matchMove('short castle')).toStrictEqual({ candidates: ['O-O'] });
      expect(unit.matchMove('castle short')).toStrictEqual({ candidates: ['O-O'] });

      // matchPawnPromotionMove
      expect(unit.matchMove('a 8 promote')).toStrictEqual({ candidates: ['a8=Q'] });
      expect(unit.matchMove('a 8 b promotion')).toStrictEqual({ candidates: ['a8=B'] });
      expect(unit.matchMove('a 8 promote to r')).toStrictEqual({ candidates: ['a8=R'] });
      expect(unit.matchMove('a 8 promote to q')).toStrictEqual({ candidates: ['a8=Q'] });
      expect(unit.matchMove('a takes b 8 promote')).toStrictEqual({ candidates: ['axb8=Q'] });
      expect(unit.matchMove('a captures b 8 promote')).toStrictEqual({ candidates: ['axb8=Q'] });
      expect(unit.matchMove('a takes b 8 n promotion')).toStrictEqual({ candidates: ['axb8=N'] });
      expect(unit.matchMove('a captures b 8 promote to r')).toStrictEqual({ candidates: ['axb8=R'] });
    });
  });

  describe('parse', () => {
    it('should parse moves correctly', () => {
      // matchControlInstruction
      expect(unit.parse('undo')).toEqual('undo');
      expect(unit.parse('flip')).toEqual('flip');
      expect(unit.parse('resign')).toEqual('resign');

      // matchPawnMove: simple pawn moves
      expect(unit.parse('a two')).toStrictEqual({ candidates: ['a2'] });
      expect(unit.parse('b two')).toStrictEqual({ candidates: ['b2'] });
      expect(unit.parse('e four')).toStrictEqual({ candidates: ['e4'] });
      expect(unit.parse('d five')).toStrictEqual({ candidates: ['d5'] });
      expect(unit.parse('h seven')).toStrictEqual({ candidates: ['h7'] });

      // matchPawnMove: pawn captures
      expect(unit.parse('a takes b one')).toStrictEqual({ candidates: ['axb1'] });
      expect(unit.parse('a captures b one')).toStrictEqual({ candidates: ['axb1'] });
      expect(unit.parse('e takes d five')).toStrictEqual({ candidates: ['exd5'] });
      expect(unit.parse('e captures d five')).toStrictEqual({ candidates: ['exd5'] });

      // matchPawnMove: en passant
      expect(unit.parse('a takes b three en passant')).toStrictEqual({ candidates: ['axb3'] });
      expect(unit.parse('a captures b three en passant')).toStrictEqual({ candidates: ['axb3'] });
      expect(unit.parse('e takes d six en passant')).toStrictEqual({ candidates: ['exd6'] });

      // matchPawnMove: non-matches
      expect(unit.parse('aeight')).toEqual(undefined);
      expect(unit.parse('eighta')).toEqual(undefined);
      expect(unit.parse('invalid')).toEqual(undefined);

      // matchPieceMove: concise moves
      expect(unit.parse('knight a three')).toStrictEqual({ candidates: ['Na3'] });
      expect(unit.parse('knight b three')).toStrictEqual({ candidates: ['Nb3'] });
      expect(unit.parse('rook d three')).toStrictEqual({ candidates: ['Rd3'] });
      expect(unit.parse('queen d one')).toStrictEqual({ candidates: ['Qd1'] });
      expect(unit.parse('pawn d three')).toStrictEqual({ candidates: ['d3'] });

      // matchPieceMove: verbose moves
      expect(unit.parse('bishop to a three')).toStrictEqual({ candidates: ['Ba3'] });
      expect(unit.parse('bishop two a three')).toStrictEqual({ candidates: ['Ba3', 'B2a3'] });
      expect(unit.parse('bishop two b three')).toStrictEqual({ candidates: ['Bb3', 'B2b3'] });
      expect(unit.parse('rook two a three')).toStrictEqual({ candidates: ['Ra3', 'R2a3'] });
      expect(unit.parse('queen to d one')).toStrictEqual({ candidates: ['Qd1'] });
      expect(unit.parse('pawn to b two')).toStrictEqual({ candidates: ['b2'] });
      expect(unit.parse('pawn two b two')).toStrictEqual({ candidates: ['b2'] });
      expect(unit.parse('king takes d three')).toStrictEqual({ candidates: ['Kxd3'] });
      expect(unit.parse('king captures d three')).toStrictEqual({ candidates: ['Kxd3'] });
      expect(unit.parse('queen takes d three')).toStrictEqual({ candidates: ['Qxd3'] });
      expect(unit.parse('queen captures d three')).toStrictEqual({ candidates: ['Qxd3'] });

      // matchPieceMove: pawn captures (generates candidates from adjacent files)
      expect(unit.parse('pawn takes h eight')).toStrictEqual({ candidates: ['gxh8'] });
      expect(unit.parse('pawn captures h eight')).toStrictEqual({ candidates: ['gxh8'] });
      expect(unit.parse('pawn takes a four')).toStrictEqual({ candidates: ['bxa4'] });
      expect(unit.parse('pawn captures a four')).toStrictEqual({ candidates: ['bxa4'] });
      expect(unit.parse('pawn takes e five')).toStrictEqual({ candidates: ['dxe5', 'fxe5'] });
      expect(unit.parse('pawn captures e five')).toStrictEqual({ candidates: ['dxe5', 'fxe5'] });

      // matchPieceMove: piece with file
      expect(unit.parse('rook a d three')).toStrictEqual({ candidates: ['Rad3'] });
      expect(unit.parse('rook a takes d three')).toStrictEqual({ candidates: ['Raxd3'] });
      expect(unit.parse('rook a captures d three')).toStrictEqual({ candidates: ['Raxd3'] });
      expect(unit.parse('rook a to d three')).toStrictEqual({ candidates: ['Rad3'] });
      expect(unit.parse('rook a two d three')).toStrictEqual({ candidates: ['Rad3'] });

      expect(unit.parse('bishop a d three')).toStrictEqual({ candidates: ['Bad3'] });
      expect(unit.parse('bishop a b two')).toStrictEqual({ candidates: ['Bab2'] });
      expect(unit.parse('bishop b b two')).toStrictEqual({ candidates: ['Bbb2'] });
      expect(unit.parse('bishop a takes d three')).toStrictEqual({ candidates: ['Baxd3'] });
      expect(unit.parse('bishop a captures d three')).toStrictEqual({ candidates: ['Baxd3'] });
      expect(unit.parse('bishop a to d three')).toStrictEqual({ candidates: ['Bad3'] });
      expect(unit.parse('bishop a two d three')).toStrictEqual({ candidates: ['Bad3'] });
      expect(unit.parse('bishop a two b three')).toStrictEqual({ candidates: ['Bab3'] });

      // matchPieceMove: piece with rank
      expect(unit.parse('rook two d three')).toStrictEqual({ candidates: ['Rd3', 'R2d3'] });
      expect(unit.parse('rook three d three')).toStrictEqual({ candidates: ['R3d3'] });
      expect(unit.parse('bishop three b three')).toStrictEqual({ candidates: ['B3b3'] });
      expect(unit.parse('rook two takes d three')).toStrictEqual({ candidates: ['R2xd3'] });
      expect(unit.parse('rook two captures d three')).toStrictEqual({ candidates: ['R2xd3'] });
      expect(unit.parse('rook two to d three')).toStrictEqual({ candidates: ['R2d3'] });
      expect(unit.parse('rook two two d three')).toStrictEqual({ candidates: ['R2d3'] });

      expect(unit.parse('bishop two d three')).toStrictEqual({ candidates: ['Bd3', 'B2d3'] });
      expect(unit.parse('bishop three d three')).toStrictEqual({ candidates: ['B3d3'] });
      expect(unit.parse('bishop two takes d three')).toStrictEqual({ candidates: ['B2xd3'] });
      expect(unit.parse('bishop two captures d three')).toStrictEqual({ candidates: ['B2xd3'] });
      expect(unit.parse('bishop two to d three')).toStrictEqual({ candidates: ['B2d3'] });
      expect(unit.parse('bishop two two b two')).toStrictEqual({ candidates: ['B2b2'] });

      // matchCoordMove
      expect(unit.parse('a two to a three')).toStrictEqual(['a2', 'a3']);
      expect(unit.parse('a two two a three')).toStrictEqual(['a2', 'a3']);
      expect(unit.parse('e two to e four')).toStrictEqual(['e2', 'e4']);
      expect(unit.parse('h one two h two')).toStrictEqual(['h1', 'h2']);
      expect(unit.parse('a two takes a three')).toStrictEqual(['a2', 'a3']);
      expect(unit.parse('a two captures a three')).toStrictEqual(['a2', 'a3']);
      expect(unit.parse('g seven takes g six')).toStrictEqual(['g7', 'g6']);
      expect(unit.parse('d seven captures e six')).toStrictEqual(['d7', 'e6']);

      // matchCastleMove
      expect(unit.parse('castle king side')).toStrictEqual({ candidates: ['O-O'] });
      expect(unit.parse('castle queen side')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.parse('king side castle')).toStrictEqual({ candidates: ['O-O'] });
      expect(unit.parse('long castle')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.parse('castle long')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.parse('queen side castle')).toStrictEqual({ candidates: ['O-O-O'] });
      expect(unit.parse('short castle')).toStrictEqual({ candidates: ['O-O'] });
      expect(unit.parse('castle short')).toStrictEqual({ candidates: ['O-O'] });

      // matchPawnPromotionMove
      expect(unit.parse('a eight promote')).toStrictEqual({ candidates: ['a8=Q'] });
      expect(unit.parse('a eight bishop promotion')).toStrictEqual({ candidates: ['a8=B'] });
      expect(unit.parse('a eight promote to rook')).toStrictEqual({ candidates: ['a8=R'] });
      expect(unit.parse('a eight promote to queen')).toStrictEqual({ candidates: ['a8=Q'] });
      expect(unit.parse('a takes b eight promote')).toStrictEqual({ candidates: ['axb8=Q'] });
      expect(unit.parse('a captures b eight promote')).toStrictEqual({ candidates: ['axb8=Q'] });
      expect(unit.parse('a takes b eight knight promotion')).toStrictEqual({ candidates: ['axb8=N'] });
      expect(unit.parse('a captures b eight promote to rook')).toStrictEqual({ candidates: ['axb8=R'] });
    });
  });
});
