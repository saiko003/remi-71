const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Serveri i REMI 71 - Versioni Profesional me Emra dhe Radhë");
});

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

console.log("Duke ndezur motorët e lojës Remi 71...");

io.on("connection", (socket) => {
    console.log("Lojtar i ri u lidh: " + socket.id);

    // 1. Futja në dhomë me Emër
    socket.on("join-room", (data) => {
        // data: { roomID, playerName }
        const { roomID, playerName } = data;
        socket.join(roomID);
        socket.playerName = playerName; // Ruajmë emrin në memorien e socket-it

        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);
        
        // Kriojmë një listë me emrat e lojtarëve në dhomë
        const players = clients.map(id => {
            const s = io.sockets.sockets.get(id);
            return { id: id, name: s ? s.playerName : "Lojtar" };
        });

        console.log(`Dhoma: ${roomID} | Lojtarë: ${players.length} | Emri: ${playerName}`);
        
        // Dërgojmë numrin e lojtarëve dhe listën e emrave
        io.to(roomID).emit("player-count", players.length);
        io.to(roomID).emit("update-players", players);
    });

    // 2. Nisja e lojës dhe caktimi i radhës së parë
    socket.on("start-game-signal", (data) => {
        // Ai që shtyp butonin 'Nis Lojën' e ka radhën i pari (StarterId)
        console.log(`Loja po nis në dhomën: ${data.roomID}`);
        
        io.to(data.roomID).emit("game-started", { 
            starterId: data.starterId,
            currentTurn: data.starterId // Personi që e nisi ka radhën
        });
    });

    // 3. Sinkronizimi i letrave të kundërshtarit
    socket.on("update-card-count", (data) => {
        socket.to(data.roomID).emit("opponent-card-count", {
            id: socket.id,
            count: data.count
        });
    });

    // 4. Hedhja e letrës dhe Kalimi i Radhës automatik
    socket.on("hidh-leter", (data) => {
        // data: { roomID, leter }
        socket.to(data.roomID).emit("leter-e-hedhur", data.leter);
        
        // Gjejmë kush e ka radhën tjetër
        const clients = Array.from(io.sockets.adapter.rooms.get(data.roomID) || []);
        const nextPlayer = clients.find(id => id !== socket.id);
        
        if (nextPlayer) {
            io.to(data.roomID).emit("ndrro-radhen", { nextTurn: nextPlayer });
            console.log(`Radha i kaloi lojtarit: ${nextPlayer}`);
        }
    });

    // 5. Mbyllja e lojës
    socket.on("mbyll-lojen", (data) => {
        const s = io.sockets.sockets.get(socket.id);
        io.to(data.roomID).emit("loja-mbaroi", {
            fituesi: s ? s.playerName : "Dikush",
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
    console.log(`REMI 71 SERVERI PRO GATI - Port: ${PORT}`);
    console.log("-----------------------------------------");
});
