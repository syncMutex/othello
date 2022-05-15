package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"othelloServer/socket"
	"time"
)

type playerStruct struct {
	s      socket.Socket
	name   string
	id     string
	isRsvd bool
}

type gameStruct struct {
	blackSide          player
	whiteSide          player
	gameState          int
	gameName           string
	isGameStarted      bool
	stopDestructChan   chan (struct{})
	isDestructChanOpen bool
}

type gamesMapType map[string]game

type player interface {
	Emit(string, string)
	connect(socket.Socket, string)
	reConnect(socket.Socket)
	disconnect()
	isIdValid(string) bool
	isConnected() bool
	isReserved() bool
	playerId() string
	playerName() string
}

type game interface {
	getStopDestructChan() <-chan struct{}
	closeChan()
	openChan()
	stopDestruct()

	joinGame(name, side string, _ socket.Socket) (playerId string, _ error)

	isGameIdle() bool
	isGameFull() bool

	broadcast(string, string)
	emitWhite(string, string)
	emitBlack(string, string)

	getGameName() string
	getPlayerById(string) player
	getEmptySide() string
	getLobbyInfoJson() string
}

type gamesHandler interface {
	createNewGame(gameName string) (gameId string)
	gameSelfDestructOnIdle(gameId string, _ time.Duration)
	getGameById(gameId string) game
	deleteGame(gameId string)
}

func randomString() string {
	b := make([]byte, 8)
	_, err := rand.Read(b)
	if err != nil {
		log.Fatal(err)
	}
	return hex.EncodeToString(b)
}

// player methods
func (p *playerStruct) playerName() string {
	return p.name
}

func (p *playerStruct) Emit(evName, data string) {
	p.s.Emit(evName, data)
}

func (p *playerStruct) isIdValid(id string) bool {
	return p.id == id
}

func (p *playerStruct) connect(s socket.Socket, name string) {
	p.s = s
	p.isRsvd = true
	p.name = name
}

func (p *playerStruct) reConnect(s socket.Socket) {
	p.s = s
}

func (p *playerStruct) disconnect() {
	p.s = nil
}

func (p *playerStruct) isConnected() bool {
	return p.s != nil
}

func (p *playerStruct) isReserved() bool {
	return p.isRsvd
}

func (p *playerStruct) playerId() string {
	return p.id
}

// gameStruct methods

func (g *gameStruct) broadcast(evName, data string) {
	g.emitBlack(evName, data)
	g.emitWhite(evName, data)
}

func (g *gameStruct) emitBlack(evName, data string) {
	if g.blackSide.isConnected() {
		g.blackSide.Emit(evName, data)
	}
}

func (g *gameStruct) emitWhite(evName, data string) {
	if g.whiteSide.isConnected() {
		g.whiteSide.Emit(evName, data)
	}
}

func (g *gameStruct) getLobbyInfoJson() string {
	lobby := struct {
		Black string `json:"black"`
		White string `json:"white"`
	}{g.blackSide.playerName(), g.whiteSide.playerName()}

	j, _ := json.Marshal(lobby)
	return string(j)
}

func (g *gameStruct) setPlayer(side string, p player) {
	if side == "black" {
		g.blackSide = p
	} else if side == "white" {
		g.whiteSide = p
	}
}

func (g *gameStruct) isGameFull() bool {
	return g.blackSide.isReserved() && g.whiteSide.isReserved()
}

func (g *gameStruct) getEmptySide() string {
	if !g.blackSide.isReserved() {
		return "black"
	} else if !g.whiteSide.isReserved() {
		return "white"
	}
	return ""
}

func (g *gameStruct) getPlayerById(pid string) player {
	if g.blackSide.isIdValid(pid) {
		return g.blackSide
	} else if g.whiteSide.isIdValid(pid) {
		return g.whiteSide
	}
	return nil
}

func (g *gameStruct) checkHost(name string) {
	if !g.blackSide.isReserved() && !g.whiteSide.isReserved() {
		g.gameName = name
	}
}

func (g *gameStruct) getGameName() string {
	return g.gameName
}

func (g *gameStruct) isGameIdle() bool {
	return !g.blackSide.isConnected() && !g.whiteSide.isConnected()
}

func (g *gameStruct) joinGame(name, side string, s socket.Socket) (playerId string, retErr error) {
	g.checkHost(name)
	switch side {
	case "black":
		if g.blackSide.isReserved() {
			return "", errors.New("black side already reserved.")
		}
		g.blackSide.connect(s, name)
		playerId = g.blackSide.playerId()
	case "white":
		if g.whiteSide.isReserved() {
			return "", errors.New("black side already reserved.")
		}
		g.whiteSide.connect(s, name)
		playerId = g.whiteSide.playerId()
	default:
		retErr = errors.New("unknown side.")
	}
	return
}

func (g *gameStruct) getStopDestructChan() <-chan struct{} {
	return g.stopDestructChan
}

func (g *gameStruct) closeChan() {
	if g.isDestructChanOpen {
		close(g.stopDestructChan)
		g.isDestructChanOpen = false
	}
}

func (g *gameStruct) openChan() {
	if g.isDestructChanOpen {
		return
	}
	g.stopDestructChan = make(chan struct{})
	g.isDestructChanOpen = true
}

func (g *gameStruct) stopDestruct() {
	if g.isDestructChanOpen {
		g.stopDestructChan <- struct{}{}
	}
}

// gamesMapType methods
func (gm gamesMapType) createNewGame(gameName string) string {
	gameId := randomString()
	gm[gameId] = &gameStruct{
		stopDestructChan:   make(chan struct{}),
		isDestructChanOpen: true,
		blackSide:          newPlayer(),
		whiteSide:          newPlayer(),
	}
	return gameId
}

func (gm gamesMapType) deleteGame(gameId string) {
	delete(gm, gameId)
}

func (gm gamesMapType) gameSelfDestructOnIdle(gameId string, dur time.Duration) {
	g := gm[gameId]
	g.openChan()
	select {
	case <-g.getStopDestructChan():
		g.closeChan()
	case <-time.After(dur):
		gm.deleteGame(gameId)
	}
}

func (gm gamesMapType) getGameById(gameId string) game {
	return gm[gameId]
}

var gamesMap gamesHandler = make(gamesMapType)

func newPlayer() player {
	var p player = &playerStruct{id: randomString()}
	return p
}
