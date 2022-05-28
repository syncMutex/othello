import "./reconnect.scss";
import { PropsWithChildren, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SocketContext } from "../contexts/socket";
import { SessionStorage } from "../ts/session-storage";

function renderReturnToGamePrompt(placeholder:string, onYes:() => void, onNo:() => void) {
  return (<div className="reconnect-page">
    <div className="page-card-dark">
      <h2>{placeholder}</h2>
      <div className="flex-btns" style={{ marginTop: "1rem" }}>
        <button className="btn-green" onClick={onYes}>yes</button>
        <button className="btn-red" onClick={onNo}>no</button>
      </div>
    </div>
  </div>)
}

export default function CheckReconnection(props:PropsWithChildren<{}>):JSX.Element {
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const playerId = SessionStorage.playerId;
  const gameId = SessionStorage.gameId;
  const location = useLocation() as { state: { reconnect:boolean }, pathname:string };

  const exitGameAndCloseSocket = () => {
    socket.emit("resign-game");
    socket.close();
    clearSessionStorageAndReturnTo("/");
  }

  const clearSessionStorageAndReturnTo = (path:string) => {
    SessionStorage.reset();
    navigate(path);
  }

  if(location.pathname.includes("/game/") && !socket.isConnected) navigate(`/lobby/${gameId}`, {
    state: { reconnect: true }
  });

  const t = (
    ((!location.state?.reconnect) && (playerId !== null)) ?
    renderReturnToGamePrompt("Reconnect to game?", () => navigate(`/lobby/${gameId}`, {
      state: { reconnect: true }
    }), () => clearSessionStorageAndReturnTo(location.pathname)):
    props.children
  )

  return (<>{
    socket.isConnected ? 
    renderReturnToGamePrompt("Return to game?",  () => navigate(`/game/${gameId}`), exitGameAndCloseSocket) : 
    t
  }</>)
}