import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getSocketBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_SOCKET_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_SOCKET_BASE_URL;
  }

  if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
    return null;
  }

  try {
    return new URL(process.env.NEXT_PUBLIC_API_BASE_URL).origin;
  } catch {
    return null;
  }
}

export const getSocket = () => {
  if (!socket) {
    const socketBaseUrl = getSocketBaseUrl();

    if (!socketBaseUrl) {
      socket = io({ autoConnect: false });
      return socket;
    }

    socket = io(socketBaseUrl, {
      autoConnect: true,
    });
  }

  return socket;
};
