<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;



class VerifyJwtToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('Authorization');
        if (!$token) {
            return $this->corsResponse(['message' => 'Token no proporcionado'], 401);
        }

        try {
            $decoded = JWT::decode($token, new Key(env('JWT_SECRET'), 'HS256'));
            
            $request->id_user = $decoded->id;

            return $next($request);

        }catch (ExpiredException $e) {
            return $this->corsResponse(['message' => 'Token expirado'], 401);
        }
         catch (\Exception $e) {
            return $this->corsResponse(['message' => 'Token inválido'], 401);
        }
    }

    /**
     * Devolver respuesta con cabeceras CORS (delegado al middleware CORS de Laravel)
     */
    private function corsResponse($data, $status)
    {
        // Laravel CORS middleware maneja automáticamente las cabeceras CORS
        // No necesitamos agregar cabeceras manualmente aquí
        return response()->json($data, $status);
    }
}
