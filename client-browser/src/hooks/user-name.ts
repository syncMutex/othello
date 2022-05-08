import React, { useEffect, useState } from "react"
import { randInt } from "../ts/utils"

function saveRandomNameToLocalStorage() {
  window.localStorage.userName = `Player_${randInt(0, 10)}${randInt(0, 10)}${randInt(0, 10)}${randInt(0, 10)}`
}

function validateUserName() {
  if(!window.localStorage.userName) saveRandomNameToLocalStorage();
}

export function useUserName():[string, React.Dispatch<React.SetStateAction<string>>] {
  const [userName, setUserName] = useState<string>("");
  useEffect(() => {
    validateUserName();
    setUserName(window.localStorage.userName);
  }, [])
  return [userName, setUserName];
}