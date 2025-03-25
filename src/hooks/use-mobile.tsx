
import * as React from "react"

// Define various breakpoints for responsive design
const SMALL_MOBILE_BREAKPOINT = 480
const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024
const DESKTOP_BREAKPOINT = 1280

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Initial check
    checkMobile()
    
    // Set up event listener for window resize
    window.addEventListener("resize", checkMobile)
    
    // Clean up
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Return false during SSR, true/false during CSR
  return isMobile === null ? false : isMobile
}

export function useIsSmallMobile() {
  const [isSmallMobile, setIsSmallMobile] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const checkSmallMobile = () => {
      setIsSmallMobile(window.innerWidth < SMALL_MOBILE_BREAKPOINT)
    }
    
    // Initial check
    checkSmallMobile()
    
    // Set up event listener for window resize
    window.addEventListener("resize", checkSmallMobile)
    
    // Clean up
    return () => window.removeEventListener("resize", checkSmallMobile)
  }, [])

  // Return false during SSR, true/false during CSR
  return isSmallMobile === null ? false : isSmallMobile
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isMobile: false,
    isSmallMobile: false,
    isTablet: false,
    isDesktop: false,
  })

  React.useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({
        width,
        height,
        isSmallMobile: width < SMALL_MOBILE_BREAKPOINT,
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < DESKTOP_BREAKPOINT,
        isDesktop: width >= DESKTOP_BREAKPOINT,
      })
    }
    
    // Initial check
    updateScreenSize()
    
    // Set up event listener for window resize
    window.addEventListener("resize", updateScreenSize)
    
    // Clean up
    return () => window.removeEventListener("resize", updateScreenSize)
  }, [])

  return screenSize
}

// Export constants for use in other components
export const BREAKPOINTS = {
  SMALL_MOBILE: SMALL_MOBILE_BREAKPOINT,
  MOBILE: MOBILE_BREAKPOINT,
  TABLET: TABLET_BREAKPOINT,
  DESKTOP: DESKTOP_BREAKPOINT,
}
