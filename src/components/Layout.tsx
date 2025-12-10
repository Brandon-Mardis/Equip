import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    LayoutDashboard,
    Monitor,
    FileText,
    LogOut,
    Menu,
    X
} from 'lucide-react'

export default function Layout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/assets', icon: Monitor, label: 'Assets' },
        { path: '/requests', icon: FileText, label: 'Requests' },
    ]

    const closeSidebar = () => setSidebarOpen(false)

    return (
        <div className="min-h-screen flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 sidebar flex flex-col fixed h-screen overflow-y-auto z-50
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                {/* Logo */}
                <div className="p-6 border-b border-navy-800/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src="/logo.svg" alt="Equip" className="w-10 h-10" />
                            <div>
                                <h1 className="font-bold text-lg text-white">Equip</h1>
                                <p className="text-xs text-gray-400">Asset Management</p>
                            </div>
                        </div>
                        {/* Close button on mobile */}
                        <button
                            onClick={closeSidebar}
                            className="lg:hidden p-2 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        {navItems.map(({ path, icon: Icon, label }) => (
                            <li key={path}>
                                <NavLink
                                    to={path}
                                    onClick={closeSidebar}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border ${isActive
                                            ? 'bg-navy-500/20 text-navy-400 border-navy-500/30'
                                            : 'text-gray-400 hover:text-white hover:bg-surface-elevated border-transparent'
                                        }`
                                    }
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-navy-800/30">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-navy-500/30 flex items-center justify-center">
                            <span className="text-navy-300 font-medium">
                                {user?.name?.charAt(0) || '?'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-white">
                                {user?.name}
                            </p>
                            <p className="text-xs capitalize text-gray-400">
                                {user?.role}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 lg:ml-64 overflow-auto bg-amoled min-h-screen">
                {/* Mobile header */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-navy-800/30 bg-surface sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <img src="/logo.svg" alt="Equip" className="w-8 h-8" />
                        <h1 className="font-bold text-white">Equip</h1>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-surface-elevated rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
