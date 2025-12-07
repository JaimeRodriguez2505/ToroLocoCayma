import { getPrinterConfig } from '../components/settings/PrinterConfigDialog'

/**
 * Genera el HTML para una comanda de cocina
 */
export const generarHtmlComanda = (comanda: any): string => {
  const { productos, numero_carrito, observaciones, fecha_creacion } = comanda

  const fecha = new Date(fecha_creacion || Date.now()).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          padding: 10px;
          max-width: 300px;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .header h1 {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .mesa {
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          margin: 10px 0;
          padding: 10px;
          border: 2px solid #000;
        }
        .info {
          margin-bottom: 10px;
          font-size: 11px;
        }
        .productos {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 10px 0;
          margin: 10px 0;
        }
        .producto {
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
        }
        .producto-nombre {
          font-weight: bold;
          font-size: 13px;
        }
        .producto-cantidad {
          font-size: 16px;
          font-weight: bold;
          margin-right: 10px;
        }
        .observaciones {
          margin-top: 10px;
          padding: 5px;
          border: 1px dashed #000;
          background-color: #f0f0f0;
        }
        .observaciones-titulo {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 2px dashed #000;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔥 COMANDA COCINA 🔥</h1>
      </div>

      <div class="mesa">
        MESA ${numero_carrito}
      </div>

      <div class="info">
        <div><strong>Fecha:</strong> ${fecha}</div>
      </div>

      <div class="productos">
        ${productos.map((producto: any) => `
          <div class="producto">
            <div>
              <div class="producto-nombre">${producto.nombreEditado || producto.nombre}</div>
            </div>
            <div class="producto-cantidad">x${producto.cantidad}</div>
          </div>
        `).join('')}
      </div>

      ${observaciones ? `
        <div class="observaciones">
          <div class="observaciones-titulo">OBSERVACIONES:</div>
          <div>${observaciones}</div>
        </div>
      ` : ''}

      <div class="footer">
        <div>🍴 ¡Buen provecho! 🍴</div>
      </div>
    </body>
    </html>
  `
}

/**
 * Imprime una comanda directamente sin mostrar preview
 */
export const imprimirComandaDirecta = async (comanda: any): Promise<void> => {
  try {
    // Obtener configuración de impresora de cocina
    const printerConfig = getPrinterConfig('cocina')

    if (!printerConfig.habilitada) {
      throw new Error('La impresora de cocina no está habilitada')
    }

    // Generar HTML de la comanda
    const html = generarHtmlComanda(comanda)

    // Crear un iframe oculto para imprimir
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'

    document.body.appendChild(iframe)

    // Escribir el contenido en el iframe
    const iframeDoc = iframe.contentWindow?.document
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(html)
      iframeDoc.close()

      // Esperar a que se cargue el contenido
      await new Promise(resolve => setTimeout(resolve, 500))

      // Configurar la impresión
      const printWindow = iframe.contentWindow
      if (printWindow) {
        printWindow.focus()
        printWindow.print()

        // Limpiar el iframe después de imprimir
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }
    }
  } catch (error) {
    console.error('Error al imprimir comanda:', error)
    throw error
  }
}

/**
 * Genera un ticket de venta (para impresora de recepción)
 */
export const imprimirTicketDirecto = async (ticketHtml: string): Promise<void> => {
  try {
    // Obtener configuración de impresora de recepción
    const printerConfig = getPrinterConfig('recepcion')

    if (!printerConfig.habilitada) {
      throw new Error('La impresora de recepción no está habilitada')
    }

    // Crear un iframe oculto para imprimir
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'

    document.body.appendChild(iframe)

    // Escribir el contenido en el iframe
    const iframeDoc = iframe.contentWindow?.document
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(ticketHtml)
      iframeDoc.close()

      // Esperar a que se cargue el contenido
      await new Promise(resolve => setTimeout(resolve, 500))

      // Configurar la impresión
      const printWindow = iframe.contentWindow
      if (printWindow) {
        printWindow.focus()
        printWindow.print()

        // Limpiar el iframe después de imprimir
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }
    }
  } catch (error) {
    console.error('Error al imprimir ticket:', error)
    throw error
  }
}

/**
 * Obtiene las impresoras disponibles en el sistema (si es soportado)
 */
export const obtenerImpresorasDisponibles = async (): Promise<string[]> => {
  // Esta funcionalidad depende de la API del navegador
  // En la mayoría de los casos, esto no está disponible por seguridad
  // Se usa principalmente en aplicaciones Electron o con extensiones específicas

  return []
}

/**
 * Verifica si hay una impresora configurada
 */
export const verificarConfiguracionImpresora = (tipo: 'cocina' | 'recepcion'): boolean => {
  try {
    const config = getPrinterConfig(tipo)
    return config.habilitada
  } catch (error) {
    return false
  }
}

export default {
  generarHtmlComanda,
  imprimirComandaDirecta,
  imprimirTicketDirecto,
  obtenerImpresorasDisponibles,
  verificarConfiguracionImpresora
}
