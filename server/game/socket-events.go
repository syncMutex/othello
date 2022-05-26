package game

import (
	"encoding/json"
	"fmt"
	"othelloServer/game/player"
)

type moveDetails struct {
	RIdx int `json:"rowIdx"`
	CIdx int `json:"colIdx"`
}

func (g *gameStruct) listenSocketEventsFor(p player.Player) {
	p.On("game-state", func(b []byte) {
		res, _ := json.Marshal(struct {
			Board   board `json:"board"`
			CurTurn rune  `json:"curTurn"`
		}{g.board, g.curTurnRune})

		p.Emit("game-state-res", string(res))
	})

	p.On("cur-turn", func(b []byte) {
		p.Emit("cur-turn-res", string(g.curTurnRune))
	})

	p.On("move", func(b []byte) {
		var md moveDetails
		json.Unmarshal(b, &md)

		if g.curTurnRune == p.Side() {
			if isFlipped := g.board.traverseAndFlip(md.RIdx, md.CIdx, p.Side(), p.OpponentRune()); isFlipped {
				g.getOpponent().Emit("opponent-move", string(b))
				g.calcHasPossibleMoves()
				if g.isGameOver() {
					g.Broadcast("game-over", "")
					g.gameOver()
					fmt.Println("gmae obveer")
					return
				}
				g.changeTurn()
				if !g.curPlayer().hasPossibleMoves {
					g.changeTurn()
				}
				fmt.Println(string(g.curTurnRune))
				g.curPlayer().Emit("cur-turn", "")
			}
		}
	})
}
