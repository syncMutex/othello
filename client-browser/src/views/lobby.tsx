import { useContext, useEffect } from "react"
import { useParams } from "react-router-dom";
import { socketConnect, SocketContext } from "../contexts/socket"

export default function Lobby() {
  const socket = useContext(SocketContext);
  const params = useParams();

  useEffect(() => {
    socketConnect()
    socket.emit("test", { "hehehe": "lol" })
    socket.on("hehehe", (d) => {
      console.log(d)
    })
  }, [])
  return (<div>
    Lobby
  </div>)
}