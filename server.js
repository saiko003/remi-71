// Përdorim një version që nuk kërkon instalim të rëndë
const http = require("http");
const server = http.createServer();
const io = require("socket.io")(server, {
    cors: { origin: "*" }
});

io.on("connection", (socket) => {
    console.log("Lojtari u lidh: " + socket.id);
    
    socket.on("join-room", (roomID) => {
        socket.join(roomID);
        io.to(roomID).emit("status-msg", "Lojtari u lidh!");
    });

    socket.on("hidh-leter", (data) => {
        socket.to(data.roomID).emit("leter-e-hedhur", data.leter);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Serveri po punon ne porten: " + PORT);
});
