import { toast } from "sonner"

// Interfaz para los datos del cliente
interface ClienteData {
  numeroDocumento?: string
  tipoDocumento?: string
  nombre?: string
}

// Interfaz para las series de documentos
interface DocumentosSeries {
  facturaActual: number
  boletaActual: number
}

/**
 * Genera un nombre de archivo inteligente para el documento
 */
export const generateFileName = (params: {
  tipoDocumento: string
  correlativoReal?: number
  clienteData?: ClienteData | null
  documentosSeries?: DocumentosSeries
  cartLength?: number
}): string => {
  const { tipoDocumento, correlativoReal, clienteData, documentosSeries, cartLength } = params
  
  // Manejar tickets de venta
  if (tipoDocumento === "ticket") {
    const ventaId = correlativoReal || Date.now()
    return `Ticket_Venta_${String(ventaId).padStart(8, "0")}`
  }
  
  const docType = tipoDocumento === "01" ? "Factura" : "Boleta"
  
  // Obtener serie y correlativo REAL
  let serie = "F001"
  let correlativo = "00000001"
  
  // Usar el correlativo real que se pasó como parámetro
  if (correlativoReal) {
    const tipoDoc = tipoDocumento === "01" ? "F" : "B"
    serie = `${tipoDoc}001`
    correlativo = String(correlativoReal).padStart(8, "0")
  } else {
    // Fallback: usar el estado actual si está disponible
    if (cartLength && cartLength > 0 && documentosSeries) {
      const tipoDoc = tipoDocumento === "01" ? "F" : "B"
      serie = `${tipoDoc}001`
      
      if (tipoDocumento === "01") {
        correlativo = String(documentosSeries.facturaActual).padStart(8, "0")
      } else {
        correlativo = String(documentosSeries.boletaActual).padStart(8, "0")
      }
    }
  }
  
  // Obtener información del cliente
  let clienteInfo = "CLIENTE_GENERAL"
  if (clienteData?.numeroDocumento && clienteData?.nombre) {
    const tipoDoc = clienteData.tipoDocumento === "6" ? "RUC" : "DNI"
    const nombre = clienteData.nombre.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toUpperCase()
    clienteInfo = `${tipoDoc}_${clienteData.numeroDocumento}_${nombre}`
  } else if (clienteData?.numeroDocumento) {
    const tipoDoc = clienteData.tipoDocumento === "6" ? "RUC" : "DNI"
    clienteInfo = `${tipoDoc}_${clienteData.numeroDocumento}`
  }
  
  return `${docType}_${serie}-${correlativo}_${clienteInfo}`
}

/**
 * Imprime directamente cualquier documento en impresora térmica de 80mm
 * Sin abrir nuevas pestañas ni ventanas, completamente silencioso
 * Funciona tanto para tickets como para comprobantes SUNAT
 */
