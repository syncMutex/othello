package game

import "othelloServer/game/player"

func (g *gameStruct) listenSocketEventsFor(p player.Player) {
	p.On("init-board", func(b []byte) {
		p.Emit("init-board-res", g.board.JsonString())
	})
}
