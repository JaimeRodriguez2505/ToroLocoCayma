/**
 * Script para ejecutar cierre del 10 de octubre
 * Ejecutar con: node ejecutar-cierre-10-oct.js
 */

const { connectDB } = require('./src/config/database');
const autoCierreCajaService = require('./src/services/autoCierreCaja.service');

async function main() {
  console.log('==========================================');
  console.log('EJECUTANDO CIERRE DEL 10 DE OCTUBRE 2025');
  console.log('==========================================\n');

  try {
    // Conectar a la base de datos
    console.log('📡 Conectando a la base de datos...');
    await connectDB();
    console.log('✅ Conexión establecida\n');

    // Ejecutar cierre para el 10 de octubre
    console.log('🔄 Ejecutando cierre para 2025-10-10...\n');
    const result = await autoCierreCajaService.ejecutarCierreParaFecha('2025-10-10');

    console.log('\n==========================================');
    console.log('RESULTADO:');
    console.log('==========================================\n');

    if (result.success) {
      console.log('✅ ¡CIERRE CREADO EXITOSAMENTE!\n');
      console.log('Detalles del cierre:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`ID Cierre:           ${result.cierre.id_cierre}`);
      console.log(`Fecha:               ${result.fecha}`);
      console.log(`Ventas procesadas:   ${result.cierre.cantidad_ventas}`);
      console.log('');
      console.log('💰 TOTALES POR MÉTODO DE PAGO:');
      console.log(`   Efectivo:         S/ ${result.cierre.total_efectivo.toFixed(2)}`);
      console.log(`   Tarjeta:          S/ ${result.cierre.total_tarjeta.toFixed(2)}`);
      console.log(`   Transferencia:    S/ ${result.cierre.total_transferencia.toFixed(2)}`);
      console.log(`   Yape:             S/ ${result.cierre.total_yape.toFixed(2)}`);
      console.log(`   Plin:             S/ ${result.cierre.total_plin.toFixed(2)}`);
      console.log('');
      console.log('💸 GASTOS Y SALDOS:');
      console.log(`   Gastos aprobados: S/ ${result.cierre.total_gastos_aprobados.toFixed(2)}`);
      console.log(`   Saldo esperado:   S/ ${result.cierre.saldo_final_esperado.toFixed(2)}`);
      console.log(`   Saldo reportado:  S/ ${result.cierre.saldo_efectivo.toFixed(2)}`);
      console.log(`   Discrepancia:     S/ ${result.cierre.discrepancia.toFixed(2)}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (result.cierre.observaciones) {
        console.log('\n📝 OBSERVACIONES:');
        console.log(result.cierre.observaciones);
      }

      // Mostrar alertas si las hay
      if (result.alertas && result.alertas.length > 0) {
        console.log('\n⚠️  ALERTAS:');
        result.alertas.forEach(alerta => {
          const emoji = alerta.tipo === 'discrepancia' ? '⚠️' : 'ℹ️';
          console.log(`   ${emoji} ${alerta.mensaje}`);
        });
      }

    } else {
      console.log('⚠️  CIERRE NO EJECUTADO\n');
      console.log(`Razón: ${result.message}`);
      if (result.cierre_existente) {
        console.log('\nYa existe un cierre para esta fecha:');
        console.log(`   ID: ${result.cierre_existente.id_cierre}`);
        console.log(`   Estado: ${result.cierre_existente.estado}`);
      }
    }

    console.log('\n==========================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

main();
