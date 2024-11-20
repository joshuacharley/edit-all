import { Server } from "socket.io";
import { NextApiResponse } from "next";
import { NextRequest } from "next/server";

import { Socket } from "net";
type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: any;
  };
};

const ioHandler = (req: NextRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket?.server?.io) {
    if (!res.socket) return res.end();

    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join-document", (documentId: string) => {
        socket.join(documentId);
        console.log(`User ${socket.id} joined document: ${documentId}`);
      });

      socket.on("leave-document", (documentId: string) => {
        socket.leave(documentId);
        console.log(`User ${socket.id} left document: ${documentId}`);
      });

      socket.on(
        "document-change",
        (data: { documentId: string; content: any; user: string }) => {
          socket.to(data.documentId).emit("document-updated", {
            content: data.content,
            user: data.user,
          });
        }
      );

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  res.end();
};
export default ioHandler;