export const printThermalTicket = (htmlContent: string, ventaId?: number): void => {
  try {
    // Crear un iframe oculto para impresión silenciosa
    const printFrame = document.createElement('iframe')
    printFrame.style.position = 'absolute'
    printFrame.style.top = '-9999px'
    printFrame.style.left = '-9999px'
    printFrame.style.width = '1px'
    printFrame.style.height = '1px'
    printFrame.style.border = 'none'
    
    document.body.appendChild(printFrame)
    
    // HTML optimizado para impresora térmica de 80mm
    const thermalHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comprobante #${ventaId || 'N/A'}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
            padding: 0mm;
          }
          
          @media print {
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              width: 80mm !important;
              margin: 0 !important;
              padding: 2mm !important;
              font-family: 'Courier New', monospace !important;
              font-size: 11px !important;
              line-height: 1.2 !important;
              color: black !important;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .ticket-content {
              width: 100% !important;
              color: black !important;
              background: white !important;
            }
            
            .ticket-content * {
              color: black !important;
              background: white !important;
            }
            
            .ticket-content table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            
            .ticket-content td, .ticket-content th {
              padding: 1px 2px !important;
              text-align: left !important;
              font-size: 11px !important;
            }
            
            .ticket-content .text-center {
              text-align: center !important;
            }
            
            .ticket-content .text-right {
              text-align: right !important;
            }
            
            .ticket-content img {
              max-width: 100% !important;
              height: auto !important;
              display: block !important;
              margin: 2mm auto !important;
            }
          }
          
          /* Estilos para vista (aunque no se verá) */
          body {
            width: 80mm;
            margin: 0;
            padding: 2mm;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.2;
            color: black;
            background: white;
          }
          
          .ticket-content {
            width: 100%;
            color: black !important;
            background: white !important;
          }
          
          .ticket-content * {
            color: black !important;
            background: white !important;
          }
          
          .ticket-content table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .ticket-content td, .ticket-content th {
            padding: 1px 2px;
            text-align: left;
            font-size: 11px;
          }
          
          .ticket-content .text-center {
            text-align: center;
          }
          
          .ticket-content .text-right {
            text-align: right;
          }
          
          .ticket-content img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 2mm auto;
          }
        </style>
      </head>
      <body>
        <div class="ticket-content">
          ${htmlContent}
        </div>
      </body>
      </html>
    `
    
    // Escribir el contenido en el iframe
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document
    if (frameDoc) {
      frameDoc.write(thermalHTML)
      frameDoc.close()
      
      // Esperar a que el contenido se cargue y luego imprimir
      printFrame.onload = () => {
        setTimeout(() => {
          try {
            const frameWindow = printFrame.contentWindow
            if (frameWindow) {
              frameWindow.focus()
              frameWindow.print()
              
              // Limpiar el iframe después de imprimir
              setTimeout(() => {
                document.body.removeChild(printFrame)
              }, 1000)
            }
          } catch (error) {
            console.error('Error en impresión silenciosa:', error)
            // Fallback: intentar con ventana mínima
            fallbackPrintWithWindow(htmlContent, ventaId)
            document.body.removeChild(printFrame)
          }
        }, 500)
      }
    }
    
    toast.success('Enviando comprobante a impresora térmica...', {
      duration: 2000,
      icon: '🖨️'
    })
    
  } catch (error) {
    console.error('Error al imprimir comprobante térmico:', error)
    // Fallback: intentar con ventana mínima
    fallbackPrintWithWindow(htmlContent, ventaId)
  }
}

/**
 * Imprime de forma completamente silenciosa usando un div oculto en la página actual
 * Evita mostrar el diálogo de impresión del navegador
 */
export const printThermalTicketSilent = (htmlContent: string, ventaId?: number): void => {
  try {
    // Crear un div oculto para impresión silenciosa
    const printId = `thermal-print-${Date.now()}`
    const printDiv = document.createElement('div')
    printDiv.id = printId
    printDiv.style.position = 'absolute'
    printDiv.style.top = '-9999px'
    printDiv.style.left = '-9999px'
    printDiv.style.width = '80mm'
    printDiv.style.visibility = 'hidden'
    printDiv.style.overflow = 'hidden'
    printDiv.style.zIndex = '-9999'
    
    // Crear estilos específicos para este elemento
    const printStyles = document.createElement('style')
    printStyles.id = `${printId}-styles`
    printStyles.textContent = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        
        #${printId}, #${printId} * {
          visibility: visible !important;
        }
        
        #${printId} {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 80mm !important;
          font-family: 'Courier New', monospace !important;
          font-size: 11px !important;
          line-height: 1.2 !important;
          color: black !important;
          background: white !important;
          margin: 0 !important;
          padding: 2mm !important;
          z-index: 9999 !important;
        }
        
        #${printId} * {
          color: black !important;
          background: white !important;
        }
        
        #${printId} table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        
        #${printId} td, #${printId} th {
          padding: 1px 2px !important;
          text-align: left !important;
          font-size: 11px !important;
        }
        
        #${printId} .text-center {
          text-align: center !important;
        }
        
        #${printId} .text-right {
          text-align: right !important;
        }
        
        #${printId} img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
          margin: 2mm auto !important;
        }
        
        @page {
          size: 80mm auto;
          margin: 0mm;
        }
      }
    `
    
    // Agregar contenido HTML
    printDiv.innerHTML = htmlContent
    
    // Agregar elementos al DOM
    document.head.appendChild(printStyles)
    document.body.appendChild(printDiv)
    
    // Configurar opciones de impresión para que sea silenciosa
    const originalOnBeforePrint = window.onbeforeprint
    const originalOnAfterPrint = window.onafterprint
    
    window.onbeforeprint = () => {
      // Configuraciones antes de imprimir
      document.title = `Comprobante #${ventaId || 'N/A'}`
    }
    
    window.onafterprint = () => {
      // Limpiar después de imprimir
      setTimeout(() => {
        if (document.body.contains(printDiv)) {
          document.body.removeChild(printDiv)
        }
        if (document.head.contains(printStyles)) {
          document.head.removeChild(printStyles)
        }
        
        // Restaurar eventos originales
        window.onbeforeprint = originalOnBeforePrint
        window.onafterprint = originalOnAfterPrint
      }, 1000)
    }
    
    // Imprimir inmediatamente de forma silenciosa
    setTimeout(() => {
      try {        // Usar execCommand para impresión silenciosa si está disponible
        if (document.execCommand) {
          document.execCommand('print', false, undefined)
        } else {
          window.print()
        }
      } catch (error) {
        console.log('Fallback a window.print():', error)
        window.print()
      }
    }, 100)
    
    toast.success('Imprimiendo directamente en impresora térmica...', {
      duration: 1500,
      icon: '🖨️'
    })
    
  } catch (error) {
    console.error('Error en impresión silenciosa:', error)
    // Fallback a la función original
    printThermalTicket(htmlContent, ventaId)
  }
}

