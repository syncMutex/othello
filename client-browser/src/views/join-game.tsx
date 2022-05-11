import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePlayerName } from "../hooks/player-name";
import { useLoadingScreen } from "../hooks/ui";
import { useEffectAbortControlled } from "../hooks/utils";

export default function JoinGame() {
  const [playerName, setPlayerName] = usePlayerName();
  const [RenderLoadingScreen, setIsLoading] = useLoadingScreen("fetching game name", true);
  const params = useParams();

  useEffectAbortControlled(async (c:AbortController) => {
    const res = await fetch(`http://${location.hostname}:5000/api/game-name/${params.gameId}`, {
      method: "GET",
      signal: c.signal
    });
    const data = await res.json();
    console.log(data)
  }, []);

  return (
    <div className="join-game-page">
      <RenderLoadingScreen>
      </RenderLoadingScreen>
    </div>
  )
}