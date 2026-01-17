<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SyncCompanies extends Command
{
    protected $signature = 'sync:companies';
    protected $description = 'Sincroniza empresas desde la base de datos ERP';

    public function handle()
    {
        $this->info('🔄 Sincronizando empresas desde ERP...');

        try {
            // Configurar conexión temporal a la base de datos ERP
            $erpHost = env('ERP_DB_HOST', 'db-erp');
            $erpDatabase = env('ERP_DB_DATABASE', 'toroloco_erp');
            $erpUsername = env('ERP_DB_USERNAME', 'toroloco');
            $erpPassword = env('ERP_DB_PASSWORD', 'toroloco_change_me');

            config([
                'database.connections.erp' => [
                    'driver' => 'mysql',
                    'host' => $erpHost,
                    'port' => '3306',
                    'database' => $erpDatabase,
                    'username' => $erpUsername,
                    'password' => $erpPassword,
                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                    'prefix' => '',
                    'strict' => true,
                    'engine' => null,
                ]
            ]);

            // Obtener empresas desde ERP
            $companies = DB::connection('erp')
                ->table('companies')
                ->get();

            if ($companies->isEmpty()) {
                $this->warn('⚠️  No se encontraron empresas en la base de datos ERP');
                return 0;
            }

            $this->info("📊 Encontradas {$companies->count()} empresa(s) en ERP");

            $synced = 0;
            $updated = 0;

            foreach ($companies as $company) {
                // Verificar si la empresa ya existe en facturación
                $exists = DB::table('companies')
                    ->where('id_company', $company->id_company)
                    ->exists();

                if ($exists) {
                    // Actualizar empresa existente
                    DB::table('companies')
                        ->where('id_company', $company->id_company)
                        ->update([
                            'razon_social' => $company->razon_social,
                            'ruc' => $company->ruc,
                            'direccion' => $company->direccion,
                            'logo_url' => $company->logo_url,
                            'sol_user' => $company->sol_user,
                            'sol_pass' => $company->sol_pass,
                            'cert_path' => $company->cert_path,
                            'client_id' => $company->client_id,
                            'client_secret' => $company->client_secret,
                            'production' => $company->production,
                            'reniec_api_key' => $company->reniec_api_key,
                            'id_user' => $company->id_user,
                            'actualizado_en' => now(),
                        ]);
                    $updated++;
                    $this->line("  ↻ Actualizada: {$company->razon_social} (RUC: {$company->ruc})");
                } else {
                    // Insertar nueva empresa
                    DB::table('companies')->insert([
                        'id_company' => $company->id_company,
                        'razon_social' => $company->razon_social,
                        'ruc' => $company->ruc,
                        'direccion' => $company->direccion,
                        'logo_url' => $company->logo_url,
                        'sol_user' => $company->sol_user,
                        'sol_pass' => $company->sol_pass,
                        'cert_path' => $company->cert_path,
                        'client_id' => $company->client_id,
                        'client_secret' => $company->client_secret,
                        'production' => $company->production,
                        'reniec_api_key' => $company->reniec_api_key,
                        'id_user' => $company->id_user,
                        'creado_en' => $company->creado_en,
                        'actualizado_en' => $company->actualizado_en,
                    ]);
                    $synced++;
                    $this->line("  ✓ Sincronizada: {$company->razon_social} (RUC: {$company->ruc})");
                }
            }

            $this->info("✅ Sincronización completada:");
            $this->info("   • Nuevas: {$synced}");
            $this->info("   • Actualizadas: {$updated}");

            return 0;

        } catch (\Exception $e) {
            $this->error("❌ Error al sincronizar empresas: " . $e->getMessage());
            return 1;
        }
    }
}
