import "./board-section.scss";
import { useState, useRef, useEffect, SetStateAction, Dispatch, Ref, MutableRefObject, useCallback } from "react";
import { useForceUpdate } from "../../hooks/utils";
import { Link } from "react-router-dom";
import { Socket } from "../../ts/socket-impl";
import { SessionStorage } from "../../ts/session-storage";
import { Side } from "../../ts/common.types";

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

interface BoardSectionProps {
  socket: Socket;
  setIsOpponentOnline: Dispatch<SetStateAction<boolean>>;
  isVsComputer?: boolean;
}

interface ReconnectHandlerProps {
  socket: Socket;
  setIsOpponentOnline: Dispatch<SetStateAction<boolean>>
  reconnectInterval: MutableRefObject<number|undefined>
}

function ConnectionHandler({ socket, setIsOpponentOnline, reconnectInterval }:ReconnectHandlerProps) {
  const [reconnectTimer, setReconnectTimer] = useState<number>(-1);

  useEffect(() => {
    socket.on("wait-for-opponent-reconnect", () => {
      setReconnectTimer(20);
      reconnectInterval.current = setInterval(() => {
        setReconnectTimer((prev:number) => {
          if(prev === 0) clearInterval(reconnectInterval.current);
          return prev - 1;
        });
      }, 1000)
    })

    socket.on("opponent-disconnect", () => {
      setIsOpponentOnline(false);
    })

    socket.on("opponent-reconnect", () => {
      setIsOpponentOnline(true);
      setReconnectTimer(() => {
        clearInterval(reconnectInterval.current);
        return -1;
      });
    })
  }, [])

  return (<>
    {reconnectTimer !== -1 && <div className="reconnect-msg">waiting for opponent reconnection {reconnectTimer}</div>}
  </>)
}

