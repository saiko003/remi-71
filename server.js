const io = require("socket.io")(process.env.PORT || 3000, {
    cors: {
        origin: "*", // Kjo lejon çdo pajisje (iPhone/PC) të lidhet
        methods: ["GET", "POST"]
    }
});

console.log("Serveri po ndizet...");

io.on("connection", (socket) => {
    console.log("Një lojtar u lidh: " + socket.id);

    // Kur lojtari krijon ose futet në një dhomë
    socket.on("join-room", (roomID) => {
        socket.join(roomID);
        
        // Numërojmë sa lojtarë janë në dhomë
        const clients = io.sockets.adapter.rooms.get(roomID);
        const numPlayers = clients ? clients.size : 0;
        
        console.log(`Lojtari ${socket.id} u fut në dhomën: ${roomID}. Lojtarë në total: ${numPlayers}`);

        // Njoftojmë të gjithë në dhomë për numrin e lojtarëve
        io.to(roomID).emit("player-count", numPlayers);

        // Nëse janë 2 lojtarë, loja mund të fillojë
        if (numPlayers === 2) {
            io.to(roomID).emit("status-msg", "Loja po fillon! Shoku u lidh.");
        }
    });

    // Kur një lojtar hedh një letër
    socket.on("hidh-leter", (data) => {
        // data duhet të ketë: { roomID, leter }
        socket.to(data.roomID).emit("leter-e-hedhur", data.leter);
        console.log(`Letra u hodh në dhomën ${data.roomID}`);
    });

    // Kur lojtari shkëputet
    socket.on("disconnect", () => {
        console.log("Një lojtar doli nga loja.");
    });
});

// Ky mesazh do të duket te "Logs" në Render kur çdo gjë të jetë OK
console.log("Serveri i REMI 71 është LIVE dhe po pret lojtarët!");