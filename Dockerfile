# Utiliser une image officielle Node.js
FROM node:20

# Installer Python et pip (nécessaires pour installer Aider)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    && rm -rf /var/lib/apt/lists/*

# Installer Aider globalement via pip
RUN pip3 install --no-cache-dir aider-chat --break-system-packages

# Créer le dossier de travail dans le conteneur
WORKDIR /app

# Copier les fichiers du projet
COPY package*.json ./
RUN npm install

COPY . .

# Exposer le port du serveur
EXPOSE 3000

# Lancer le serveur
CMD ["npm", "start"]
