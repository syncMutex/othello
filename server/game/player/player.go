package player

import (
	"othelloServer/socket"
	"time"
)

type playerStruct struct {
	socket.Socket
	name          string
	id            string
	isRsvd        bool
	side          rune
	reconnectChan chan struct{}
}

type Player interface {
	Emit(string, string)
	On(evName string, f func([]byte))

	Connect(socket.Socket, string)
	Reconnect(socket.Socket)
	Disconnect()
	IsIdValid(string) bool
	IsConnected() bool
	IsReserved() bool
	PlayerId() string
	PlayerName() string
	Side() rune
	OpponentRune() rune
	ReconnectChan() chan struct{}
	WaitForReconnect(_ time.Duration, gameOverFunc func(string))
}

func NewPlayer(id string, side rune) Player {
	var p Player = &playerStruct{id: id, side: side}
	return p
}

func (p *playerStruct) Emit(evName string, data string) {
	if p.Socket != nil {
		p.Socket.Emit(evName, data)
	}
}

func (p *playerStruct) ReconnectChan() chan struct{} {
	return p.reconnectChan
}

func (p *playerStruct) PlayerName() string {
	return p.name
}

func (p *playerStruct) IsIdValid(id string) bool {
	return p.id == id
}

func (p *playerStruct) Connect(s socket.Socket, name string) {
	p.Socket = s
	p.isRsvd = true
	p.name = name
}

func (p *playerStruct) WaitForReconnect(d time.Duration, gameOverFunc func(string)) {
	p.reconnectChan = make(chan struct{})
	select {
	case <-p.reconnectChan:
		close(p.reconnectChan)
		return
	case <-time.After(d):
		if gameOverFunc != nil {
			gameOverFunc("opponent failed to reconnect :(")
		}
	}
}

func (p *playerStruct) Reconnect(s socket.Socket) {
	p.reconnectChan <- struct{}{}
	p.Socket = s
}

func (p *playerStruct) Disconnect() {
	if p.Socket != nil {
		p.Socket.Close()
	}
	p.Socket = nil
}

func (p *playerStruct) IsConnected() bool {
	return p.Socket != nil
}

func (p *playerStruct) IsReserved() bool {
	return p.isRsvd
}

func (p *playerStruct) PlayerId() string {
	return p.id
}

func (p *playerStruct) Side() rune {
	return p.side
}

func (p *playerStruct) OpponentRune() rune {
	if p.side == 'w' {
		return 'b'
	} else {
		return 'w'
	}
}
