// URLs del backend principal y facturador
import { API_URL, FACTURADOR_API_URL } from "../config/api"
import { DateTime } from "luxon"

// Helper: asegurar formato Bearer SIEMPRE
const getAuthHeader = (token: string) => (token.startsWith("Bearer ") ? token : `Bearer ${token}`)

// Interfaz para la respuesta de SUNAT
export interface SunatResponse {
  success: boolean
  cdrDescription?: string
  error?: string
}

// Interfaz para la respuesta del envío de factura
export interface InvoiceSendResponse {
  xml: string
  hash: string
  sunatResponse: SunatResponse
}

// Modificar la interfaz InvoiceData para incluir el campo descuentoGlobal
export interface InvoiceData {
  ublVersion: string
  tipoDoc: string // "01" para Factura, "03" para Boleta
  tipoOperacion: string
  serie: string // F001 para Factura, B001 para Boleta
  correlativo: string
  fechaEmision: string
  formaPago: {
    moneda: string
    tipo: string
  }
  tipoMoneda: string
  company: {
    ruc: number
    razonSocial: string
    nombreComercial: string
    address: {
      ubigueo: string
      departamento: string
      provincia: string
      distrito: string
      urbanizacion: string
      direccion: string
      codLocal: string
    }
  }
  client: {
    tipoDoc: string // "6" para RUC, "1" para DNI
    numDoc: number
    rznSocial: string
  }
  details: Array<{
    tipAfeIgv: number
    codProducto: string
    unidad: string
    descripcion: string
    cantidad: number
    mtoValorUnitario: number
    mtoValorVenta: number
    mtoBaseIgv: number
    porcentajeIgv: number
    igv: number
    totalImpuestos: number
    mtoPrecioUnitario: number
    factorIcbper?: number
    icbper?: number
  }>
  // Nuevos campos para series y correlativo
  serieFactura?: string
  correlativoFactura?: number
  serieBoleta?: string
  correlativoBoleta?: number
  // Nuevo campo para descuento global
  descuentoGlobal?: number
}

// Interfaz para respuesta de consulta de cliente
export interface ClienteConsultaResponse {
  // Campos comunes
  tipoDocumento: string
  numeroDocumento: string
  // Campos para RUC
  razonSocial?: string
  estado?: string
  condicion?: string
  direccion?: string
  ubigeo?: string
  distrito?: string
  provincia?: string
  departamento?: string
  // Campos para DNI
  nombre?: string
  nombres?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
}

// Función para consultar RUC
export const consultarRuc = async (ruc: string): Promise<ClienteConsultaResponse> => {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("No se encontró token de autenticación")
  }

  const response = await fetch(`${API_URL}/ruc/${ruc}`, {
    headers: {
      Accept: "application/json",
      Authorization: getAuthHeader(token),
    },
  })

  if (!response.ok) {
    throw new Error(`Error al consultar RUC: ${response.statusText}`)
  }

  const data = await response.json()
  console.log("Datos RUC recibidos:", data)

  return {
    tipoDocumento: "6",
    numeroDocumento: ruc,
    razonSocial: data.razon_social,
    direccion: data.direccion,
    estado: data.estado,
    condicion: data.condicion,
  }
}

// Función para consultar DNI
export const consultarDni = async (dni: string): Promise<ClienteConsultaResponse> => {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("No se encontró token de autenticación")
  }

  const response = await fetch(`${API_URL}/dni/${dni}`, {
    headers: {
      Accept: "application/json",
      Authorization: getAuthHeader(token),
    },
  })

  if (!response.ok) {
    throw new Error(`Error al consultar DNI: ${response.statusText}`)
  }

  const data = await response.json()
  console.log("Datos DNI recibidos:", data)

  return {
    tipoDocumento: "1",
    numeroDocumento: dni,
    nombre: data.full_name,
    apellidoPaterno: data.first_last_name,
    apellidoMaterno: data.second_last_name,
    nombres: data.first_name,
  }
}

