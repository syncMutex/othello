package game

import (
	"encoding/json"
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
		}{g.board, g.curTurn})

		p.Emit("game-state-res", string(res))
	})

	p.On("cur-turn", func(b []byte) {
		p.Emit("cur-turn-res", string(g.curTurn))
	})

	p.On("move", func(b []byte) {
		var md moveDetails
		json.Unmarshal(b, &md)

		if g.curTurn == p.Side() {
			if isFlipped := g.board.traverseAndFlip(md.RIdx, md.CIdx, p.Side(), p.Opponent()); isFlipped {
				if p.Side() == BLACK {
					g.whiteSide.Emit("opponent-move", string(b))
				} else {
					g.blackSide.Emit("opponent-move", string(b))
				}
				g.changeTurn()
			}
		}
	})
}
