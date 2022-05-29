package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"othelloServer/game"
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
		HostSide rune   `json:"hostSide"`
	}

	err = json.Unmarshal(body, &gameDetails)
	if err != nil {
		respond.RespondErrMsg(err.Error(), w)
		return
	}

	if gameDetails.HostName == "" || (gameDetails.HostSide != game.BLACK && gameDetails.HostSide != game.WHITE) {
		respond.RespondErrMsg("invalid data.", w)
		return
	}

	gameId := game.GamesMap.CreateNewGame(gameDetails.HostName)
	json.NewEncoder(w).Encode(struct {
		respond.ResponseStruct
		GameId string `json:"gameId"`
	}{GameId: gameId, ResponseStruct: respond.ResponseStruct{Msg: "success", Err: false}})
	go game.GamesMap.GameSelfDestructOnIdle(gameId, time.Duration(time.Second*10))
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
	g := game.GamesMap.GetGameById(gameId)
	if g == nil {
		s.EmitErr("game-verified", "false").Close()
		return
	}
	s.Emit("game-verified", "true")
	g.StopDestruct()

	s.Once("join-player-info", func(b []byte) {
		var pInfo struct {
			Name        string `json:"playerName"`
			Side        rune   `json:"side"`
			IsReconnect bool   `json:"isReconnect"`
			PlayerId    string `json:"playerId"`
		}
		err = json.Unmarshal(b, &pInfo)
		if err != nil {
			s.Close()
			return
		}

		if pInfo.IsReconnect {
			playerId = pInfo.PlayerId
			p := g.GetPlayerById(playerId)
			if p == nil || p.Side() != pInfo.Side {
				s.Close()
				return
			}
			if p.IsConnected() {
				s.Close()
				return
			}
			p.Reconnect(s)
			g.ListenSocketEventsFor(p)
			p.Emit("lobby-info", g.GetLobbyInfoJson())

			isGameStarted := "false"
			if g.IsGameStarted() {
				isGameStarted = "true"
			}

			p.Emit("reconnect-success", isGameStarted)
			g.GetOpponentOf(p.Side()).Emit("opponent-reconnect", "")
			return
		}

		if pInfo.Side == 0 {
			if pInfo.Side = g.GetEmptySide(); pInfo.Side == 0 {
				s.EmitErr("join-player-info-res", "game full :(").Close()
				return
			}
		}

		playerId, err = g.JoinGame(pInfo.Name, pInfo.Side, s)
		var res []byte
		if err != nil {
			s.EmitErr("join-player-info-res", err.Error()).Close()
			return
		}
		var playerInfo = struct {
			respond.ResponseStruct
			PlayerId string `json:"playerId"`
			Side     rune   `json:"side"`
		}{respond.ResponseStruct{Err: false, Msg: "success"}, playerId, pInfo.Side}
		res, _ = json.Marshal(playerInfo)
		s.Emit("join-player-info-res", string(res))
		g.Broadcast("lobby-info", g.GetLobbyInfoJson())

		if g.IsGameFull() && !g.IsGameStarted() {
			g.Broadcast("countdown-begin", "")
			<-time.After(time.Second * 2)
			g.StartGame()
		}
	})

	fmt.Println(s.Listen().Error())
	p := g.GetPlayerById(playerId)
	if p != nil {
		p.Disconnect()
	}

	if g.IsGameOver() {
		game.GamesMap.DeleteGame(gameId)
	} else if g.IsGameIdle() {
		game.GamesMap.GameSelfDestructOnIdle(gameId, time.Second*10)
	} else if p != nil {
		g.GetOpponentOf(p.Side()).Emit("opponent-disconnect", "")
		g.WaitForReconnect(time.Second*20, p)
	}
	s.Close()
}

func gameInfo(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	if g := game.GamesMap.GetGameById(params["gameId"]); g != nil {
		res := struct {
			respond.ResponseStruct
			GameName    string `json:"lobbyName"`
			IsLobbyFull bool   `json:"isLobbyFull"`
		}{
			GameName:    g.GetGameName(),
			IsLobbyFull: g.IsGameFull(),
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
