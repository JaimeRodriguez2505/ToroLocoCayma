/**
 * Script de prueba para ejecutar cierre automático del 10 de octubre
 */

require('dotenv').config();
const cierreScheduler = require('./src/services/cierreScheduler.service');

async function test() {
  console.log('========================================');
  console.log('PRUEBA DE CIERRE AUTOMÁTICO - 10 DE OCTUBRE');
  console.log('========================================\n');

  try {
    // Ejecutar cierre para el 10 de octubre
    console.log('Ejecutando cierre para el 10 de octubre...\n');

    const result = await cierreScheduler.runCierreForDate('2025-10-10');

    console.log('\n========================================');
    console.log('RESULTADO:');
    console.log('========================================');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ CIERRE EXITOSO!');
      console.log(`   Cierre ID: ${result.cierre?.id_cierre}`);
      console.log(`   Total Efectivo: S/ ${result.cierre?.total_efectivo}`);
      console.log(`   Gastos Aprobados: S/ ${result.cierre?.total_gastos_aprobados}`);
      console.log(`   Saldo Esperado: S/ ${result.cierre?.saldo_final_esperado}`);
      console.log(`   Discrepancia: S/ ${result.cierre?.discrepancia}`);
    } else {
      console.log('\n⚠️  CIERRE NO EJECUTADO');
      console.log(`   Razón: ${result.message}`);
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
