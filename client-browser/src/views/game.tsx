import { useContext } from "react";
import BoardSection from "../components/board/board-section";
import ChatSection from "../components/board/chat-section";
import { SocketContext } from "../contexts/socket";
import { SessionStorage } from "../ts/session-storage";
import "./game.scss";


export default function Game() {
  const socket = useContext(SocketContext);
  const opponentName = SessionStorage.opponentName || "";

  return (<section className="game-page">
    <ChatSection socket={socket} opponentName={opponentName} />
    <BoardSection socket={socket} />
  </section>)
}