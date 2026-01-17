"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "../lib/theme"
import { motion } from "framer-motion"
import { useEffect } from "react"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  // Asegurarse de que el tema se aplique correctamente al DOM
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
    }
  }, [theme])

  useEffect(() => {
    const handleToggleThemeEvent = () => {
      toggleTheme()
    }

    window.addEventListener("toggleTheme", handleToggleThemeEvent)

    return () => {
      window.removeEventListener("toggleTheme", handleToggleThemeEvent)
    }
  }, [toggleTheme])

  const handleThemeToggle = () => {
    toggleTheme()
    // Aplicar el cambio inmediatamente
    const newTheme = theme === "light" ? "dark" : "light"
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
    }
  }

  return (
    <motion.button
      onClick={handleThemeToggle}
      className={`
        p-2.5 rounded-xl shadow-md backdrop-blur-sm transition-all duration-300 ease-in-out border-2
        ${theme === "dark"
          ? "bg-muted hover:bg-accent text-primary border-border dark:shadow-primary-glow hover:shadow-fire"
          : "bg-muted hover:bg-accent text-primary border-border"
        }
      `}
      whileHover={{ scale: 1.1, rotate: theme === "dark" ? 180 : 0 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {theme === "dark" ? (
        <Sun size={24} className="animate-spin-slow" />
      ) : (
        <Moon size={24} className="animate-pulse-soft" />
      )}
    </motion.button>
  )
}