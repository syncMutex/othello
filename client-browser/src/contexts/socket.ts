import React from "react";
import { Socket } from "../ts/socket-impl";

const socket:Socket = new Socket("ws://localhost:5000/api/join-game"); 
export const SocketContext = React.createContext<Socket>(socket);

export const socketConnect = () => {
  socket.connect();
}