import React from "react";
import { Socket } from "../ts/socket-impl";

const socket:Socket = new Socket(); 
export const SocketContext = React.createContext<Socket>(socket);

export const socketConnect = (url:string) => {
  if(socket.isConnected) return; 
  socket.connect(url);
}