package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Event struct {
	Name string      `json:"name"`
	Data interface{} `json:"data"`
}

func socketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err.Error())
		return
	}
	defer conn.Close()

	emit := func(name string, data interface{}) {
		conn.WriteJSON(Event{name, data})
	}

	emit("hehe", "yoyoyo man man man")

	for {
		var ev Event
		err := conn.ReadJSON(&ev)
		if err != nil {
			log.Println("read err: ", err.Error())
			break
		}
		fmt.Println(ev)
	}
}

func main() {
	log.Println("running on http://localhost:5000")
	http.HandleFunc("/socket", socketHandler)
	if err := http.ListenAndServe(":5000", nil); err != nil {
		log.Fatal(err.Error())
	}
}
