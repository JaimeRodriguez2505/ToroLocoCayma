<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Greenter\Report\XmlUtils;
use Illuminate\Http\Request;
use Luecano\NumeroALetras\NumeroALetras;
use App\Services\SunatService;
 

class InvoiceController extends Controller
{

    public function send(Request $request)
    {
        $request->validate([
            'company' => 'required|array',
            'company.address' => 'required|array',
            'client' => 'required|array',
            'details' => 'required|array',
            'details.*' => 'required|array',
        ]);

        // Verificar si es un usuario de ventas
        $is_sales_user = $request->input('is_sales_user', false);

        // Obtener el ID de usuario
        $id_user = null;

        if ($is_sales_user) {
            // Si es un usuario de ventas, buscar la empresa por RUC
            $company_data = $request->input('company');
            $company_ruc = $company_data['ruc'] ?? null;
            $company = Company::where('ruc', $company_ruc)->first();

            if (!$company) {
                return response()->json(['message' => 'Empresa no encontrada'], 404);
            }

            $id_user = $company->id_user;
        } else {
            // Si es un usuario normal, usar el ID del usuario autenticado
            $id_user = $request->id_user;
        }

        $data = $request->all();
        $data['descuentoGlobal'] = $request->input('descuentoGlobal', 0);

        // Buscar la empresa
        $company = Company::where('id_user', $id_user)
            ->where('ruc', $data['company']['ruc'])
            ->firstOrFail();

        $this->setTotales($data);
        $this->setLegends($data);

        $sunat = new SunatService();
        $see = $sunat->getSee($company);

        $invoice = $sunat->getInvoice($data);

        $result = $see->send($invoice);

        $response['xml'] = $see->getFactory()->getLastXml();

        $response['hash'] = (new XmlUtils())->getHashSign($response['xml']);

        $response['sunatResponse'] = $sunat->sunatResponse($result);

        return response()->json($response, 200);
    }

    public function xml(Request $request)
    {
        $request->validate([
            'company' => 'required|array',
            'company.address' => 'required|array',
            'client' => 'required|array',
            'details' => 'required|array',
            'details.*' => 'required|array',
        ]);

        // Verificar si es un usuario de ventas
        $is_sales_user = $request->input('is_sales_user', false);

        // Obtener el ID de usuario
        $id_user = null;

        if ($is_sales_user) {
            // Si es un usuario de ventas, buscar la empresa por RUC
            $company_data = $request->input('company');
            $company_ruc = $company_data['ruc'] ?? null;
            $company = Company::where('ruc', $company_ruc)->first();

            if (!$company) {
                return response()->json(['message' => 'Empresa no encontrada'], 404);
            }

            $id_user = $company->id_user;
        } else {
            // Si es un usuario normal, usar el ID del usuario autenticado
            $id_user = $request->id_user;
        }

        $data = $request->all();
        $data['descuentoGlobal'] = $request->input('descuentoGlobal', 0);


        $company = Company::where('id_user', $id_user)
            ->where('ruc', $data['company']['ruc'])
            ->firstOrFail();

        $this->setTotales($data);
        $this->setLegends($data);

        $sunat = new SunatService();
        $see = $sunat->getSee($company);

        $invoice = $sunat->getInvoice($data);

        $response['xml'] = $see->getXmlSigned($invoice);

        $response['hash'] = (new XmlUtils())->getHashSign($response['xml']);

        return response()->json($response, 200);
    }

    public function pdf(Request $request)
    {
        $request->validate([
            'company' => 'required|array',
            'company.address' => 'required|array',
            'client' => 'required|array',
            'details' => 'required|array',
            'details.*' => 'required|array',
        ]);

        $id_user = $request->id_user;
        $data = $request->all();
        $data['descuentoGlobal'] = $request->input('descuentoGlobal', 0);


        // Verificar si es un usuario de ventas
        $isSalesUser = $request->has('is_sales_user') && $request->is_sales_user === true;

        // Modificar la consulta para permitir acceso a usuarios de ventas
        if ($isSalesUser) {
            // Buscar la empresa por RUC sin restricción de id_user
            $company = Company::where('ruc', $data['company']['ruc'])
                ->first();

            if (!$company) {
                return response()->json(['message' => 'Empresa no encontrada'], 404);
            }
        } else {
            // Consulta original para administradores
            $company = Company::where('id_user', $id_user)
                ->where('ruc', $data['company']['ruc'])
                ->firstOrFail();
        }

        $this->setTotales($data);
        $this->setLegends($data);

        $sunat = new SunatService();
        $invoice = $sunat->getInvoice($data);

        // Usar el ID del propietario de la empresa para obtener el logo y otros datos
        $htmlTicket = $sunat->getHtmlReportTicket($invoice, $company->id_user);
        
        return response()->json([
            'success' => true,
            'message' => 'PDF generado correctamente',
            'data' => [
                'html' => $htmlTicket,
                'invoice_number' => $invoice->getSerie() . '-' . $invoice->getCorrelativo(),
                'company_name' => $data['company']['razonSocial'] ?? '',
                'client_name' => $data['client']['rznSocial'] ?? '',
                'total' => $data['mtoImpVenta'] ?? 0
            ]
        ], 200);
    }

