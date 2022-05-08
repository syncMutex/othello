import "./create-game.scss"
import { useUserName } from "../hooks/user-name"
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Side = "black" | "white";

export default function CreateGame() { 
  const [userName] = useUserName();
  const [curSide, setCurSide] = useState<Side>("black")

  return (<div className="create-game-page">
    <h1>Create Game</h1>
    <div className="create-game-container">
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
        <button className="btn-green">create</button>
      </div>
    </div>
  </div>)
}