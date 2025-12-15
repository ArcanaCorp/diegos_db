export default function registerVentaEvents(io, socket) {

    // SOLO TIENDA debería emitir esto
    socket.on("venta:nueva", async (venta) => {
        try {
            
            const ventaGuardada = {
                ...venta,
                id: Date.now()
            };

            // 🔔 Notificar ADMIN
            io.to("ADMIN").emit("venta:notificacion", {
                mensaje: "🧾 Nueva venta registrada",
                venta: ventaGuardada
            });

            // 📊 Actualizar dashboard ADMIN
            io.to("ADMIN").emit("dashboard:update", {
                ultimaVenta: ventaGuardada
            });

            // 📦 Notificar ALMACÉN
            io.to("ALMACEN").emit("stock:update", {
                productos: ventaGuardada.productos
            });

        } catch (error) {
            console.error("❌ Error en venta:nueva", error);
            socket.emit("venta:error", { message: "Error al procesar venta" });
        }
    });

}