import { useContext, useEffect, useState } from "react";
import { SocketContext } from "../contexts/socket";
import "./game.scss";

type Board = Array<Array<number>>

const BLACK = 98;
const WHITE = 119;
const EMPTY = 0;
const isDebug = false;

const LEFT = -1, RIGHT = 1, UP = -1, DOWN = 1;

export default function Game() {
  const socket = useContext(SocketContext);
  const [board, setBoard] = useState<Board>([[]] as Board);
  const [isCurTurn, setIsCurTurn] = useState<boolean>(false);
  const mySide = sessionStorage.side?.charCodeAt(0);
  const opponentSide = (mySide === BLACK) ? WHITE : BLACK;
  const [availableMovesIdxs, setAvailableMovesIdxs] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--ghost-color", (mySide === BLACK) ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)"
    );
    socket.emit("game-state");
    socket.on("game-state-res", (game:{board:Board, curTurn:number}) => {
      game.board[2][4] = WHITE;
      game.board[4][0] = WHITE;
      game.board[4][1] = WHITE;
      game.board[4][2] = WHITE;
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

        const isInBounds = (r:number, c:number):boolean => r >= 0 && r < board.length && c >= 0 && c < board[0].length;

        let row:number, col:number;
        const traverseVertic = (mag:-1|1) => {
          row = i + mag;
          while(isInBounds(row, j) && (board[row][j] === opponentSide)) row += mag;
          if(board[row][j] === EMPTY && row !== i + mag) newMoves.add(`${row}-${j}`);
        }
        traverseVertic(UP);
        traverseVertic(DOWN);
        const tranverseHoriz = (mag:1|-1) => {
          col = j + mag;
          while(isInBounds(i, col) && (board[i][col] === opponentSide)) col += mag;
          if(board[i][col] === EMPTY && col !== j + mag) newMoves.add(`${i}-${col}`);
        }
        tranverseHoriz(LEFT);
        tranverseHoriz(RIGHT);
        // check up-right
        const traverseDiag = (rMag:1|-1, cMag:1|-1) => {
          row = i + rMag;
          col = j + cMag;
          while(isInBounds(row, col) && (board[row][col] === opponentSide)) {
            row += rMag;
            col += cMag;
          }
          if(board[row][col] === EMPTY && col !== j + cMag && row !== i + rMag) newMoves.add(`${row}-${col}`);
        }
        traverseDiag(UP, RIGHT);
        traverseDiag(UP, LEFT);
        traverseDiag(DOWN, LEFT);
        traverseDiag(DOWN, RIGHT);
      }
    }
    setAvailableMovesIdxs(newMoves);
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
            <div
              onClick={() => playMove(rIdx, cellIdx)}
              key={cellIdx}
              className={`color-${rune}${availableMovesIdxs.has(`${rIdx}-${cellIdx}`) ? " available" : ""}`}
            >
              {isDebug && <span style={{ position:'absolute', color: "aqua", top: 0, left: 0, zIndex: 10, pointerEvents: "none" }}>
                {`${rIdx}-${cellIdx}`}
              </span>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>)
}