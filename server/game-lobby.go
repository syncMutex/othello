package main

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type playerStruct struct {
	name   string
	ws     *websocket.Conn
	id     string
	isRsvd bool
}

type lobby struct {
	blackSide player
	whiteSide player
}

type gameStruct struct {
	lobby
	gameState          int
	gameName           string
	isGameStarted      bool
	stopDestructChan   chan (struct{})
	isDestructChanOpen bool
}

type gamesMapType map[string]game

type player interface {
	connect(*websocket.Conn, string)
	reConnect(*websocket.Conn)
	disconnect()
	isIdValid(string) bool
	isConnected() bool
	isReserved() bool
	playerId() string
}

type game interface {
	getStopDestructChan() <-chan struct{}
	closeChan()
	stopDestruct()
	joinGame(name, side string, _ *websocket.Conn) (playerId string, _ error)
	getGameName() string
}

type gamesHandler interface {
	createNewGame(gameName string) (gameId string)
	gameSelfDestructOnIdle(gameId string, _ time.Duration)
	getGameById(gameId string) game
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
func (p *playerStruct) isIdValid(id string) bool {
	return p.id == id
}

func (p *playerStruct) connect(ws *websocket.Conn, name string) {
	p.ws = ws
	p.isRsvd = true
	p.name = name
}

func (p *playerStruct) reConnect(ws *websocket.Conn) {
	p.ws = ws
}

func (p *playerStruct) disconnect() {
	p.ws = nil
}

func (p *playerStruct) isConnected() bool {
	return p.ws != nil
}

func (p *playerStruct) isReserved() bool {
	return p.isRsvd
}

func (p *playerStruct) playerId() string {
	return p.id
}

// gameStruct methods
func (g *gameStruct) setPlayer(side string, p player) {
	if side == "black" {
		g.blackSide = p
	} else if side == "white" {
		g.whiteSide = p
	}
}

func (g *gameStruct) checkHost(name string) {
	if !g.blackSide.isReserved() && !g.whiteSide.isReserved() {
		g.gameName = name
	}
}

func (g *gameStruct) getGameName() string {
	return g.gameName
}

func (g *gameStruct) joinGame(name, side string, ws *websocket.Conn) (playerId string, retErr error) {
	g.checkHost(name)
	switch side {
	case "black":
		if g.blackSide.isReserved() {
			return "", errors.New("black side already reserved.")
		}
		g.blackSide.connect(ws, name)
		playerId = g.blackSide.playerId()
	case "white":
		if g.whiteSide.isReserved() {
			return "", errors.New("black side already reserved.")
		}
		g.whiteSide.connect(ws, name)
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
	close(g.stopDestructChan)
	g.isDestructChanOpen = false
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
		lobby:              lobby{blackSide: newPlayer(), whiteSide: newPlayer()},
	}
	return gameId
}

func (gm gamesMapType) gameSelfDestructOnIdle(gameId string, dur time.Duration) {
	select {
	case <-gm[gameId].getStopDestructChan():
		gm[gameId].closeChan()
	case <-time.After(dur):
		delete(gm, gameId)
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
