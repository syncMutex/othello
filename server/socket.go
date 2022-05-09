package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	WriteBufferSize: 1024,
	ReadBufferSize:  1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type socket struct {
	w        http.ResponseWriter
	r        *http.Request
	conn     *websocket.Conn
	isAuth   bool
	eventMap map[string]func(string)
}

type socketMsg struct {
	Name string `json:"name"`
	Data string `json:"data"`
}

func newSocket(w http.ResponseWriter, r *http.Request) (*socket, error) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return nil, err
	}
	s := &socket{w: w, r: r, conn: conn, eventMap: make(map[string]func(string))}
	return s, nil
}

func (s *socket) on(evName string, f func(string)) {
	s.eventMap[evName] = f
}

func (s *socket) emit(evName string, data string) {
	var msg socketMsg
	msg.Name = evName
	msg.Data = data
	res, err := json.Marshal(msg)
	if err != nil {
		log.Fatal(err.Error())
	}
	s.conn.WriteMessage(websocket.TextMessage, res)
}

func (s *socket) listen() error {
	for {
		var msg socketMsg
		err := s.conn.ReadJSON(&msg)
		if err != nil {
			return err
		}
		if f, ok := s.eventMap[msg.Name]; ok {
			f(msg.Data)
		}
	}
}
