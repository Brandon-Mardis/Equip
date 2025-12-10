import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Monitor, Users, FileText, AlertTriangle, TrendingUp, Package, Plus, Eye, MapPin, Wrench, RefreshCw, PackagePlus, Loader2 } from 'lucide-react'
import { fetchStats, fetchAssets, fetchRequests, type Asset, type Request, type Stats } from '../services/api'
import { categoryIcons } from '../data/store'

export default function Dashboard() {
    const { user } = useAuth()
    const { theme } = useTheme()
    const navigate = useNavigate()
    const isAdmin = user?.role === 'admin'

    // API data state
    const [stats, setStats] = useState<Stats | null>(null)
    const [userAssets, setUserAssets] = useState<Asset[]>([])
    const [recentRequests, setRecentRequests] = useState<Request[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch data function (can be called to retry)
    async function loadData() {
        setLoading(true)
        setError(null)
        try {
            const [statsData, assetsData, requestsData] = await Promise.all([
                fetchStats(),
                fetchAssets(undefined, isAdmin ? undefined : 'Sam Rivera'),
                fetchRequests()
            ])
            setStats(statsData)
            setUserAssets(assetsData)
            setRecentRequests(requestsData.slice(0, 4))
        } catch (err) {
            console.error('Failed to load dashboard data:', err)
            setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    // Fetch data on mount
    useEffect(() => {
        loadData()
    }, [isAdmin])

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="w-8 h-8 text-navy-400 animate-spin" />
                <p className="text-gray-400 text-sm">Loading dashboard...</p>
            </div>
        )
    }

    // Error state with retry button
    if (error || !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertTriangle className="w-12 h-12 text-amber-400" />
                <p className="text-white font-medium">Unable to load dashboard</p>
                <p className="text-gray-400 text-sm">{error || 'Please try again'}</p>
                <button
                    onClick={loadData}
                    className="btn-primary flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        )
    }

    // stat cards for admin view
    const adminStatCards = [
        {
            label: 'Total Assets',
            value: stats.totalAssets.toString(),
            icon: Monitor,
            change: `${stats.available} available`,
            trend: 'neutral' as const,
            onClick: () => navigate('/assets')
        },
        {
            label: 'Assigned',
            value: stats.assigned.toString(),
            icon: Users,
            change: `${Math.round((stats.assigned / stats.totalAssets) * 100)}% utilization`,
            trend: 'up' as const,
            onClick: () => navigate('/assets?status=Assigned')
        },
        {
            label: 'Pending Requests',
            value: stats.pendingRequests.toString(),
            icon: FileText,
            change: stats.pendingRequests > 0 ? 'Needs attention' : 'All clear',
            trend: stats.pendingRequests > 0 ? 'warning' as const : 'up' as const,
            onClick: () => navigate('/requests?status=Pending')
        },
        {
            label: 'In Maintenance',
            value: (stats.maintenance + stats.broken).toString(),
            icon: AlertTriangle,
            change: `${stats.broken} broken`,
            trend: stats.broken > 0 ? 'down' as const : 'neutral' as const,
            onClick: () => navigate('/assets?status=Maintenance')
        },
    ]

    // simpler cards for employees
    const employeeStatCards = [
        {
            label: 'My Assets',
            value: userAssets.length.toString(),
            icon: Monitor,
            change: userAssets.map(a => a.category).join(', '),
            trend: 'neutral' as const,
            onClick: () => navigate('/assets')
        },
        {
            label: 'My Requests',
            value: recentRequests.filter(r => r.user === 'Sam Rivera').length.toString(),
            icon: FileText,
            change: recentRequests.filter(r => r.user === 'Sam Rivera' && r.status === 'Pending').length > 0 ? 'Pending approval' : 'No pending',
            trend: recentRequests.filter(r => r.user === 'Sam Rivera' && r.status === 'Pending').length > 0 ? 'warning' as const : 'up' as const,
            onClick: () => navigate('/requests')
        },
    ]

    const statCards = isAdmin ? adminStatCards : employeeStatCards

    // icons for request types - using muted colors
    const requestIcons: Record<string, React.ReactNode> = {
        'New Equipment': <PackagePlus className="w-4 h-4" style={{ color: '#6ee7b7' }} />,
        'Repair': <Wrench className="w-4 h-4" style={{ color: '#fcd34d' }} />,
        'Replace': <RefreshCw className="w-4 h-4" style={{ color: '#93c5fd' }} />,
    }

    // Recent activity (from API)
    const recentActivity = recentRequests.map(r => ({
        id: r.id,
        type: r.type,
        action: r.type === 'New Equipment' ? 'New equipment request' : `${r.type} request`,
        asset: r.asset || 'New Equipment',
        user: r.user,
        time: r.createdAt
    }))

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Welcome back, {user?.name?.split(' ')[0]}!
                </h1>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {isAdmin
                        ? 'Here\'s an overview of your IT asset inventory.'
                        : 'Here\'s a quick look at your assigned equipment.'
                    }
                </p>
            </div>

            {/* Stats Grid - Clickable Cards */}
            <div className={`grid gap-6 mb-8 ${isAdmin ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'}`}>
                {statCards.map((stat, index) => (
                    <button
                        key={index}
                        onClick={stat.onClick}
                        className="card p-6 text-left hover:border-navy-500/50 transition-all cursor-pointer"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold text-white">{stat.value}</p>
                                <span className={`inline-block text-xs mt-3 px-2.5 py-1 rounded-full bg-surface-elevated border border-navy-800/30 ${stat.trend === 'up' ? 'text-[#6ee7b7]' :
                                    stat.trend === 'warning' ? 'text-[#fcd34d]' :
                                        stat.trend === 'down' ? 'text-[#fca5a5]' :
                                            'text-[#93c5fd]'
                                    }`}>
                                    {stat.change}
                                </span>
                            </div>
                            <div className="w-12 h-12 bg-navy-500/20 rounded-lg flex items-center justify-center">
                                <stat.icon className="w-6 h-6 text-navy-400" />
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Admin-only sections */}
            {isAdmin && (
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-navy-400" />
                            Recent Activity
                        </h2>
                        <div className="space-y-4">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-navy-800/30 last:border-0 last:pb-0">
                                    <div className="w-8 h-8 bg-navy-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {requestIcons[activity.type] || <Package className="w-4 h-4 text-navy-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white">{activity.action}</p>
                                        <p className="text-xs text-gray-400">{activity.asset} • {activity.user}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">{activity.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions - Now functional */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/assets?new=true')}
                                className="btn-primary text-sm py-3 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add New Asset
                            </button>
                            <button
                                onClick={() => navigate('/requests')}
                                className="btn-secondary text-sm py-3 flex items-center justify-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                View Requests
                            </button>
                            <button
                                onClick={() => navigate('/assets?status=Maintenance')}
                                className="btn-secondary text-sm py-3 flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Maintenance
                            </button>
                            <button
                                onClick={() => navigate('/assets')}
                                className="btn-secondary text-sm py-3 flex items-center justify-center gap-2"
                            >
                                <MapPin className="w-4 h-4" />
                                Manage Sites
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee-only section */}
            {!isAdmin && (
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">My Equipment</h2>
                    <div className="space-y-3">
                        {userAssets.map((item, index) => {
                            const IconComponent = categoryIcons[item.category] || Package
                            return (
                                <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <IconComponent className="w-5 h-5 text-navy-400" />
                                        <div>
                                            <p className="text-sm font-medium text-white">{item.name}</p>
                                            <p className="text-xs text-gray-400">{item.tag}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded-full status-assigned border">
                                        {item.status}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                    <button
                        onClick={() => navigate('/requests?new=true')}
                        className="btn-primary w-full mt-4"
                    >
                        Request New Equipment
                    </button>
                </div>
            )}
        </div>
    )
}

