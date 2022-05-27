import { useContext } from "react";
import BoardSection from "../components/board/board-section";
import ChatSection from "../components/board/chat-section";
import { SocketContext } from "../contexts/socket";
import "./game.scss";


export default function Game() {
  const socket = useContext(SocketContext);

  return (<section className="game-page">
    <ChatSection socket={socket} />
    <BoardSection socket={socket} />
  </section>)
}