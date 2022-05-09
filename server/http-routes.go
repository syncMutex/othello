package main

import (
	"encoding/json"
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

func createHttpRoutes() http.Handler {
	headersOk := handlers.AllowedHeaders([]string{"Content-Type"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})
	mainRouter := mux.NewRouter()

	r := mainRouter.PathPrefix("/api").Subrouter()
	r.HandleFunc("/create-lobby", createLobby).Methods(http.MethodPost)
	return handlers.CORS(headersOk, originsOk, methodsOk)(mainRouter)
}
