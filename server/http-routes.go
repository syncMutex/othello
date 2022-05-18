package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"othelloServer/respond"
	"othelloServer/socket"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func createLobby(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		respond.RespondErrMsg(err.Error(), w)
		return
	}

	var gameDetails struct {
		HostName string `json:"hostName"`
		HostSide string `json:"hostSide"`
	}

	err = json.Unmarshal(body, &gameDetails)
	if err != nil {
		respond.RespondErrMsg(err.Error(), w)
		return
	}

	if gameDetails.HostName == "" || (gameDetails.HostSide != "black" && gameDetails.HostSide != "white") {
		respond.RespondErrMsg("invalid data.", w)
		return
	}

	gameId := gamesMap.createNewGame(gameDetails.HostName)
	json.NewEncoder(w).Encode(struct {
		respond.ResponseStruct
		GameId string `json:"gameId"`
	}{GameId: gameId, ResponseStruct: respond.ResponseStruct{Msg: "success", Err: false}})
	go gamesMap.gameSelfDestructOnIdle(gameId, time.Duration(time.Second*10))
}

func joinGame(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	s, err := socket.NewSocket(w, r)
	if err != nil {
		respond.RespondErrMsg(err.Error(), w)
		return
	}
	var playerId string
	gameId := params["gameId"]
	g := gamesMap.getGameById(gameId)
	if g == nil {
		s.EmitErr("game-verified", "false").Close()
		return
	}
	s.Emit("game-verified", "true")
	g.stopDestruct()

	s.Once("join-player-info", func(data []byte) {
		var pInfo struct {
			Name string `json:"playerName"`
			Side string `json:"side"`
		}
		err = json.Unmarshal(data, &pInfo)
		if err != nil {
			s.Close()
			return
		}

		if pInfo.Side == "" {
			if pInfo.Side = g.getEmptySide(); pInfo.Side == "" {
				s.EmitErr("join-player-info-res", "game full :(").Close()
				return
			}
		}

		playerId, err = g.joinGame(pInfo.Name, pInfo.Side, s)
		var res []byte
		if err != nil {
			s.EmitErr("join-player-info-res", err.Error()).Close()
			return
		}
		var playerInfo = struct {
			respond.ResponseStruct
			PlayerId string `json:"playerId"`
			Side     string `json:"side"`
		}{respond.ResponseStruct{Err: false, Msg: "success"}, playerId, pInfo.Side}
		res, _ = json.Marshal(playerInfo)
		s.Emit("join-player-info-res", string(res))
		g.broadcast("lobby-info", g.getLobbyInfoJson())

		if g.isGameFull() && !g.isGameStarted() {
			g.broadcast("countdown-begin", "")
		}
	})

	fmt.Println(s.Listen().Error())
	if g.getPlayerById(playerId) != nil {
		g.getPlayerById(playerId).disconnect()
	}

	if g.isGameIdle() {
		gamesMap.gameSelfDestructOnIdle(gameId, time.Second*10)
	}
	s.Close()
}

func gameInfo(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	if g := gamesMap.getGameById(params["gameId"]); g != nil {
		res := struct {
			respond.ResponseStruct
			GameName    string `json:"lobbyName"`
			IsLobbyFull bool   `json:"isLobbyFull"`
		}{
			GameName:    g.getGameName(),
			IsLobbyFull: g.isGameFull(),
			ResponseStruct: respond.ResponseStruct{
				Msg: "success",
				Err: false,
			},
		}
		json.NewEncoder(w).Encode(res)
	} else {
		respond.RespondErrMsg("game doesn't exist.", w)
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
	r.HandleFunc("/game-info/{gameId}", gameInfo)
	r.HandleFunc("/reconnect-game/{gameId}", joinGame)
	return handlers.CORS(headersOk, originsOk, methodsOk)(mainRouter)
}
