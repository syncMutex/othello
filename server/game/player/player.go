package player

import "othelloServer/socket"

type playerStruct struct {
	socket.Socket
	name   string
	id     string
	isRsvd bool
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
}

func NewPlayer(id string) Player {
	var p Player = &playerStruct{id: id}
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
