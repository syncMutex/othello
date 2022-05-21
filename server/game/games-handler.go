package game

import (
	"time"
)

type gamesMapType map[string]Game

type gamesHandler interface {
	CreateNewGame(gameName string) (gameId string)
	GameSelfDestructOnIdle(gameId string, _ time.Duration)
	GetGameById(gameId string) Game
	DeleteGame(gameId string)
}

// gamesMapType methods
func (gm gamesMapType) CreateNewGame(gameName string) string {
	gameId := RandomString()
	gm[gameId] = NewGame()
	return gameId
}

func (gm gamesMapType) DeleteGame(gameId string) {
	delete(gm, gameId)
}

func (gm gamesMapType) GameSelfDestructOnIdle(gameId string, dur time.Duration) {
	g := gm[gameId]
	g.openChan()
	select {
	case <-g.getStopDestructChan():
		g.closeChan()
	case <-time.After(dur):
		gm.DeleteGame(gameId)
	}
}

func (gm gamesMapType) GetGameById(gameId string) Game {
	return gm[gameId]
}

var GamesMap gamesHandler = make(gamesMapType)
