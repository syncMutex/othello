import "./The-Body.scss"
import { Routes, Route, Navigate } from "react-router-dom"
import Home from "../../views/home"
import CreateGame from "../../views/create-game"
import JoinGame from "../../views/join-game"
import Game from "../../views/game"
import ChangeName from "../../views/change-name"
import Lobby from "../../views/lobby"
import CheckReconnection from "../reconnect"

export default function TheBody() {
  return (
    <div className="body-content custom-scrollbar">
      <Routes>
        <Route path="/" element={<CheckReconnection><Home /></CheckReconnection>} />
        <Route path="/create-game" element={<CheckReconnection><CreateGame /></CheckReconnection>} />
        <Route path="/join-game/:gameId" element={<CheckReconnection><JoinGame /></CheckReconnection>} />
        <Route path="/lobby/:gameId" element={<CheckReconnection><Lobby /></CheckReconnection>} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="/change-username" element={<ChangeName />} />
        <Route path="*" element={<Navigate to="/" replace />}/>
      </Routes>
    </div>
  ) 
}