// Función para validar los datos de la factura
export const validateInvoiceData = (data: InvoiceData): boolean => {
  for (const detail of data.details) {
    if (
      !detail.cantidad ||
      detail.cantidad <= 0 ||
      !detail.mtoValorUnitario ||
      detail.mtoValorUnitario <= 0 ||
      !detail.mtoValorVenta ||
      detail.mtoValorVenta <= 0 ||
      !detail.mtoPrecioUnitario ||
      detail.mtoPrecioUnitario <= 0
    ) {
      return false
    }
  }
  return true
}

// Enviar factura a SUNAT
export const sendInvoiceToSunat = async (invoiceData: InvoiceData, ventaId?: number): Promise<InvoiceSendResponse> => {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("No se encontró token de autenticación")
  }

  if (!validateInvoiceData(invoiceData)) {
    throw new Error(
      "Los datos de la factura contienen valores inválidos. Verifica que todos los precios y cantidades sean mayores a cero.",
    )
  }

  try {
    const requestData = {
      ...invoiceData,
      is_sales_user: true,
    }

    const response = await fetch(`${FACTURADOR_API_URL}/invoices/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: getAuthHeader(token),
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || ""

      if (contentType.includes("text/html")) {
        const htmlText = await response.text()
        let errorMessage = "Error al enviar factura a SUNAT"

        if (htmlText.includes("404 Not Found")) {
          errorMessage = "Servicio de facturación no encontrado (404). Verifique que el servicio esté activo."
        } else if (htmlText.includes("500 Internal Server Error")) {
          errorMessage = "Error interno en el servidor de facturación (500)."
        } else if (htmlText.includes("403 Forbidden")) {
          errorMessage = "Acceso denegado al servicio de facturación (403)."
        }

        if (ventaId) {
          try {
            await updateComprobanteStatus(ventaId, false)
          } catch (updateError) {
            console.error("Error al actualizar estado del comprobante:", updateError)
          }
        }

        throw new Error(errorMessage)
      }

      try {
        const errorData = await response.json()

        if (ventaId) {
          try {
            await updateComprobanteStatus(ventaId, false)
          } catch (updateError) {
            console.error("Error al actualizar estado del comprobante:", updateError)
          }
        }

        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      } catch (jsonError) {
        if (ventaId) {
          try {
            await updateComprobanteStatus(ventaId, false)
          } catch (updateError) {
            console.error("Error al actualizar estado del comprobante:", updateError)
          }
        }

        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
    }

    const data = await response.json()

    if (ventaId) {
      try {
        await updateComprobanteStatus(ventaId, data.sunatResponse?.success || false, data)
      } catch (updateError) {
        console.error("Error al actualizar estado del comprobante:", updateError)
      }
    }

    return data
  } catch (error: any) {
    if (ventaId) {
      try {
        await updateComprobanteStatus(ventaId, false)
      } catch (updateError) {
        console.error("Error al actualizar estado del comprobante:", updateError)
      }
    }

    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      throw new Error("No se pudo conectar al servicio de facturación. Verifique que el servicio esté activo y accesible.")
    }

    throw error
  }
}

// Obtener PDF de factura
export const getInvoicePdf = async (invoiceData: InvoiceData): Promise<Blob | string> => {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("No se encontró token de autenticación")
  }

  if (!validateInvoiceData(invoiceData)) {
    throw new Error(
      "Los datos de la factura contienen valores inválidos. Verifica que todos los precios y cantidades sean mayores a cero.",
    )
  }

  try {
    const requestData = {
      ...invoiceData,
      is_sales_user: true,
    }

    const response = await fetch(`${FACTURADOR_API_URL}/invoices/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: getAuthHeader(token),
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || ""

      if (contentType.includes("text/html")) {
        const htmlText = await response.text()
        let errorMessage = "Error al obtener el PDF de la factura"

        if (htmlText.includes("404 Not Found")) {
          errorMessage = "Servicio de generación de PDF no encontrado (404). Verifique que el servicio esté activo."
        } else if (htmlText.includes("500 Internal Server Error")) {
          errorMessage = "Error interno en el servidor al generar PDF (500)."
        }

        throw new Error(errorMessage)
      }

      try {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      } catch (jsonError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
    }

    const contentType = response.headers.get("content-type")

    if (contentType && contentType.includes("application/pdf")) {
      return await response.blob()
    } else if (contentType && contentType.includes("application/json")) {
      const jsonResponse = await response.json()

      if (jsonResponse.success && jsonResponse.data && jsonResponse.data.html) {
        const htmlContent = jsonResponse.data.html
        const enhancedHtml = enhanceTicketHtml(htmlContent)
        return enhancedHtml
      } else {
        throw new Error(jsonResponse.message || "Error al obtener el HTML de la factura")
      }
    } else if (contentType && contentType.includes("text/html")) {
      const htmlContent = await response.text()
      const enhancedHtml = enhanceTicketHtml(htmlContent)
      return enhancedHtml
    } else {
      const text = await response.text()
      return text
    }
  } catch (error: any) {
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      throw new Error("No se pudo conectar al servicio de generación de PDF. Verifique que el servicio esté activo y accesible.")
    }
    throw error
  }
}

