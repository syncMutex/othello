import { useContext, useEffect, useState } from "react";
import { SocketContext } from "../contexts/socket";
import "./game.scss";

type Board = Array<Array<number>>

export default function Game() {
  const socket = useContext(SocketContext);
  const [board, setBoard] = useState<Board>();

  useEffect(() => {
    socket.emit("init-board");
    socket.on("init-board-res", (board:Board) => {
      setBoard(board);
    })
    socket.on("cur-turn", () => {
      console.log("cur turn")
    })
  }, []);

  return (<div className="game-page">
    <div className="board">
      {board?.map((row:Array<number>, rIdx:number) =>
        <div key={rIdx} className="row">
          {row.map((rune:number, cellIdx:number) => <div key={cellIdx} className={`color-${rune}`}></div>)}
        </div>
      )}
    </div>
  </div>)
}