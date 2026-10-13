import { io } from "socket.io-client";

const apiUrl = String(import.meta.env.VITE_API_URL || "http://localhost:5000/api");
const socketUrl = apiUrl.replace(/\/api\/?$/, "");
let socket;

function getSocket() {
  if (!socket) socket = io(socketUrl, { withCredentials: true, autoConnect: true });
  return socket;
}

export function subscribe(event, handler) {
  const current = getSocket();
  current.on(event, handler);
  return () => current.off(event, handler);
}
