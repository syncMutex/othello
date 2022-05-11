import "./The-Body.scss"
import { Routes, Route, Navigate } from "react-router-dom"
import Home from "../../views/home"
import CreateGame from "../../views/create-game"
import JoinGame from "../../views/join-game"
import Game from "../../views/game"
import ChangeName from "../../views/change-name"
import Lobby from "../../views/lobby"

export default function TheBody() {
  return (
    <div className="body-content custom-scrollbar">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-game" element={<CreateGame />} />
        <Route path="/join-game/:gameId" element={<JoinGame />} />
        <Route path="/lobby/:gameId" element={<Lobby />} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="/change-username" element={<ChangeName />} />
        <Route path="*" element={<Navigate to="/" replace />}/>
      </Routes>
    </div>
  ) 
}
