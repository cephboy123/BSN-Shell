const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Endpoint asynchrone pour lancer Aider et logger chaque sortie/erreur
app.post('/api/aider', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: "Le paramètre 'prompt' est requis." });
    }

    // Réponse immédiate pour éviter les timeouts
    res.json({ success: true, message: "Aider a été lancé en arrière-plan sur le serveur !" });

    const logFile = path.join(__dirname, 'aider.log');
    const command = `aider --model gemini/gemini-2.5-flash --message "${prompt.replace(/"/g, '\\"')}" --yes`;

    // Exécution et enregistrement des logs (stdout et stderr)
    exec(command, (error, stdout, stderr) => {
        let logContent = `--- Exécution : ${new Date().toISOString()} ---\n`;
        logContent += `Commande : ${command}\n`;
        if (stdout) logContent += `[STDOUT]\n${stdout}\n`;
        if (stderr) logContent += `[STDERR]\n${stderr}\n`;
        if (error) logContent += `[ERREUR]\n${error.message}\n`;
        logContent += `----------------------------------------\n\n`;

        fs.appendFileSync(logFile, logContent);
    });
});

// Endpoint pour lire les logs à tout moment
app.get('/api/logs', (req, res) => {
    const logFile = path.join(__dirname, 'aider.log');
    if (fs.existsSync(logFile)) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(fs.readFileSync(logFile, 'utf8'));
    } else {
        res.send("Aucun journal pour le moment.");
    }
});

// Endpoint simple pour lire n'importe quel fichier (ex: /api/read?file=test.txt)
app.get('/api/read', (req, res) => {
    const fileName = req.query.file;
    if (!fileName) return res.status(400).json({ error: "Paramètre 'file' manquant." });
    
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(fs.readFileSync(filePath, 'utf8'));
    } else {
        res.status(404).json({ error: "Fichier introuvable." });
    }
});
        
