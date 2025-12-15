export default function registerUserEvents(io, socket) {

    socket.on("user:ping", () => {
        socket.emit("user:pong", { ok: true });
    });

    socket.on("user:update", (data) => {
        // Solo admin recibe actualizaciones de usuarios
        io.to("admin").emit("user:updated", data);
    });

}