import { useContext, useEffect, useRef, useState } from "react";
import { SocketContext } from "../contexts/socket";
import { useForceUpdate } from "../hooks/utils";
import "./game.scss";

type Board = Array<Array<number>>

const BLACK = 98;
const WHITE = 119;
const EMPTY = 0;
const isDebug = false;

const LEFT = -1, RIGHT = 1, UP = -1, DOWN = 1, FIX = 0;
const TRAV_ARR = [
  [UP, FIX],
  [DOWN, FIX],
  [FIX, LEFT],
  [FIX, RIGHT],
  [UP, RIGHT],
  [UP, LEFT],
  [DOWN, LEFT],
  [DOWN, RIGHT],
];

type Dir = 1|-1|0;
type EndPosCallback = (rIdx:number, cIdx:number) => void;
type CellType = typeof BLACK| typeof WHITE| typeof EMPTY;
type Side = typeof BLACK| typeof WHITE;

export default function Game() {
  const socket = useContext(SocketContext);
  const forceUpdate = useForceUpdate();
  const board = useRef<Board>([[]]);
  const setBoard = (newBoard:Board) => { board.current = newBoard; forceUpdate() };
  const [isCurTurn, setIsCurTurn] = useState<boolean>(false);
  const mySide = sessionStorage.side?.charCodeAt(0);
  const opponentSide = (mySide === BLACK) ? WHITE : BLACK;
  const [availableMovesIdxs, setAvailableMovesIdxs] = useState<Set<string>>(new Set());
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--ghost-color", (mySide === BLACK) ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)"
    );
    socket.emit("game-state");
    socket.on("game-state-res", (game:{board:Board, curTurn:number}) => {
      setBoard(game.board);
      if(mySide === game.curTurn) setIsCurTurn(true);
    })
    socket.on("cur-turn", () => {
      setIsCurTurn(true);
    })
    socket.on("game-over", () => {
      setIsGameOver(true);
    })
    socket.on("opponent-move", ({ rowIdx, colIdx }:{ rowIdx:number, colIdx:number }) => {
      playMove(rowIdx, colIdx, opponentSide);
    })
  }, []);

  const isInBounds = (r:number, c:number, rl:number, cl:number):boolean => r >= 0 && r < rl && c >= 0 && c < cl;

  const traverseFrom = (
    initRow:number, initCol:number,
    vDir:Dir, hDir:Dir,
    mySide:CellType, opponentSide:Side,
    funcOrBoard:EndPosCallback|Board|null,
  ):boolean => {
    let row = initRow + vDir;
    let col = initCol + hDir;
    let b:Board = (funcOrBoard !== null && typeof funcOrBoard !== "function") ? funcOrBoard : board.current;
    let rl = b.length, cl = b[0].length;
    while(isInBounds(row, col, rl, cl) && (b[row][col] === opponentSide)) {
      row += vDir;
      col += hDir;
    }
    if(!isInBounds(row, col, rl, cl)) {
      row += vDir * -1;
      col += hDir * -1;
    }

    if(b[row][col] === mySide && (col !== initCol + hDir || row !== initRow + vDir)) {
      if(funcOrBoard === null) return true;
      if(typeof funcOrBoard === "function") funcOrBoard(row, col);
      else flipFrom(funcOrBoard, initRow, initCol, vDir, hDir, mySide as Side, opponentSide);
      return true;
    }
    return false;
  }

  const flipFrom = (
    toFlipBoard:Board,
    initRow:number, initCol:number,
    vDir:Dir, hDir:Dir,
    mySide:Side, opponentSide:Side,
  ) => {
    let row = initRow + vDir;
    let col = initCol + hDir;
    while(isInBounds(row, col, toFlipBoard.length, toFlipBoard[0].length) && (toFlipBoard[row][col] === opponentSide)) {
      toFlipBoard[row][col] = mySide;
      row += vDir;
      col += hDir;
    }
  }

  const traverseAll = (i:number, j:number, ct:CellType, funcOrBoard:EndPosCallback|Board) => {
    let opponentSide:Side;
    if(ct === EMPTY) opponentSide = mySide === BLACK ? WHITE : BLACK;
    else opponentSide = ct === BLACK ? WHITE : BLACK;
    let ret:boolean = false;
    for(let [vertic, horiz] of TRAV_ARR)
      ret = traverseFrom(i, j, vertic as Dir, horiz as Dir, ct, opponentSide, funcOrBoard) || ret;
    return ret;
  }

  const checkMoves = () => {
    const newMoves:Set<string> = new Set();
    const addFunc = (rIdx:number, cIdx:number) => newMoves.add(`${rIdx}-${cIdx}`);

    for(let i = 0; i < board.current.length; i++) {
      for(let j = 0; j < board.current[i].length; j++) {
        let cell = board.current[i][j];
        if(cell !== mySide) continue;
        traverseAll(i, j, EMPTY, addFunc);
      }
    }
    setAvailableMovesIdxs(newMoves);
  }

  useEffect(() => { setAvailableMovesIdxs(new Set()); isCurTurn && checkMoves() }, [isCurTurn])

  // random autoplay
  /* useEffect(() => { isCurTurn && availableMovesIdxs.size && setTimeout(() => {
    let a = [...availableMovesIdxs];
    let t = a[Math.floor(Math.random()*a.length)].split("-");
    let rIdx = +t[0], cellIdx = +t[1];
    if(playMove(rIdx, cellIdx, mySide)) {
      setIsCurTurn(false);
      socket.emit("move", { rowIdx: rIdx , colIdx: cellIdx })
    }
  }, 200) }, [availableMovesIdxs]) */

  const playMove = (rIdx:number, cIdx:number, _mySide:Side):boolean => {
    if(!availableMovesIdxs.has(`${rIdx}-${cIdx}`) && mySide === _mySide) return false;
    let prev:Board = board.current.map((r:Array<number>) => [...r]);
    prev[rIdx][cIdx] = _mySide;
    let hasFlipped = traverseAll(rIdx, cIdx, _mySide, prev);
    if(!hasFlipped) prev[rIdx][cIdx] = EMPTY;
    setBoard(prev);
    return hasFlipped;
  } 

  return (<div className="game-page">
    <div style={{ color: "white" }}>{isCurTurn ? String.fromCharCode(mySide) : String.fromCharCode(opponentSide)}</div>
    <div style={{ color: "white" }}>{isGameOver && "game over"}</div>
    <div className={`board${isCurTurn ? " enabled" : ""}`}>
      {board.current?.map((row:Array<number>, rIdx:number) =>
        <div key={rIdx} className="row">
          {row.map((rune:number, cellIdx:number) => (
            <div
              onClick={() => {
                if(playMove(rIdx, cellIdx, mySide)) {
                  setIsCurTurn(false);
                  socket.emit("move", { rowIdx: rIdx , colIdx: cellIdx })
                }
              }}
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