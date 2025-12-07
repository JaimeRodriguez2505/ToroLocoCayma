"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  ArrowLeft, 
  Search,
  Bell,
  Settings,
  User,
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  FileText,
  CreditCard,
  Truck,
  Gift,
  Building2,
  Shield,
  BookOpen
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'

interface MobileLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
  showSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  headerActions?: React.ReactNode
  className?: string
  contentClassName?: string
}

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  badge?: number
  requiredRole?: number[]
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'sales', label: 'Nueva Venta', icon: ShoppingCart, path: '/sales/new' },
  { id: 'sales-history', label: 'Historial Ventas', icon: FileText, path: '/sales' },
  { id: 'products', label: 'Productos', icon: Package, path: '/products' },
  { id: 'categories', label: 'Categorías', icon: BarChart3, path: '/categories' },
  { id: 'users', label: 'Usuarios', icon: Users, path: '/users', requiredRole: [1] },
  { id: 'cash', label: 'Caja Diaria', icon: CreditCard, path: '/cash-register' },
  { id: 'comandas', label: 'Comandas', icon: Truck, path: '/comandas' },
  { id: 'offers', label: 'Ofertas', icon: Gift, path: '/offers' },
  { id: 'company', label: 'Empresa', icon: Building2, path: '/company', requiredRole: [1] },
  { id: 'audit', label: 'Auditoría', icon: Shield, path: '/audit-logs', requiredRole: [1] },
  { id: 'libro', label: 'Libro Reclamaciones', icon: BookOpen, path: '/libro-reclamaciones' }
]

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  headerActions,
  className,
  contentClassName
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Filtrar menú según rol del usuario
  const filteredMenuItems = menuItems.filter(item => 
    !item.requiredRole || item.requiredRole.includes(user?.id_role || 0)
  )

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
  }, [location.pathname])

  // Prevenir scroll del body cuando el menú está abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/dashboard')
    }
  }

  const handleMenuItemClick = (path: string) => {
    navigate(path)
    setIsMenuOpen(false)
  }

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col", className)}>
      {/* Header móvil */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 safe-top">
        <div className="flex items-center justify-between p-4">
          {/* Lado izquierdo */}
          <div className="flex items-center space-x-3">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-10 w-10 p-0 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="h-10 w-10 p-0 rounded-full"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Lado derecho */}
          <div className="flex items-center space-x-2">
            {showSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="h-10 w-10 p-0 rounded-full"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
            
            {headerActions}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="h-10 w-10 p-0 rounded-full"
            >
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Barra de búsqueda expandible */}
        <AnimatePresence>
          {isSearchOpen && showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-10 h-12 text-base bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Contenido principal */}
      <main className={cn("flex-1 overflow-auto", contentClassName)}>
        {children}
      </main>

      {/* Menú lateral */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Menú */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-800 z-50 shadow-xl safe-left safe-top safe-bottom"
            >
              {/* Header del menú */}
              <div className="bg-gradient-to-r from-fire-600 to-ember-600 text-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Toro Loco ERP</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(false)}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{user?.name || 'Usuario'}</p>
                    <p className="text-sm text-white/80">
                      {user?.id_role === 1 ? 'Administrador' : 'Cajero'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items del menú */}
              <div className="flex-1 overflow-auto p-4">
                <nav className="space-y-2">
                  {filteredMenuItems.map((item) => {
                    const isActive = location.pathname === item.path || 
                      (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuItemClick(item.path)}
                        className={cn(
                          "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                          isActive
                            ? "bg-toro-red text-white shadow-lg"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Footer del menú */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-ember-600 dark:text-ember-400 hover:bg-ember-50 dark:hover:bg-ember-900/20 transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileLayout