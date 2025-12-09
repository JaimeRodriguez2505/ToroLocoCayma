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
  XCircle,
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

  // Añadir el hook para obtener los datos de los gráficos dentro del componente DashboardPage, justo después de la declaración de los hooks existentes:
  const {
    monthlySalesData,
    monthlyRevenueData,
    topProductsData,
    paymentMethodData,
    isLoading: isLoadingCharts,
  } = useSalesChartsData()

  // Fetch dashboard stats
  const { isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
    // If the API doesn't have a dashboard stats endpoint, we'll simulate it
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

  // Cargar estadísticas de gastos cuando cambie el rango de fechas
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

  // Define stat card styles
  const statCards = [
    {
      title: "Productos",
      value: totalProducts,
      description: "Total en inventario",
      icon: <Package className="h-5 w-5" />,
      color: "from-toro-red to-red-600",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-toro-red dark:text-toro-red",
      linkTo: "/products",
    },
    {
      title: "Categorías",
      value: totalCategories,
      description: "Categorías registradas",
      icon: <Tags className="h-5 w-5" />,
      color: "from-ember-500 to-ember-600",
      iconBg: "bg-ember-100 dark:bg-ember-900/30",
      iconColor: "text-ember-600 dark:text-ember-400",
      linkTo: "/categories",
    },
    {
      title: "Ventas",
      value: totalSales,
      description: "Ventas realizadas",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "from-red-500 to-red-700",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      linkTo: "/sales",
    },
    {
      title: "Ingresos",
      value: isLoading ? "..." : formatCurrency(totalRevenue),
      description: "Ingresos totales",
      icon: <DollarSign className="h-5 w-5" />,
      color: "from-emerald-500 to-green-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      linkTo: "/sales",
    },
  ]
  // Define quick action buttons
  const quickActions = [
    {
      title: "Gestionar Productos",
      icon: <Package className="h-5 w-5" />,
      color: "text-toro-red dark:text-toro-red",
      gradient: "from-toro-red to-red-600",
      hoverBg: "hover:bg-red-50 dark:hover:bg-red-950/50",
      link: "/products",
    },
    {
      title: "Gestionar Categorías",
      icon: <Tags className="h-5 w-5" />,
      color: "text-ember-600 dark:text-ember-400",
      gradient: "from-ember-500 to-ember-600",
      hoverBg: "hover:bg-ember-50 dark:hover:bg-ember-950/50",
      link: "/categories",
    },
    {
      title: "Registrar Venta",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "text-red-600 dark:text-red-400",
      gradient: "from-red-500 to-red-700",
      hoverBg: "hover:bg-red-50 dark:hover:bg-red-950/50",
      link: "/sales",
      needsBusinessHours: true,
    },
    {
      title: "Ver Historial de Ventas",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "text-emerald-600 dark:text-emerald-400",
      gradient: "from-emerald-500 to-green-600",
      hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/50",
      link: "/sales",
    },
  ]
  return (
    <div className="min-h-screen bg-background p-2 sm:p-3 lg:p-4 space-y-4 sm:space-y-6">
      {/* Dashboard Header */}
      <motion.div
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-fire-700 dark:text-white">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">Bienvenido al panel de control de Toro Loco Cayma</p>
        </div>

        {/* Nueva Venta Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <motion.div
                  whileHover={isWithinBusinessHours ? { scale: 1.05 } : {}}
                  whileTap={isWithinBusinessHours ? { scale: 0.95 } : {}}
                >
                  <Button
                    asChild={isWithinBusinessHours}
                    disabled={!isWithinBusinessHours}
                    size="lg"
                    className={`relative overflow-hidden transition-all duration-300 ${
                      isWithinBusinessHours
                        ? "bg-gradient-to-r from-toro-red via-red-500 to-red-600 hover:from-red-600 hover:via-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl"
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                    }`}
                  >
                    {isWithinBusinessHours ? (
                      <Link to="/sales">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Ventas
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
                className="bg-amber-50 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200 border-amber-200 dark:border-amber-800/30"
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
      </motion.div>{" "}
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <Card className="relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group toro-card-hover">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.color}`}></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground/80">{card.title}</h3>
                  <div
                    className={`h-12 w-12 rounded-xl ${card.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}
                  >
                    <span className={card.iconColor}>{card.icon}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-foreground">
                    {isLoading ? <div className="h-8 w-16 bg-muted animate-pulse rounded"></div> : card.value}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{card.description}</p>{" "}
                    <Link
                      to={card.linkTo}
                      className={`text-sm font-medium ${card.iconColor} flex items-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:underline`}
                    >
                      Ver <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>{" "}
      {/* Dashboard Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-6"
      >
        <Tabs defaultValue="paneles" className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <div className="border-b border-border">
            <TabsList className="h-auto bg-transparent p-0 space-x-1">
              <TabsTrigger
                value="paneles"
                className="relative h-12 px-6 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-fire-500 data-[state=active]:text-fire-600 dark:data-[state=active]:text-fire-400 rounded-none transition-all duration-200"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Paneles de Control
              </TabsTrigger>
              <TabsTrigger
                value="estadisticas"
                className="relative h-12 px-6 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-ember-500 data-[state=active]:text-ember-600 dark:data-[state=active]:text-ember-400 rounded-none transition-all duration-200"
              >
                <LineChart className="h-4 w-4 mr-2" />
                Análisis Mensual
              </TabsTrigger>
              <TabsTrigger
                value="semanal"
                className="relative h-12 px-6 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 rounded-none transition-all duration-200"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Análisis Semanal
              </TabsTrigger>
              <TabsTrigger
                value="caja-semanal"
                className="relative h-12 px-6 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 rounded-none transition-all duration-200"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Control Semanal
              </TabsTrigger>
              <TabsTrigger
                value="gastos-personal"
                className="relative h-12 px-6 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 rounded-none transition-all duration-200"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Gastos Personal
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Panel de Control Tab Content */}
          <TabsContent value="paneles" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="lg:col-span-1"
              >
                <Card className="relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm shadow-lg h-full toro-card-hover">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-toro-red to-red-600"></div>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-foreground">Acciones Rápidas</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Accede a las funciones principales
                    </CardDescription>
                  </CardHeader>{" "}
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
                                  variant="outline"
                                  className={`w-full justify-start gap-3 h-12 transition-all duration-200 ${action.hoverBg} ${
                                    isDisabled
                                      ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                                      : "bg-background border-border hover:shadow-md"
                                  }`}
                                  disabled={isDisabled}
                                >
                                  {!isDisabled ? (
                                    <Link to={action.link} className="flex items-center gap-3 w-full">
                                      <div className={`p-2 rounded-lg bg-gradient-to-br ${action.gradient} text-white`}>
                                        {action.icon}
                                      </div>
                                      <span className="font-medium">{action.title}</span>
                                    </Link>
                                  ) : (
                                    <div className="flex items-center gap-3 w-full">
                                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">{action.icon}</div>
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
                                className="bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-200 dark:border-amber-800"
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
                      )
                    })}
                  </CardContent>
                </Card>
              </motion.div>{" "}
              {/* Recent Sales Summary */}
              <motion.div
                className="lg:col-span-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card className="relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm shadow-lg h-full toro-card-hover">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-700"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-semibold text-foreground">Ventas Recientes</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Últimas transacciones realizadas
                      </CardDescription>
                    </div>
                    {sales && sales.length > 0 && (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
                      >
                        <Link to="/sales">Ver todas</Link>
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isLoadingSales ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : sales && sales.length > 0 ? (
                      <div className="space-y-4">
                        {sales.slice(0, 5).map((sale, index) => (
                          <motion.div
                            key={sale.venta_id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 * index }}
                          >
                            <div className="sale-item-info flex flex-col">
                              <div className="sale-item-header flex items-center">
                                <span className="sale-item-id font-medium">Venta #{sale.venta_id}</span>
                                <span className="sale-item-method ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                  {sale.metodo_pago}
                                </span>
                              </div>
                              <span className="sale-item-date text-xs text-muted-foreground">
                                {new Date(sale.fecha).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="sale-item-amount flex items-center gap-2">
                              <span className="sale-item-value font-medium text-foreground">
                                {formatCurrency(Number.parseFloat(sale.total_con_igv))}
                              </span>
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="sale-item-link opacity-0 group-hover:opacity-100 transition-opacity text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                              >
                                <Link to={`/sales/${sale.venta_id}`}>
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-sales flex flex-col items-center justify-center py-8">
                        <AlertCircle className="h-10 w-10 text-gray-400 mb-4" />
                        <p className="text-sm text-muted-foreground">No hay ventas registradas aún.</p>
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
              className="space-y-4"
            >
              <Card className="relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">Control de Caja Diaria</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Comparación entre ventas del día y cierre de caja registrado
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-auto"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(isLoadingDailySales || isLoadingCierreCaja) ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        // Función para calcular el total real de ventas (considerando descuentos)
                        const calculateRealSalesTotal = (sales: any[]) => {
                          return sales.reduce((sum, sale) => {
                            const baseTotal = Number(sale.total_con_igv) || 0
                            const discount = (sale.es_descuento && sale.descuento) ? Number(sale.descuento) : 0
                            return sum + (baseTotal - discount)
                          }, 0)
                        }

                        // Calcular totales de ventas del día (con descuentos aplicados)
                        const totalVentasDia = calculateRealSalesTotal(dailySales || [])
                        const cantidadVentas = dailySales?.length || 0

                        // Obtener datos del cierre de caja
                        let cierreCajaData = null
                        if (Array.isArray(cierreCaja)) {
                          cierreCajaData = cierreCaja.find(c => c.fecha_apertura?.startsWith(selectedDate)) || cierreCaja[0]
                        } else if (cierreCaja) {
                          cierreCajaData = cierreCaja
                        }

                        const totalCierreCaja = cierreCajaData ? (
                          Number(cierreCajaData.saldo_efectivo) || 0
                        ) : 0

                        const diferencia = totalVentasDia - totalCierreCaja
                        const hayCierreCaja = !!cierreCajaData
                        const estadoCierre = cierreCajaData?.estado || 'Sin cierre'

                        const getDiferenciaIcon = () => {
                          if (Math.abs(diferencia) < 0.01) return <Minus className="h-4 w-4 text-gray-500" />
                          return diferencia > 0 
                            ? <TrendingUp className="h-4 w-4 text-amber-500" />
                            : <TrendingDown className="h-4 w-4 text-red-500" />
                        }

                        const getDiferenciaColor = () => {
                          if (Math.abs(diferencia) < 0.01) return "text-gray-600"
                          return diferencia > 0 ? "text-amber-600" : "text-red-600"
                        }

                        return (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Concepto</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead className="text-center">Estado</TableHead>
                                <TableHead className="text-right">Diferencia</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                                    Total Ventas del Día
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {cantidadVentas} transacciones
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-blue-600">
                                  {formatCurrency(totalVentasDia)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Sistema
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">-</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    Efectivo Disponible en Caja
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Saldo de efectivo registrado
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-green-600">
                                  {formatCurrency(totalCierreCaja)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {hayCierreCaja ? (
                                    <Badge 
                                      variant={estadoCierre === 'cerrado' ? 'default' : 'secondary'}
                                      className={estadoCierre === 'cerrado' 
                                        ? "bg-green-50 text-green-700 border-green-200" 
                                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      }
                                    >
                                      {estadoCierre === 'cerrado' ? (
                                        <>
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Cerrado
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="h-3 w-3 mr-1" />
                                          Abierto
                                        </>
                                      )}
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Sin cierre
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">-</TableCell>
                              </TableRow>
                              <TableRow className="border-t-2 border-gray-200">
                                <TableCell className="font-bold">
                                  <div className="flex items-center gap-2">
                                    {getDiferenciaIcon()}
                                    Diferencia
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Ventas vs Efectivo en Caja
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">-</TableCell>
                                <TableCell className="text-center">
                                  {Math.abs(diferencia) < 0.01 ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Cuadrado
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Descuadre
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className={`text-right font-bold ${getDiferenciaColor()}`}>
                                  {diferencia > 0 ? '+' : ''}{formatCurrency(diferencia)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        )
                      })()}

                      {/* Información adicional */}
                      <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">Información importante:</p>
                            <ul className="space-y-1 text-xs">
                              <li>• Los datos de ventas se obtienen en tiempo real del sistema</li>
                              <li>• El efectivo disponible debe registrarse en el cierre de caja</li>
                              <li>• Una diferencia mayor a S/1.00 requiere revisión</li>
                              <li>• Puedes acceder al módulo de <Link to="/cash-register" className="text-blue-600 hover:underline">Caja Diaria</Link> para gestionar cierres</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Estadísticas Tab Content */}
          <TabsContent value="estadisticas" className="mt-0 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-fire-700 dark:text-white">
                  Estadísticas y Tendencias Mensuales
                </h2>
              </div>

              {isLoadingCharts ? (
                <div className="flex justify-center py-16">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                    <p className="text-muted-foreground">Cargando estadísticas...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Monthly Charts with improved animations */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {monthlySalesData && (
                      <Card className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-fire-600"></div>
                        <CardHeader className="pb-2">
                          <CardTitle>Ventas Mensuales</CardTitle>
                          <CardDescription>Número de ventas por mes en el año actual</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ height: "320px" }} className="p-2">
                            <Bar
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: "top",
                                  },
                                  tooltip: {
                                    backgroundColor: "rgba(99, 102, 241, 0.9)",
                                    titleColor: "#ffffff",
                                    bodyColor: "#ffffff",
                                    borderColor: "rgba(99, 102, 241, 0.3)",
                                    borderWidth: 1,
                                    padding: 12,
                                    cornerRadius: 8,
                                  },
                                },
                                scales: {
                                  x: {
                                    grid: {
                                      display: false,
                                    },
                                  },
                                  y: {
                                    beginAtZero: true,
                                  },
                                },
                                animation: {
                                  duration: 1000,
                                  easing: "easeOutQuart",
                                },
                              }}
                              data={monthlySalesData}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {monthlyRevenueData && (
                      <Card className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-ember-500 to-ember-600"></div>
                        <CardHeader className="pb-2">
                          <CardTitle>Ingresos Mensuales</CardTitle>
                          <CardDescription>Tendencia de ingresos por mes en el año actual</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ height: "320px" }} className="p-2">
                            <Line
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: "top",
                                  },
                                  tooltip: {
                                    backgroundColor: "rgba(139, 92, 246, 0.9)",
                                    titleColor: "#ffffff",
                                    bodyColor: "#ffffff",
                                    borderColor: "rgba(139, 92, 246, 0.3)",
                                    borderWidth: 1,
                                    padding: 12,
                                    cornerRadius: 8,
                                  },
                                },
                                scales: {
                                  x: {
                                    grid: {
                                      display: false,
                                    },
                                  },
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: (value) => {
                                        if (typeof value === "number") {
                                          return "S/ " + value.toLocaleString("es-PE")
                                        }
                                        return value
                                      },
                                    },
                                  },
                                },
                                animation: {
                                  duration: 1500,
                                  easing: "easeOutQuart",
                                },
                              }}
                              data={monthlyRevenueData}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Top Products and Payment Method Charts */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {topProductsData && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                      >
                        <Card className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-green-600"></div>
                          <CardHeader className="pb-2">
                            <CardTitle>Productos Más Vendidos</CardTitle>
                            <CardDescription>Top 5 productos con mayor número de unidades vendidas</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div style={{ height: "320px" }} className="p-2">
                              <Bar
                                options={{
                                  indexAxis: "y",
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false,
                                    },
                                    tooltip: {
                                      backgroundColor: "rgba(16, 185, 129, 0.9)",
                                      titleColor: "#ffffff",
                                      bodyColor: "#ffffff",
                                      borderColor: "rgba(16, 185, 129, 0.3)",
                                      borderWidth: 1,
                                      padding: 12,
                                      cornerRadius: 8,
                                    },
                                  },
                                  scales: {
                                    x: {
                                      grid: {
                                        display: false,
                                      },
                                      ticks: {
                                        font: {
                                          size: 11,
                                        },
                                      },
                                      border: {
                                        display: false,
                                      },
                                    },
                                    y: {
                                      grid: {
                                        display: false,
                                      },
                                      ticks: {
                                        font: {
                                          size: 12,
                                        },
                                      },
                                      border: {
                                        display: false,
                                      },
                                    },
                                  },
                                  animation: {
                                    delay: (context) => context.dataIndex * 100,
                                    duration: 1000,
                                    easing: "easeOutQuart",
                                  },
                                  layout: {
                                    padding: {
                                      top: 5,
                                      bottom: 5,
                                      left: 10,
                                      right: 10,
                                    },
                                  },
                                }}
                                data={topProductsData}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {paymentMethodData && (
                      <Card className="border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-ember-500 to-rose-600"></div>
                        <CardHeader className="pb-2">
                          <CardTitle>Métodos de Pago</CardTitle>
                          <CardDescription>Distribución de ventas por método de pago</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ height: "320px" }} className="flex items-center justify-center p-2">
                            <Pie
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: "right",
                                    labels: {
                                      usePointStyle: true,
                                      pointStyle: "circle",
                                      padding: 20,
                                    },
                                  },
                                  tooltip: {
                                    backgroundColor: "rgba(236, 72, 153, 0.9)",
                                    titleColor: "#ffffff",
                                    bodyColor: "#ffffff",
                                    borderColor: "rgba(236, 72, 153, 0.3)",
                                    borderWidth: 1,
                                    padding: 12,
                                    cornerRadius: 8,
                                  },
                                },
                                animation: {
                                  animateRotate: true,
                                  animateScale: true,
                                  duration: 1800,
                                  easing: "easeOutCirc",
                                },
                              }}
                              data={paymentMethodData}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Nueva pestaña de Análisis Semanal */}
          <TabsContent value="semanal" className="mt-0 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <WeeklySalesCharts />
            </motion.div>
          </TabsContent>

          {/* Control Semanal Tab Content */}
          <TabsContent value="caja-semanal" className="mt-0 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-4"
            >
              <Card className="relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm shadow-lg">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">Control de Caja Semanal</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Comparación diaria entre ventas y cierres de caja por semana
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={selectedWeekStart}
                        onChange={(e) => setSelectedWeekStart(e.target.value)}
                        className="w-auto"
                        title="Seleccionar inicio de semana (Lunes)"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(isLoadingWeeklySales || isLoadingWeeklyCierres) ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        // Función para obtener todos los días de la semana
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

                        // Agrupar ventas por día (solo la fecha, sin la hora)
                        const salesByDay = weeklySales?.reduce((acc, sale) => {
                          // Extraer solo la fecha (YYYY-MM-DD) sin la hora
                          const saleDate = sale.fecha.split(' ')[0] // Para fechas como "2025-07-21 11:46:12"
                          if (!acc[saleDate]) {
                            acc[saleDate] = []
                          }
                          acc[saleDate].push(sale)
                          return acc
                        }, {} as Record<string, typeof weeklySales>) || {}

                        // Agrupar cierres por día (solo la fecha, sin la hora)
                        const cierresByDay = weeklyCierres?.reduce((acc: Record<string, any>, cierre: any) => {
                          // Extraer solo la fecha (YYYY-MM-DD) sin la hora
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

                                // Función para calcular el total real de ventas (considerando descuentos)
                                const calculateRealSalesTotal = (sales: any[]) => {
                                  return sales.reduce((sum, sale) => {
                                    const baseTotal = Number(sale.total_con_igv) || 0
                                    const discount = (sale.es_descuento && sale.descuento) ? Number(sale.descuento) : 0
                                    return sum + (baseTotal - discount)
                                  }, 0)
                                }

                                const totalVentasDia = calculateRealSalesTotal(daySales)
                                const cantidadVentas = daySales.length

                                const totalCierreCaja = dayCierre ? (
                                  Number(dayCierre.saldo_efectivo) || 0
                                ) : 0

                                const diferencia = totalVentasDia - totalCierreCaja
                                const hayCierreCaja = !!dayCierre
                                const estadoCierre = dayCierre?.estado || 'Sin cierre'

                                const getDiferenciaIcon = () => {
                                  if (Math.abs(diferencia) < 0.01) return <Minus className="h-4 w-4 text-gray-500" />
                                  return diferencia > 0 
                                    ? <TrendingUp className="h-4 w-4 text-amber-500" />
                                    : <TrendingDown className="h-4 w-4 text-red-500" />
                                }

                                const getDiferenciaColor = () => {
                                  if (Math.abs(diferencia) < 0.01) return "text-gray-600"
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
                                        <span className="font-semibold text-blue-600">
                                          {formatCurrency(totalVentasDia)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {cantidadVentas} ventas
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex flex-col items-end">
                                        <span className="font-semibold text-green-600">
                                          {formatCurrency(totalCierreCaja)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          efectivo disponible
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {totalVentasDia === 0 && totalCierreCaja === 0 ? (
                                        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                                          Sin actividad
                                        </Badge>
                                      ) : hayCierreCaja ? (
                                        <Badge 
                                          variant={estadoCierre === 'cerrado' ? 'default' : 'secondary'}
                                          className={estadoCierre === 'cerrado' 
                                            ? "bg-green-50 text-green-700 border-green-200" 
                                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                          }
                                        >
                                          {estadoCierre === 'cerrado' ? (
                                            <>
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Cerrado
                                            </>
                                          ) : (
                                            <>
                                              <Clock className="h-3 w-3 mr-1" />
                                              Abierto
                                            </>
                                          )}
                                        </Badge>
                                      ) : (
                                        <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Sin cierre
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className={`text-right ${getDiferenciaColor()}`}>
                                      {totalVentasDia === 0 && totalCierreCaja === 0 ? (
                                        <span className="text-gray-400">-</span>
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

                      {/* Resumen semanal */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(() => {
                          // Función para calcular el total real de ventas (considerando descuentos)
                          const calculateRealSalesTotal = (sales: any[]) => {
                            return sales.reduce((sum, sale) => {
                              const baseTotal = Number(sale.total_con_igv) || 0
                              const discount = (sale.es_descuento && sale.descuento) ? Number(sale.descuento) : 0
                              return sum + (baseTotal - discount)
                            }, 0)
                          }

                          const totalVentasSemana = calculateRealSalesTotal(weeklySales || [])
                          const totalCierresSemana = weeklyCierres?.reduce((sum: number, cierre: any) => {
                            return sum + (Number(cierre.saldo_efectivo) || 0)
                          }, 0) || 0
                          const diferenciaSemanal = totalVentasSemana - totalCierresSemana

                          return (
                            <>
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                                <div className="flex items-center gap-2 mb-2">
                                  <ShoppingCart className="h-4 w-4 text-blue-500" />
                                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">Total Ventas Semana</h3>
                                </div>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {formatCurrency(totalVentasSemana)}
                                </p>
                                <p className="text-sm text-blue-600/70 dark:text-blue-300/70">
                                  {weeklySales?.length || 0} transacciones
                                </p>
                              </div>

                              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                                <div className="flex items-center gap-2 mb-2">
                                  <DollarSign className="h-4 w-4 text-green-500" />
                                  <h3 className="font-semibold text-green-700 dark:text-green-300">Efectivo Total Semana</h3>
                                </div>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(totalCierresSemana)}
                                </p>
                                <p className="text-sm text-green-600/70 dark:text-green-300/70">
                                  {weeklyCierres?.length || 0} cierres con efectivo
                                </p>
                              </div>

                              <div className={`p-4 rounded-lg border ${Math.abs(diferenciaSemanal) < 0.01 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' 
                                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  {Math.abs(diferenciaSemanal) < 0.01 ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                  )}
                                  <h3 className={`font-semibold ${Math.abs(diferenciaSemanal) < 0.01 
                                    ? 'text-emerald-700 dark:text-emerald-300' 
                                    : 'text-amber-700 dark:text-amber-300'
                                  }`}>
                                    Diferencia Semanal
                                  </h3>
                                </div>
                                <p className={`text-2xl font-bold ${Math.abs(diferenciaSemanal) < 0.01 
                                  ? 'text-emerald-600 dark:text-emerald-400' 
                                  : diferenciaSemanal > 0 
                                    ? 'text-amber-600 dark:text-amber-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {diferenciaSemanal > 0 ? '+' : ''}{formatCurrency(diferenciaSemanal)}
                                </p>
                                <p className={`text-sm ${Math.abs(diferenciaSemanal) < 0.01 
                                  ? 'text-emerald-600/70 dark:text-emerald-300/70' 
                                  : 'text-amber-600/70 dark:text-amber-300/70'
                                }`}>
                                  {Math.abs(diferenciaSemanal) < 0.01 ? 'Semana cuadrada' : 'Requiere revisión'}
                                </p>
                              </div>
                            </>
                          )
                        })()}
                      </div>

                      {/* Información adicional semanal */}
                      <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">Vista semanal:</p>
                            <ul className="space-y-1 text-xs">
                              <li>• Semana del {selectedWeekStart} al {(() => {
                                const endDate = new Date(selectedWeekStart + 'T00:00:00')
                                endDate.setDate(endDate.getDate() + 6)
                                return endDate.toISOString().split('T')[0]
                              })()}</li>
                              <li>• Los días sin actividad aparecen sombreados</li>
                              <li>• El resumen semanal incluye solo días con datos</li>
                              <li>• Usa el selector de fecha para cambiar la semana (selecciona el lunes)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Gastos de Personal Tab Content */}
          <TabsContent value="gastos-personal" className="mt-0 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Filtros de fecha */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-orange-500" />
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
                        className="w-auto"
                      />
                      <span className="text-muted-foreground">al</span>
                      <Input
                        type="date"
                        value={expensesDateRange.end}
                        onChange={(e) => setExpensesDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-auto"
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {isLoadingExpenses ? (
                <div className="flex justify-center py-16">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-muted-foreground">Cargando estadísticas de gastos...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tarjetas de resumen */}
                  {expenseAverages && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card className="border-0 shadow-lg overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Total Aprobado</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {formatCurrency(expenseAverages.total_aprobado)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {expenseAverages.cantidad_total} gastos
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                              <Receipt className="h-6 w-6 text-orange-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-lg overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-fire-600"></div>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Promedio General</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(expenseAverages.promedio_general)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                por gasto
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <BarChart3 className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-lg overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ember-500 to-ember-600"></div>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Promedio Semanal</p>
                              <p className="text-2xl font-bold text-ember-600">
                                {formatCurrency(expenseAverages.promedio_semanal)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                por semana
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-ember-100 dark:bg-ember-900/30 flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-ember-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-lg overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-600"></div>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Promedio Mensual</p>
                              <p className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(expenseAverages.promedio_mensual)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                por mes
                              </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Gráficos y tablas */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Ranking de empleados */}
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-red-600"></div>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-orange-500" />
                          Ranking de Empleados
                        </CardTitle>
                        <CardDescription>Top 10 empleados con más gastos solicitados</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {employeeRanking.length > 0 ? (
                          <div className="space-y-3">
                            {employeeRanking.map((emp, index) => (
                              <div
                                key={emp.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    index === 0 ? 'bg-yellow-500 text-white' :
                                    index === 1 ? 'bg-gray-400 text-white' :
                                    index === 2 ? 'bg-amber-600 text-white' :
                                    'bg-gray-200 text-gray-700'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{emp.name}</p>
                                    <p className="text-xs text-muted-foreground">{emp.cantidad_gastos} gastos</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-orange-600">{formatCurrency(emp.monto_total)}</p>
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
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-fire-600"></div>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-500" />
                          Días con Mayor Volumen
                        </CardTitle>
                        <CardDescription>Distribución diaria de gastos</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {expensesByDay.length > 0 ? (
                          <div style={{ height: "320px" }} className="p-2">
                            <Bar
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { display: false },
                                  tooltip: {
                                    backgroundColor: "rgba(59, 130, 246, 0.9)",
                                    padding: 12,
                                    cornerRadius: 8,
                                  }
                                },
                                scales: {
                                  x: { grid: { display: false } },
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: (value) => typeof value === "number" ? formatCurrency(value) : value
                                    }
                                  }
                                }
                              }}
                              data={{
                                labels: expensesByDay.map(d => new Date(d.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })),
                                datasets: [{
                                  label: 'Monto Total',
                                  data: expensesByDay.map(d => d.monto_total),
                                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                  borderColor: 'rgb(59, 130, 246)',
                                  borderWidth: 2,
                                  borderRadius: 8,
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

                  {/* Comparativa de períodos */}
                  {expenseAverages && expenseAverages.por_semana.length > 0 && (
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card className="border-0 shadow-lg overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-ember-500 to-ember-600"></div>
                        <CardHeader>
                          <CardTitle>Tendencia Semanal</CardTitle>
                          <CardDescription>Comparativa de gastos semanales</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ height: "280px" }} className="p-2">
                            <Line
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { display: false },
                                  tooltip: {
                                    backgroundColor: "rgba(139, 92, 246, 0.9)",
                                    padding: 12,
                                    cornerRadius: 8,
                                  }
                                },
                                scales: {
                                  x: { grid: { display: false } },
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: (value) => typeof value === "number" ? formatCurrency(value) : value
                                    }
                                  }
                                }
                              }}
                              data={{
                                labels: expenseAverages.por_semana.map((w: { semana: string; monto: number }) => {
                                  const date = new Date(w.semana)
                                  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
                                }),
                                datasets: [{
                                  label: 'Gastos Semanales',
                                  data: expenseAverages.por_semana.map((w: { semana: string; monto: number }) => w.monto),
                                  borderColor: 'rgb(139, 92, 246)',
                                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                  fill: true,
                                  tension: 0.4,
                                  pointRadius: 5,
                                  pointHoverRadius: 7,
                                }]
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-lg overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-green-600"></div>
                        <CardHeader>
                          <CardTitle>Tendencia Mensual</CardTitle>
                          <CardDescription>Comparativa de gastos mensuales</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div style={{ height: "280px" }} className="p-2">
                            <Line
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { display: false },
                                  tooltip: {
                                    backgroundColor: "rgba(16, 185, 129, 0.9)",
                                    padding: 12,
                                    cornerRadius: 8,
                                  }
                                },
                                scales: {
                                  x: { grid: { display: false } },
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: (value) => typeof value === "number" ? formatCurrency(value) : value
                                    }
                                  }
                                }
                              }}
                              data={{
                                labels: expenseAverages.por_mes.map((m: { mes: string; monto: number }) => {
                                  const [, month] = m.mes.split('-')
                                  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                                  return monthNames[parseInt(month) - 1]
                                }),
                                datasets: [{
                                  label: 'Gastos Mensuales',
                                  data: expenseAverages.por_mes.map((m: { mes: string; monto: number }) => m.monto),
                                  borderColor: 'rgb(16, 185, 129)',
                                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                  fill: true,
                                  tension: 0.4,
                                  pointRadius: 5,
                                  pointHoverRadius: 7,
                                }]
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Alertas de gastos inusuales */}
                  {unusualExpenses.length > 0 && (
                    <Card className="border-0 shadow-lg overflow-hidden border-l-4 border-l-amber-500">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          Gastos Inusuales Detectados
                        </CardTitle>
                        <CardDescription>
                          Gastos significativamente superiores al promedio (2+ desviaciones estándar)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {unusualExpenses.map(expense => (
                            <div
                              key={expense.gasto_id}
                              className="flex items-start justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                    {expense.categoria}
                                  </Badge>
                                  <p className="font-medium">{expense.concepto}</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {expense.usuario_solicitante?.name} • {new Date(expense.fecha_gasto).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                                  {expense.porcentaje_sobre_promedio.toFixed(0)}% sobre el promedio
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-amber-600">{formatCurrency(expense.monto)}</p>
                                <p className="text-xs text-muted-foreground">
                                  +{formatCurrency(expense.diferencia_promedio)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Información adicional */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Información sobre las estadísticas:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Los datos se actualizan en tiempo real según el rango de fechas seleccionado</li>
                          <li>• El ranking muestra empleados ordenados por monto total de gastos</li>
                          <li>• Los promedios incluyen solo gastos aprobados</li>
                          <li>• Los gastos inusuales se detectan automáticamente usando análisis estadístico</li>
                          <li>• Puedes gestionar gastos desde el módulo de <Link to="/gastos-personal" className="text-blue-600 hover:underline font-medium">Gastos de Personal</Link></li>
                        </ul>
                      </div>
                    </div>
                  </div>
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
