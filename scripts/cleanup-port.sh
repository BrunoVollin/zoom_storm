#!/bin/bash
# Script para limpar processos Node ativos em portas específicas
# Útil para eliminar processos zumbis antes de iniciar o debugger

PORT=${1:-3000}

echo "🔍 Procurando processos na porta $PORT..."

PIDS=$(lsof -ti :$PORT 2>/dev/null)

if [ -z "$PIDS" ]; then
  echo "✅ Nenhum processo na porta $PORT"
  exit 0
fi

echo "⚠️  Encontrados os seguintes PIDs na porta $PORT:"
echo "$PIDS"

echo ""
echo "🔪 Eliminando processos..."
echo "$PIDS" | xargs kill -9 2>/dev/null

echo "✅ Processos eliminados com sucesso!"
echo ""
echo "💡 Dica: Pode usar 'npm run dev' para iniciar o servidor de desenvolvimento"
