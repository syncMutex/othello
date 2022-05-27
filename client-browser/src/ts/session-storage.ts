import { Side } from "./common.types";

export function sessionStorageSetMySide(side:Side) {
  sessionStorage.mySide = side;
}

export function sessionStorageGetMySide():Side{
  return sessionStorage.mySide;
}

export function sessionStorageSetSideNames(blackSideName:string, whiteSideName:string) {
  sessionStorage.blackSideName = blackSideName;
  sessionStorage.whiteSideName = whiteSideName;
}

export function sessionStorageSetPlayerId(playerId:string) {
  sessionStorage.playerId = playerId;
}

export function sessionStorageGetPlayerId():string {
  return sessionStorage.playerId;
}

export function sessionStorageGetOpponentName() {
  if(sessionStorageGetMySide() === "black") return sessionStorage.whiteSideName;
  return sessionStorage.blackSideName; 
}