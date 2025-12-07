import jsPDF from "jspdf"
import autoTable, { RowInput } from "jspdf-autotable"
import moment from "moment-timezone"

interface CierreCajaData {
  id_cierre: number
  fecha_apertura: string
  fecha_cierre: string
  cajero_id: number
  saldo_efectivo: number
  total_efectivo: number
  total_tarjeta: number
  total_transferencia: number
  total_yape: number
  total_plin: number
  total_pedidosya?: number
  total_rappi?: number
  total_uber_eats?: number
  cantidad_ventas: number
  estado: string
  observaciones?: string
}

interface ExportOptions {
  fechaInicio: string
  fechaFin: string
  cierres: CierreCajaData[]
  cashierNames: Record<number, string>
}

export const exportarHistorialCierreCajaPDF = ({
  fechaInicio,
  fechaFin,
  cierres,
  cashierNames,
}: ExportOptions) => {
  // Crear nuevo documento PDF en orientación horizontal para más espacio
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  })

  // Configurar fuente
  doc.setFont("helvetica")

  // Título del documento
  doc.setFontSize(18)
  doc.setTextColor(88, 28, 135) // purple-800
  doc.text("HISTORIAL DE CIERRES DE CAJA", doc.internal.pageSize.getWidth() / 2, 15, {
    align: "center",
  })

  // Subtítulo con rango de fechas
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  const fechaInicioFormateada = moment(fechaInicio).format("DD/MM/YYYY")
  const fechaFinFormateada = moment(fechaFin).format("DD/MM/YYYY")
  doc.text(
    `Período: ${fechaInicioFormateada} - ${fechaFinFormateada}`,
    doc.internal.pageSize.getWidth() / 2,
    22,
    { align: "center" }
  )

  // Fecha de generación del reporte
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(
    `Generado el: ${moment().tz("America/Lima").format("DD/MM/YYYY HH:mm")}`,
    doc.internal.pageSize.getWidth() / 2,
    28,
    { align: "center" }
  )

  // Calcular totales generales
  const totales = cierres.reduce(
    (acc, cierre) => ({
      saldoEfectivo: acc.saldoEfectivo + Number(cierre.saldo_efectivo || 0),
      efectivo: acc.efectivo + Number(cierre.total_efectivo || 0),
      tarjeta: acc.tarjeta + Number(cierre.total_tarjeta || 0),
      transferencia: acc.transferencia + Number(cierre.total_transferencia || 0),
      yape: acc.yape + Number(cierre.total_yape || 0),
      plin: acc.plin + Number(cierre.total_plin || 0),
      pedidosya: acc.pedidosya + Number(cierre.total_pedidosya || 0),
      rappi: acc.rappi + Number(cierre.total_rappi || 0),
      uberEats: acc.uberEats + Number(cierre.total_uber_eats || 0),
      ventas: acc.ventas + Number(cierre.cantidad_ventas || 0),
    }),
    {
      saldoEfectivo: 0,
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      yape: 0,
      plin: 0,
      pedidosya: 0,
      rappi: 0,
      uberEats: 0,
      ventas: 0,
    }
  )

  // Preparar datos para la tabla
  const tableData: RowInput[] = cierres.map((cierre) => [
    moment(cierre.fecha_apertura).format("DD/MM/YYYY"),
    cierre.fecha_cierre ? moment(cierre.fecha_cierre).format("DD/MM/YYYY HH:mm") : "N/A",
    cashierNames[cierre.cajero_id] || `Cajero #${cierre.cajero_id}`,
    cierre.estado === "cerrado" ? "Cerrado" : "Abierto",
    `S/ ${Number(cierre.saldo_efectivo || 0).toFixed(2)}`,
    `S/ ${Number(cierre.total_efectivo || 0).toFixed(2)}`,
    `S/ ${Number(cierre.total_tarjeta || 0).toFixed(2)}`,
    `S/ ${Number(cierre.total_transferencia || 0).toFixed(2)}`,
    `S/ ${Number(cierre.total_yape || 0).toFixed(2)}`,
    `S/ ${Number(cierre.total_plin || 0).toFixed(2)}`,
    `S/ ${Number(cierre.total_pedidosya || 0).toFixed(2)}`,
    `S/ ${Number(cierre.total_rappi || 0).toFixed(2)}`,
    `S/ ${Number(cierre.total_uber_eats || 0).toFixed(2)}`,
    cierre.cantidad_ventas.toString(),
  ])

  // Agregar fila de totales
  tableData.push([
    { content: "TOTALES", colSpan: 4, styles: { fontStyle: "bold", fillColor: [139, 92, 246] } },
    { content: `S/ ${totales.saldoEfectivo.toFixed(2)}`, styles: { fontStyle: "bold", fillColor: [196, 181, 253] } },
    { content: `S/ ${totales.efectivo.toFixed(2)}`, styles: { fontStyle: "bold", fillColor: [196, 181, 253] } },
    { content: `S/ ${totales.tarjeta.toFixed(2)}`, styles: { fontStyle: "bold", fillColor: [196, 181, 253] } },
    { content: `S/ ${totales.transferencia.toFixed(2)}`, styles: { fontStyle: "bold", fillColor: [196, 181, 253] } },
    { content: `S/ ${totales.yape.toFixed(2)}`, styles: { fontStyle: "bold", fillColor: [196, 181, 253] } },
    { content: `S/ ${totales.plin.toFixed(2)}`, styles: { fontStyle: "bold", fillColor: [196, 181, 253] } },
    { content: `S/ ${totales.pedidosya.toFixed(2)}`, styles: { fontStyle: "bold", fillColor: [196, 181, 253] } },
    { content: `S/ ${totales.rappi.toFixed(2)}`, styles: { fontStyle: "bold", fillColor: [196, 181, 253] } },
    { content: `S/ ${totales.uberEats.toFixed(2)}`, styles: { fontStyle: "bold", fillColor: [196, 181, 253] } },
    { content: totales.ventas.toString(), styles: { fontStyle: "bold", fillColor: [196, 181, 253] } },
  ])

  // Generar tabla con autoTable
  autoTable(doc, {
    startY: 35,
    head: [
      [
        "F. Apertura",
        "F. Cierre",
        "Cajero",
        "Estado",
        "Saldo Efec.",
        "Efectivo",
        "Tarjeta",
        "Transfer.",
        "Yape",
        "Plin",
        "PedidosYa",
        "Rappi",
        "Uber Eats",
        "Ventas",
      ],
    ],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
      halign: "center",
    },
    headStyles: {
      fillColor: [139, 92, 246], // purple-600
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // gray-50
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 18 }, // F. Apertura
      1: { halign: "center", cellWidth: 26 }, // F. Cierre
      2: { halign: "left", cellWidth: 25 }, // Cajero
      3: { halign: "center", cellWidth: 16 }, // Estado
      4: { halign: "right", cellWidth: 18 }, // Saldo Efectivo
      5: { halign: "right", cellWidth: 16 }, // Efectivo
      6: { halign: "right", cellWidth: 16 }, // Tarjeta
      7: { halign: "right", cellWidth: 16 }, // Transferencia
      8: { halign: "right", cellWidth: 15 }, // Yape
      9: { halign: "right", cellWidth: 15 }, // Plin
      10: { halign: "right", cellWidth: 18 }, // PedidosYa
      11: { halign: "right", cellWidth: 15 }, // Rappi
      12: { halign: "right", cellWidth: 18 }, // Uber Eats
      13: { halign: "center", cellWidth: 13 }, // Ventas
    },
    margin: { top: 35, right: 10, bottom: 20, left: 10 },
    didDrawPage: (data) => {
      // Pie de página con número de página
      const pageCount = doc.internal.pages.length - 1
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      )
    },
  })

  // Resumen estadístico en nueva página si hay espacio
  const finalY = (doc as any).lastAutoTable.finalY || 100
  const pageHeight = doc.internal.pageSize.getHeight()

  if (finalY + 60 > pageHeight) {
    doc.addPage()
  }

  // Agregar resumen estadístico
  const summaryY = finalY + 60 > pageHeight ? 20 : finalY + 15
  doc.setFontSize(14)
  doc.setTextColor(88, 28, 135)
  doc.text("RESUMEN GENERAL", 15, summaryY)

  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)

  const totalGeneral =
    totales.efectivo +
    totales.tarjeta +
    totales.transferencia +
    totales.yape +
    totales.plin +
    totales.pedidosya +
    totales.rappi +
    totales.uberEats

  const resumenData = [
    ["Total de Cierres:", cierres.length.toString()],
    ["Total de Ventas:", totales.ventas.toString()],
    ["Total General:", `S/ ${totalGeneral.toFixed(2)}`],
    ["Promedio por Cierre:", `S/ ${cierres.length > 0 ? (totalGeneral / cierres.length).toFixed(2) : "0.00"}`],
  ]

  autoTable(doc, {
    startY: summaryY + 5,
    body: resumenData,
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 50, halign: "right" },
    },
    margin: { left: 15 },
  })

  // Guardar el PDF con nombre descriptivo
  const fileName = `Historial_Cierres_${fechaInicioFormateada.replace(/\//g, "-")}_${fechaFinFormateada.replace(
    /\//g,
    "-"
  )}.pdf`
  doc.save(fileName)
}
