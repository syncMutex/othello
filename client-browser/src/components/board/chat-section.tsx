import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Socket } from "../../ts/socket-impl";
import "./chat-section.scss";
 
interface ChatSectionProps {
  socket: Socket;
  opponentName: string;
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

export default function ChatSection({ socket, opponentName }:ChatSectionProps) {
  const [isChatSectionOpen, setIsChatSectionOpen] = useState<boolean>(false);
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
      setChats((prev:Chats) => [...prev, new ChatMsg(opponentName, msg, false)]);
    })
  }, [])
  
  useEffect(() => {
    if(chatMsgsDiv.current)
      chatMsgsDiv.current.scrollTop = chatMsgsDiv.current.scrollHeight;
  }, [chats]);

  return (<div className={`chat-section${isChatSectionOpen ? " open" : " closed"}`}>
    <header>
      <h1>Chat</h1>
      <div className="close-btn" onClick={() => setIsChatSectionOpen((prev:boolean) => !prev)}>close</div>
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