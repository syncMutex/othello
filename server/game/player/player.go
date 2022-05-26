package player

import "othelloServer/socket"

type playerStruct struct {
	socket.Socket
	name   string
	id     string
	isRsvd bool
	side   rune
}

type Player interface {
	Emit(string, string)
	On(evName string, f func([]byte))

	Connect(socket.Socket, string)
	ReConnect(socket.Socket)
	Disconnect()
	IsIdValid(string) bool
	IsConnected() bool
	IsReserved() bool
	PlayerId() string
	PlayerName() string
	Side() rune
	OpponentRune() rune
}

func NewPlayer(id string, side rune) Player {
	var p Player = &playerStruct{id: id, side: side}
	return p
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

func (p *playerStruct) ReConnect(s socket.Socket) {
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
