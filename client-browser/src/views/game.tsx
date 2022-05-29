import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BoardSection from "../components/board/board-section";
import ChatSection from "../components/board/chat-section";
import { SocketContext } from "../contexts/socket";
import { BLACK } from "../ts/common.types";
import { SessionStorage } from "../ts/session-storage";
import "./game.scss";


export default function Game() {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [isOpponentOnline, setIsOpponentOnline] = useState<boolean>(false);
  const opponent = useRef<{name:string, sideStr:string}>({
    name: SessionStorage.opponentName || "", sideStr: SessionStorage.mySide === BLACK ? "white" : "black",
  });

  useEffect(() => { if(!socket.isConnected) navigate(`/lobby/${SessionStorage.gameId}`, { state: { reconnect: true } }) } , [])

  return (<section className="game-page">
    <ChatSection socket={socket} isOpponentOnline={isOpponentOnline} opponent={opponent.current} />
    <BoardSection socket={socket} setIsOpponentOnline={setIsOpponentOnline} />
  </section>)
}