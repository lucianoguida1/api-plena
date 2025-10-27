#!/bin/bash

# Caminho para o diretório do seu projeto
PROJECT_DIR="/home/api_dash"

# Muda para o diretório do projeto
cd "$PROJECT_DIR" || exit

# Verifica se há mudanças no repositório remoto
git fetch origin main

# Verifica se há mudanças não integradas
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "Atualizações encontradas. Executando git pull."
    git pull origin main
else
    echo "Nenhuma atualização encontrada."
fi
