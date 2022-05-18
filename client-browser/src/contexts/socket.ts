import React from "react";
import { Socket } from "../ts/socket-impl";

const socket:Socket = new Socket(); 
export const SocketContext = React.createContext<Socket>(socket);

export const socketConnect = async (url:string, onError:(e:Event) => void) => {
  if(socket.isConnected) return;
  socket.connect(url, onError);
}