export default function BoardSection({ socket, setIsOpponentOnline, isVsComputer }:BoardSectionProps) {
  const forceUpdate = useForceUpdate();
  const board = useRef<Board>([[]]);
  const setBoard = (newBoard:Board) => { board.current = newBoard; forceUpdate() };
  const [isCurTurn, setIsCurTurn] = useState<boolean>(false);
  let mySide = SessionStorage.mySide;
  let opponentSide = calcOpponent(mySide);
  const [availableMovesIdxs, setAvailableMovesIdxs] = useState<Set<string>>(new Set());
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const blackPoints = useRef<number>(0);
  const whitePoints = useRef<number>(0);
  const [gameOverMsg, setGameOverMsg] = useState<string>("");
  const reconnectInterval = useRef<number|undefined>();

  function calcOpponent(s:Side):Side {
    return (s === BLACK) ? WHITE : BLACK;
  }

  const pointSetter = (b:number, w:number) => {
    blackPoints.current = b;
    whitePoints.current = w;
  }

  const gameOver = (gameOverMsg:string) => {
    setIsGameOver(true);
    if(gameOverMsg) setGameOverMsg(gameOverMsg);
    else if(whitePoints.current === blackPoints.current) setGameOverMsg("Draw");
    else {
      if(mySide === BLACK) setGameOverMsg(whitePoints.current < blackPoints.current ? "You won :)" : "You lost :(");
      else setGameOverMsg(whitePoints.current > blackPoints.current ? "You won :)" : "You lost :(");
    }
    SessionStorage.reset();
  }

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--ghost-color", (mySide === BLACK) ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)"
    );
    let b:Board = [];
    for(let i = 0; i < 8; i++) b.push((new Array<number>(8)).fill(0, 0, 8));
    if(isVsComputer) {
      b[3][3] = BLACK;
      b[3][4] = WHITE;
      b[4][3] = WHITE;
      b[4][4] = BLACK;
      pointSetter(2, 2);
      if(!SessionStorage.mySide) {
        mySide = BLACK;
        document.documentElement.style.setProperty(
          "--ghost-color", (mySide === BLACK) ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)"
        );
        SessionStorage.mySide = BLACK;
      }
      if(mySide === BLACK) setIsCurTurn(true);
    }
    setBoard(b);

    if(isVsComputer) return;

    socket.emit("game-state");

    socket.on("game-state-res", (game:{
      board:Board, curTurn:number, blackPoints:number, whitePoints:number, isOpponentOnline:boolean
    }) => {
      setBoard(game.board);
      setIsOpponentOnline(game.isOpponentOnline);
      pointSetter(game.blackPoints, game.whitePoints);
      if(mySide === game.curTurn) setIsCurTurn(true);
    })

    socket.on("cur-turn", () => {
      setIsCurTurn(true);
    })

    socket.on("game-over", (gameOverMsg:string) => {
      clearInterval(reconnectInterval.current);
      gameOver(gameOverMsg);
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
  ):[boolean, number] => {
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
      if(funcOrBoard === null) return [true, 0];
      if(typeof funcOrBoard === "function") funcOrBoard(row, col);
      else return [true, flipFrom(funcOrBoard, initRow, initCol, vDir, hDir, mySide as Side, opponentSide)];
    }
    return [false, 0];
  }

  const flipFrom = (
    toFlipBoard:Board,
    initRow:number, initCol:number,
    vDir:Dir, hDir:Dir,
    mySide:Side, opponentSide:Side,
  ) => {
    let row = initRow + vDir;
    let col = initCol + hDir;
    let flipped = 0;
    while(isInBounds(row, col, toFlipBoard.length, toFlipBoard[0].length) && (toFlipBoard[row][col] === opponentSide)) {
      toFlipBoard[row][col] = mySide;
      row += vDir;
      col += hDir;
      flipped++;
    }
    return flipped;
  }

  const traverseAll = (
    i:number, j:number,
    mySide:CellType, opponentSide:Side,
    funcOrBoard:EndPosCallback|Board
  ):[boolean,number] => {
    let hasFlipped:boolean=false, isF:boolean;
    let flippedCount:number = 0, flC:number;
    for(let [vertic, horiz] of TRAV_ARR) {
      [isF, flC] = traverseFrom(
        i, j, vertic as Dir, horiz as Dir, mySide, opponentSide, funcOrBoard
      );
      flippedCount += flC;
      hasFlipped = isF || hasFlipped;
    }
    return [hasFlipped, flippedCount];
  }

  const hasPossibleMoves = (s:Side):boolean => {
    let isAvailableMove = false;
    const opponentSide = calcOpponent(s)
    for(let i = 0; i < board.current.length; i++) {
      for(let j = 0; j < board.current[i].length; j++) {
        if(board.current[i][j] !== s) continue;
        for(let [vertic, horiz] of TRAV_ARR) {
          isAvailableMove = traverseFrom(
            i, j, vertic as Dir, horiz as Dir, EMPTY, opponentSide, null
          )[0];
          if(isAvailableMove) return true;
        }
      }
    }
    return false;
  }

  const checkMoves = (s:Side=mySide):undefined|Set<string> => {
    const newMoves:Set<string> = new Set();
    const addFunc = (rIdx:number, cIdx:number) => newMoves.add(`${rIdx}-${cIdx}`);
    const opponentSide = calcOpponent(s);

    for(let i = 0; i < board.current.length; i++) {
      for(let j = 0; j < board.current[i].length; j++) {
        if(board.current[i][j] !== s) continue;
        traverseAll(i, j, EMPTY, opponentSide, addFunc);
      }
    }
    if(s === mySide)
      setAvailableMovesIdxs(newMoves);
    else return newMoves;
  }

  useEffect(() => { setAvailableMovesIdxs(new Set()); isCurTurn && checkMoves() }, [isCurTurn])

  const playComputer = () => {
    const availableMovesStrs = checkMoves(opponentSide) as Set<string>;
    if(availableMovesStrs.size > 0) {
      let a = [...availableMovesStrs];
      let t = a[Math.floor(Math.random()*a.length)].split("-");
      let rIdx = +t[0], cellIdx = +t[1];
      playMove(rIdx, cellIdx, opponentSide)
    }
    setIsCurTurn(true);
  }

  // random autoplay online

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
    const _opponentSide = calcOpponent(_mySide);
    const [hasFlipped, flipCount] = traverseAll(rIdx, cIdx, _mySide, _opponentSide, prev);
    if(!hasFlipped) prev[rIdx][cIdx] = EMPTY;
    if(flipCount) {
      if(_mySide === BLACK)
        pointSetter(blackPoints.current + 1 + flipCount, whitePoints.current - flipCount);
      else
        pointSetter(blackPoints.current - flipCount, whitePoints.current + 1 + flipCount);
    }
    setBoard(prev);
    if(isVsComputer && (!hasPossibleMoves(mySide) && !hasPossibleMoves(opponentSide))) gameOver("");
    return hasFlipped;
  } 

  const moveClick = (rowIdx:number, colIdx:number) => {
    if(playMove(rowIdx, colIdx, mySide)) {
      setIsCurTurn(false);
      if(isVsComputer) {
        setTimeout(() => {
          playComputer();
        }, 1000);
      } else socket.emit("move", { rowIdx, colIdx });
    }
  }

  return (<div className="board-section">
    <ConnectionHandler socket={socket} setIsOpponentOnline={setIsOpponentOnline} reconnectInterval={reconnectInterval} />
    {!isGameOver && <div className="cur-turn">
      {isCurTurn ? "Your turn" : (opponentSide === BLACK ? "Black" : "White") + "'s turn"}
    </div>}
    <div className="points-table">
      <div className="black-points">{blackPoints.current}</div>
      <div className="white-points">{whitePoints.current}</div>
    </div>
    <div className="board-container">
      <div className={`board${isCurTurn ? " enabled" : ""}`}>
        {isGameOver && <div className="game-over">
          <div>Game over</div>
          <div style={{ fontSize: "1.5rem" }}>{gameOverMsg}</div>
          <Link to="/" className="link-btn btn-nobg" data-theme="dark">home page</Link>
        </div>}
        {board.current?.map((row:Array<number>, rIdx:number) =>
          <div key={rIdx} className="row">
            {row.map((rune:number, cellIdx:number) => (
              <div
                onClick={() => moveClick(rIdx, cellIdx)}
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
    </div>
  </div>)
}