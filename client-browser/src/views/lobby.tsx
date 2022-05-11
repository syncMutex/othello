import "./lobby.scss";
import { useContext, useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socketConnect, SocketContext } from "../contexts/socket"
import { usePlayerName } from "../hooks/player-name";
import { useLoadingScreen } from "../hooks/ui";

export default function Lobby() {
  const [playerName] = usePlayerName();
  const socket = useContext(SocketContext);
  const params = useParams();
  const state = useLocation() as any;
  const navigate = useNavigate();
  const [RenderIsLoading, setIsLoading] = useLoadingScreen("Loading", true);
  const [blackSideName, setBlackSideName] = useState<string>("");
  const [whiteSideName, setWhiteSideName] = useState<string>("");
  const side = state.side || sessionStorage.side;
  const [lobbyMsg, setLobbyMsg] = useState<string>();

  useEffect(() => {
    socketConnect(`ws://${location.hostname}:5000/api/join-game/${params.gameId}`);

    // I mean, the json parser is parsing "true" as true. don't ask why
    socket.on("game-verified", (s:boolean) => {
      if(s)
        socket.emit("join-player-info", { playerName, side });
      else
        navigate("/")
    })

    socket.on("join-player-info-res", (data:{ playerId:string, err:boolean, msg:string }) => {
      if(data.err) return;
      if(side === "black") setBlackSideName(playerName);
      else setWhiteSideName(playerName);
      setIsLoading(false);
      setLobbyMsg("waiting for your opponent...")
    })
    socket.onClose(() => navigate("/"))
  }, [])
  return (<div className="lobby-page">
    <h1>Lobby</h1>
    <RenderIsLoading>
      <div className="lobby-container page-card-dark">
        <div className="players">
          <div className="black-side">
            <div></div>
            {blackSideName || <button className="btn-nobg" data-theme="dark">invite</button>}
          </div>
          <div className="white-side">
            <div></div>
            {whiteSideName || <button className="btn-nobg" data-theme="dark">invite</button>}
          </div>
        </div>
        <div>{lobbyMsg}</div>
      </div>
    </RenderIsLoading>
  </div>)
}
