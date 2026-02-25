const http = require("http");
const { Server } = require("socket.io");

// Serveri bazë HTTP
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Serveri i REMI 71 eshte LIVE! (Versioni 2-5 Lojtare)");
});

// Konfigurimi i Socket.io me CORS
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

console.log("Duke ndezur motorët e lojës Remi 71...");

io.on("connection", (socket) => {
    console.log("Lojtari i ri u lidh: " + socket.id);

    // 1. Kur lojtari futet në dhomë
    socket.on("join-room", (roomID) => {
        socket.join(roomID);
        
        const clients = io.sockets.adapter.rooms.get(roomID);
        const numPlayers = clients ? clients.size : 0;
        
        console.log(`Dhoma: ${roomID} | Lojtarë aktualë: ${numPlayers}`);

        // Njoftojmë të gjithë në dhomë për numrin e lojtarëve
        io.to(roomID).emit("player-count", numPlayers);
    });

    // 2. Sinjali për nisjen e lojës (Vjen nga Krijuesi i dhomës)
    socket.on("start-game-signal", (roomID) => {
        console.log(`Loja po nis në dhomën: ${roomID}`);
        io.to(roomID).emit("game-started");
    });

    // 3. Kur një lojtar hedh një letër
    socket.on("hidh-leter", (data) => {
        // data: { roomID, leter }
        socket.to(data.roomID).emit("leter-e-hedhur", data.leter);
        console.log(`Letër e re në toke (Dhoma: ${data.roomID})`);
    });

    // 4. Kur një lojtar mbyll lojën (71)
    socket.on("mbyll-lojen", (data) => {
        // data: { roomID, lloji }
        io.to(data.roomID).emit("loja-mbaroi", {
            fituesi: socket.id,
            lloji: data.lloji
        });
        console.log(`Loja mbaroi në dhomën ${data.roomID}. Fituesi: ${socket.id}`);
    });

    socket.on("disconnecting", () => {
        // Njoftojmë dhomat që lojtari po del para se të shkëputet plotësisht
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                const clients = io.sockets.adapter.rooms.get(room);
                const numPlayers = clients ? clients.size - 1 : 0;
                io.to(room).emit("player-count", numPlayers);
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("Një lojtar doli nga loja.");
    });
});

// Porta për Render
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("-----------------------------------------");
    console.log(`REMI 71 SERVERI GATI - Port: ${PORT}`);
    console.log("-----------------------------------------");
});
