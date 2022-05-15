import "./lobby.scss";
import { MouseEvent, useContext, useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socketConnect, SocketContext } from "../contexts/socket"
import { usePlayerName } from "../hooks/player-name";
import { useLoadingScreen } from "../hooks/ui";
import { useCopyToClipboard } from "../hooks/utils";


function Invite({ link }:{ link:string }) {
  const [copyToClipboard, copiedMsg] = useCopyToClipboard("dark");
  return (<>
    <button className="btn-nobg" data-theme="dark" onClick={async (e:MouseEvent) => {
      (e.target as HTMLButtonElement).disabled = true;
      if(navigator?.share) {
        try {
          await navigator.share({
            title: "Join Scrum board",
            url: link
          })
        } catch (err) {
          console.error(err);
        }
      } else copyToClipboard(link, 'copied link');
      (e.target as HTMLButtonElement).disabled = false;
    }}>invite</button>
    {copiedMsg}
  </>)
}

export default function Lobby() {
  const [playerName] = usePlayerName();
  const socket = useContext(SocketContext);
  const { gameId } = useParams();
  const state = useLocation() as any;
  const navigate = useNavigate();
  const [RenderIsLoading, setIsLoading] = useLoadingScreen("Loading", true);
  const [blackSideName, setBlackSideName] = useState<string>("");
  const [whiteSideName, setWhiteSideName] = useState<string>("");
  const side = state.side || sessionStorage.side;
  const [lobbyMsg, setLobbyMsg] = useState<string>();

  useEffect(() => {
    socketConnect(`ws://${location.hostname}:5000/api/join-game/${gameId}`);

    // I mean, the json parser is parsing "true" as true. don't ask why
    socket.on("game-verified", (s:boolean) => {
      if(s)
        socket.emit("join-player-info", { playerName, side });
      else
        navigate("/")
    })

    socket.on("join-player-info-res", (data:{ playerId:string, side:string, err:boolean, msg:string }) => {
      if(data.err) return;
      if(data.side === "black") setBlackSideName(playerName);
      else setWhiteSideName(playerName);
      setIsLoading(false);
      setLobbyMsg("waiting for your opponent...")
    })

    socket.on("lobby-info", (lobby:{ black:string, white:string }={black: "", white: ""}) => {
      setBlackSideName(lobby.black);
      setWhiteSideName(lobby.white);
    })
    socket.onClose(() => navigate("/"))
  }, [])

  const Inv = <Invite link={`http://${location.hostname}:3000/join-game/${gameId}`} />
  return (<div className="lobby-page">
    <h1>Lobby</h1>
    <RenderIsLoading>
      <div className="lobby-container page-card-dark">
        <div className="players">
          <div className="black-side">
            <div></div>
            {blackSideName || Inv}
          </div>
          <div className="white-side">
            <div></div>
            {whiteSideName || Inv}
          </div>
        </div>
        <div>{lobbyMsg}</div>
      </div>
    </RenderIsLoading>
  </div>)
}
