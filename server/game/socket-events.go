package game

import (
	"encoding/json"
	"othelloServer/game/player"
)

type moveDetails struct {
	RIdx int `json:"rowIdx"`
	CIdx int `json:"colIdx"`
}

func (g *gameStruct) ListenSocketEventsFor(p player.Player) {
	p.On("game-state", func(b []byte) {
		res, _ := json.Marshal(struct {
			Board       board `json:"board"`
			CurTurn     rune  `json:"curTurn"`
			BlackPoints int   `json:"blackPoints"`
			WhitePoints int   `json:"whitePoints"`
		}{g.board, g.curTurnRune, g.board.getPointsFor(BLACK), g.board.getPointsFor(WHITE)})

		p.Emit("game-state-res", string(res))
	})

	p.On("cur-turn", func(b []byte) {
		p.Emit("cur-turn-res", string(g.curTurnRune))
	})

	p.On("chat-msg", func(b []byte) {
		g.getOpponentOf(p.Side()).Emit("chat-msg", string(b))
	})

	p.On("resign-game", func(b []byte) {
		g.getOpponentOf(p.Side()).Emit("opponent-resign", "")
		g.gameOver()
	})

	p.On("move", func(b []byte) {
		var md moveDetails
		json.Unmarshal(b, &md)

		if g.curTurnRune == p.Side() {
			if isFlipped := g.board.traverseAndFlip(md.RIdx, md.CIdx, p.Side(), p.OpponentRune()); isFlipped {
				g.getCurOpponent().Emit("opponent-move", string(b))
				g.calcHasPossibleMoves()
				if g.isGameOver() {
					g.Broadcast("game-over", "")
					g.gameOver()
					return
				}
				g.changeTurn()
				if !g.curPlayer().hasPossibleMoves {
					g.changeTurn()
				}
				g.curPlayer().Emit("cur-turn", "")
			}
		}
	})
}
