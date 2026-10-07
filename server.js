const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

let activeShell = null;

io.on('connection', (socket) => {
    console.log('Un client est connecté au terminal');

    if (!activeShell) {
        // Lancement d'un shell bash persistant
        activeShell = pty.spawn('bash', [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env
        });

        activeShell.onData((data) => {
            io.emit('output', data);
        });
    }

    socket.on('input', (data) => {
        if (activeShell) {
            activeShell.write(data);
        }
    });
});

// ROUTE API : C'est ici que votre IA envoie ses ordres de code
app.post('/api/execute', (req, res) => {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'Aucune commande fournie.' });
    if (!activeShell) return res.status(500).json({ error: 'Terminal non initialisé.' });

    try {
        activeShell.write(command + '\n');
        res.json({ success: true, message: `Commande lancée : ${command}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur de terminal en ligne sur le port ${PORT}`);
});
          
