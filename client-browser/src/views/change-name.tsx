import "./change-name.scss";
import React, { ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlayerName } from "../hooks/player-name";

export default function ChangeName() {
  const [newPlayerName, setNewPlayerName] = usePlayerName();
  const navigate = useNavigate();

  return (<div className="change-username">
    <h1>Change Name</h1>
    <div className="form-group">
      <div>
        <div className="form-field">
          <input
            type="text" 
            value={newPlayerName}
            onChange={(e:ChangeEvent<HTMLInputElement>) => setNewPlayerName(e.target.value)} 
            data-theme="dark" 
            maxLength={18}
            spellCheck="false"
          />
          <label>new name</label>
        </div>
        <div className="flex-btns">
          <Link className="btn-red link-btn" to="/">cancel</Link>
          <button 
            className="btn-green" 
            onClick={() => {
              window.localStorage.playerName = newPlayerName;
              navigate("/")
            }}
            disabled={
              newPlayerName === window.localStorage.playerName || newPlayerName.length < 3
            }>done</button>
        </div>
      </div>
    </div>
  </div>)
}