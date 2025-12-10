import { createContext, useContext, useState, ReactNode } from 'react'

export type UserRole = 'admin' | 'employee' | null

interface User {
    id: number
    name: string
    email: string
    role: UserRole
    siteId: number
}

interface AuthContextType {
    user: User | null
    login: (role: 'admin' | 'employee') => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// hardcoded demo users for the portfolio demo
// in production this would come from an API
const demoUsers: Record<'admin' | 'employee', User> = {
    admin: {
        id: 1,
        name: 'Brandon Mardis',
        email: 'brandon.mardis@company.com',
        role: 'admin',
        siteId: 1
    },
    employee: {
        id: 2,
        name: 'Sam Rivera',
        email: 'sam.rivera@company.com',
        role: 'employee',
        siteId: 1
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)

    const login = (role: 'admin' | 'employee') => {
        setUser(demoUsers[role])
    }

    const logout = () => {
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
