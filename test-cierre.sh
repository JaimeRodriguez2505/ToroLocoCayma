#!/bin/bash

# Script para probar el cierre automático del 10 de octubre

echo "=========================================="
echo "PRUEBA DE CIERRE AUTOMÁTICO - 10/10/2025"
echo "=========================================="
echo ""

# 1. Login para obtener token
echo "1. Obteniendo token de autenticación..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jaimeandre17@hotmail.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token"
  echo "Respuesta del servidor:"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Token obtenido exitosamente"
echo ""

# 2. Verificar estado del scheduler
echo "2. Verificando estado del scheduler..."
SCHEDULER_STATUS=$(curl -s -X GET http://localhost:3000/api/scheduler/status \
  -H "Authorization: Bearer $TOKEN")

echo "$SCHEDULER_STATUS" | python3 -m json.tool 2>/dev/null || echo "$SCHEDULER_STATUS"
echo ""

# 3. Verificar si ya existe cierre del 10/10
echo "3. Verificando si existe cierre del 10/10/2025..."
EXISTING_CIERRE=$(docker exec -i tiktendry-mysql mysql -utiktendry -ptiktendry tiktendry -se "SELECT COUNT(*) FROM cierres_caja WHERE DATE(fecha_apertura) = '2025-10-10';" 2>/dev/null | tail -1)

if [ "$EXISTING_CIERRE" -gt "0" ]; then
  echo "⚠️  Ya existe un cierre para el 10/10/2025"
  echo "   Puedes eliminarlo manualmente si quieres volver a probarlo"
else
  echo "✅ No existe cierre previo, procediendo..."
fi
echo ""

# 4. Ejecutar cierre para el 10/10/2025
echo "4. Ejecutando cierre automático para 10/10/2025..."
CIERRE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/scheduler/run-for-date \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"fecha": "2025-10-10"}')

echo "$CIERRE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CIERRE_RESPONSE"
echo ""

# 5. Verificar el cierre creado en la base de datos
echo "5. Verificando cierre creado en la base de datos..."
docker exec -i tiktendry-mysql mysql -utiktendry -ptiktendry tiktendry -e "
SELECT
  id_cierre,
  DATE(fecha_apertura) as fecha,
  total_efectivo,
  total_gastos_aprobados,
  saldo_final_esperado,
  discrepancia,
  cantidad_ventas,
  estado
FROM cierres_caja
WHERE DATE(fecha_apertura) = '2025-10-10';
" 2>/dev/null

echo ""
echo "=========================================="
echo "PRUEBA COMPLETADA"
echo "=========================================="
