#!/bin/bash

# Nome da imagem
IMAGE_NAME="whatsapp-bot"

# Verifica se docker-compose está instalado
if ! [ -x "$(command -v docker-compose)" ]; then
  echo "Erro: docker-compose não está instalado." >&2
  exit 1
fi

# Constrói a imagem do Docker
echo "Construindo a imagem do Docker..."
docker-compose build || { echo "Falha ao construir a imagem do Docker"; exit 1; }

# Executa o container
echo "Iniciando o container..."
docker-compose up -d || { echo "Falha ao iniciar o container"; exit 1; }

echo "Container iniciado com sucesso."
