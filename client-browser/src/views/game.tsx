import { useContext, useEffect, useState } from "react";
import { SocketContext } from "../contexts/socket";
import "./game.scss";

type Board = Array<Array<number>>

const BLACK = 98;
const WHITE = 119;

export default function Game() {
  const socket = useContext(SocketContext);
  const [board, setBoard] = useState<Board>([[]] as Board);
  const [isCurTurn, setIsCurTurn] = useState<boolean>(false);
  const mySide = sessionStorage.side?.charCodeAt(0);
  const opponentSide = (mySide === BLACK) ? WHITE : BLACK;
  const [availableMovesIdx, setAvailableMovesIdx] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--ghost-color", (mySide === BLACK) ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)"
    );
    socket.emit("game-state");
    socket.on("game-state-res", (game:{board:Board, curTurn:number}) => {
      setBoard(game.board);
      if(mySide === game.curTurn) setIsCurTurn(true);
    })
  }, []);

  const checkMoves = () => {
    const newMoves:Set<string> = new Set();
    for(let i = 0; i < board.length; i++) {
      for(let j = 0; j < board[i].length; j++) {
        let cell = board[i][j];
        if(
          (cell !== mySide) || 
          (i - 1 < 0)
        ) continue;

        let m = i - 1;
        while(m >= 0 && (board[m][j] === opponentSide)) m--;
        console.log(i, m, board[i][m]);
      }
    }
  }

  useEffect(() => { isCurTurn && checkMoves() }, [isCurTurn])

  const playMove = (rIdx:number, cellIdx:number) => {
    setBoard((prev:Board) => {
      prev[rIdx][cellIdx] = mySide;
      return [...prev];
    })
  } 

  return (<div className="game-page">
    <div className={`board${isCurTurn ? " enabled" : ""}`}>
      {board?.map((row:Array<number>, rIdx:number) =>
        <div key={rIdx} className="row">
          {row.map((rune:number, cellIdx:number) => (
            <div onClick={() => playMove(rIdx, cellIdx)} key={cellIdx} className={`color-${rune}`}></div>
          ))}
        </div>
      )}
    </div>
  </div>)
}