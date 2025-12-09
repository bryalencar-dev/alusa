#!/bin/bash
# Script para testar o endpoint Twilio da API Alusa
# Usage: ./test-twilio-api.sh [numero_celular]

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🧪 TESTE DA API TWILIO - ALUSA"
echo "=============================="
echo ""

# Número de teste (padrão ou argumento)
NUMERO=${1:-"97981106749"}

echo "📱 Configuração do teste:"
echo "   Endpoint: http://localhost:3000/api/twilio/send"
echo "   Número: $NUMERO"
echo "   Mensagem: Teste via script bash 🚀"
echo ""

echo "⏳ Enviando requisição..."
echo ""

# Fazer requisição
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/twilio/send \
  -H "Content-Type: application/json" \
  -d "{\"numero\":\"$NUMERO\",\"mensagem\":\"Teste via script bash 🚀\"}")

# Separar body e status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo "📊 Resposta da API:"
echo ""
echo "$HTTP_BODY" | jq . 2>/dev/null || echo "$HTTP_BODY"
echo ""

# Analisar resposta
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ SUCESSO! Status: $HTTP_CODE${NC}"
  
  # Extrair SID se existir
  SID=$(echo "$HTTP_BODY" | jq -r '.sid' 2>/dev/null)
  if [ "$SID" != "null" ] && [ ! -z "$SID" ]; then
    echo -e "${GREEN}   SID: $SID${NC}"
  fi
  
  echo ""
  echo "💡 Agora faça os seguintes testes:"
  echo ""
  echo "1️⃣ Verifique se a mensagem chegou no WhatsApp"
  echo "   Número: +55 $NUMERO"
  echo ""
  echo "2️⃣ Verifique os logs do servidor Next.js"
  echo "   Procure por: [Twilio] ✅ Mensagem enviada com sucesso"
  echo ""
  echo "3️⃣ Verifique o Console Twilio"
  echo "   https://console.twilio.com/us1/monitor/logs/sms"
  echo ""
  
elif [ "$HTTP_CODE" -eq 400 ]; then
  echo -e "${YELLOW}⚠️ ERRO DE VALIDAÇÃO! Status: $HTTP_CODE${NC}"
  echo ""
  echo "Possíveis causas:"
  echo "  - Número inválido"
  echo "  - Formato incorreto"
  echo "  - Mensagem muito longa"
  
elif [ "$HTTP_CODE" -eq 500 ]; then
  echo -e "${RED}❌ ERRO NO SERVIDOR! Status: $HTTP_CODE${NC}"
  echo ""
  echo "Possíveis causas:"
  echo "  - Variáveis de ambiente ausentes (.env.local)"
  echo "  - Credenciais Twilio inválidas"
  echo "  - Servidor não está rodando"
  echo ""
  echo "Verifique:"
  echo "  1. O servidor está rodando? (pnpm dev)"
  echo "  2. O arquivo .env.local existe em apps/web?"
  echo "  3. As variáveis TWILIO_* estão definidas?"
  
else
  echo -e "${RED}❌ ERRO INESPERADO! Status: $HTTP_CODE${NC}"
fi

echo ""
echo "🔍 Debug rápido:"
echo ""
echo "# Ver logs do servidor:"
echo "tail -f apps/web/.next/server.log"
echo ""
echo "# Testar variáveis de ambiente:"
echo "cd apps/web && node -e \"require('dotenv').config({path:'.env.local'}); console.log(process.env.TWILIO_FROM_NUMBER)\""
echo ""
echo "# Teste direto com Twilio (sem Next.js):"
echo "node test-twilio-direct.js $NUMERO"
echo ""
