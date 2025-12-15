import { Server } from "socket.io";
import registerUserEvents from "./events/user.event.js";
import registerVentaEvents from "./events/venta.event.js";

export default function socketLoader(server, allowedOrigins) {
    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true,
        }
    });

    io.on("connection", (socket) => {
        const { role, userId } = socket.handshake.auth || {};

        if (!role) {
            console.log("⛔ Socket sin rol, desconectado");
            socket.disconnect();
            return;
        }

        socket.join(role); // admin | tienda | almacen
        console.log(`⚡ ${role} conectado → ${socket.id}`);

        registerUserEvents(io, socket);
        registerVentaEvents(io, socket);

        socket.on("disconnect", () => {
            console.log(`❌ ${role} desconectado → ${socket.id}`);
        });
    });

    return io;
}