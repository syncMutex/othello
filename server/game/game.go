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

type playerSide struct {
	player.Player
	hasPossibleMoves bool
}

type gameStruct struct {
	board              board
	blackSide          *playerSide
	whiteSide          *playerSide
	curTurnRune        rune
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

	JoinGame(name string, side rune, _ socket.Socket) (playerId string, _ error)
	ListenSocketEventsFor(player.Player)

	IsGameIdle() bool
	IsGameFull() bool
	IsGameStarted() bool
	IsGameOver() bool

	Broadcast(string, string)
	EmitWhite(string, string)
	EmitBlack(string, string)

	GetGameName() string
	GetPlayerById(string) player.Player
	GetEmptySide() rune
	GetLobbyInfoJson() string
}

func newPlayerSide(pId string, side rune) *playerSide {
	return &playerSide{
		Player:           player.NewPlayer(pId, side),
		hasPossibleMoves: false,
	}
}

func NewGame() Game {
	return &gameStruct{
		stopDestructChan:   make(chan struct{}),
		isDestructChanOpen: true,
		blackSide:          newPlayerSide(RandomString(), BLACK),
		whiteSide:          newPlayerSide(RandomString(), WHITE),
		gameState:          GAME_NOT_STARTED,
		curTurnRune:        BLACK,
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
	EMPTY = 0
)

func (g *gameStruct) StartGame() {
	g.gameState = GAME_STARTED
	g.initBoard()
	g.calcHasPossibleMoves()
	g.ListenSocketEventsFor(g.blackSide)
	g.ListenSocketEventsFor(g.whiteSide)
}

func (g *gameStruct) initBoard() {
	g.board[3][3] = BLACK
	g.board[3][4] = WHITE
	g.board[4][3] = WHITE
	g.board[4][4] = BLACK
}

func (g *gameStruct) gameOver() {
	g.gameState = GAME_OVER
	g.blackSide.Disconnect()
	g.whiteSide.Disconnect()
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
	if g.curTurnRune == BLACK {
		g.curTurnRune = WHITE
	} else {
		g.curTurnRune = BLACK
	}
}

func (g *gameStruct) getCurOpponent() *playerSide {
	return g.getOpponentOf(g.curTurnRune)
}

func (g *gameStruct) getOpponentOf(side rune) *playerSide {
	if side == BLACK {
		return g.whiteSide
	}
	return g.blackSide
}

func (g *gameStruct) curPlayer() *playerSide {
	if g.curTurnRune == BLACK {
		return g.blackSide
	}
	return g.whiteSide
}

func (g *gameStruct) calcHasPossibleMoves() {
	g.blackSide.hasPossibleMoves = g.board.hasPossibleMoves(BLACK, WHITE)
	g.whiteSide.hasPossibleMoves = g.board.hasPossibleMoves(WHITE, BLACK)
}

func (g *gameStruct) isGameOver() bool {
	return !g.blackSide.hasPossibleMoves && !g.whiteSide.hasPossibleMoves
}

func (g *gameStruct) IsGameOver() bool {
	return g.gameState == GAME_OVER
}

func (g *gameStruct) GetLobbyInfoJson() string {
	lobby := struct {
		Black string `json:"black"`
		White string `json:"white"`
	}{g.blackSide.PlayerName(), g.whiteSide.PlayerName()}

	j, _ := json.Marshal(lobby)
	return string(j)
}

func (g *gameStruct) SetPlayer(side string, p *playerSide) {
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

func (g *gameStruct) GetEmptySide() rune {
	if !g.blackSide.IsReserved() {
		return BLACK
	} else if !g.whiteSide.IsReserved() {
		return WHITE
	}
	return 0
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

func (g *gameStruct) JoinGame(name string, side rune, s socket.Socket) (playerId string, retErr error) {
	g.checkHost(name)
	switch side {
	case BLACK:
		if g.blackSide.IsReserved() {
			return "", errors.New("black side already reserved.")
		}
		g.blackSide.Connect(s, name)
		playerId = g.blackSide.PlayerId()
	case WHITE:
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
