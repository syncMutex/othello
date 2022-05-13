import "./join-game.scss";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePlayerName } from "../hooks/player-name";
import { useLoadingScreen } from "../hooks/ui";
import { useEffectAbortControlled } from "../hooks/utils";

export default function JoinGame() {
  const [playerName, setPlayerName] = usePlayerName();
  const [errMsg, setErrMsg] = useState<string>("");
  const [lobbyName, setLobbyName] = useState<string>('');
  const [RenderLoadingScreen, setIsLoading] = useLoadingScreen("fetching game name", true);
  const params = useParams();

  useEffectAbortControlled(async (c:AbortController) => {
    try {
      const res = await fetch(`http://${location.hostname}:5000/api/game-name/${params.gameId}`, {
        method: "GET",
        signal: c.signal
      });
      const data = await res.json();
      if(data.err || !res.ok) {
        setErrMsg(data.msg);
      } else {
        setLobbyName(data.lobbyName)
      }
      setIsLoading(false);
    } catch(err) {
      setErrMsg("Something went wrong. Maybe try checking your connection.");
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="join-game-page">
      <RenderLoadingScreen>
        <h1>Join Game</h1>
        <div className="page-card-dark">{
          errMsg !== "" ? 
          <div>
            <h2>{errMsg}</h2>
            <Link to="/" className="btn-nobg link-btn" data-theme="dark">go home</Link>
          </div> : (<>
            <h2>Join <span className="username">{lobbyName}</span>'s lobby?</h2>
            <div className="flex-btns">
              <Link to="/" className="btn-nobg link-btn" data-theme="dark">cancel</Link>
              <button className="btn-green">join</button>
            </div>
          </>)
        }</div>
      </RenderLoadingScreen>
    </div>
  )
}