import { useState } from "react";
import { Socket } from "../../ts/socket-impl";
import "./chat-section.scss";
 
interface ChatSectionProps {
  socket: Socket;
}

interface ChatMsg {
  name:string;
  msg:string;
  time:string;
  isSent:boolean;
}

type Chats = Array<ChatMsg>;

export default function ChatSection({ socket }:ChatSectionProps) {
  const [isChatSectionOpen, setIsChatSectionOpen] = useState<boolean>(true);
  const [chats, setChats] = useState<Chats>([
    { name: "ok", "msg": "yeyeye", time: "10:07", isSent: true },
    { name: "ladadj", msg: "asdadsdasasd", time: "10:07", isSent: false },
    { name: "ladadj", msg: "asdadsdasasd", time: "10:07", isSent: false },
    { name: "ladadj", msg: "asdadsdasadsasdasdasdasdasdasdadasdadasdadasdadasdasdadsdasasd", time: "10:07", isSent: false },
    { name: "ladadj", msg: "asdadsdasasd", time: "10:07", isSent: false },
    { name: "ladadj", msg: "asdadsdasasd", time: "10:07", isSent: true },
    { name: "ladadj", msg: "asdadsdasasd", time: "10:07", isSent: true },
    { name: "ladadj", msg: "asdadsdasasd", time: "10:07", isSent: true },
    { name: "ladadj", msg: "asdadsdasasd", time: "10:07", isSent: false },
    { name: "ladadj", msg: "last boii asd asdahaeh hde ahd adu asd aidaio", time: "10:07", isSent: false },
  ]);

  return (<div className={`chat-section${isChatSectionOpen ? " open" : " closed"}`}>
    <header>
      <h1>Chat</h1>
      <div className="close-btn" onClick={() => setIsChatSectionOpen((prev:boolean) => !prev)}>close</div>
    </header>
    <div className="chat-msgs custom-scrollbar">
      {chats.map((c:ChatMsg, idx:number) => (<div key={idx} className={c.isSent ? "sent" : ""}>
        <div className="msg"><span>{c.isSent ? "You" : c.name }</span> : {c.msg}</div>
        <div className="time">{c.time}</div>
      </div>))}
    </div>
    <div className="chat-input-section">
      <input type="text" spellCheck="false" />
      <button className="btn-blue">send</button>
    </div>
  </div>)
}