    public function setTotales(&$data)
    {
        $details = collect($data['details']);

        // 1) Distribuir descuento global proporcionalmente en líneas gravadas (tipAfeIgv = 10)
        $descuentoGlobal = floatval($data['descuentoGlobal'] ?? 0);
        if ($descuentoGlobal > 0) {
            // Sumar base imponible gravada original (antes de descuento)
            $sumaGravadaOriginal = $details
                ->whereIn('tipAfeIgv', [10, '10'])
                ->sum('mtoValorVenta');

            if ($sumaGravadaOriginal > 0) {
                // Reparto proporcional por línea con ajuste del residuo al final
                $gravadasKeys = [];
                $lineDiscounts = [];
                $acumDiscount = 0.0;

                foreach ($data['details'] as $idx => $detail) {
                    if ((string)($detail['tipAfeIgv'] ?? '') === '10') {
                        $gravadasKeys[] = $idx;
                    }
                }

                $numGravadas = count($gravadasKeys);
                foreach ($gravadasKeys as $i => $k) {
                    $detail = $data['details'][$k];
                    $baseLinea = floatval($detail['mtoValorVenta'] ?? 0);
                    if ($i < $numGravadas - 1) {
                        $prop = $baseLinea / $sumaGravadaOriginal;
                        $descLinea = round($descuentoGlobal * $prop, 2);
                        $lineDiscounts[$k] = $descLinea;
                        $acumDiscount += $descLinea;
                    } else {
                        // Última línea: ajustar residuo para que coincida exactamente con el descuento global
                        $descLinea = round($descuentoGlobal - $acumDiscount, 2);
                        $lineDiscounts[$k] = $descLinea;
                        $acumDiscount += $descLinea;
                    }
                }

                // Aplicar descuentos y recalcular importes por línea (base e IGV)
                foreach ($gravadasKeys as $k) {
                    $detail = $data['details'][$k];
                    $cantidad = floatval($detail['cantidad'] ?? 0);
                    $baseOriginal = floatval($detail['mtoValorVenta'] ?? 0);
                    $descLinea = floatval($lineDiscounts[$k] ?? 0);
                    $baseNueva = max(0.0, round($baseOriginal - $descLinea, 2));

                    // Recalcular montos derivados
                    $valorUnitario = $cantidad > 0 ? round($baseNueva / $cantidad, 2) : 0.0; // sin IGV
                    $igvLinea = round($baseNueva * 0.18, 2);
                    $precioUnitario = round($valorUnitario * 1.18, 2); // con IGV

                    $data['details'][$k]['mtoValorVenta'] = $baseNueva;
                    $data['details'][$k]['mtoBaseIgv'] = $baseNueva;
                    $data['details'][$k]['mtoValorUnitario'] = $valorUnitario;
                    $data['details'][$k]['igv'] = $igvLinea;
                    $data['details'][$k]['totalImpuestos'] = $igvLinea;
                    $data['details'][$k]['mtoPrecioUnitario'] = $precioUnitario;
                }

                // Marcar que el descuento global ya ha sido distribuido a las líneas
                $data['descuentoDistribuido'] = true;
            }
        }

        // refrescar colección tras posibles cambios en detalles
        $details = collect($data['details']);

        $data['mtoOperGravadas'] = $details
            ->whereIn('tipAfeIgv', [10, '10'])
            ->sum('mtoValorVenta');

        $data['mtoOperExoneradas'] = $details
            ->whereIn('tipAfeIgv', [20, '20'])
            ->sum('mtoValorVenta');

        $data['mtoOperInafecto'] = $details
            ->whereIn('tipAfeIgv', [30, '30'])
            ->sum('mtoValorVenta');

        $data['mtoOperExportacion'] = $details
            ->whereIn('tipAfeIgv', [40, '40'])
            ->sum('mtoValorVenta');

        $data['mtoOperGratuitas'] = $details
            ->whereNotIn('tipAfeIgv', [10, '10', 20, '20', 30, '30', 40, '40'])
            ->sum('mtoValorVenta');


        // IGV: recalculado desde detalles ya ajustados
        $data['mtoIGV'] = $details
            ->whereIn('tipAfeIgv', [10, '10'])
            ->sum('igv');

        $data['mtoIGVGratuitas'] = $details
            ->whereNotIn('tipAfeIgv', [10, '10', 20, '20', 30, '30', 40, '40'])
            ->sum('igv');


        $data['icbper'] = $details
            ->sum('icbper');


        $data['totalImpuestos'] = $data['mtoIGV'] + $data['icbper'];

        $data['valorVenta'] = $details
            ->whereIn('tipAfeIgv', [10, '10', 20, '20', 30, '30', 40, '40'])
            ->sum('mtoValorVenta');

        $data['subTotal'] = $data['valorVenta'] + $data['mtoIGV'];

        // El descuento ya fue distribuido en líneas, por lo que subTotal y valorVenta ya reflejan el descuento.
        // Aun así, mantenemos el registro del descuento global a nivel de cabecera para UBL (AllowanceCharge).
        $totalSinRedondeo = $data['subTotal'] + $data['icbper'];

        // Redondeo correcto a 2 decimales (no usar floor que redondea hacia abajo)
        $data['mtoImpVenta'] = round($totalSinRedondeo, 2);

        $data['redondeo'] = $data['mtoImpVenta'] - $totalSinRedondeo;
        


    }

    public function setLegends(&$data)
    {
        $formatter = new NumeroALetras();
        $data['legends'] = [
            [
                'code' => '1000',
                'value' => $formatter->toInvoice($data['mtoImpVenta'], 2, 'SOLES')
            ]
        ];
    }
}