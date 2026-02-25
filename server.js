const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Serveri i REMI 71 eshte LIVE! (Versioni i Sinkronizuar)");
});

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

console.log("Duke ndezur motorët e lojës Remi 71...");

io.on("connection", (socket) => {
    console.log("Lojtari u lidh: " + socket.id);

    // 1. Futja në dhomë
    socket.on("join-room", (roomID) => {
        socket.join(roomID);
        const clients = io.sockets.adapter.rooms.get(roomID);
        const numPlayers = clients ? clients.size : 0;
        
        console.log(`Dhoma: ${roomID} | Lojtarë: ${numPlayers}`);
        
        // Njofton të gjithë në dhomë për numrin e lojtarëve
        io.to(roomID).emit("player-count", numPlayers);
    });

    // 2. Nisja e lojës (Sinjali nga kushdo që shtyp butonin)
    socket.on("start-game-signal", (data) => {
        // data: { roomID, starterId }
        console.log(`Loja po nis në dhomën: ${data.roomID} nga lojtari: ${data.starterId}`);
        
        // Dërgojmë starterId te të gjithë që kodi .html ta dijë kush merr 11 letra
        io.to(data.roomID).emit("game-started", { starterId: data.starterId });
    });

    // 3. Sinkronizimi i letrave të kundërshtarit
    socket.on("update-card-count", (data) => {
        // data: { roomID, count }
        // Ky sinjal i tregon shokut sa letra ka ky lojtar në dorë
        socket.to(data.roomID).emit("opponent-card-count", {
            id: socket.id,
            count: data.count
        });
    });

    // 4. Hedhja e letrës në tokë
    socket.on("hidh-leter", (data) => {
        // data: { roomID, leter }
        socket.to(data.roomID).emit("leter-e-hedhur", data.leter);
        console.log(`Letër u hodh në dhomën: ${data.roomID}`);
    });

    // 5. Mbyllja e lojës (71)
    socket.on("mbyll-lojen", (data) => {
        io.to(data.roomID).emit("loja-mbaroi", {
            fituesi: socket.id,
            lloji: data.lloji
        });
    });

    // Largimi i lojtarit
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
    console.log("-----------------------------------------");
    console.log(`REMI 71 SERVERI GATI - Port: ${PORT}`);
    console.log("-----------------------------------------");
});
