import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { fetchRequests, createRequest, updateRequestStatus, fetchStats, type Request as RequestType } from '../services/api'

const statusIcons: Record<string, React.ReactNode> = {
    'Pending': <Clock className="w-4 h-4 text-amber-400" />,
    'Approved': <CheckCircle className="w-4 h-4 text-emerald-400" />,
    'Denied': <XCircle className="w-4 h-4 text-red-400" />,
    'Completed': <CheckCircle className="w-4 h-4 text-blue-400" />,
}

const statusStyles: Record<string, string> = {
    'Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Approved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Denied': 'bg-red-500/10 text-red-400 border-red-500/30',
    'Completed': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
}

const priorityStyles: Record<string, string> = {
    'Low': 'text-gray-400',
    'Normal': 'text-white',
    'High': 'text-amber-400',
    'Critical': 'text-red-400',
}

export default function Requests() {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const isAdmin = user?.role === 'admin'
    const [showNewRequest, setShowNewRequest] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>('all')

    // API state
    const [requests, setRequests] = useState<RequestType[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [stats, setStats] = useState<{ pending: number; approved: number; denied: number; completed: number }>({
        pending: 0, approved: 0, denied: 0, completed: 0
    })

    // Form state for new request
    const [newRequest, setNewRequest] = useState({
        type: 'New Equipment',
        priority: 'Normal',
        description: ''
    })

    // Get status filter from URL if present
    useEffect(() => {
        const statusFromUrl = searchParams.get('status')
        if (statusFromUrl) {
            setFilterStatus(statusFromUrl)
        }
        // Auto-open new request modal if ?new=true
        if (searchParams.get('new') === 'true') {
            setShowNewRequest(true)
        }
    }, [searchParams])

    // Fetch requests from API
    useEffect(() => {
        async function loadData() {
            try {
                const [requestsData, statsData] = await Promise.all([
                    fetchRequests(undefined, isAdmin ? undefined : 'Sam Rivera'),
                    fetchStats()
                ])
                setRequests(requestsData)
                setStats({
                    pending: statsData.pendingRequests,
                    approved: statsData.approvedRequests,
                    denied: statsData.deniedRequests,
                    completed: statsData.completedRequests
                })
            } catch (err) {
                console.error('Failed to load requests:', err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [isAdmin])

    // Handle creating new request
    async function handleCreateRequest() {
        if (!newRequest.description.trim()) return

        setSubmitting(true)
        try {
            const created = await createRequest({
                ...newRequest,
                user: user?.name || 'Unknown'
            })
            setRequests(prev => [created, ...prev])
            setShowNewRequest(false)
            setNewRequest({ type: 'New Equipment', priority: 'Normal', description: '' })
            // Update pending count
            setStats(prev => ({ ...prev, pending: prev.pending + 1 }))
        } catch (err) {
            console.error('Failed to create request:', err)
        } finally {
            setSubmitting(false)
        }
    }

    // Handle approve/deny
    async function handleStatusUpdate(id: number, newStatus: string) {
        try {
            const updated = await updateRequestStatus(id, newStatus)
            setRequests(prev => prev.map(r => r.id === id ? updated : r))
            // Update stats
            setStats(prev => ({
                ...prev,
                pending: prev.pending - 1,
                approved: newStatus === 'Approved' ? prev.approved + 1 : prev.approved,
                denied: newStatus === 'Denied' ? prev.denied + 1 : prev.denied
            }))
        } catch (err) {
            console.error('Failed to update request:', err)
        }
    }

    // Apply status filter
    const filteredRequests = filterStatus === 'all'
        ? requests
        : requests.filter(r => r.status === filterStatus)

    // Stats for admin display
    const statCards = [
        { label: 'Pending', count: stats.pending, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Approved', count: stats.approved, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Denied', count: stats.denied, color: 'text-red-400', bg: 'bg-red-500/10' },
        { label: 'Completed', count: stats.completed, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-navy-400 animate-spin" />
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                        {isAdmin ? 'Equipment Requests' : 'My Requests'}
                    </h1>
                    <p className="text-gray-400">
                        {isAdmin
                            ? 'Review and manage equipment requests from employees'
                            : 'Track your equipment requests and their status'
                        }
                    </p>
                </div>
                <button
                    onClick={() => setShowNewRequest(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Request
                </button>
            </div>

            {/* Quick Stats for Admin - Clickable */}
            {isAdmin && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {statCards.map((stat, index) => (
                        <button
                            key={index}
                            onClick={() => setFilterStatus(stat.label)}
                            className={`card p-4 text-center transition-all hover:border-navy-500/50 ${filterStatus === stat.label ? 'border-navy-500' : ''}`}
                        >
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                            <p className="text-sm text-gray-400">{stat.label}</p>
                        </button>
                    ))}
                </div>
            )}

            {/* Filter tabs */}
            {isAdmin && (
                <div className="flex gap-2 mb-6 flex-wrap">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'all'
                            ? 'bg-navy-500 text-white'
                            : 'bg-surface-elevated text-gray-400 hover:text-white'
                            }`}
                    >
                        All
                    </button>
                    {['Pending', 'Approved', 'Denied', 'Completed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                                ? 'bg-navy-500 text-white'
                                : 'bg-surface-elevated text-gray-400 hover:text-white'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            )}

            {/* Requests List */}
            <div className="space-y-4">
                {filteredRequests.map((request) => (
                    <div key={request.id} className="card p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-navy-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-6 h-6 text-navy-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-xs px-2 py-0.5 rounded bg-surface-elevated text-gray-300">
                                            {request.type}
                                        </span>
                                        <span className={`text-xs font-medium ${priorityStyles[request.priority]}`}>
                                            {request.priority} Priority
                                        </span>
                                    </div>
                                    <p className="font-medium text-white mb-1">
                                        {request.asset || 'New Equipment Request'}
                                    </p>
                                    <p className="text-sm text-gray-400">{request.description}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {isAdmin && `Requested by ${request.user} • `}
                                        {request.createdAt}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 ml-16 md:ml-0">
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusStyles[request.status]}`}>
                                    {statusIcons[request.status]}
                                    <span className="text-sm font-medium">{request.status}</span>
                                </div>

                                {isAdmin && request.status === 'Pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate(request.id, 'Approved')}
                                            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-all"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(request.id, 'Denied')}
                                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-all"
                                        >
                                            Deny
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredRequests.length === 0 && (
                    <div className="card p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">
                            {filterStatus !== 'all'
                                ? `No ${filterStatus.toLowerCase()} requests found.`
                                : 'No requests found.'}
                        </p>
                        {filterStatus !== 'all' && (
                            <button
                                onClick={() => setFilterStatus('all')}
                                className="text-navy-400 hover:text-navy-300 text-sm mr-4"
                            >
                                View all requests
                            </button>
                        )}
                        <button
                            onClick={() => setShowNewRequest(true)}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create Request
                        </button>
                    </div>
                )}
            </div>

            {/* New Request Modal */}
            {showNewRequest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold text-white mb-6">New Equipment Request</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Request Type</label>
                                <select
                                    className="input-field"
                                    value={newRequest.type}
                                    onChange={(e) => setNewRequest(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    <option>New Equipment</option>
                                    <option>Repair</option>
                                    <option>Replace</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Priority</label>
                                <select
                                    className="input-field"
                                    value={newRequest.priority}
                                    onChange={(e) => setNewRequest(prev => ({ ...prev, priority: e.target.value }))}
                                >
                                    <option>Normal</option>
                                    <option>Low</option>
                                    <option>High</option>
                                    <option>Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Description</label>
                                <textarea
                                    className="input-field min-h-[100px] resize-none"
                                    placeholder="Describe what you need and why..."
                                    value={newRequest.description}
                                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowNewRequest(false)}
                                className="btn-secondary flex-1"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateRequest}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                                disabled={submitting || !newRequest.description.trim()}
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