// Función para mejorar el HTML del ticket para impresión térmica
export const enhanceTicketHtml = (html: string): string => {
  if (!html.includes("@page") && !html.includes("@media print")) {
    const styleTag = `
    <style>
      @page {
        size: 80mm auto;
        margin: 0;
      }
      
      body {
        width: 80mm;
        margin: 0;
        padding: 0;
      }
    </style>
    `

    html = html.replace("</head>", `${styleTag}</head>`)

    if (!html.includes("<head>")) {
      html = `<!DOCTYPE html>
<html>
<head>
${styleTag}
</head>
<body>
${html}
</body>
</html>`
    }
  }

  return html
}

// Agregar una función para verificar la disponibilidad del servicio de facturación
export const checkFacturadorService = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${FACTURADOR_API_URL}/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    })

    return response.ok
  } catch (error) {
    return false
  }
}

// Nueva función para obtener el PDF del documento exacto enviado a SUNAT
export const getInvoicePdfFromSunatResponse = async (
  invoiceData: InvoiceData,
  sunatResponse: InvoiceSendResponse,
): Promise<Blob | string> => {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("No se encontró token de autenticación")
  }

  try {
    const requestData = {
      ...invoiceData,
      is_sales_user: true,
      sunat_xml: sunatResponse.xml,
      sunat_hash: sunatResponse.hash,
      sunat_success: sunatResponse.sunatResponse.success,
      sunat_cdr_description: sunatResponse.sunatResponse.cdrDescription,
      use_sent_document: true,
    }

    const response = await fetch(`${FACTURADOR_API_URL}/invoices/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: getAuthHeader(token),
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || ""

      if (contentType.includes("text/html")) {
        const htmlText = await response.text()
        let errorMessage = "Error al obtener el PDF del documento enviado a SUNAT"

        if (htmlText.includes("404 Not Found")) {
          errorMessage = "Servicio de generación de PDF no encontrado (404). Verifique que el servicio esté activo."
        } else if (htmlText.includes("500 Internal Server Error")) {
          errorMessage = "Error interno en el servidor al generar PDF del documento enviado (500)."
        }

        throw new Error(errorMessage)
      }

      try {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
      } catch (jsonError) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
    }

    const contentType = response.headers.get("content-type")

    if (contentType && contentType.includes("application/pdf")) {
      return await response.blob()
    } else if (contentType && contentType.includes("application/json")) {
      const jsonResponse = await response.json()

      if (jsonResponse.success && jsonResponse.data && jsonResponse.data.html) {
        const htmlContent = jsonResponse.data.html
        const enhancedHtml = enhanceTicketHtml(htmlContent)
        return enhancedHtml
      } else {
        throw new Error(jsonResponse.message || "Error al obtener el HTML del documento enviado a SUNAT")
      }
    } else if (contentType && contentType.includes("text/html")) {
      const htmlContent = await response.text()
      const enhancedHtml = enhanceTicketHtml(htmlContent)
      return enhancedHtml
    } else {
      const text = await response.text()
      return text
    }
  } catch (error: any) {
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      throw new Error(
        "No se pudo conectar al servicio de generación de PDF del documento enviado. Verifique que el servicio esté activo y accesible.",
      )
    }

    throw error
  }
}

export const updateComprobanteStatus = async (ventaId: number, success: boolean, sunatData?: any): Promise<void> => {
  const token = localStorage.getItem("token")

  if (!token) {
    throw new Error("No se encontró token de autenticación")
  }

  try {
    const response = await fetch(`${API_URL}/ventas/actualizar-comprobante/${ventaId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(token),
      },
      body: JSON.stringify({
        comprobante_emitido: success,
        sunat_data: sunatData || null,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error al actualizar estado del comprobante: ${response.statusText}`)
    }
  } catch (error) {
    console.error("Error al actualizar estado del comprobante:", error)
    throw error
  }
}

// Función para preparar los datos de la factura
export const prepareInvoiceData = (
  sale: any,
  company: any,
  tipoDocumento: string,
  cliente: ClienteConsultaResponse | null,
  series: { facturaActual: number; boletaActual: number },
  nuevoCorrelativo?: number,
): InvoiceData => {
  let fechaEmision = ""
  try {
    let dateTime
    if (sale.fecha.includes('T')) {
      dateTime = DateTime.fromISO(sale.fecha)
    } else {
      const isoDateString = sale.fecha.replace(' ', 'T')
      dateTime = DateTime.fromISO(isoDateString)
    }

    if (dateTime.isValid) {
      fechaEmision = dateTime.setZone("America/Lima").toISO({ suppressMilliseconds: true }) ?? ""
    } else {
      console.warn('No se pudo parsear la fecha de la venta:', sale.fecha, 'usando fecha actual')
      fechaEmision = DateTime.now().setZone("America/Lima").toISO({ suppressMilliseconds: true }) ?? ""
    }
  } catch (error) {
    console.error('Error al procesar fecha de venta:', error, 'fecha:', sale.fecha)
    fechaEmision = DateTime.now().setZone("America/Lima").toISO({ suppressMilliseconds: true }) ?? ""
  }

  let serie, correlativo

  if (sale.serie) {
    serie = sale.serie
  } else {
    if (tipoDocumento === "01") {
      serie = "F001"
    } else {
      serie = "B001"
    }
  }

  if (sale.correlativo) {
    correlativo = String(sale.correlativo).padStart(8, "0")
  } else if (nuevoCorrelativo) {
    correlativo = String(nuevoCorrelativo).padStart(8, "0")
  } else {
    if (tipoDocumento === "01") {
      correlativo = String(series.facturaActual).padStart(8, "0")
    } else {
      correlativo = String(series.boletaActual).padStart(8, "0")
    }
  }

  const details = sale.items.map((item: any) => {
    const precioUnitario = Math.max(0.01, Number.parseFloat(item.precio_unitario_con_igv) || 0.01)
    const cantidad = Math.max(0.01, item.cantidad || 0.01)
    const valorUnitario = Math.max(0.01, precioUnitario / 1.18)
    const valorVenta = Math.max(0.01, valorUnitario * cantidad)
    const igv = Math.max(0.01, valorVenta * 0.18)

    return {
      tipAfeIgv: 10,
      codProducto: item.producto_id.toString(),
      unidad: "NIU",
      descripcion: item.nombre || "Producto",
      cantidad: Number(cantidad.toFixed(2)),
      mtoValorUnitario: Number(valorUnitario.toFixed(2)),
      mtoValorVenta: Number(valorVenta.toFixed(2)),
      mtoBaseIgv: Number(valorVenta.toFixed(2)),
      porcentajeIgv: 18,
      igv: Number(igv.toFixed(2)),
      totalImpuestos: Number(igv.toFixed(2)),
      mtoPrecioUnitario: Number(precioUnitario.toFixed(2)),
    }
  })

  const clientData = {
    tipoDoc: tipoDocumento === "01" ? "6" : "1",
    numDoc: 0,
    rznSocial: "CLIENTE GENERAL",
  }

  if (sale.cliente_numero_documento && sale.cliente_nombre) {
    clientData.numDoc = Number(sale.cliente_numero_documento)
    clientData.rznSocial = sale.cliente_nombre
    clientData.tipoDoc = sale.cliente_tipo_documento || (tipoDocumento === "01" ? "6" : "1")
  } else if (cliente) {
    clientData.numDoc = Number(cliente.numeroDocumento)
    if (tipoDocumento === "01") {
      clientData.rznSocial = cliente.razonSocial || "CLIENTE GENERAL"
    } else {
      clientData.rznSocial =
        cliente.nombre ||
        `${cliente.apellidoPaterno || ""} ${cliente.apellidoMaterno || ""} ${cliente.nombres || ""}`.trim()
    }
  }

  const invoiceData: InvoiceData = {
    ublVersion: "2.1",
    tipoDoc: tipoDocumento,
    tipoOperacion: "0101",
    serie,
    correlativo,
    fechaEmision,
    formaPago: {
      moneda: "PEN",
      tipo: "Contado",
    },
    tipoMoneda: "PEN",
    company: {
      ruc: Number(company.ruc),
      razonSocial: company.razon_social || "EMPRESA",
      nombreComercial: company.razon_social || "EMPRESA",
      address: {
        ubigueo: "150101",
        departamento: "AREQUIPA",
        provincia: "AREQUIPA",
        distrito: "AREQUIPA",
        urbanizacion: "-",
        direccion: company.direccion || "DIRECCIÓN NO ESPECIFICADA",
        codLocal: "0000",
      },
    },
    client: clientData,
    details,
    serieFactura: "F001",
    correlativoFactura: series.facturaActual,
    serieBoleta: "B001",
    correlativoBoleta: series.boletaActual,
  }

  if (sale.es_descuento && sale.descuento) {
    invoiceData.descuentoGlobal = Number(((Number(sale.descuento) || 0) / 1.18).toFixed(2))
  } else if (sale.descuento && Number(sale.descuento) > 0) {
    invoiceData.descuentoGlobal = Number(((Number(sale.descuento) || 0) / 1.18).toFixed(2))
  }

  if (sale.descuentoGlobal) {
    invoiceData.descuentoGlobal = Number(((Number(sale.descuentoGlobal) || 0) / 1.18).toFixed(2))
  }

  return invoiceData
}

// Función para obtener el último correlativo
export const getLastCorrelativo = async (tipoDocumento: string): Promise<number> => {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No hay token de autenticación")
    }

    const tipoDocBackend = tipoDocumento === "01" ? "1" : "3"

    const response = await fetch(`${API_URL}/ventas/ultimo-correlativo/${tipoDocBackend}`, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(token),
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al obtener el último correlativo")
    }

    const data = await response.json()
    return data.correlativo
  } catch (error) {
    return 0
  }
}

// Función para detectar dispositivos móviles o con poca memoria
export const isMobileOrLowEndDevice = (): boolean => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
  const hasSlowConnection = (navigator as any).connection &&
    ((navigator as any).connection.effectiveType === 'slow-2g' ||
     (navigator as any).connection.effectiveType === '2g' ||
     (navigator as any).connection.effectiveType === '3g')

  return isMobile || hasLowMemory || hasSlowConnection
}

// Función para limpiar la caché y liberar memoria
export const clearMemoryCache = (): void => {
  try {
    if ((window as any).gc) {
      (window as any).gc()
    }
    const canvases = document.querySelectorAll('canvas[data-temp="true"]')
    canvases.forEach(canvas => canvas.remove())
  } catch (error) {
    console.warn('No se pudo limpiar la caché de memoria:', error)
  }
}

// Función para convertir HTML a PDF
export const convertHtmlToPdf = async (htmlContent: string): Promise<Blob> => {
  try {
    console.log('🔄 Iniciando conversión HTML a PDF...')
    clearMemoryCache()

    const timeoutMs = 60000

    const conversionPromise = new Promise<Blob>((resolve, reject) => {
      (async () => {
        try {
          console.log('📚 Cargando librerías...')
          const [jsPDFModule, html2canvasModule] = await Promise.all([
            import("jspdf"),
            import("html2canvas"),
          ])
          const { jsPDF } = jsPDFModule
          const html2canvas = html2canvasModule.default

          console.log('✅ Librerías cargadas correctamente')
          console.log('🎨 Procesando HTML...')

          let processedHtml = htmlContent
          const basicStyles = `
        <style>
          * {
            color: black !important;
            background-color: white !important;
            font-family: 'Courier New', monospace !important;
          }
          body {
            margin: 0;
            padding: 2mm;
            width: 76mm;
            background: white;
          }
        </style>`

          if (processedHtml.includes("<head>")) {
            processedHtml = processedHtml.replace("</head>", basicStyles + "</head>")
          } else {
            processedHtml = `<!DOCTYPE html><html><head>${basicStyles}</head><body>${processedHtml}</body></html>`
          }

          const container = document.createElement("div")
          container.innerHTML = processedHtml
          container.style.position = "absolute"
          container.style.left = "-9999px"
          container.style.top = "0"
          container.style.width = "76mm"
          container.style.backgroundColor = "white"
          container.style.color = "black"
          container.style.fontFamily = "Courier New, monospace"
          container.style.fontSize = "11px"
          container.style.lineHeight = "1.2"
          container.style.padding = "2mm"
          container.style.margin = "0"
          container.style.boxSizing = "border-box"
          container.style.overflow = "visible"
          container.setAttribute('data-temp', 'true')
          document.body.appendChild(container)

          await new Promise(r => setTimeout(r, 200))
          console.log('📸 Capturando con html2canvas...')

          const canvasOptions = {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: "white",
            width: 76 * 3.78,
            height: container.scrollHeight || container.offsetHeight,
            scrollX: 0,
            scrollY: 0,
            imageTimeout: 10000,
            removeContainer: true,
          }

          console.log('🎯 Renderizando canvas...')
          const canvas = await html2canvas(container, canvasOptions)
          document.body.removeChild(container)

          console.log('📄 Creando PDF...')
          const imgData = canvas.toDataURL("image/jpeg", 0.9)
          const pdfWidth = 76
          const pdfHeight = Math.max((canvas.height * pdfWidth) / canvas.width, 50)
          const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfWidth, pdfHeight], compress: true })
          pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight)
          canvas.remove()
          clearMemoryCache()
          console.log('✅ PDF generado correctamente')
          resolve(pdf.output("blob"))
        } catch (error) {
          console.error('❌ Error en conversión:', error)
          reject(new Error("Error en conversión: " + (((error as Error).message) || "Error desconocido")))
        }
      })()
    })

    console.log(`⏱️ Iniciando conversión con timeout de ${timeoutMs/1000}s...`)
    const result = await Promise.race([
      conversionPromise,
      new Promise<Blob>((_, reject) => setTimeout(() => reject(new Error('Timeout: La conversión tardó demasiado tiempo')), timeoutMs)),
    ])

    console.log('🎉 Conversión completada exitosamente')
    return result
  } catch (error) {
    console.error('💥 Error general en convertHtmlToPdf:', error)
    clearMemoryCache()
    const tempContainers = document.querySelectorAll('[data-temp="true"]')
    tempContainers.forEach(container => container.remove())
    throw new Error("Error al convertir HTML a PDF: " + (((error as Error).message) || "Error desconocido"))
  }
}

// Función de fallback para generar PDF simple
export const generateSimplePdf = async (htmlContent: string): Promise<Blob> => {
  try {
    console.log('🔄 Generando PDF simple como fallback...')

    const { jsPDF } = await import("jspdf")

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [76, 200],
      compress: true
    })

    const textContent = htmlContent
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()

    const lines = textContent.split('\n').filter(line => line.trim())

    let yPosition = 10
    const lineHeight = 5
    const maxWidth = 70

    lines.forEach(line => {
      if (yPosition > 190) {
        pdf.addPage()
        yPosition = 10
      }

      const wrappedLines = pdf.splitTextToSize(line, maxWidth)
      wrappedLines.forEach((wrappedLine: string) => {
        pdf.text(wrappedLine, 3, yPosition)
        yPosition += lineHeight
      })
    })

    console.log('✅ PDF simple generado correctamente')
    return pdf.output("blob")

  } catch (error) {
    console.error('❌ Error en PDF simple:', error)
    throw new Error("No se pudo generar PDF simple: " + ((error as Error).message || "Error desconocido"))
  }
}
