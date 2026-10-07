const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

let activeShell = null;

io.on('connection', (socket) => {
    console.log('Un client est connecté au terminal');

    if (!activeShell) {
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

// ROUTE API CLASSIQUE POUR LES COMMANDES TERMINAL
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

// NOUVELLE ROUTE API SPÉCIALE POUR AIDER
// Elle lance Aider en arrière-plan avec la consigne (prompt) que vous lui donnez
app.post('/api/aider', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Aucun prompt fourni pour Aider.' });

    // On s'assure que la clé Gemini est bien transmise à la commande
    const apiKey = process.env.GEMINI_API_KEY || '';
    
    // Commande pour lancer Aider en mode non-interactif (--yes ou --message)
    // Ici on utilise --message pour lui donner l'ordre directement et quitter
    const aiderCmd = `export GEMINI_API_KEY="${apiKey}" && aider --model gemini/gemini-2.5-flash --message "${prompt.replace(/"/g, '\\"')}" --yes`;

    console.log(`Lancement d'Aider avec la consigne : ${prompt}`);

    exec(aiderCmd, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur d'exécution Aider: ${error.message}`);
            return res.status(500).json({ success: false, error: error.message, details: stderr });
        }
        res.json({ 
            success: true, 
            message: 'Aider a exécuté la tâche avec succès !', 
            output: stdout 
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur de terminal en ligne sur le port ${PORT}`);
});
