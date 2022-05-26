package game

import (
	"encoding/json"
)

type board [8][8]rune

const (
	LEFT  = -1
	RIGHT = 1
	UP    = -1
	DOWN  = 1
	FIX   = 0
)

var TRAV_ARR = [][2]int{
	{UP, FIX},
	{DOWN, FIX},
	{FIX, LEFT},
	{FIX, RIGHT},
	{UP, RIGHT},
	{UP, LEFT},
	{DOWN, LEFT},
	{DOWN, RIGHT},
}

func (b *board) JsonString() string {
	bs, _ := json.Marshal(b)
	return string(bs)
}

func (b *board) isInBounds(r, c, rl, cl int) bool {
	return r >= 0 && r < rl && c >= 0 && c < cl
}

func (b *board) traverseFrom(initRow, initCol, vDir, hDir int, mySide, opponentSide rune) bool {
	row := initRow + vDir
	col := initCol + hDir
	rl, cl := len(b), len(b[0])

	for b.isInBounds(row, col, rl, cl) && (b[row][col] == opponentSide) {
		row += vDir
		col += hDir
	}
	if !b.isInBounds(row, col, rl, cl) {
		row += vDir * -1
		col += hDir * -1
	}
	if b[row][col] == mySide && (col != initCol+hDir || row != initRow+vDir) {
		return true
	}
	return false
}

func (b *board) flipFrom(initRow, initCol, vDir, hDir int, flipFrom, flipTo rune) {
	row := initRow + vDir
	col := initCol + hDir
	rl, cl := len(b), len(b[0])
	for b.isInBounds(row, col, rl, cl) && (b[row][col] == flipFrom) {
		b[row][col] = flipTo
		row += vDir
		col += hDir
	}
}

func (b *board) traverseAndFlip(i, j int, mySide, opponentSide rune) (isFlipped bool) {
	for _, d := range TRAV_ARR {
		f := b.traverseFrom(i, j, d[0], d[1], mySide, opponentSide)
		if f {
			b.flipFrom(i, j, d[0], d[1], opponentSide, mySide)
		}
		isFlipped = f || isFlipped
	}
	if isFlipped {
		b[i][j] = mySide
	}
	return
}

func (b *board) hasPossibleMoves(mySide, opponentSide rune) bool {
	for i := range b {
		for j := range b[i] {
			if b[i][j] != mySide {
				continue
			}
			for _, d := range TRAV_ARR {
				if b.traverseFrom(i, j, d[0], d[1], 0, opponentSide) {
					return true
				}
			}
		}
	}
	return false
}
