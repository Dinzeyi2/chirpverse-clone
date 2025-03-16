
import * as React from "react"

// Define various breakpoints for responsive design
const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024
const DESKTOP_BREAKPOINT = 1280
const SMALL_MOBILE_BREAKPOINT = 480 // Adding extra breakpoint for very small devices

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

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

  return !!isMobile
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isSmallMobile: false,
  })

  React.useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({
        width,
        height,
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < DESKTOP_BREAKPOINT,
        isDesktop: width >= DESKTOP_BREAKPOINT,
        isSmallMobile: width < SMALL_MOBILE_BREAKPOINT,
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