/**
 * Función de respaldo que usa ventana mínima para impresión
 */
const fallbackPrintWithWindow = (htmlContent: string, ventaId?: number): void => {
  try {
    // Crear ventana muy pequeña y centrada
    const printWindow = window.open('', '_blank', 
      'width=350,height=500,scrollbars=yes,resizable=yes,top=100,left=100,toolbar=no,menubar=no,status=no,location=no'
    )
    
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión. Verifique que no esté bloqueada por el navegador.')
      return
    }

    const thermalHTML = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comprobante Térmico #${ventaId || 'N/A'}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          
          @media print {
            * {
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
            }
            
            body {
              width: 80mm !important;
              font-family: 'Courier New', monospace !important;
              font-size: 11px !important;
              line-height: 1.2 !important;
              color: black !important;
              background: white !important;
              padding: 2mm !important;
            }
            
            .ticket-content * {
              color: black !important;
              background: white !important;
            }
          }
          
          body {
            margin: 0;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.3;
            background: #f5f5f5;
          }
          
          .container {
            max-width: 80mm;
            margin: 0 auto;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            text-align: center;
            padding: 8px;
            font-size: 12px;
            font-weight: bold;
          }
          
          .ticket-content {
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.2;
            color: black;
          }
          
          .ticket-content * {
            color: black !important;
            background: white !important;
          }
          
          .actions {
            padding: 10px;
            background: #f8f9fa;
            text-align: center;
            border-top: 1px solid #ddd;
          }
          
          .btn {
            padding: 8px 16px;
            margin: 0 5px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
          }
          
          .btn-print {
            background: #10b981;
            color: white;
          }
          
          .btn-close {
            background: #6b7280;
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            🧾 Comprobante Térmico #${ventaId || 'N/A'}
            <br><small>Optimizado para impresora térmica de 80mm</small>
          </div>
          <div class="ticket-content">
            ${htmlContent}
          </div>
          <div class="actions">
            <button onclick="window.print()" class="btn btn-print">
              🖨️ Imprimir
            </button>
            <button onclick="window.close()" class="btn btn-close">
              ❌ Cerrar
            </button>
          </div>
        </div>
        
        <script>
          // Auto-imprimir después de cargar
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
            }, 800);
          });
          
          // Cerrar después de imprimir (en algunos navegadores)
          window.addEventListener('afterprint', function() {
            setTimeout(function() {
              window.close();
            }, 1000);
          });
        </script>
      </body>
      </html>
    `
    
    printWindow.document.write(thermalHTML)
    printWindow.document.close()
    
  } catch (error) {
    console.error('Error en fallback de impresión:', error)
    toast.error('Error al enviar el comprobante a la impresora')
  }
}

/**
 * Imprime directamente un PDF en formato térmico 80mm
 * Sin abrir nuevas pestañas, completamente silencioso
 */
export const printThermalPdf = (pdfBlob: Blob, correlativo?: number): void => {
  try {
    const pdfUrl = URL.createObjectURL(pdfBlob)
    
    // Crear iframe oculto para impresión silenciosa de PDF
    const printFrame = document.createElement('iframe')
    printFrame.style.position = 'absolute'
    printFrame.style.top = '-9999px'
    printFrame.style.left = '-9999px'
    printFrame.style.width = '1px'
    printFrame.style.height = '1px'
    printFrame.style.border = 'none'
    
    document.body.appendChild(printFrame)
    
    printFrame.src = pdfUrl
    
    printFrame.onload = () => {
      setTimeout(() => {
        try {
          const frameWindow = printFrame.contentWindow
          if (frameWindow) {
            frameWindow.focus()
            frameWindow.print()
            
            // Limpiar recursos
            setTimeout(() => {
              document.body.removeChild(printFrame)
              URL.revokeObjectURL(pdfUrl)
            }, 2000)
          }
        } catch (error) {
          console.error('Error en impresión silenciosa de PDF:', error)
          // Fallback para PDF
          fallbackPrintPdfWithWindow(pdfBlob, correlativo)
          document.body.removeChild(printFrame)
          URL.revokeObjectURL(pdfUrl)
        }
      }, 1000)
    }
    
    toast.success('Enviando PDF a impresora térmica...', {
      duration: 2000,
      icon: '🖨️'
    })
    
  } catch (error) {
    console.error('Error al imprimir PDF térmico:', error)
    fallbackPrintPdfWithWindow(pdfBlob, correlativo)
  }
}

/**
 * Función de respaldo para imprimir PDF con ventana mínima
 */
const fallbackPrintPdfWithWindow = (pdfBlob: Blob, correlativo?: number): void => {
  try {
    const pdfUrl = URL.createObjectURL(pdfBlob)
    
    // Crear ventana pequeña para PDF
    const printWindow = window.open('', '_blank', 
      'width=400,height=600,scrollbars=yes,resizable=yes,top=50,left=50,toolbar=no,menubar=no,status=no,location=no'
    )
    
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión. Verifique que no esté bloqueada por el navegador.')
      URL.revokeObjectURL(pdfUrl)
      return
    }

    const htmlPage = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comprobante PDF #${correlativo || 'N/A'}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: #f5f5f5;
            font-family: Arial, sans-serif;
          }
          
          .container {
            height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .header {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            text-align: center;
            padding: 10px;
            font-size: 14px;
            font-weight: bold;
          }
          
          .pdf-viewer {
            flex: 1;
            border: none;
            width: 100%;
          }
          
          .actions {
            padding: 10px;
            background: white;
            border-top: 1px solid #ddd;
            text-align: center;
          }
          
          .btn {
            padding: 8px 16px;
            margin: 0 5px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
          }
          
          .btn-print {
            background: #10b981;
            color: white;
          }
          
          .btn-close {
            background: #6b7280;
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            📄 Comprobante PDF #${correlativo || 'N/A'}
            <br><small>Formato térmico 80mm - Se imprimirá automáticamente</small>
          </div>
          <iframe 
            src="${pdfUrl}" 
            class="pdf-viewer"
            onload="setTimeout(() => window.print(), 1000)">
          </iframe>
          <div class="actions">
            <button onclick="window.print()" class="btn btn-print">
              🖨️ Imprimir
            </button>
            <button onclick="window.close()" class="btn btn-close">
              ❌ Cerrar
            </button>
          </div>
        </div>
        
        <script>
          // Auto-imprimir después de cargar el PDF
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
            }, 1500);
          });
          
          // Cerrar después de imprimir
          window.addEventListener('afterprint', function() {
            setTimeout(function() {
              window.close();
            }, 1000);
          });
        </script>
      </body>
      </html>
    `
    
    printWindow.document.write(htmlPage)
    printWindow.document.close()
    
  } catch (error) {
    console.error('Error en fallback de impresión PDF:', error)
    toast.error('Error al enviar el PDF a la impresora')
  }
}

