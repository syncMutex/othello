package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

type ResponseStruct struct {
	Err bool   `json:"err"`
	Msg string `json:"msg"`
}

func respondErrMsg(msg string, w http.ResponseWriter) {
	res := ResponseStruct{Msg: msg, Err: true}
	json.NewEncoder(w).Encode(res)
}

func respondSuccess(w http.ResponseWriter) {
	json.NewEncoder(w).Encode(ResponseStruct{Err: false, Msg: "success"})
}

func createLobby(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		respondErrMsg(err.Error(), w)
		return
	}

	var gameDetails struct {
		HostName string `json:"hostName"`
		HostSide string `json:"hostSide"`
	}

	err = json.Unmarshal(body, &gameDetails)
	if err != nil {
		respondErrMsg(err.Error(), w)
		return
	}

	if gameDetails.HostName == "" || (gameDetails.HostSide != "black" && gameDetails.HostSide != "white") {
		respondErrMsg("invalid data.", w)
		return
	}

	gameId := gamesMap.createNewGame(gameDetails.HostName)
	json.NewEncoder(w).Encode(struct {
		ResponseStruct
		GameId string `json:"gameId"`
	}{GameId: gameId, ResponseStruct: ResponseStruct{Msg: "success", Err: false}})
	go gamesMap.gameSelfDestructOnIdle(gameId, time.Duration(time.Second*20))
}

func joinGame(w http.ResponseWriter, r *http.Request) {
	s, err := newSocket(w, r)
	if err != nil {
		respondErrMsg(err.Error(), w)
		return
	}
	s.on("test", func(data string) {
		fmt.Println(data)
	})
	s.on("some msg", func(data string) {
		fmt.Println("inside some msg")
		s.emit("hehehe", "nonon")
	})
	fmt.Println(s.listen().Error())
	s.conn.Close()
}

func createHttpRoutes() http.Handler {
	headersOk := handlers.AllowedHeaders([]string{"Content-Type"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})
	mainRouter := mux.NewRouter()

	r := mainRouter.PathPrefix("/api").Subrouter()
	r.HandleFunc("/create-lobby", createLobby).Methods(http.MethodPost)
	r.HandleFunc("/join-game", joinGame)
	return handlers.CORS(headersOk, originsOk, methodsOk)(mainRouter)
}
