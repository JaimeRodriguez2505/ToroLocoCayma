<?php

namespace App\Services;

use App\Models\Company as ModelsCompany;
use DateTime;
use Greenter\Model\Client\Client;
use Greenter\Model\Company\Address;
use Greenter\Model\Company\Company;
use Greenter\Model\Sale\FormaPagos\FormaPagoContado;
use Greenter\Model\Sale\Invoice;
use Greenter\Model\Sale\Legend;
use Greenter\Model\Sale\SaleDetail;
use Greenter\Report\HtmlReport;
use Greenter\Report\Resolver\DefaultTemplateResolver;
use Greenter\See;
use Greenter\Ws\Services\SunatEndpoints;
use Illuminate\Support\Facades\Storage;

use Greenter\Model\Sale\Charge;

class SunatService
{
    public function getSee($company)
    {

        $see = new See();
        $filename = basename($company->cert_path);
        $certificateContent = Storage::disk('certs')->get($filename);
        $see->setCertificate($certificateContent);
        $see->setService($company->production ? SunatEndpoints::FE_PRODUCCION : SunatEndpoints::FE_BETA);
        $see->setClaveSOL($company->ruc, $company->sol_user, $company->sol_pass);

        return $see;
    }

    public function getInvoice($data)
    {
        // Venta
        return (new Invoice())
            ->setUblVersion($data['ublVersion'] ?? '2.1')
            ->setTipoOperacion($data['tipoOperacion'] ?? null) // Venta - Catalog. 51
            ->setTipoDoc($data['tipoDoc'] ?? null) // Factura - Catalog. 01
            ->setSerie($data['serie'] ?? null)
            ->setCorrelativo($data['correlativo'] ?? null)
            ->setFechaEmision(new DateTime($data['fechaEmision'] ?? null)) // Zona horaria: Lima
            ->setFormaPago(new FormaPagoContado()) // FormaPago: Contado
            ->setTipoMoneda($data['tipoMoneda'] ?? null) // Sol - Catalog. 02
            ->setCompany($this->getCompany($data['company']))
            ->setClient($this->getClient($data['client']))

            //mntOper
            ->setMtoOperGravadas($data['mtoOperGravadas'])
            ->setMtoOperExoneradas($data['mtoOperExoneradas'])
            ->setMtoOperInafectas($data['mtoOperInafecto'])
            ->setMtoOperExportacion($data['mtoOperExportacion'])
            ->setMtoOperGratuitas($data['mtoOperGratuitas'])

            //impuestos
            ->setMtoIGV($data['mtoIGV'])
            ->setMtoIGVGratuitas($data['mtoIGVGratuitas'])
            ->setIcbper($data['icbper'])
            ->setTotalImpuestos($data['totalImpuestos'])

            //toales
            ->setValorVenta($data['valorVenta'])
            ->setSubTotal($data['subTotal'])
            ->setRedondeo($data['redondeo'])
            ->setMtoImpVenta($data['mtoImpVenta'])

            //productos
            ->setDetails($this->getDetails($data['details']))

            //leyendas
            ->setLegends($this->getLegend($data['legends']))

            //descuento (solo si NO ha sido distribuido a nivel de líneas)
            ->setDescuentos(
                (floatval($data['descuentoGlobal'] ?? 0) > 0 && empty($data['descuentoDistribuido'])) ? [
                    (new Charge())
                        ->setCodTipo('02')
                        ->setMontoBase($data['mtoOperGravadas'])
                        ->setFactor(0)
                        ->setMonto($data['descuentoGlobal'])
                ] : []
            );
    }

    public function getCompany($company)
    {
        return (new Company())
            ->setRuc($company['ruc'] ?? null)
            ->setRazonSocial($company['razonSocial'] ?? null)
            ->setNombreComercial($company['nombreComercial'] ?? null)
            ->setAddress($this->getAddress($company['address']));
    }

    public function getClient($client)
    {
        // Cliente
        return (new Client())
            ->setTipoDoc($client['tipoDoc'] ?? null) // RUC - Catalog. 06
            ->setNumDoc($client['numDoc'] ?? null)
            ->setRznSocial($client['rznSocial'] ?? null);
    }

    public function getAddress($address)
    {
        // Emisor
        return (new Address())
            ->setUbigueo($address['ubigueo'] ?? null)
            ->setDepartamento($address['departamento'] ?? null)
            ->setProvincia($address['provincia'] ?? null)
            ->setDistrito($address['distrito'] ?? null)
            ->setUrbanizacion($address['urbanizacion'] ?? null)
            ->setDireccion($address['direccion'] ?? null)
            ->setCodLocal($address['codLocal'] ?? null); // Codigo de establecimiento asignado por SUNAT, 0000 por defecto.

    }