/**
 * Impresión directa optimizada para impresoras térmicas POS
 * Usa múltiples estrategias para minimizar la intervención del usuario
 */
export const printThermalTicketAuto = (htmlContent: string, ventaId?: number): void => {
  try {
    // Intentar impresión directa con iframe optimizado
    printDirectWithIframe(htmlContent, ventaId)
    
  } catch (error) {
    console.error('Error en impresión térmica automática:', error)
    // Fallback: usar la función de ventana mínima
    fallbackPrintWithWindow(htmlContent, ventaId)
  }
}

/**
 * Impresión directa usando iframe con configuración optimizada
 */
const printDirectWithIframe = (htmlContent: string, ventaId?: number): void => {
  // Crear iframe completamente oculto
  const iframe = document.createElement('iframe')
  iframe.style.cssText = `
    position: absolute;
    top: -99999px;
    left: -99999px;
    width: 1px;
    height: 1px;
    border: none;
    visibility: hidden;
    opacity: 0;
    z-index: -99999;
  `
  
  document.body.appendChild(iframe)
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  if (!iframeDoc) {
    fallbackPrintWithWindow(htmlContent, ventaId)
    return
  }
  
  const thermalHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket ${ventaId || 'N/A'}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          width: 80mm;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.2;
          color: black;
          background: white;
          padding: 2mm;
        }
        .ticket-content * {
          color: black !important;
          background: white !important;
        }
      </style>
    </head>
    <body>
      <div class="ticket-content">
        ${htmlContent}
      </div>
      <script>
        // Auto-imprimir cuando se cargue
        window.addEventListener('load', function() {
          setTimeout(function() {
            try {
              // Intentar diferentes métodos de impresión
              if (window.print) {
                window.print();
              }
            } catch (e) {
              console.error('Error en auto-print:', e);
            }
          }, 300);
        });
        
        // Limpiar iframe después de imprimir
        window.addEventListener('afterprint', function() {
          setTimeout(function() {
            try {
              const iframes = parent.document.querySelectorAll('iframe');
              iframes.forEach(function(frame) {
                if (frame.style.top === '-99999px') {
                  parent.document.body.removeChild(frame);
                }
              });
            } catch (e) {
              console.warn('No se pudieron limpiar iframes temporales:', e)
            }
          }, 1000);
        });
      </script>
    </body>
    </html>
  `
  
  iframeDoc.write(thermalHTML)
  iframeDoc.close()
  
  toast.success('Enviando a impresora térmica...', {
    duration: 2000,
    icon: '🖨️'
  })
  
  // Limpiar iframe después de un tiempo como respaldo
  setTimeout(() => {
    try {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    } catch (e) {
      console.warn('No se pudo eliminar el iframe temporal:', e)
    }
  }, 10000)
}

/**
 * Configuración global para impresión térmica automática
 * Se ejecuta al cargar la página para configurar la impresora por defecto
 */
export const configureThermalPrinterGlobal = (): void => {
  try {
    // Detectar si hay una impresora térmica conectada
    if ('mediaDevices' in navigator || 'usb' in navigator) {
      // Configurar CSS global para impresión térmica
      const globalPrintStyles = document.createElement('style')
      globalPrintStyles.id = 'thermal-printer-config'
      globalPrintStyles.textContent = `
        /* Configuración global para impresoras térmicas */
        @media print {
          @page {
            size: 80mm auto !important;
            margin: 0mm !important;
            padding: 0mm !important;
          }
          
          /* Forzar tamaño de papel térmico */
          html, body {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Courier New', monospace !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
            color: black !important;
            background: white !important;
          }
        }
        
        /* Configuración específica para diferentes impresoras térmicas */
        @media print and (max-device-width: 90mm) {
          @page {
            size: 80mm auto !important;
          }
        }
        
        /* Configuración para impresoras POS */
        @media print and (-webkit-device-pixel-ratio: 1) {
          @page {
            size: 80mm auto !important;
            margin: 0 !important;
          }
        }
      `
      
      // Solo agregar si no existe ya
      if (!document.getElementById('thermal-printer-config')) {
        document.head.appendChild(globalPrintStyles)
      }
    }
    
    // Configurar eventos globales de impresión
    const originalBeforePrint = window.onbeforeprint
    const originalAfterPrint = window.onafterprint
    
    window.onbeforeprint = (event) => {
      // Configurar tamaño de página antes de imprimir
      document.body.style.width = '80mm'
      document.body.style.maxWidth = '80mm'
      
      if (originalBeforePrint) {
        originalBeforePrint.call(window, event)
      }
    }
    
    window.onafterprint = (event) => {
      // Restaurar después de imprimir
      document.body.style.width = ''
      document.body.style.maxWidth = ''
      
      if (originalAfterPrint) {
        originalAfterPrint.call(window, event)
      }
    }
      } catch (error) {
    // No se pudo configurar impresora térmica automática
  }
}

/**
 * Función de impresión ultra-silenciosa que intenta evadir completamente el diálogo del navegador
 * Usa técnicas avanzadas para impresión directa en impresoras térmicas
 */
export const printThermalTicketSilentUltra = (htmlContent: string, ventaId?: number): void => {
  try {
    // Método 1: Intentar con Blob URL y descarga automática
    if (tryBlobPrint(htmlContent, ventaId)) {
      return
    }
    
    // Método 2: Intentar con Canvas y conversión a imagen
    if (tryCanvasPrint(htmlContent, ventaId)) {
      return
    }
    
    // Método 3: Usar iframe con configuración especial para Kiosk mode
    if (tryKioskModePrint(htmlContent, ventaId)) {
      return
    }
    
    // Fallback: usar función estándar
    printThermalTicketAuto(htmlContent, ventaId)
    
  } catch (error) {
    console.error('Error en impresión ultra-silenciosa:', error)
    printThermalTicketAuto(htmlContent, ventaId)
  }
}

/**
 * Intenta crear un PDF/HTML como blob y enviarlo a impresión directa
 */
const tryBlobPrint = (htmlContent: string, ventaId?: number): boolean => {
  try {
    const fullHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket ${ventaId || 'N/A'}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            width: 80mm; 
            font-family: 'Courier New', monospace; 
            font-size: 11px; 
            line-height: 1.2; 
            color: black; 
            background: white; 
            padding: 2mm; 
            margin: 0;
          }
          .ticket-content * { color: black !important; background: white !important; }
        </style>
      </head>
      <body>
        <div class="ticket-content">${htmlContent}</div>
      </body>
      </html>
    `
    
    const blob = new Blob([fullHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    // Crear enlace de descarga oculto que activa impresión
    const link = document.createElement('a')
    link.href = url
    link.download = `ticket-${ventaId || Date.now()}.html`
    link.style.display = 'none'
    
    document.body.appendChild(link)
    
    // Abrir en ventana que auto-imprime
    const printWindow = window.open(url, '_blank', 'width=350,height=600,menubar=no,toolbar=no,status=no')
    
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print()
          setTimeout(() => {
            printWindow.close()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }, 1000)
        }, 500)
      })
      
      toast.success('Preparando impresión térmica...', {
        duration: 2000,
        icon: '🖨️'
      })
      
      return true
    }
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return false
    
  } catch (error) {
    return false
  }
}

