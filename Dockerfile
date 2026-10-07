FROM node:20

# 1. Installer Python, pip et les dépendances système de base
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    && rm -rf /var/lib/apt/lists/*

# 2. Forcer l'installation d'Aider et de l'API Google GenAI
RUN pip3 install --no-cache-dir aider-chat google-generativeai --break-system-packages

# 3. Dossier de travail
WORKDIR /app

# 4. Installation des dépendances Node.js
COPY package*.json ./
RUN npm install

# 5. Copie du reste du code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
