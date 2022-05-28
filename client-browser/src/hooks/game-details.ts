import { SessionStorage } from "../ts/session-storage";

export function useGameDetails() {
  const gameDetails = {
    gameId: SessionStorage.gameId,
    playerId: SessionStorage.playerId,
    mySide: SessionStorage.mySide,
  }  
}