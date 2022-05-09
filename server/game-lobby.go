package main

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type playerStruct struct {
	name string
	ws   *websocket.Conn
	id   string
}

type lobby struct {
	blackSide player
	whiteSide player
}

type gameStruct struct {
	lobby
	stopDestructChan chan (struct{})
}

type gamesMapType map[string]game

type player interface {
}

type game interface {
	setPlayer(side string, _ player)
	getStopDestructChan() chan struct{}
	stopDestruct()
}

type gamesHandler interface {
	createNewGame(gameName string) (gameId string)
	joinGame(gameId string, _ player, side string)
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

// gamesMapType methods
func (gm gamesMapType) createNewGame(gameName string) string {
	gameId := randomString()
	gm[gameId] = &gameStruct{stopDestructChan: make(chan struct{}), lobby: lobby{}}
	return gameId
}

func (gm gamesMapType) joinGame(gameId string, p player, side string) {
	g := gm[gameId]
	g.setPlayer(side, p)
}

func (gm gamesMapType) gameSelfDestructOnIdle(gameId string, dur time.Duration) {
	select {
	case <-gm[gameId].getStopDestructChan():
	case <-time.After(dur):
		delete(gm, gameId)
	}
}

func (gm gamesMapType) getGameById(gameId string) game {
	return gm[gameId]
}

// gameStruct methods
func (g *gameStruct) setPlayer(side string, p player) {
	if side == "black" {
		g.blackSide = p
	} else if side == "white" {
		g.whiteSide = p
	}
}

func (g *gameStruct) getStopDestructChan() chan struct{} {
	return g.stopDestructChan
}

func (g *gameStruct) stopDestruct() {
	g.stopDestructChan <- struct{}{}
}

var gamesMap gamesHandler = make(gamesMapType)

func newPlayer(ws *websocket.Conn, name string) player {
	var p player = &playerStruct{ws: ws, name: name, id: randomString()}
	return p
}
