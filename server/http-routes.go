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
	go gamesMap.gameSelfDestructOnIdle(gameId, time.Duration(time.Second*10))
}

func joinGame(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	s, err := newSocket(w, r)
	if err != nil {
		respondErrMsg(err.Error(), w)
		return
	}
	var playerId string
	gameId := params["gameId"]
	g := gamesMap.getGameById(gameId)
	if g == nil {
		s.emit("game-verified", "false")
		s.close()
		return
	}
	s.emit("game-verified", "true")
	g.stopDestruct()

	s.once("join-player-info", func(data []byte) {
		var pInfo struct {
			Name string `json:"playerName"`
			Side string `json:"side"`
		}
		err = json.Unmarshal(data, &pInfo)
		if err != nil {
			s.close()
			return
		}
		playerId, err = g.joinGame(pInfo.Name, pInfo.Side, s.conn)
		var res []byte
		if err != nil {
			res, _ = json.Marshal(ResponseStruct{Err: true, Msg: err.Error()})
			s.close()
		} else {
			var playerInfo = struct {
				ResponseStruct
				PlayerId string `json:"playerId"`
			}{ResponseStruct{Err: false, Msg: "success"}, playerId}
			res, _ = json.Marshal(playerInfo)
		}
		s.emit("join-player-info-res", string(res))
	})

	fmt.Println(s.listen().Error())
	g.getPlayerById(playerId).disconnect()

	if g.isGameIdle() {
		gamesMap.gameSelfDestructOnIdle(gameId, time.Second*10)
	}
	s.close()
}

func gameName(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	if g := gamesMap.getGameById(params["gameId"]); g != nil {
		res := struct {
			ResponseStruct
			GameName string `json:"lobbyName"`
		}{
			GameName: g.getGameName(),
			ResponseStruct: ResponseStruct{
				Msg: "success",
				Err: false,
			},
		}
		json.NewEncoder(w).Encode(res)
	} else {
		respondErrMsg("game doesn't exist.", w)
	}
}

func createHttpRoutes() http.Handler {
	headersOk := handlers.AllowedHeaders([]string{"Content-Type"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})
	mainRouter := mux.NewRouter()

	r := mainRouter.PathPrefix("/api").Subrouter()
	r.HandleFunc("/create-lobby", createLobby).Methods(http.MethodPost)
	r.HandleFunc("/join-game/{gameId}", joinGame)
	r.HandleFunc("/game-name/{gameId}", gameName)
	r.HandleFunc("/reconnect-game/{gameId}", joinGame)
	return handlers.CORS(headersOk, originsOk, methodsOk)(mainRouter)
}
