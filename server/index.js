const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { createDeck, evaluateHand } = require('./game/pokdeng');

const app = express();
app.use(cors());

// Serve React build in production
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

let players = {
    x1ertz:  { money: 100, socketId: null, cards: [], status: 'waiting', evaluate: null, diff: 0, role: null },
    konsuay: { money: 100, socketId: null, cards: [], status: 'waiting', evaluate: null, diff: 0, role: null }
};

let deck = [];
let gameState = 'waiting';
let currentDealer = null; // คงที่ตลอด session จนกว่าจะ reset

// ─────────────────────────────────────────────
// Socket Events
// ─────────────────────────────────────────────
io.on('connection', (socket) => {

    // Login
    socket.on('login', ({ username, password }) => {
        if (password !== '12345' || !['x1ertz', 'konsuay'].includes(username)) {
            socket.emit('login_error', 'Invalid credentials');
            return;
        }
        players[username].socketId = socket.id;
        socket.emit('login_success', username);
        broadcastState();
        checkGameStart();
    });

    // Player / Dealer action (draw or stay)
    socket.on('action', ({ username, action }) => {
        if (gameState !== 'player_turns') return;
        if (!players[username] || players[username].status !== 'turn') return;

        if (action === 'draw') {
            players[username].cards.push(deck.pop());
        }
        // Both draw and stay move the player to 'done'
        players[username].status = 'done';
        players[username].evaluate = evaluateHand(players[username].cards);
        broadcastState();
        setTimeout(nextTurn, 800);
    });

    // Next round — dealer stays the same, only money persists
    socket.on('next_round', () => {
        if (gameState === 'resolving') {
            startNewRound();
        }
    });

    // Full reset — randomise dealer again, reset money
    socket.on('reset_game', () => {
        currentDealer = Math.random() > 0.5 ? 'x1ertz' : 'konsuay';
        for (let user of ['x1ertz', 'konsuay']) {
            players[user].cards    = [];
            players[user].status   = 'waiting';
            players[user].evaluate = null;
            players[user].diff     = 0;
            players[user].money    = 100;
            players[user].role     = user === currentDealer ? 'dealer' : 'player';
        }
        gameState = 'waiting';
        broadcastState();
        checkGameStart();
    });

    // Request current state on reconnect
    socket.on('request_state', () => {
        socket.emit('state_update', buildState());
    });

    // Disconnect
    socket.on('disconnect', () => {
        for (let user in players) {
            if (players[user].socketId === socket.id) {
                players[user].socketId = null;
                broadcastState();
            }
        }
    });
});

// ─────────────────────────────────────────────
// Game Flow
// ─────────────────────────────────────────────

function checkGameStart() {
    const bothOnline = players.x1ertz.socketId && players.konsuay.socketId;
    if (!bothOnline || gameState !== 'waiting') return;

    // Assign dealer only once per session (persists across rounds)
    if (!currentDealer) {
        currentDealer = Math.random() > 0.5 ? 'x1ertz' : 'konsuay';
        players.x1ertz.role  = currentDealer === 'x1ertz'  ? 'dealer' : 'player';
        players.konsuay.role = currentDealer === 'konsuay' ? 'dealer' : 'player';
    }

    gameState = 'dealing';
    broadcastState();
    setTimeout(startRound, 2000);
}

function startNewRound() {
    // Keep currentDealer — no re-randomisation
    for (let user of ['x1ertz', 'konsuay']) {
        players[user].cards    = [];
        players[user].status   = 'waiting';
        players[user].evaluate = null;
        players[user].diff     = 0;
        // role persists, money persists
    }
    gameState = 'waiting';
    broadcastState();
    checkGameStart();
}

function startRound() {
    deck = createDeck();

    const dUser = currentDealer;
    const pUser = currentDealer === 'x1ertz' ? 'konsuay' : 'x1ertz';

    // Deal 2 cards to each player
    players.x1ertz.cards  = [deck.pop(), deck.pop()];
    players.konsuay.cards = [deck.pop(), deck.pop()];

    players.x1ertz.evaluate  = evaluateHand(players.x1ertz.cards);
    players.konsuay.evaluate  = evaluateHand(players.konsuay.cards);
    players.x1ertz.diff  = 0;
    players.konsuay.diff = 0;

    const dealerPok  = players[dUser].evaluate.type.includes('Pok');
    const playerPok  = players[pUser].evaluate.type.includes('Pok');

    if (dealerPok || playerPok) {
        // Either side has Pok → reveal everything and resolve immediately
        players.x1ertz.status  = 'done';
        players.konsuay.status = 'done';
        gameState = 'player_turns'; // brief moment before resolve
        broadcastState();
        setTimeout(resolveRound, 1200);
    } else {
        // No Pok → player (non-dealer) decides first
        players[pUser].status = 'turn';
        players[dUser].status = 'waiting'; // dealer waits
        gameState = 'player_turns';
        broadcastState();
    }
}

function nextTurn() {
    const dUser = currentDealer;
    const pUser = currentDealer === 'x1ertz' ? 'konsuay' : 'x1ertz';

    if (players[pUser].status === 'done' && players[dUser].status === 'waiting') {
        // Player finished → it's the dealer's turn
        players[dUser].status = 'turn';
        broadcastState();
    } else if (players[pUser].status === 'done' && players[dUser].status === 'done') {
        // Both done → resolve
        resolveRound();
    }
}

function resolveRound() {
    gameState = 'resolving';
    const bet = 10;

    const dUser = currentDealer;
    const pUser = currentDealer === 'x1ertz' ? 'konsuay' : 'x1ertz';

    const dEval = players[dUser].evaluate;
    const pEval = players[pUser].evaluate;

    if (pEval.rank > dEval.rank) {
        // Player wins — money from dealer
        const amount = bet * pEval.multiplier;
        players[pUser].money += amount;
        players[dUser].money -= amount;
        players[pUser].diff  =  amount;
        players[dUser].diff  = -amount;
    } else if (pEval.rank < dEval.rank) {
        // Dealer wins — money from player
        const amount = bet * dEval.multiplier;
        players[pUser].money -= amount;
        players[dUser].money += amount;
        players[pUser].diff  = -amount;
        players[dUser].diff  =  amount;
    } else {
        // Tie
        players[pUser].diff = 0;
        players[dUser].diff = 0;
    }

    broadcastState();
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildState() {
    return {
        gameState,
        currentDealer,
        players: {
            x1ertz:  { ...players.x1ertz },
            konsuay: { ...players.konsuay }
        }
    };
}

function broadcastState() {
    io.emit('state_update', buildState());
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
