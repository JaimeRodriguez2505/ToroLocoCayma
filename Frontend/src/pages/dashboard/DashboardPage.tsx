"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import {
  BarChart3,
  Package,
  Tags,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  Clock,
  AlertCircle,
  LayoutDashboard,
  LineChart,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Receipt,
  Users,
  AlertTriangle,
  Filter,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { fetchDashboardStats } from "../../services/dashboardService"
import { fetchProducts } from "../../services/productService"
import { fetchCategories } from "../../services/categoryService"
import { fetchSales, fetchSalesByDate, fetchSalesByDateRange } from "../../services/saleService"
import { obtenerCierreCajaPorFecha, obtenerCierresCajaPorRango } from "../../services/cierreCajaService"
import gastoPersonalService from "../../services/gastoPersonalService"
import { formatCurrency } from "../../lib/utils"
import { motion } from "framer-motion"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import { useTheme } from "../../lib/theme"
import { useBusinessHours } from "../../hooks/useBusinessHours"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"

import { useSalesChartsData } from "../../hooks/use-sales-charts-data"
import { WeeklySalesCharts } from "../../components/charts/weekly-sales-charts"
import { Bar, Line, Pie } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js"

// Registrar todos los componentes necesarios de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
)

const DashboardPage = () => {
  // Add the hook to change the document title
  useDocumentTitle("Dashboard")
  useTheme()
  const { isWithinBusinessHours, businessHoursMessage } = useBusinessHours()

  const [totalProducts, setTotalProducts] = useState(0)
  const [totalCategories, setTotalCategories] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [activeTab, setActiveTab] = useState("paneles")

  // Estados para cierre de caja diario
  const [selectedDate, setSelectedDate] = useState(() => {
    // Usar zona horaria peruana (UTC-5)
    const today = new Date()
    const peruTime = new Date(today.getTime() - (5 * 60 * 60 * 1000)) // UTC-5
    return peruTime.toISOString().split('T')[0] // YYYY-MM-DD format
  })
  
  // Estados para vista semanal
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const today = new Date()
    const peruTime = new Date(today.getTime() - (5 * 60 * 60 * 1000)) // UTC-5
    const dayOfWeek = peruTime.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Lunes como inicio de semana
    const monday = new Date(peruTime)
    monday.setDate(peruTime.getDate() + mondayOffset)
    return monday.toISOString().split('T')[0]
  })

  // Estados para estadísticas de gastos
  const [expensesDateRange, setExpensesDateRange] = useState(() => {
    const today = new Date()
    const peruTime = new Date(today.getTime() - (5 * 60 * 60 * 1000))
    const thirtyDaysAgo = new Date(peruTime)
    thirtyDaysAgo.setDate(peruTime.getDate() - 30)

    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: peruTime.toISOString().split('T')[0]
    }
  })

  const [employeeRanking, setEmployeeRanking] = useState<any[]>([])
  const [expensesByDay, setExpensesByDay] = useState<any[]>([])
  const [expenseAverages, setExpenseAverages] = useState<any>(null)
  const [unusualExpenses, setUnusualExpenses] = useState<any[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false)

  const {
    monthlySalesData,
    monthlyRevenueData,
    topProductsData,
    paymentMethodData,
  } = useSalesChartsData()

  // Fetch dashboard stats
  const { isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
    enabled: false,
  })

  // Fetch products for count
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  // Fetch categories for count
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })

  // Fetch sales for count and revenue
  const { data: sales, isLoading: isLoadingSales } = useQuery({
    queryKey: ["sales"],
    queryFn: fetchSales,
  })

  // Fetch ventas del día seleccionado
  const { data: dailySales, isLoading: isLoadingDailySales } = useQuery({
    queryKey: ["dailySales", selectedDate],
    queryFn: () => fetchSalesByDate(selectedDate),
    enabled: !!selectedDate,
  })

  // Fetch cierre de caja del día seleccionado
  const { data: cierreCaja, isLoading: isLoadingCierreCaja } = useQuery({
    queryKey: ["cierreCaja", selectedDate],
    queryFn: () => obtenerCierreCajaPorFecha(selectedDate),
    enabled: !!selectedDate,
  })

  // Calcular fechas de la semana seleccionada
  const getWeekDates = (weekStart: string) => {
    const start = new Date(weekStart + 'T00:00:00')
    const end = new Date(start)
    end.setDate(start.getDate() + 6) // Domingo es el último día
    return {
      fechaInicio: weekStart,
      fechaFin: end.toISOString().split('T')[0]
    }
  }

  // Fetch ventas de la semana seleccionada
  const { data: weeklySales, isLoading: isLoadingWeeklySales } = useQuery({
    queryKey: ["weeklySales", selectedWeekStart],
    queryFn: () => {
      const { fechaInicio, fechaFin } = getWeekDates(selectedWeekStart)
      return fetchSalesByDateRange(fechaInicio, fechaFin)
    },
    enabled: !!selectedWeekStart,
  })

  // Fetch cierres de caja de la semana seleccionada
  const { data: weeklyCierres, isLoading: isLoadingWeeklyCierres } = useQuery({
    queryKey: ["weeklyCierres", selectedWeekStart],
    queryFn: () => {
      const { fechaInicio, fechaFin } = getWeekDates(selectedWeekStart)
      return obtenerCierresCajaPorRango(fechaInicio, fechaFin)
    },
    enabled: !!selectedWeekStart,
  })

  useEffect(() => {
    if (products) {
      setTotalProducts(products.length)
    }
    if (categories) {
      setTotalCategories(categories.length)
    }
    if (sales) {
      setTotalSales(sales.length)
      // Calculate total revenue
      const revenue = sales.reduce((acc, sale) => acc + Number.parseFloat(sale.total_con_igv), 0)
      setTotalRevenue(revenue)
    }
  }, [products, categories, sales])

  useEffect(() => {
    const loadExpensesStats = async () => {
      if (activeTab !== 'gastos-personal') return

      setIsLoadingExpenses(true)
      try {
        const filters = {
          fecha_inicio: expensesDateRange.start,
          fecha_fin: expensesDateRange.end
        }

        const [ranking, byDay, averages, unusual] = await Promise.all([
          gastoPersonalService.getEmployeeRanking({ ...filters, limit: 10 }),
          gastoPersonalService.getExpensesByDay(filters),
          gastoPersonalService.getExpenseAverages(filters),
          gastoPersonalService.getUnusualExpenses(filters)
        ])

        setEmployeeRanking(ranking)
        setExpensesByDay(byDay)
        setExpenseAverages(averages)
        setUnusualExpenses(unusual)
      } catch (error) {
        console.error("Error cargando estadísticas de gastos:", error)
      } finally {
        setIsLoadingExpenses(false)
      }
    }

    loadExpensesStats()
  }, [expensesDateRange, activeTab])

  const isLoading = isLoadingStats || isLoadingProducts || isLoadingCategories || isLoadingSales

  // Define stat card styles with Modern Palette
  const statCards = [
    {
      title: "Productos",
      value: totalProducts,
      description: "Total en inventario",
      icon: <Package className="h-6 w-6" />,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      linkTo: "/products",
    },
    {
      title: "Categorías",
      value: totalCategories,
      description: "Categorías registradas",
      icon: <Tags className="h-6 w-6" />,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      linkTo: "/categories",
    },
    {
      title: "Ventas",
      value: totalSales,
      description: "Ventas realizadas",
      icon: <ShoppingCart className="h-6 w-6" />,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      linkTo: "/sales",
    },
    {
      title: "Ingresos",
      value: isLoading ? "..." : formatCurrency(totalRevenue),
      description: "Ingresos totales",
      icon: <DollarSign className="h-6 w-6" />,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      linkTo: "/sales",
    },
  ]

  // Define quick action buttons with clean style
  const quickActions = [
    {
      title: "Gestionar Productos",
      icon: <Package className="h-5 w-5" />,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100/50 dark:bg-blue-900/20",
      hover: "hover:bg-blue-100 dark:hover:bg-blue-900/40",
      link: "/products",
    },
    {
      title: "Gestionar Categorías",
      icon: <Tags className="h-5 w-5" />,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100/50 dark:bg-orange-900/20",
      hover: "hover:bg-orange-100 dark:hover:bg-orange-900/40",
      link: "/categories",
    },
    {
      title: "Registrar Venta",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "text-primary",
      bg: "bg-primary/10",
      hover: "hover:bg-primary/20",
      link: "/sales",
      needsBusinessHours: true,
    },
    {
      title: "Ver Historial",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100/50 dark:bg-emerald-900/20",
      hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
      link: "/sales",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Dashboard Header */}
      <motion.div
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-base">Bienvenido al panel de control de Toro Loco Cayma</p>
        </div>

        {/* Nueva Venta Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <motion.div
                  whileHover={isWithinBusinessHours ? { scale: 1.02 } : {}}
                  whileTap={isWithinBusinessHours ? { scale: 0.98 } : {}}
                >
                  <Button
                    asChild={isWithinBusinessHours}
                    disabled={!isWithinBusinessHours}
                    size="lg"
                    className={`relative overflow-hidden transition-all duration-300 ${
                      isWithinBusinessHours
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {isWithinBusinessHours ? (
                      <Link to="/sales">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Nueva Venta
                      </Link>
                    ) : (
                      <span className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        Ventas
                      </span>
                    )}
                  </Button>
                </motion.div>
              </div>
            </TooltipTrigger>
            {!isWithinBusinessHours && (
              <TooltipContent
                side="bottom"
                className="bg-amber-50 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200 border-amber-200"
              >
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
                  <span>Fuera del horario laboral</span>
                </div>
                <p className="text-xs mt-1">{businessHoursMessage}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <Card className="relative overflow-hidden rounded-2xl border bg-card hover:shadow-lg dark:shadow-ember dark:hover:shadow-fire transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">{card.title}</p>
                    <p className="text-3xl font-bold text-primary mb-1">
                      {isLoading ? <div className="h-10 w-28 bg-muted animate-pulse rounded-xl"></div> : card.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </div>
                  <div
                    className={`h-14 w-14 rounded-xl ${card.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}
                  >
                    <span className={card.iconColor}>{card.icon}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Dashboard Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-6"
      >
        <Tabs defaultValue="paneles" className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <div className="border-b border-border mb-6">
            <TabsList className="h-auto bg-transparent p-0 space-x-6 justify-start">
              <TabsTrigger
                value="paneles"
                className="relative h-10 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all duration-200 hover:text-primary/80"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="estadisticas"
                className="relative h-10 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all duration-200 hover:text-primary/80"
              >
                <LineChart className="h-4 w-4 mr-2" />
                Análisis Mensual
              </TabsTrigger>
              <TabsTrigger
                value="semanal"
                className="relative h-10 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all duration-200 hover:text-primary/80"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Análisis Semanal
              </TabsTrigger>
              <TabsTrigger
                value="caja-semanal"
                className="relative h-10 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all duration-200 hover:text-primary/80"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Control Caja
              </TabsTrigger>
              <TabsTrigger
                value="gastos-personal"
                className="relative h-10 px-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all duration-200 hover:text-primary/80"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Gastos
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Panel de Control Tab Content */}
          <TabsContent value="paneles" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="lg:col-span-1"
              >
                <Card className="h-full rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Acciones Rápidas</CardTitle>
                    <CardDescription>
                      Accesos directos frecuentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quickActions.map((action) => {
                      const isDisabled = action.needsBusinessHours && !isWithinBusinessHours

                      return (
                        <TooltipProvider key={action.title}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Button
                                  asChild={!isDisabled}
                                  variant="ghost"
                                  className={`w-full justify-start gap-3 h-14 rounded-xl transition-all duration-200 ${action.hover} ${
                                    isDisabled
                                      ? "opacity-50 cursor-not-allowed bg-muted"
                                      : "bg-card border-2 border-border hover:border-primary/30 hover:shadow-md dark:hover:shadow-primary-glow"
                                  }`}
                                  disabled={isDisabled}
                                >
                                  {!isDisabled ? (
                                    <Link to={action.link} className="flex items-center gap-3 w-full">
                                      <div className={`p-2 rounded-md ${action.bg}`}>
                                        <div className={action.color}>{action.icon}</div>
                                      </div>
                                      <span className="font-medium">{action.title}</span>
                                    </Link>
                                  ) : (
                                    <div className="flex items-center gap-3 w-full">
                                      <div className="p-2 rounded-md bg-muted text-muted-foreground">{action.icon}</div>
                                      <span className="font-medium">{action.title}</span>
                                      <Clock className="ml-auto h-4 w-4" />
                                    </div>
                                  )}
                                </Button>
                              </div>
                            </TooltipTrigger>
                            {isDisabled && (
                              <TooltipContent
                                side="right"
                                className="bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-200"
                              >
                                <div className="flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-2 text-amber-600" />
                                  <span>Fuera del horario laboral</span>
                                </div>
                                <p className="text-xs mt-1">{businessHoursMessage}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Sales Summary */}
              <motion.div
                className="lg:col-span-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card className="h-full rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold">Ventas Recientes</CardTitle>
                      <CardDescription>
                        Últimas transacciones registradas
                      </CardDescription>
                    </div>
                    {sales && sales.length > 0 && (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                      >
                        <Link to="/sales">Ver todas</Link>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isLoadingSales ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : sales && sales.length > 0 ? (
                      <div className="space-y-4">
                        {sales.slice(0, 5).map((sale, index) => (
                          <motion.div
                            key={sale.venta_id}
                            className="flex items-center justify-between p-4 rounded-xl border-2 border-transparent hover:bg-accent hover:border-primary/30 transition-all group"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.05 * index }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                #{sale.venta_id}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-base text-foreground">
                                  {sale.metodo_pago}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(sale.fecha).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-lg text-primary">
                                {formatCurrency(Number.parseFloat(sale.total_con_igv))}
                              </span>
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                              >
                                <Link to={`/sales/${sale.venta_id}`}>
                                  <ArrowRight className="h-5 w-5" />
                                </Link>
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No hay ventas recientes</p>
                        <p className="text-xs text-muted-foreground mt-1">Las ventas aparecerán aquí cuando se registren.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Tabla de Control de Caja Diaria */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold">Control de Caja Diaria</CardTitle>
                      <CardDescription>
                        Balance del día
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        inputSize="default"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(isLoadingDailySales || isLoadingCierreCaja) ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        const calculateRealSalesTotal = (sales: any[]) => {
                          return sales.reduce((sum, sale) => {
                            const baseTotal = Number(sale.total_con_igv) || 0
                            const discount = (sale.es_descuento && sale.descuento) ? Number(sale.descuento) : 0
                            return sum + (baseTotal - discount)
                          }, 0)
                        }

                        const totalVentasDia = calculateRealSalesTotal(dailySales || [])
                        const cantidadVentas = dailySales?.length || 0

                        let cierreCajaData = null
                        if (Array.isArray(cierreCaja)) {
                          cierreCajaData = cierreCaja.find(c => c.fecha_apertura?.startsWith(selectedDate)) || cierreCaja[0]
                        } else if (cierreCaja) {
                          cierreCajaData = cierreCaja
                        }

                        const totalCierreCaja = cierreCajaData ? (Number(cierreCajaData.saldo_efectivo) || 0) : 0
                        const diferencia = totalVentasDia - totalCierreCaja
                        const hayCierreCaja = !!cierreCajaData
                        const estadoCierre = cierreCajaData?.estado || 'Sin cierre'

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-6 rounded-xl bg-card border-2 border-border shadow-sm dark:shadow-ember">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <ShoppingCart className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground">Ventas Sistema</span>
                              </div>
                              <p className="text-3xl font-bold text-primary mb-1">{formatCurrency(totalVentasDia)}</p>
                              <p className="text-sm text-muted-foreground">{cantidadVentas} transacciones</p>
                            </div>

                            <div className="p-6 rounded-xl bg-card border-2 border-border shadow-sm dark:shadow-ember">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <DollarSign className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground">Efectivo Caja</span>
                              </div>
                              <p className="text-3xl font-bold text-primary mb-2">{formatCurrency(totalCierreCaja)}</p>
                              <div className="flex items-center gap-2">
                                {hayCierreCaja ? (
                                  <Badge variant={estadoCierre === 'cerrado' ? 'outline' : 'secondary'} className="text-xs h-6 px-2">
                                    {estadoCierre === 'cerrado' ? 'Cerrado' : 'Abierto'}
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs h-6 px-2">Sin cierre</Badge>
                                )}
                              </div>
                            </div>

                            <div className={`p-6 rounded-xl border-2 shadow-sm ${
                              Math.abs(diferencia) < 0.01
                                ? "bg-card border-border dark:shadow-ember"
                                : diferencia > 0
                                  ? "bg-card border-amber-500 dark:shadow-primary-glow"
                                  : "bg-card border-destructive dark:shadow-primary-glow"
                            }`}>
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                  Math.abs(diferencia) < 0.01 ? "bg-muted text-muted-foreground" : diferencia > 0 ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive"
                                }`}>
                                  {Math.abs(diferencia) < 0.01 ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground">Diferencia</span>
                              </div>
                              <p className={`text-3xl font-bold mb-1 ${
                                Math.abs(diferencia) < 0.01 ? "text-muted-foreground" : diferencia > 0 ? "text-amber-600" : "text-destructive"
                              }`}>
                                {diferencia > 0 ? '+' : ''}{formatCurrency(diferencia)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {Math.abs(diferencia) < 0.01 ? "Caja cuadrada" : "Descuadre detectado"}
                              </p>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Estadísticas Tab Content - Simplified for brevity in this rewrite, assuming similar structure but cleaner */}
          <TabsContent value="estadisticas" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Análisis Mensual</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Ventas Mensuales</CardTitle>
                  <CardDescription>Cantidad de transacciones por mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                     {monthlySalesData && <Bar options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={monthlySalesData} />}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Ingresos Mensuales</CardTitle>
                  <CardDescription>Facturación total por mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                     {monthlyRevenueData && <Line options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={monthlyRevenueData} />}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Productos Más Vendidos</CardTitle>
                  <CardDescription>Top 5 productos del mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {topProductsData && <Bar options={{ indexAxis: 'y' as const, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={topProductsData} />}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Métodos de Pago</CardTitle>
                  <CardDescription>Distribución de preferencias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex justify-center">
                    {paymentMethodData && <Pie options={{ maintainAspectRatio: false }} data={paymentMethodData} />}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tabs would follow similar clean pattern */}
          <TabsContent value="semanal">
             <WeeklySalesCharts />
          </TabsContent>
          
          <TabsContent value="caja-semanal" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-4"
            >
              <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold">Control de Caja Semanal</CardTitle>
                      <CardDescription>
                        Comparación diaria
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={selectedWeekStart}
                        onChange={(e) => setSelectedWeekStart(e.target.value)}
                        inputSize="default"
                        title="Seleccionar inicio de semana (Lunes)"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(isLoadingWeeklySales || isLoadingWeeklyCierres) ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        const getWeekDays = () => {
                          const days = []
                          const startDate = new Date(selectedWeekStart + 'T00:00:00')
                          for (let i = 0; i < 7; i++) {
                            const day = new Date(startDate)
                            day.setDate(startDate.getDate() + i)
                            days.push({
                              date: day.toISOString().split('T')[0],
                              dayName: day.toLocaleDateString('es-ES', { weekday: 'long' }),
                              dayNumber: day.getDate()
                            })
                          }
                          return days
                        }

                        const weekDays = getWeekDays()

                        const salesByDay = weeklySales?.reduce((acc: any, sale: any) => {
                          const saleDate = sale.fecha.split(' ')[0]
                          if (!acc[saleDate]) {
                            acc[saleDate] = []
                          }
                          acc[saleDate].push(sale)
                          return acc
                        }, {} as Record<string, typeof weeklySales>) || {}

                        const cierresByDay = weeklyCierres?.reduce((acc: Record<string, any>, cierre: any) => {
                          const cierreDate = cierre.fecha_apertura?.split(' ')[0]
                          if (cierreDate && !acc[cierreDate]) {
                            acc[cierreDate] = cierre
                          }
                          return acc
                        }, {} as Record<string, any>) || {}

                        return (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Día</TableHead>
                                <TableHead className="text-right">Ventas Sistema</TableHead>
                                <TableHead className="text-right">Efectivo en Caja</TableHead>
                                <TableHead className="text-center">Estado</TableHead>
                                <TableHead className="text-right">Diferencia</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {weekDays.map((day) => {
                                const dayDate = day.date
                                const daySales = salesByDay[dayDate] || []
                                const dayCierre = cierresByDay[dayDate]

                                const calculateRealSalesTotal = (sales: any[]) => {
                                  return sales.reduce((sum, sale) => {
                                    const baseTotal = Number(sale.total_con_igv) || 0
                                    const discount = (sale.es_descuento && sale.descuento) ? Number(sale.descuento) : 0
                                    return sum + (baseTotal - discount)
                                  }, 0)
                                }

                                const totalVentasDia = calculateRealSalesTotal(daySales)
                                const cantidadVentas = daySales.length

                                const totalCierreCaja = dayCierre ? (Number(dayCierre.saldo_efectivo) || 0) : 0
                                const diferencia = totalVentasDia - totalCierreCaja
                                const hayCierreCaja = !!dayCierre
                                const estadoCierre = dayCierre?.estado || 'Sin cierre'

                                const getDiferenciaIcon = () => {
                                  if (Math.abs(diferencia) < 0.01) return <Minus className="h-4 w-4 text-muted-foreground" />
                                  return diferencia > 0 
                                    ? <TrendingUp className="h-4 w-4 text-amber-500" />
                                    : <TrendingDown className="h-4 w-4 text-red-500" />
                                }

                                const getDiferenciaColor = () => {
                                  if (Math.abs(diferencia) < 0.01) return "text-muted-foreground"
                                  return diferencia > 0 ? "text-amber-600" : "text-red-600"
                                }

                                return (
                                  <TableRow key={dayDate} className={totalVentasDia === 0 && totalCierreCaja === 0 ? "opacity-50" : ""}>
                                    <TableCell className="font-medium">
                                      <div className="flex flex-col">
                                        <span className="capitalize">{day.dayName}</span>
                                        <span className="text-sm text-muted-foreground">{day.dayNumber}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex flex-col items-end">
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                          {formatCurrency(totalVentasDia)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {cantidadVentas} ventas
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex flex-col items-end">
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                          {formatCurrency(totalCierreCaja)}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {totalVentasDia === 0 && totalCierreCaja === 0 ? (
                                        <Badge variant="outline" className="text-xs">
                                          Sin actividad
                                        </Badge>
                                      ) : hayCierreCaja ? (
                                        <Badge 
                                          variant={estadoCierre === 'cerrado' ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {estadoCierre === 'cerrado' ? 'Cerrado' : 'Abierto'}
                                        </Badge>
                                      ) : (
                                        <Badge variant="destructive" className="text-xs">
                                          Sin cierre
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className={`text-right ${getDiferenciaColor()}`}>
                                      {totalVentasDia === 0 && totalCierreCaja === 0 ? (
                                        <span className="text-muted-foreground">-</span>
                                      ) : (
                                        <div className="flex items-center justify-end gap-1">
                                          {getDiferenciaIcon()}
                                          <span className="font-semibold">
                                            {diferencia > 0 ? '+' : ''}{formatCurrency(diferencia)}
                                          </span>
                                        </div>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="gastos-personal" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Filtros de fecha */}
              <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl font-bold">
                        <Filter className="h-6 w-6 text-primary" />
                        Filtros de Análisis
                      </CardTitle>
                      <CardDescription>
                        Selecciona el rango de fechas para analizar
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="date"
                        value={expensesDateRange.start}
                        onChange={(e) => setExpensesDateRange(prev => ({ ...prev, start: e.target.value }))}
                        inputSize="default"
                      />
                      <span className="text-muted-foreground font-semibold">al</span>
                      <Input
                        type="date"
                        value={expensesDateRange.end}
                        onChange={(e) => setExpensesDateRange(prev => ({ ...prev, end: e.target.value }))}
                        inputSize="default"
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {isLoadingExpenses ? (
                <div className="flex justify-center py-16">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                    <p className="text-muted-foreground">Cargando estadísticas de gastos...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tarjetas de resumen */}
                  {expenseAverages && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-muted-foreground mb-2">Total Aprobado</p>
                              <p className="text-3xl font-bold text-primary mb-1">
                                {formatCurrency(expenseAverages.total_aprobado)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {expenseAverages.cantidad_total} gastos
                              </p>
                            </div>
                            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Receipt className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-muted-foreground mb-2">Promedio General</p>
                              <p className="text-3xl font-bold text-primary mb-1">
                                {formatCurrency(expenseAverages.promedio_general)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                por gasto
                              </p>
                            </div>
                            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                              <BarChart3 className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-muted-foreground mb-2">Promedio Semanal</p>
                              <p className="text-3xl font-bold text-primary mb-1">
                                {formatCurrency(expenseAverages.promedio_semanal)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                por semana
                              </p>
                            </div>
                            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-muted-foreground mb-2">Promedio Mensual</p>
                              <p className="text-3xl font-bold text-primary mb-1">
                                {formatCurrency(expenseAverages.promedio_mensual)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                por mes
                              </p>
                            </div>
                            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                              <TrendingUp className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Gráficos y tablas */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Ranking de empleados */}
                    <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                          <Users className="h-6 w-6 text-primary" />
                          Ranking de Empleados
                        </CardTitle>
                        <CardDescription>Top 10 empleados con más gastos</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {employeeRanking.length > 0 ? (
                          <div className="space-y-3">
                            {employeeRanking.map((emp, index) => (
                              <div
                                key={emp.id}
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 hover:border-primary/30 border-2 border-transparent transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                                    index === 0 ? 'bg-primary text-white' :
                                    index === 1 ? 'bg-muted-foreground text-white' :
                                    index === 2 ? 'bg-primary/60 text-white' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm">{emp.name}</p>
                                    <p className="text-xs text-muted-foreground">{emp.cantidad_gastos} gastos</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary text-lg">{formatCurrency(emp.monto_total)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No hay datos de empleados</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Gastos por día */}
                    <Card className="rounded-2xl border bg-card shadow-sm dark:shadow-ember">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold">
                          <Calendar className="h-6 w-6 text-primary" />
                          Días con Mayor Volumen
                        </CardTitle>
                        <CardDescription>Distribución diaria de gastos</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {expensesByDay.length > 0 ? (
                          <div style={{ height: "300px" }}>
                            <Bar
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { display: false },
                                }
                              }}
                              data={{
                                labels: expensesByDay.map(d => new Date(d.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })),
                                datasets: [{
                                  label: 'Monto Total',
                                  data: expensesByDay.map(d => d.monto_total),
                                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                  borderRadius: 4,
                                }]
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No hay datos por día</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Alertas de gastos inusuales */}
                  {unusualExpenses.length > 0 && (
                    <Card className="rounded-2xl border-2 border-amber-500 shadow-md dark:shadow-primary-glow bg-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-6 w-6" />
                          Gastos Inusuales Detectados
                        </CardTitle>
                        <CardDescription>
                          Gastos significativamente superiores al promedio
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {unusualExpenses.map(expense => (
                            <div
                              key={expense.gasto_id}
                              className="flex items-start justify-between p-4 bg-card rounded-xl border-2 border-amber-500/30 shadow-sm hover:border-amber-500 transition-all"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="border-amber-500 text-amber-600 font-semibold">
                                    {expense.categoria}
                                  </Badge>
                                  <p className="font-semibold text-foreground">{expense.concepto}</p>
                                </div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  {expense.usuario_solicitante?.name} • {new Date(expense.fecha_gasto).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-amber-600 font-semibold">
                                  {expense.porcentaje_sobre_promedio.toFixed(0)}% sobre el promedio
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-amber-600">{formatCurrency(expense.monto)}</p>
                                <p className="text-xs text-muted-foreground font-semibold">
                                  +{formatCurrency(expense.diferencia_promedio)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

export default DashboardPage