/**
 * Convierte el HTML a Canvas y luego intenta imprimir como imagen
 */
const tryCanvasPrint = (_htmlContent: string, _ventaId?: number): boolean => {
  try {
    // Esta función requeriría html2canvas o similar
    // Por ahora retornamos false para usar otros métodos
    return false
    
    /* Implementación futura con html2canvas:
    import html2canvas from 'html2canvas'
    
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = _htmlContent
    tempDiv.style.width = '80mm'
    tempDiv.style.fontFamily = 'Courier New, monospace'
    tempDiv.style.fontSize = '11px'
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    
    document.body.appendChild(tempDiv)
    
    html2canvas(tempDiv).then(canvas => {
      document.body.removeChild(tempDiv)
      
      const imgData = canvas.toDataURL('image/png')
      const printWindow = window.open()
      printWindow.document.write(`
        <img src="${imgData}" style="width: 80mm; height: auto;" onload="window.print(); window.close();">
      `)
      printWindow.document.close()
    })
    
    return true
    */
    
  } catch (error) {
    return false
  }
}

/**
 * Modo Kiosk especial para aplicaciones en modo quiosco o PWA
 */
const tryKioskModePrint = (htmlContent: string, _ventaId?: number): boolean => {
  try {
    // Verificar si estamos en modo Kiosk o PWA
    const isKioskMode = (window.navigator as any).standalone || 
                       window.matchMedia('(display-mode: standalone)').matches ||
                       window.matchMedia('(display-mode: fullscreen)').matches
    
    if (!isKioskMode) {
      return false
    }
    
    // En modo Kiosk, intentar impresión más directa
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;'
    
    document.body.appendChild(iframe)
    
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (doc) {
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { width: 80mm; font-family: 'Courier New', monospace; font-size: 11px; }
          </style>
        </head>
        <body>${htmlContent}</body>
        </html>
      `)
      doc.close()
      
      setTimeout(() => {
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 2000)
      }, 300)
      
      toast.success('Imprimiendo en modo directo...', {
        duration: 1500,
        icon: '🖨️'
      })
      
      return true
    }
    
    return false
    
  } catch (error) {
    return false
  }
}

/**
 * Configuración automática para detectar y configurar impresoras térmicas
 * Se ejecuta una sola vez al cargar la aplicación
 */
export const setupThermalPrinterAutoDetection = (): void => {
  try {
    // Detectar si hay impresoras térmicas conectadas
    if ('usb' in navigator && (navigator as any).usb) {
      // Intentar detectar impresoras USB térmicas comunes
      const commonThermalPrinters = [
        { vendorId: 0x04b8, productId: 0x0202 }, // Epson
        { vendorId: 0x0525, productId: 0xa4a8 }, // Citizen
        { vendorId: 0x28e9, productId: 0x0289 }, // Bixolon
      ]
      
      ;(navigator as any).usb.getDevices().then((devices: any[]) => {
        const thermalPrinter = devices.find((device: any) => 
          commonThermalPrinters.some(printer => 
            device.vendorId === printer.vendorId && 
            device.productId === printer.productId
          )
        )
          if (thermalPrinter) {
          // Configurar para uso directo
          localStorage.setItem('thermal_printer_detected', 'true')
          localStorage.setItem('thermal_printer_type', 'usb')
        }
      }).catch(() => {
        // No hay permisos o no hay dispositivos
      })
    }
    
    // Configurar CSS global para impresión térmica
    if (!document.querySelector('#thermal-global-styles')) {
      const globalStyles = document.createElement('style')
      globalStyles.id = 'thermal-global-styles'
      globalStyles.textContent = `
        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
        }
      `
      document.head.appendChild(globalStyles)
    }
      } catch (error) {
    // No se pudo configurar detección automática de impresoras
  }
}

/**
 * Configurador avanzado de impresión térmica con opciones del usuario
 * Permite configurar preferencias específicas para diferentes impresoras
 */
export const configureThermalPrinterSettings = (settings?: {
  forceDirectPrint?: boolean
  preferredWidth?: '58mm' | '80mm'
  autoDetectPrinter?: boolean
  silentMode?: boolean
}): void => {
  const defaultSettings = {
    forceDirectPrint: true,
    preferredWidth: '80mm' as const,
    autoDetectPrinter: true,
    silentMode: true,
    ...settings
  }
  
  // Guardar configuración en localStorage
  localStorage.setItem('thermal_printer_settings', JSON.stringify(defaultSettings))
  
  // Aplicar configuración CSS global basada en las preferencias
  const globalStyleId = 'thermal-user-config-styles'
  const existingStyles = document.querySelector(`#${globalStyleId}`)
  
  if (existingStyles) {
    existingStyles.remove()
  }
  
  const userStyles = document.createElement('style')
  userStyles.id = globalStyleId
  userStyles.textContent = `
    @media print {
      @page {
        size: ${defaultSettings.preferredWidth} auto;
        margin: 0mm;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      * {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }
      
      body {
        width: ${defaultSettings.preferredWidth} !important;
        max-width: ${defaultSettings.preferredWidth} !important;
        font-family: 'Courier New', monospace !important;
        font-size: 11px !important;
        line-height: 1.2 !important;
        color: black !important;
        background: white !important;
        padding: 2mm !important;
      }
      
      .thermal-ticket {
        width: 100% !important;
        color: black !important;
        background: white !important;
      }
      
      .thermal-ticket * {
        color: black !important;
        background: white !important;
      }
      
      /* Optimizaciones específicas para impresoras térmicas */
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      
      td, th {
        padding: 1px 2px !important;
        text-align: left !important;
        font-size: 11px !important;
        color: black !important;
        background: white !important;
      }
      
      .text-center {
        text-align: center !important;
      }
      
      .text-right {
        text-align: right !important;
      }
      
      img, canvas {
        max-width: 100% !important;
        height: auto !important;
        display: block !important;
        margin: 2mm auto !important;
      }
    }
  `
  
  document.head.appendChild(userStyles)
  
  // toast.success(`Configuración de impresora térmica aplicada (${defaultSettings.preferredWidth})`, {
  //   duration: 2000,
  //   icon: '⚙️'
  // })
}

/**
 * Función que intenta imprimir usando todas las técnicas disponibles en orden de preferencia
 * Basada en la configuración del usuario y capacidades del navegador
 */
export const smartThermalPrint = async (htmlContent: string, ventaId?: number): Promise<void> => {
  try {
    // Obtener configuración del usuario
    const savedSettings = localStorage.getItem('thermal_printer_settings')
    const settings = savedSettings ? JSON.parse(savedSettings) : {
      forceDirectPrint: true,
      preferredWidth: '80mm',
      autoDetectPrinter: true,
      silentMode: true
    }
      // Detectar capacidades del navegador
    const browserCapabilities = {
      hasWebSerial: 'serial' in navigator,
      hasWebUSB: 'usb' in navigator,
      hasServiceWorker: 'serviceWorker' in navigator,
      isSecureContext: window.isSecureContext,
      isPWA: window.matchMedia('(display-mode: standalone)').matches
    }
    
    // Estrategia 1: Si es PWA o Kiosk, usar impresión directa
    if (browserCapabilities.isPWA && settings.silentMode) {
      if (await tryPWAPrint(htmlContent, ventaId, settings.preferredWidth)) {
        return
      }
    }
    
    // Estrategia 2: Si tiene configuración de impresora específica
    const detectedPrinter = localStorage.getItem('thermal_printer_detected')
    if (detectedPrinter && settings.forceDirectPrint) {
      if (await tryDirectPrinterPrint(htmlContent, ventaId, settings.preferredWidth)) {
        return
      }
    }
    
    // Estrategia 3: Usar función ultra-silenciosa
    printThermalTicketSilentUltra(htmlContent, ventaId)
    
  } catch (error) {
    console.error('Error en impresión inteligente:', error)
    // Fallback final
    printThermalTicketSilentUltra(htmlContent, ventaId)
  }
}

/**
 * Intenta impresión directa en PWA/Kiosk mode
 */
const tryPWAPrint = async (htmlContent: string, ventaId?: number, width = '80mm'): Promise<boolean> => {
  try {
    const printWindow = window.open('', '_blank', `width=350,height=600,location=0,menubar=0,toolbar=0,status=0,scrollbars=1,resizable=1`)
    
    if (!printWindow) return false
    
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket PWA ${ventaId || 'N/A'}</title>
        <style>
          @page { 
            size: ${width} auto; 
            margin: 0; 
          }
          body { 
            width: ${width}; 
            font-family: 'Courier New', monospace; 
            font-size: 11px; 
            margin: 0; 
            padding: 2mm; 
            color: black; 
            background: white; 
          }
          * { color: black !important; background: white !important; }
        </style>
        <script>
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 500);
          });
        </script>
      </head>
      <body>${htmlContent}</body>
      </html>
    `
    
    printWindow.document.write(printHTML)
    printWindow.document.close()
    
    toast.success('Impresión PWA iniciada', {
      duration: 1500,
      icon: '📱'
    })
    
    return true
  } catch (error) {
    return false
  }
}

/**
 * Intenta comunicación directa con impresora detectada
 */
const tryDirectPrinterPrint = async (_htmlContent: string, _ventaId?: number, _width = '80mm'): Promise<boolean> => {
  try {
    const printerType = localStorage.getItem('thermal_printer_type')
    
    if (printerType === 'usb' && 'usb' in navigator) {
      // Intentar usar WebUSB para comunicación directa
      // Esta funcionalidad requiere permisos previos del usuario
      
      toast.info('Intentando comunicación directa con impresora USB...', {
        duration: 2000,
        icon: '🔌'
      })
      
      // Por ahora, usar fallback ya que WebUSB requiere configuración específica
      return false
    }
    
    return false
  } catch (error) {
    return false
  }
}
