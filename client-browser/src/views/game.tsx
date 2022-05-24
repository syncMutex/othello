import { useContext, useEffect, useState } from "react";
import { SocketContext } from "../contexts/socket";
import "./game.scss";

type Board = Array<Array<number>>

const BLACK = 98;
const WHITE = 119;
const EMPTY = 0;
const isDebug = false;

const LEFT = -1, RIGHT = 1, UP = -1, DOWN = 1, FIX = 0;

type OnTrueFunc = (_:string) => void;
type Dir = 1|-1|0;
type EndPosCallback = (rIdx:number, cIdx:number) => void;
type CellType = typeof BLACK| typeof WHITE| typeof EMPTY;

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
      setBoard(game.board);
      if(mySide === game.curTurn) setIsCurTurn(true);
    })
  }, []);

  const isInBounds = (r:number, c:number):boolean => r >= 0 && r < board.length && c >= 0 && c < board[0].length;

  const traverseFrom = (
    initRow:number,
    initCol:number,
    vDir:Dir, hDir:Dir,
    endCondition:CellType,
    funcOrBoard:EndPosCallback|Board|null,
  ) => {
    let row = initRow + vDir;
    let col = initCol + hDir;
    while(isInBounds(row, col) && (board[row][col] === opponentSide)) {
      row += vDir;
      col += hDir;
    }
    if(board[row][col] === endCondition && (col !== initCol + hDir || row !== initRow + vDir)) {
      if(funcOrBoard === null) return;
      if(typeof funcOrBoard === "function") funcOrBoard(row, col);
      else flipFrom(funcOrBoard, initRow, initCol, vDir, hDir);
    }
  }

  const flipFrom = (
    toFlipBoard:Board,
    initRow:number,
    initCol:number,
    vDir:Dir, hDir:Dir,
  ) => {
    let row = initRow + vDir;
    let col = initCol + hDir;
    while(isInBounds(row, col) && (toFlipBoard[row][col] === opponentSide)) {
      console.log(row, col)
      toFlipBoard[row][col] = mySide;
      row += vDir;
      col += hDir;
    }
  }

  const traverseAll = (i:number, j:number, ct:CellType, funcOrBoard:EndPosCallback|Board) => {
    traverseFrom(i, j, UP, FIX, ct, funcOrBoard);
    traverseFrom(i, j, DOWN, FIX, ct, funcOrBoard);
    traverseFrom(i, j, FIX, LEFT, ct, funcOrBoard);
    traverseFrom(i, j, FIX, RIGHT, ct, funcOrBoard);
    traverseFrom(i, j, UP, RIGHT, ct, funcOrBoard);
    traverseFrom(i, j, UP, LEFT, ct, funcOrBoard);
    traverseFrom(i, j, DOWN, LEFT, ct, funcOrBoard);
    traverseFrom(i, j, DOWN, RIGHT, ct, funcOrBoard);
  }

  const checkMoves = () => {
    const newMoves:Set<string> = new Set();
    const addFunc = (rIdx:number, cIdx:number) => newMoves.add(`${rIdx}-${cIdx}`);

    for(let i = 0; i < board.length; i++) {
      for(let j = 0; j < board[i].length; j++) {
        let cell = board[i][j];
        if(
          (cell !== mySide) || 
          (i - 1 < 0)
        ) continue;
        traverseAll(i, j, EMPTY, addFunc);
      }
    }
    setAvailableMovesIdxs(newMoves);
  }

  useEffect(() => { isCurTurn && checkMoves() }, [isCurTurn])

  const playMove = (rIdx:number, cellIdx:number) => {
    setBoard((prev:Board) => {
      prev[rIdx][cellIdx] = mySide;
      traverseAll(rIdx, cellIdx, mySide, prev);
      checkMoves();
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