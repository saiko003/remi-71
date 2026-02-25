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

// Lista për Jackpot-in e përbashkët
const simbolet = ['♥', '♦', '♣', '♠'];
const vlerat = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

console.log("Duke ndezur motorët e lojës Remi 71...");

io.on("connection", (socket) => {
    console.log("Lojtar i ri u lidh: " + socket.id);

    // 1. Futja në dhomë me Emër
    socket.on("join-room", (data) => {
        const { roomID, playerName } = data;
        socket.join(roomID);
        socket.playerName = playerName; 

        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);
        
        const players = clients.map(id => {
            const s = io.sockets.sockets.get(id);
            return { id: id, name: s ? s.playerName : "Lojtar" };
        });

        console.log(`Dhoma: ${roomID} | Lojtarë: ${players.length} | Emri: ${playerName}`);
        
        io.to(roomID).emit("player-count", players.length);
        io.to(roomID).emit("update-players", players);
    });

    // 2. Nisja e lojës (Shtuar vetëm variabla e Jackpot-it që të jetë e njëjtë)
    socket.on("start-game-signal", (data) => {
        const jv = vlerat[Math.floor(Math.random() * vlerat.length)];
        const js = simbolet[Math.floor(Math.random() * simbolet.length)];
        const jackpot = { v: jv, s: js, color: (js === '♥' || js === '♦' ? 'red' : 'black') };

        console.log(`Loja po nis në dhomën: ${data.roomID}`);
        
        // Dërgojmë saktësisht ato që pret kodi yt + jackpot-in e ri
        io.to(data.roomID).emit("game-started", { 
            starterId: data.starterId,
            currentTurn: data.starterId,
            jackpot: jackpot 
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
        socket.to(data.roomID).emit("leter-e-hedhur", data.leter);
        
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
