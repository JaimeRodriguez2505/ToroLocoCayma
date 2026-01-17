<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $table = 'companies';
    protected $primaryKey = 'id_company';
    public $timestamps = false;

    const CREATED_AT = 'creado_en';
    const UPDATED_AT = 'actualizado_en';

    protected $fillable = [
        'razon_social',
        'ruc',
        'direccion',
        'logo_url',
        'sol_user',
        'sol_pass',
        'cert_path',
        'client_id',
        'client_secret',
        'production',
        'reniec_api_key',
        'id_user',
    ];

    protected $casts = [
        'production' => 'boolean',
        'creado_en' => 'datetime',
        'actualizado_en' => 'datetime',
    ];
}


