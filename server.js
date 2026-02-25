const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Serveri i REMI 71 eshte LIVE! (Versioni Final)");
});

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

console.log("Duke ndezur motorët e lojës Remi 71...");

io.on("connection", (socket) => {
    console.log("Lojtari i ri u lidh: " + socket.id);

    socket.on("join-room", (roomID) => {
        socket.join(roomID);
        const clients = io.sockets.adapter.rooms.get(roomID);
        const numPlayers = clients ? clients.size : 0;
        console.log(`Dhoma: ${roomID} | Lojtarë: ${numPlayers}`);
        io.to(roomID).emit("player-count", numPlayers);
    });

    socket.on("start-game-signal", (roomID) => {
        console.log(`Loja po nis në dhomën: ${roomID}`);
        io.to(roomID).emit("game-started");
    });

    // KJO SHTESA ISHTE E NEVOJSHME:
    // Kur ti lëviz (merr/hedh), njoftohet shoku sa letra i ke në dorë
    socket.on("update-card-count", (data) => {
        // data: { roomID, count }
        socket.to(data.roomID).emit("opponent-card-count", {
            id: socket.id,
            count: data.count
        });
    });

    socket.on("hidh-leter", (data) => {
        socket.to(data.roomID).emit("leter-e-hedhur", data.leter);
        console.log(`Letër u hodh në dhomën: ${data.roomID}`);
    });

    socket.on("mbyll-lojen", (data) => {
        io.to(data.roomID).emit("loja-mbaroi", {
            fituesi: socket.id,
            lloji: data.lloji
        });
    });

    socket.on("disconnecting", () => {
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                const clients = io.sockets.adapter.rooms.get(room);
                const numPlayers = clients ? clients.size - 1 : 0;
                io.to(room).emit("player-count", numPlayers);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("Lojtari doli.");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`REMI 71 SERVERI GATI - Port: ${PORT}`);
});
