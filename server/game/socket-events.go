package game

import (
	"encoding/json"
	"othelloServer/game/player"
)

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
}
