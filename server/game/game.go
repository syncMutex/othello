package game

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"othelloServer/game/player"
	"othelloServer/socket"
)

type gameStruct struct {
	board              board
	blackSide          player.Player
	whiteSide          player.Player
	curTurn            rune
	gameState          int
	gameName           string
	stopDestructChan   chan (struct{})
	isDestructChanOpen bool
}

type Game interface {
	getStopDestructChan() <-chan struct{}
	closeChan()
	openChan()
	StopDestruct()

	StartGame()

	JoinGame(name, side string, _ socket.Socket) (playerId string, _ error)

	IsGameIdle() bool
	IsGameFull() bool
	IsGameStarted() bool

	Broadcast(string, string)
	EmitWhite(string, string)
	EmitBlack(string, string)

	GetGameName() string
	GetPlayerById(string) player.Player
	GetEmptySide() string
	GetLobbyInfoJson() string
}

func NewGame() Game {
	return &gameStruct{
		stopDestructChan:   make(chan struct{}),
		isDestructChanOpen: true,
		blackSide:          player.NewPlayer(RandomString(), BLACK),
		whiteSide:          player.NewPlayer(RandomString(), WHITE),
		gameState:          GAME_NOT_STARTED,
		curTurn:            BLACK,
	}
}

func RandomString() string {
	b := make([]byte, 8)
	_, err := rand.Read(b)
	if err != nil {
		log.Fatal(err)
	}
	return hex.EncodeToString(b)
}

const (
	// game states
	GAME_NOT_STARTED = iota
	GAME_STARTED
	GAME_OVER

	WHITE = 'w'
	BLACK = 'b'
)

func (g *gameStruct) StartGame() {
	g.gameState = GAME_STARTED
	g.initBoard()
	g.listenSocketEventsFor(g.blackSide)
	g.listenSocketEventsFor(g.whiteSide)
}

func (g *gameStruct) initBoard() {
	g.board[3][3] = 'b'
	g.board[3][4] = 'w'
	g.board[4][3] = 'w'
	g.board[4][4] = 'b'
}

func (g *gameStruct) Broadcast(evName, data string) {
	g.EmitBlack(evName, data)
	g.EmitWhite(evName, data)
}

func (g *gameStruct) EmitBlack(evName, data string) {
	if g.blackSide.IsConnected() {
		g.blackSide.Emit(evName, data)
	}
}

func (g *gameStruct) EmitWhite(evName, data string) {
	if g.whiteSide.IsConnected() {
		g.whiteSide.Emit(evName, data)
	}
}

func (g *gameStruct) changeTurn() {
	if g.curTurn == BLACK {
		g.curTurn = WHITE
	} else {
		g.curTurn = BLACK
	}
}

func (g *gameStruct) GetLobbyInfoJson() string {
	lobby := struct {
		Black string `json:"black"`
		White string `json:"white"`
	}{g.blackSide.PlayerName(), g.whiteSide.PlayerName()}

	j, _ := json.Marshal(lobby)
	return string(j)
}

func (g *gameStruct) SetPlayer(side string, p player.Player) {
	if side == "black" {
		g.blackSide = p
	} else if side == "white" {
		g.whiteSide = p
	}
}

func (g *gameStruct) IsGameFull() bool {
	return g.blackSide.IsReserved() && g.whiteSide.IsReserved()
}

func (g *gameStruct) IsGameStarted() bool {
	return g.gameState == GAME_STARTED
}

func (g *gameStruct) GetEmptySide() string {
	if !g.blackSide.IsReserved() {
		return "black"
	} else if !g.whiteSide.IsReserved() {
		return "white"
	}
	return ""
}

func (g *gameStruct) GetPlayerById(pid string) player.Player {
	if g.blackSide.IsIdValid(pid) {
		return g.blackSide
	} else if g.whiteSide.IsIdValid(pid) {
		return g.whiteSide
	}
	return nil
}

func (g *gameStruct) checkHost(name string) {
	if !g.blackSide.IsReserved() && !g.whiteSide.IsReserved() {
		g.gameName = name
	}
}

func (g *gameStruct) GetGameName() string {
	return g.gameName
}

func (g *gameStruct) IsGameIdle() bool {
	return !g.blackSide.IsConnected() && !g.whiteSide.IsConnected()
}

func (g *gameStruct) JoinGame(name, side string, s socket.Socket) (playerId string, retErr error) {
	g.checkHost(name)
	switch side {
	case "black":
		if g.blackSide.IsReserved() {
			return "", errors.New("black side already reserved.")
		}
		g.blackSide.Connect(s, name)
		playerId = g.blackSide.PlayerId()
	case "white":
		if g.whiteSide.IsReserved() {
			return "", errors.New("black side already reserved.")
		}
		g.whiteSide.Connect(s, name)
		playerId = g.whiteSide.PlayerId()
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

func (g *gameStruct) StopDestruct() {
	if g.isDestructChanOpen {
		g.stopDestructChan <- struct{}{}
	}
}