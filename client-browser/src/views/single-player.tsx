import "./game.scss";
import BoardSection from "../components/board/board-section";
import { Socket } from "../ts/socket-impl";

export default function SinglePlayer() {
  const socket:Socket = new Socket();

  return (<section className="game-page">
    <BoardSection socket={socket} isVsComputer={true} setIsOpponentOnline={() => {}} />
  </section>)
}