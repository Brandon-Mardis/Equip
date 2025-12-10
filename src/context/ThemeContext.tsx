import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark')

    useEffect(() => {
        // Check localStorage on mount
        const saved = localStorage.getItem('equip-theme') as Theme | null
        if (saved) {
            setTheme(saved)
            applyTheme(saved)
        } else {
            applyTheme('dark')
        }
    }, [])

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement
        if (newTheme === 'dark') {
            root.classList.add('dark')
            root.classList.remove('light')
        } else {
            root.classList.remove('dark')
            root.classList.add('light')
        }
    }

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
        applyTheme(newTheme)
        localStorage.setItem('equip-theme', newTheme)
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
