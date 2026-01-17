"use client"

import { useState, useEffect } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Zap } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormMessage } from "../../components/ui/form"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../lib/theme"
import { motion, AnimatePresence } from "framer-motion"
import { useDocumentTitle } from "../../hooks/useDocumentTitle"
import logo from "../../assets/logo.png"

const loginSchema = z.object({
  email: z.string().email("Ingrese un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type LoginFormValues = z.infer<typeof loginSchema>

const LoginPage = () => {
  useDocumentTitle("Inicio de Sesión | Toro Loco Cayma")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeField, setActiveField] = useState<string | null>(null)
  const { login, isAuthenticated, checkAuth } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [isAuth, setIsAuth] = useState(false)
  const [pageLoaded, setPageLoaded] = useState(false)

  // Para animación de partículas
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; color: string; shadow: string; speed: number }>
  >([])

  useEffect(() => {
    // Crear partículas aleatorias con colores basados en el tema (Intense Red + Neutral)
    const newParticles = Array.from({ length: 30 }).map((_, i) => {
      // Colores fuego/brasas (Rojo Intenso)
      const isRed = Math.random() > 0.3; // 70% red, 30% white/grey
      const r = isRed ? Math.floor(Math.random() * 55) + 200 : 255; 
      const g = isRed ? Math.floor(Math.random() * 20) : 255;
      const b = isRed ? Math.floor(Math.random() * 20) : 255;
      const alpha = Math.random() * 0.5 + 0.1;

      return {
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 4 + 1,
        color: `rgba(${r}, ${g}, ${b}, ${alpha})`,
        shadow: `0 0 ${Math.random() * 15 + 5}px rgba(${r}, ${g}, ${b}, ${alpha})`,
        speed: Math.random() * 20 + 5,
      }
    })

    setParticles(newParticles)

    const timer = setTimeout(() => {
      setPageLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [theme])

  useEffect(() => {
    const auth = checkAuth()
    setIsAuth(auth)

    const sessionExpired = localStorage.getItem("session_expired")
    if (sessionExpired) {
      toast.error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.")
      localStorage.removeItem("session_expired")
    }

    // Force dark mode for login page consistency
    document.documentElement.classList.add("dark")
  }, [checkAuth])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  if (isAuth || isAuthenticated) {
    return <Navigate to="/" />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        delayChildren: 0.2,
        duration: 0.5,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  const decorationVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.2 + i * 0.2,
        duration: 1.5,
        ease: "easeOut",
      },
    }),
  }

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      navigate("/")
    } catch (error: any) {
      setIsLoading(false)
      if (error.message && error.message.includes("Acceso denegado fuera del horario laboral")) {
        toast.error(error.message, { duration: 5000 })
      } else if (error.message && error.message.includes("No tienes autorización para acceder al sistema")) {
        toast.error("No tienes autorización para acceder al sistema. Contacta con un administrador.", { duration: 6000 })
      } else {
        if (error.response?.status === 400) {
          toast.error(error.response?.data?.msg || error.response?.data?.message || "Credenciales incorrectas")
        } else {
          toast.error(error.response?.data?.message || error.message || "Error al iniciar sesión")
        }
      }
    }
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-background text-foreground selection:bg-primary/30 font-sans">
      <AnimatePresence>
        {pageLoaded && (
          <>
            {/* Background Decorations - Minimalist & Intense */}
            <motion.div
              className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 bg-primary"
              custom={1}
              initial="hidden"
              animate="visible"
              variants={decorationVariants}
            />
            <motion.div
              className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-15 bg-primary"
              custom={2}
              initial="hidden"
              animate="visible"
              variants={decorationVariants}
            />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%) pointer-events-none opacity-20"></div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Particles */}
      <div className="absolute w-full h-full overflow-hidden pointer-events-none z-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full mix-blend-screen"
            initial={{ x: particle.x, y: particle.y, opacity: 0 }}
            animate={{
              y: [particle.y, particle.y - Math.random() * 200 - 50],
              opacity: [0, particle.color.includes('255, 255, 255') ? 0.3 : 0.6, 0],
            }}
            transition={{
              duration: particle.speed,
              delay: Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              boxShadow: particle.shadow,
            }}
          />
        ))}
      </div>

      {/* Main Container */}
      <motion.div
        className="w-full min-h-screen p-4 relative z-10 flex items-center justify-center"
        initial="hidden"
        animate={pageLoaded ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <motion.div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24" variants={containerVariants}>
          
          {/* Left Section - Branding */}
          <motion.div className="w-full max-w-lg flex flex-col items-center lg:items-start text-center lg:text-left" variants={itemVariants}>
            <div className="relative mb-10 group cursor-default">
              <motion.div 
                className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full scale-150 group-hover:bg-primary/30 transition-all duration-700"
                animate={{ scale: [1.4, 1.6, 1.4], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
              ></motion.div>
              <motion.img 
                src={logo}
                alt="Toro Loco Logo" 
                className="w-64 h-64 lg:w-80 lg:h-80 object-contain relative z-10 drop-shadow-[0_0_50px_rgba(236,19,19,0.3)] transform group-hover:scale-105 transition-transform duration-500"
                variants={itemVariants}
              />
            </div>

            <motion.h1 className="text-5xl md:text-7xl font-bold mb-4 tracking-tight font-heading" variants={itemVariants}>
              <span className="text-white">TORO</span>
              <span className="text-primary glow-text ml-4">LOCO</span>
            </motion.h1>

            <motion.div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent mb-6 rounded-full" variants={itemVariants} />

            <motion.p className="text-xl text-neutral-400 font-light max-w-md leading-relaxed" variants={itemVariants}>
              Sistema integral de gestión para restaurantes. Control, eficiencia y velocidad en tiempo real.
            </motion.p>
          </motion.div>

          {/* Right Section - Login Form */}
          <motion.div className="w-full max-w-[420px]" variants={itemVariants}>
            <motion.div
              className="relative overflow-hidden rounded-3xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 shadow-2xl"
              variants={itemVariants}
              whileHover={{ boxShadow: "0 0 50px -10px rgba(236, 19, 19, 0.15)", borderColor: "rgba(255, 255, 255, 0.1)" }}
            >
              {/* Top Gradient Line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />

              <div className="p-8 md:p-10 relative z-10">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2 font-heading">Bienvenido</h2>
                  <p className="text-neutral-400 text-sm">Ingresa a tu panel de control</p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-5">
                    
                    {/* Email Field */}
                    <motion.div variants={itemVariants}>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className={`group relative transition-all duration-300 rounded-2xl bg-black/40 border border-white/5 ${
                                activeField === "email" ? 'border-primary/50 shadow-[0_0_20px_-5px_rgba(236,19,19,0.3)]' : 'hover:border-white/10'
                              }`}>
                                <div className="flex items-center px-4 py-3.5">
                                  <div className={`p-2 rounded-xl transition-colors ${
                                    activeField === "email" ? 'bg-primary/10 text-primary' : 'bg-neutral-800/50 text-neutral-400'
                                  }`}>
                                    <Mail size={18} />
                                  </div>
                                  <div className="flex-1 ml-3">
                                    <label className={`block text-[10px] uppercase tracking-wider font-semibold transition-colors ${
                                      activeField === "email" ? 'text-primary' : 'text-neutral-500'
                                    }`}>
                                      Correo
                                    </label>
                                    <input
                                      {...field}
                                      onFocus={() => setActiveField("email")}
                                      onBlur={() => setActiveField(null)}
                                      placeholder="usuario@toroloco.com"
                                      className="w-full bg-transparent border-none text-sm text-white placeholder-neutral-600 focus:ring-0 p-0 mt-0.5 font-medium"
                                    />
                                  </div>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs text-primary mt-1" />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    {/* Password Field */}
                    <motion.div variants={itemVariants}>
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className={`group relative transition-all duration-300 rounded-2xl bg-black/40 border border-white/5 ${
                                activeField === "password" ? 'border-primary/50 shadow-[0_0_20px_-5px_rgba(236,19,19,0.3)]' : 'hover:border-white/10'
                              }`}>
                                <div className="flex items-center px-4 py-3.5">
                                  <div className={`p-2 rounded-xl transition-colors ${
                                    activeField === "password" ? 'bg-primary/10 text-primary' : 'bg-neutral-800/50 text-neutral-400'
                                  }`}>
                                    <Lock size={18} />
                                  </div>
                                  <div className="flex-1 ml-3 relative">
                                    <label className={`block text-[10px] uppercase tracking-wider font-semibold transition-colors ${
                                      activeField === "password" ? 'text-primary' : 'text-neutral-500'
                                    }`}>
                                      Contraseña
                                    </label>
                                    <input
                                      type={showPassword ? "text" : "password"}
                                      {...field}
                                      onFocus={() => setActiveField("password")}
                                      onBlur={() => setActiveField(null)}
                                      placeholder="••••••••"
                                      className="w-full bg-transparent border-none text-sm text-white placeholder-neutral-600 focus:ring-0 p-0 mt-0.5 font-medium"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    className="p-2 text-neutral-500 hover:text-white transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs text-primary mt-1" />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center text-white shadow-lg transition-all duration-300 mt-6 relative overflow-hidden group ${
                        isLoading ? 'opacity-80 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                      style={{
                        background: "linear-gradient(135deg, #EC1313 0%, #B91010 100%)",
                        boxShadow: "0 10px 30px -10px rgba(236, 19, 19, 0.5)"
                      }}
                      whileHover={{ boxShadow: "0 15px 35px -5px rgba(236, 19, 19, 0.6)" }}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-2xl" />
                      
                      {isLoading ? (
                        <div className="flex items-center gap-2 relative z-10">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Procesando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 relative z-10">
                          <span>Iniciar Sesión</span>
                          <Zap size={18} className="fill-white" />
                        </div>
                      )}
                    </motion.button>

                  </form>
                </Form>
              </div>

              {/* Footer Status */}
              <div className="bg-black/40 px-8 py-4 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <span>Seguro</span>
                </div>
                <div>v2.0.26</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default LoginPage
