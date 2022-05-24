package game

import "encoding/json"

type board [8][8]rune

const (
	LEFT  = -1
	RIGHT = 1
	UP    = -1
	DOWN  = 1
	FIX   = 0
)

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
		if row < 0 {
			row = 0
		}
		if col < 0 {
			col = 0
		}
		if row >= rl {
			row = rl - 1
		}
		if col >= cl {
			col = cl - 1
		}
	}
	if b[row][col] == mySide && (col != initCol+hDir || row != initRow+vDir) {
		b.flipFrom(initRow, initCol, vDir, hDir, opponentSide, mySide)
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
	isFlipped = b.traverseFrom(i, j, UP, FIX, mySide, opponentSide) || isFlipped
	isFlipped = b.traverseFrom(i, j, DOWN, FIX, mySide, opponentSide) || isFlipped
	isFlipped = b.traverseFrom(i, j, FIX, LEFT, mySide, opponentSide) || isFlipped
	isFlipped = b.traverseFrom(i, j, FIX, RIGHT, mySide, opponentSide) || isFlipped
	isFlipped = b.traverseFrom(i, j, UP, RIGHT, mySide, opponentSide) || isFlipped
	isFlipped = b.traverseFrom(i, j, UP, LEFT, mySide, opponentSide) || isFlipped
	isFlipped = b.traverseFrom(i, j, DOWN, LEFT, mySide, opponentSide) || isFlipped
	isFlipped = b.traverseFrom(i, j, DOWN, RIGHT, mySide, opponentSide) || isFlipped
	if isFlipped {
		b[i][j] = mySide
	}
	return
}
