import "./create-game.scss"
import { usePlayerName } from "../hooks/player-name"
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sessionStorageSetMySide } from "../ts/session-storage";
import { Side } from "../ts/common.types";

export default function CreateGame() { 
  const [userName] = usePlayerName();
  const [curSide, setCurSide] = useState<Side>("black")
  const navigate = useNavigate();

  const createLobby = async () => {
    const res = await fetch(`http://${location.hostname}:5000/api/create-lobby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostSide: curSide,
        hostName: userName
      })
    })
    const data = await res.json();
    if(data.err) return;
    sessionStorageSetMySide(curSide);
    navigate(`/lobby/${data.gameId}`);
  }

  return (<div className="create-game-page">
    <h1>Create Game</h1>
    <div className="create-game-container page-card-dark">
      <div className="game-name">
        <span className="username">{userName}</span>'s game
      </div> 
      <div style={{ fontFamily: "monospace" }}>Choose your side</div>
      <div className="sides" onChange={(e:React.ChangeEvent<HTMLInputElement>) => setCurSide(e.target.value as Side)}>
        <label className="black-side">
          <input type="radio" name="side" value="black" defaultChecked />
          <span className="checkmark"></span>
        </label>
        <label className="white-side">
          <input type="radio" name="side" value="white" />
          <span className="checkmark"></span>
        </label>
      </div>
      <div className="flex-btns">
        <Link to="/home" className="btn-nobg link-btn" data-theme="dark">back</Link>
        <button className="btn-green" onClick={createLobby}>create</button>
      </div>
    </div>
  </div>)
}