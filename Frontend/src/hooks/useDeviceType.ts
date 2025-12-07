import { useState, useEffect } from 'react'

export interface DeviceType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  isTouchDevice: boolean
}

export const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: 1024,
    isTouchDevice: false
  })

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Definir breakpoints
      const isMobile = width < 768  // < 768px = móvil
      const isTablet = width >= 768 && width < 1024  // 768px - 1024px = tablet
      const isDesktop = width >= 1024  // >= 1024px = desktop

      setDeviceType({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        isTouchDevice
      })
    }

    // Detectar al cargar
    updateDeviceType()

    // Escuchar cambios de tamaño
    window.addEventListener('resize', updateDeviceType)
    
    // Detectar orientación para mobile/tablet
    window.addEventListener('orientationchange', () => {
      setTimeout(updateDeviceType, 100) // Delay para obtener las dimensiones correctas
    })

    return () => {
      window.removeEventListener('resize', updateDeviceType)
      window.removeEventListener('orientationchange', updateDeviceType)
    }
  }, [])

  return deviceType
}

// Hook para obtener solo si es móvil/tablet (para simplificar uso)
export const useIsMobileOrTablet = (): boolean => {
  const { isMobile, isTablet } = useDeviceType()
  return isMobile || isTablet
}
