import { BLACK, Side } from "./common.types";

type SSValue = string | null;

export class PlayerNamesObj {
  blackSideName: SSValue = sessionStorage.getItem("blackSideName");
  whiteSideName: SSValue = sessionStorage.getItem("whiteSideName");

  constructor(blackSideName:SSValue, whiteSideName:SSValue) {
    this.blackSideName = blackSideName;
    this.whiteSideName = whiteSideName;
    if(blackSideName === null) sessionStorage.removeItem("blackSideName");
    else sessionStorage.setItem("blackSideName", blackSideName); 
    if(whiteSideName === null) sessionStorage.removeItem("whiteSideName");
    else sessionStorage.setItem("whiteSideName", whiteSideName);
  }
}

class SessionStorageHandler {
  private _mySide: Side | null = (+(sessionStorage.getItem("mySide") || 0) as Side);
  private _playerNames: PlayerNamesObj = new PlayerNamesObj(null, null);
  private _playerId: SSValue = sessionStorage.getItem("playerId");
  private _gameId: SSValue = sessionStorage.getItem("gameId");
  private _opponentName: SSValue = sessionStorage.getItem("opponentName");

  
  public get mySide() : Side {
    return this._mySide || 0;
  }
  public set mySide(v : Side|null) {
    this._mySide = v;
    if(v === null) sessionStorage.removeItem("mySide");
    else sessionStorage.setItem("mySide", `${v}`);
  }
  
  public set playerNames(v : PlayerNamesObj) {
    this._playerNames = v;
    this.setOpponentName();
  }
  
  private setOpponentName() {
    if(this._mySide === BLACK) this.opponentName = this._playerNames.whiteSideName;
    else this.opponentName = this._playerNames.blackSideName; 
  }

  
  public get opponentName() : SSValue {
    return this._opponentName;
  }
  
  private set opponentName(v : SSValue) {
    this._opponentName = v;
    if(v === null) sessionStorage.removeItem("opponentName");
    else sessionStorage.setItem("opponentName", v);
  }
  
  public get playerId() : SSValue {
    return this._playerId;
  }
  
  public set playerId(v : SSValue) {
    this._playerId = v;
    if(v === null) sessionStorage.removeItem("playerId");
    else sessionStorage.setItem("playerId", v);
  }

  public get gameId() : SSValue {
    return this._gameId;
  }
  
  public set gameId(v : SSValue) {
    this._gameId = v;
    if(v === null) sessionStorage.removeItem("gameId");
    else sessionStorage.setItem("gameId", v);
  }

  reset() {
    sessionStorage.clear();
    this.gameId = null;
    this.mySide = null;
    this.opponentName = null;
    this.playerId = null;
    this.playerNames = new PlayerNamesObj(null, null);
  }
}

export const SessionStorage = new SessionStorageHandler();