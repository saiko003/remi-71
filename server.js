const http = require("http");
const { Server } = require("socket.io");

// Krijojmë një server bazë HTTP
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Serveri i REMI 71 eshte LIVE!");
});

// Lidhim Socket.io me serverin dhe rregullojmë aksesin (CORS)
const io = new Server(server, {
    cors: {
        origin: "*", // Lejon iPhone-at dhe Netlify të lidhen
        methods: ["GET", "POST"]
    }
});

console.log("Duke ndezur motorët e lojës...");

io.on("connection", (socket) => {
    console.log("Lojtari i ri u lidh: " + socket.id);

    // Kur një lojtar krijon ose futet në dhomë
    socket.on("join-room", (roomID) => {
        socket.join(roomID);
        
        // Gjejmë sa lojtarë janë në këtë dhomë specifike
        const clients = io.sockets.adapter.rooms.get(roomID);
        const numPlayers = clients ? clients.size : 0;
        
        console.log(`Dhoma: ${roomID} | Lojtarë: ${numPlayers}`);

        // Njoftojmë të gjithë në dhomë
        io.to(roomID).emit("player-count", numPlayers);
        
        if (numPlayers === 2) {
            io.to(roomID).emit("status-msg", "Gati për lojë!");
        }
    });

    // Kur një lojtar hedh një letër
    socket.on("hidh-leter", (data) => {
        // data duhet të jetë: { roomID, leter }
        socket.to(data.roomID).emit("leter-e-hedhur", data.leter);
        console.log(`Letra u hodh në dhomën ${data.roomID}`);
    });

    socket.on("disconnect", () => {
        console.log("Një lojtar doli nga loja.");
    });
});

// Përcaktojmë portën automatike për Render
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("-----------------------------------------");
    console.log(`REMI 71 punon në portën: ${PORT}`);
    console.log("-----------------------------------------");
});
