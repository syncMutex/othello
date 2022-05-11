import React, { useEffect, useState } from "react"
import { randInt } from "../ts/utils"

function saveRandomNameToLocalStorage() {
  window.localStorage.playerName = `Player_${randInt(0, 10)}${randInt(0, 10)}${randInt(0, 10)}${randInt(0, 10)}`
}

function isPlayerNameValid():boolean {
  if(!window.localStorage.playerName) {
    saveRandomNameToLocalStorage()
    return false
  }
  return true
}

export function usePlayerName():[string, React.Dispatch<React.SetStateAction<string>>] {
  const [playerName, setPlayerName] = useState<string>(window.localStorage.playerName);
  useEffect(() => {
    if(isPlayerNameValid())
      setPlayerName(window.localStorage.playerName);
  }, [])
  return [playerName, setPlayerName];
}