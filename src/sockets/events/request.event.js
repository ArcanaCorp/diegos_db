import { notifyUsersByRole } from "#src/services/push.service.js";

export default function registerRequestEvents (io, socket) {

    socket.on("request:nueva", async (request) => {
        try {
            
            if (!request || !request.id_request) {
                return socket.emit("request:error", {
                    message: "Solicitud inválida"
                });
            }

            const notification = {
                id: request.id_request,
                type: request.type,
                title: request.title,
                message: request.message,
                store_id: request.store_id,
                status: "PENDING",
                payload: request.payload,
                created_at: new Date()
            };

            // 🔔 Notificar ADMIN (tiempo real)
            io.to("ADMIN").emit("request:notificacion", {
                mensaje: "Nueva notificación",
                notification: notification
            });

            // 📌 Actualizar lista de solicitudes
            io.to("ADMIN").emit("requests:update", {
                action: "NEW",
                request: notification
            });

            // 📲 Push notification
            await notifyUsersByRole("ADMIN", {
                title: request.title || "Nueva solicitud de tienda",
                body: request.message,
                icon: "/icon.png",
                badge: "/badge.png",
                url: "/solicitudes"
            });

        } catch (error) {
            console.error("❌ Error en venta:nueva", error);
            socket.emit("request:error", { message: "Error al procesar la petición" });
        }
    })

}