    public function getDetails($details)
    {

        $green_details = [];

        foreach ($details as $detail) {

            $green_details[] = (new SaleDetail())
                ->setTipAfeIgv($detail['tipAfeIgv'] ?? null) // Gravado Op. Onerosa - Catalog. 07
                ->setCodProducto($detail['codProducto'] ?? null)
                ->setUnidad($detail['unidad'] ?? null) // Unidad - Catalog. 03
                ->setDescripcion($detail['descripcion'] ?? null)
                ->setCantidad($detail['cantidad'] ?? null)
                ->setMtoValorUnitario($detail['mtoValorUnitario'] ?? null)
                ->setMtoValorVenta($detail['mtoValorVenta'] ?? null)
                ->setMtoBaseIgv($detail['mtoBaseIgv'] ?? null) // Base imponible

                ->setPorcentajeIgv($detail['porcentajeIgv'] ?? null) // 18%
                ->setIgv($detail['igv'] ?? null) // Impuesto
                ->setFactorIcbper($detail['factorIcbper'] ?? null) // 0.2
                ->setIcbper($detail['icbper'] ?? null) // Impuesto

                ->setTotalImpuestos($detail['totalImpuestos'] ?? null) // Suma de impuestos en el detalle

                ->setMtoPrecioUnitario($detail['mtoPrecioUnitario'] ?? null);
        }

        return $green_details;
    }

    public function getLegend($legends)
    {
        $green_legends = [];

        foreach ($legends as $legend) {
            $green_legends[] = (new Legend())
                ->setCode($legend['code'] ?? null) // Catalog. 1000
                ->setValue($legend['value'] ?? null);
        }


        return $green_legends;
    }

    //response y reporte
    public function sunatResponse($result)
    {

        $response['success'] = $result->isSuccess();

        if (!$response['success']) {
            // Mostrar error al conectarse a SUNAT.

            $response['error'] = [
                'code' => $result->getError()->getCode(),
                'message' => $result->getError()->getMessage()
            ];

            return $response;
        }
        $response['cdrZip'] = base64_encode($result->getCdrZip());

        $cdr = $result->getCdrResponse();

        $response['cdrResponse'] = [
            'code' => (int)$cdr->getCode(),
            'description' => $cdr->getDescription(),
            'notes' => $cdr->getNotes()

        ];

        return $response;
    }

    public function getHtmlReport($invoice, $id_user)
    {

        $report = new HtmlReport();

        $resolver = new DefaultTemplateResolver();

        $report->setTemplate($resolver->getTemplate($invoice));

        $ruc = $invoice->getCompany()->getRuc();
        $company = ModelsCompany::where('ruc', $ruc)
            ->where('id_user', $id_user)
            ->first();

        $filename = basename($company->logo_url);
        $logo_content = Storage::disk('logos')->get($filename);
        $params = [
            'system' => [
                'logo' => $logo_content,
                'hash' => 'qqnr2dN4p/HmaEA/CJuVGo7dv5g=', // Valor Resumen
            ],
            'user' => [
                'header'     => 'Telf: <b>(01) 123375</b>', // Texto que se ubica debajo de la dirección de empresa
                'extras'     => [
                    // Leyendas adicionales
                    ['name' => 'CONDICION DE PAGO', 'value' => 'Efectivo'],
                    ['name' => 'VENDEDOR', 'value' => 'GITHUB SELLER'],
                ],
                'footer' => '<p>Nro Resolucion: <b>3232323</b></p>'
            ]
        ];

        return $report->render($invoice, $params);
    }

    public function getHtmlReportTicket($invoice,$id_user)
    {
        // 1. Directorio donde hemos colocado custom_ticket.html.twig
        $templatesDir = base_path('templates');

        // 2. Creamos el reporte indicando nuestro directorio de Twig
        $report = new HtmlReport($templatesDir);
        // 3. Le decimos exactamente qué plantilla usar
        $report->setTemplate('ticket.html.twig');

        // 4. Cargamos datos de la empresa según RUC y usuario
        $ruc = $invoice->getCompany()->getRuc();
        $company = ModelsCompany::where('ruc', $ruc)
            ->where('id_user', $id_user)
            ->firstOrFail();

        // 5. Leemos el logo y lo codificamos en base64
        $filename    = basename($company->logo_url);

        // 6. Preparamos todos los parámetros para la plantilla
        $params = [
            'system'  => [
                'logo' => Storage::disk('logos')->get($filename),
                'hash' => 'qqnr2dN4p/HmaEA/CJuVGo7dv5g=', // Valor Resumen
            ],
            'company' => [
                'name'    => 'test',
                'address' => 'test@gmail.com',
                'phone'   => '(01) 123375',
            ],
            'user'    => [
                'header' => 'Telf: <b>(01) 123375</b>',
                'extras' => [
                    ['name' => 'CONDICION DE PAGO', 'value' => 'Efectivo'],
                    ['name' => 'VENDEDOR',          'value' => 'GITHUB SELLER'],
                ],
                'footer' => '<p>Nro Resolucion: <b>3232323</b></p>',
            ],
        ];

        // 7. Renderizamos y devolvemos el HTML listo para impresión térmica
        return $report->render($invoice, $params);
    }
};