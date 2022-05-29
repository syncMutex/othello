import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { WHITE, Side } from "../../ts/common.types";
import { Socket } from "../../ts/socket-impl";
import "./chat-section.scss";
 
interface ChatSectionProps {
  socket: Socket;
  opponent: { name:string; sideStr:string }
  isOpponentOnline: boolean;
}

class ChatMsg {
  name:string;
  msg:string;
  time:string;
  isSent:boolean;

  constructor(name:string, msg:string, isSent:boolean) {
    this.name = name;
    this.msg = msg;
    this.isSent = isSent;
    this.time = new Date().toLocaleTimeString([], { timeStyle: 'short' })
  }
}

type Chats = Array<ChatMsg>;

export default function ChatSection({ socket, isOpponentOnline, opponent }:ChatSectionProps) {
  const [isChatSectionOpen, setIsChatSectionOpen] = useState<boolean>(false);
  const [hideChatSection, setHideChatSection] = useState<boolean>(false);
  const [chats, setChats] = useState<Chats>([]);
  const [inputMsg, setInputMsg] = useState<string>("");
  const chatMsgsDiv = useRef<HTMLDivElement>(null);

  const sendMsg = () => {
    const trimmed = inputMsg.trim();
    if(inputMsg === "") return;
    socket.emit("chat-msg", trimmed);
    setChats((prev:Chats) => [...prev, new ChatMsg("", trimmed, true)]);
    setInputMsg("");
  }

  useEffect(() => {
    socket.on("chat-msg", (msg:string) => {
      setChats((prev:Chats) => [...prev, new ChatMsg(opponent.name, msg, false)]);
    })
  }, [])
  
  useEffect(() => {
    if(chatMsgsDiv.current)
      chatMsgsDiv.current.scrollTop = chatMsgsDiv.current.scrollHeight;
  }, [chats]);

  return (<div className={`chat-section${isChatSectionOpen ? " open" : " closed"}${hideChatSection ? " hide" : ""}`}>
    {hideChatSection && <div className="chat-icon-container" onClick={() => setHideChatSection(false)}>
      <svg viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M74.8998 113.706L97.5025 143.993C98.0427 144.717 99.1898 144.411 99.2969 143.514L102.684 115.144C102.864 113.636 104.144 112.5 105.663 112.5H138.5C140.157 112.5 141.5 111.157 141.5 109.5V13C141.5 11.3431 140.157 10 138.5 10H9C7.34315 10 6 11.3431 6 13V109.5C6 111.157 7.34314 112.5 9 112.5H72.4955C73.4423 112.5 74.3335 112.947 74.8998 113.706Z" stroke="white" strokeWidth={5}/>
      <rect x="14" y="18" width="94" height="16" rx="4" fill="#AB75E1"/>
      <rect x="50" y="42" width="78" height="16" rx="4" fill="#FFFA7B"/>
      <rect x="76" y="66" width="51" height="16" rx="4" fill="#FFFA7B"/>
      <rect x="14" y="88" width="64" height="16" rx="4" fill="#AB75E1"/>
      </svg>
    </div>}
    <header>
      <div className="opponent-details">
        <div className={`${opponent.sideStr}${isOpponentOnline ? " online" : ""}`.trim()}></div>
        <h1>{opponent.name}</h1>
      </div>
      <div className="icons">
        <div className="minimize-btn" onClick={() => setIsChatSectionOpen((prev:boolean) => !prev)}>
          <svg viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 107V14C4 12.3431 5.34315 11 7 11H74.7603H142.567C144.205 11 145.541 12.3151 145.566 13.9538L147 107" stroke="white" strokeDasharray="2 2"/>
          <path d="M3 106C3 104.343 4.34315 103 6 103H145C146.657 103 148 104.343 148 106V148H3V106Z" fill="#8B8B8B"/>
          <path d="M53.7678 22.2322C52.7915 21.2559 51.2085 21.2559 50.2322 22.2322L34.3223 38.1421C33.346 39.1184 33.346 40.7014 34.3223 41.6777C35.2986 42.654 36.8816 42.654 37.8579 41.6777L52 27.5355L66.1421 41.6777C67.1184 42.654 68.7014 42.654 69.6777 41.6777C70.654 40.7014 70.654 39.1184 69.6777 38.1421L53.7678 22.2322ZM54.5 97L54.5 24H49.5L49.5 97H54.5Z" fill="white"/>
          <path d="M90.2566 98.7918C91.2462 99.7547 92.829 99.733 93.7918 98.7434L109.482 82.6171C110.445 81.6275 110.423 80.0447 109.434 79.0819C108.444 78.119 106.862 78.1407 105.899 79.1303L91.9516 93.4648L77.6171 79.5177C76.6275 78.5549 75.0447 78.5765 74.0819 79.5661C73.119 80.5557 73.1407 82.1385 74.1303 83.1013L90.2566 98.7918ZM88.5002 24.0342L89.5002 97.0342L94.4998 96.9658L93.4998 23.9658L88.5002 24.0342Z" fill="white"/>
          <rect x="8" y="110" width="55" height="16" rx="8" fill="black" fillOpacity="0.34"/>
          <rect x="105" y="111" width="14" height="14" rx="7" fill="black" fillOpacity="0.34"/>
          <path d="M126 117.5C126 113.91 128.91 111 132.5 111C136.09 111 139 113.91 139 117.5V118.5C139 122.09 136.09 125 132.5 125C128.91 125 126 122.09 126 118.5V117.5Z" fill="black" fillOpacity="0.34"/>
          </svg>
        </div>
        <div className="close-btn" onClick={() => setHideChatSection(true)}></div>
      </div>
    </header>
    <div className="chat-msgs custom-scrollbar" ref={chatMsgsDiv}>
      {chats.map((c:ChatMsg, idx:number) => (<div key={idx} className={c.isSent ? "sent" : ""}>
        <div className="msg"><span>{c.isSent ? "You" : c.name }</span> : {c.msg}</div>
        <div className="time">{c.time}</div>
      </div>))}
    </div>
    <form onSubmit={(e:FormEvent) => e.preventDefault()}>
      <div className="chat-input-section">
        <input
          type="text"
          spellCheck="false"
          value={inputMsg}
          onChange={(e:ChangeEvent<HTMLInputElement>) => setInputMsg(e.target.value)}
        />
        <button className="btn-blue" onClick={sendMsg}>send</button>
      </div>
    </form>
  </div>)
}