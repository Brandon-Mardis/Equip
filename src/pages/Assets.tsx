import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, Plus, MoreVertical, MapPin, Package, Loader2, Trash2, Edit3 } from 'lucide-react'
import { fetchAssets, createAsset, deleteAsset, updateAsset, type Asset } from '../services/api'
import { categoryIcons, statusColors } from '../data/store'

export default function Assets() {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const isAdmin = user?.role === 'admin'
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [showAddModal, setShowAddModal] = useState(false)

    // Dropdown state
    const [openDropdown, setOpenDropdown] = useState<number | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Delete confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState<Asset | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Edit state
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

    // API state
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Form state for new asset
    const [newAsset, setNewAsset] = useState({
        name: '',
        category: 'Laptop',
        site: 'HQ',
        notes: ''
    })

    // Get status filter from URL if present
    useEffect(() => {
        const statusFromUrl = searchParams.get('status')
        if (statusFromUrl) {
            setFilterStatus(statusFromUrl)
        }
        // Auto-open add modal if ?new=true
        if (searchParams.get('new') === 'true') {
            setShowAddModal(true)
        }
    }, [searchParams])

    // Fetch assets from API
    useEffect(() => {
        async function loadAssets() {
            try {
                const data = await fetchAssets(
                    undefined,
                    isAdmin ? undefined : 'Sam Rivera'
                )
                setAssets(data)
            } catch (err) {
                console.error('Failed to load assets:', err)
            } finally {
                setLoading(false)
            }
        }
        loadAssets()
    }, [isAdmin])

    // Handle adding new asset
    async function handleAddAsset() {
        if (!newAsset.name.trim()) return

        setSubmitting(true)
        try {
            const created = await createAsset(newAsset)
            setAssets(prev => [...prev, created])
            setShowAddModal(false)
            setNewAsset({ name: '', category: 'Laptop', site: 'HQ', notes: '' })
        } catch (err) {
            console.error('Failed to create asset:', err)
        } finally {
            setSubmitting(false)
        }
    }

    // Handle delete asset
    async function handleDeleteAsset() {
        if (!deleteConfirm) return

        setDeleting(true)
        try {
            await deleteAsset(deleteConfirm.id)
            setAssets(prev => prev.filter(a => a.id !== deleteConfirm.id))
            setDeleteConfirm(null)
        } catch (err) {
            console.error('Failed to delete asset:', err)
        } finally {
            setDeleting(false)
        }
    }

    // Handle update asset
    async function handleUpdateAsset() {
        if (!editingAsset) return

        setSubmitting(true)
        try {
            const updated = await updateAsset(editingAsset.id, {
                name: editingAsset.name,
                category: editingAsset.category,
                site: editingAsset.site,
                status: editingAsset.status,
                assignedTo: editingAsset.assignedTo || '' // Send empty string for Unassigned
            })
            setAssets(prev => prev.map(a => a.id === updated.id ? updated : a))
            setEditingAsset(null)
        } catch (err) {
            console.error('Failed to update asset:', err)
        } finally {
            setSubmitting(false)
        }
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Apply search and filter
    const filteredAssets = assets.filter(asset => {
        const matchesSearch =
            asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.category.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesFilter = filterStatus === 'all' || asset.status === filterStatus
        return matchesSearch && matchesFilter
    })

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
                        {isAdmin ? 'Asset Inventory' : 'My Assets'}
                    </h1>
                    <p className="text-gray-400">
                        {isAdmin
                            ? `${filteredAssets.length} assets in your inventory`
                            : `${filteredAssets.length} items assigned to you`
                        }
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Asset
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, tag, or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-12 bg-surface-elevated border border-navy-800/30 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500/50 transition-all"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 bg-surface-elevated border border-navy-800/30 rounded-lg text-white focus:outline-none focus:border-navy-500 cursor-pointer"
                >
                    <option value="all">All Status</option>
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Broken">Broken</option>
                </select>
            </div>

            {/* Asset Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-navy-800/30 bg-surface-elevated/50">
                                <th className="text-left p-4 text-sm font-medium text-gray-400">Asset</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-400">Category</th>
                                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                                {isAdmin && <th className="text-left p-4 text-sm font-medium text-gray-400">Location</th>}
                                {isAdmin && <th className="text-left p-4 text-sm font-medium text-gray-400">Assigned To</th>}
                                <th className="text-left p-4 text-sm font-medium text-gray-400 w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssets.map((asset) => {
                                const IconComponent = categoryIcons[asset.category] || Package
                                return (
                                    <tr
                                        key={asset.id}
                                        className={`border-b border-navy-800/20 hover:bg-surface-elevated/50 transition-colors ${isAdmin ? 'cursor-pointer' : ''}`}
                                        onClick={() => isAdmin && setEditingAsset(asset)}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-navy-500/20 rounded-lg flex items-center justify-center">
                                                    <IconComponent className="w-5 h-5 text-navy-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{asset.name}</p>
                                                    <p className="text-sm text-gray-400">{asset.tag}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-300">{asset.category}</td>
                                        <td className="p-4">
                                            <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${statusColors[asset.status]}`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{asset.site}</span>
                                                </div>
                                            </td>
                                        )}
                                        {isAdmin && (
                                            <td className="p-4 text-gray-300">
                                                {asset.assignedTo || <span className="text-gray-500">—</span>}
                                            </td>
                                        )}
                                        <td className="p-4 relative" onClick={(e) => e.stopPropagation()}>
                                            <div ref={openDropdown === asset.id ? dropdownRef : null}>
                                                <button
                                                    onClick={() => setOpenDropdown(openDropdown === asset.id ? null : asset.id)}
                                                    className="p-2 text-gray-400 hover:text-white hover:bg-surface-hover rounded-lg transition-all"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {/* Dropdown Menu - opens to the left to avoid overflow */}
                                                {openDropdown === asset.id && isAdmin && (
                                                    <div className="absolute right-full top-0 mr-2 w-32 bg-surface-elevated border border-navy-800/30 rounded-lg shadow-lg py-1 z-10">
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdown(null)
                                                                setEditingAsset(asset)
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-navy-500/20 flex items-center gap-2"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdown(null)
                                                                setDeleteConfirm(asset)
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredAssets.length === 0 && (
                    <div className="p-12 text-center">
                        <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">No assets found matching your criteria.</p>
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                setFilterStatus('all')
                            }}
                            className="text-navy-400 hover:text-navy-300 text-sm"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>

            {/* Add Asset Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold text-white mb-6">Add New Asset</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Asset Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g., Dell XPS 15"
                                    value={newAsset.name}
                                    onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Category</label>
                                <select
                                    className="input-field"
                                    value={newAsset.category}
                                    onChange={(e) => setNewAsset(prev => ({ ...prev, category: e.target.value }))}
                                >
                                    <option>Laptop</option>
                                    <option>Monitor</option>
                                    <option>Docking Station</option>
                                    <option>Peripheral</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Site/Location</label>
                                <select
                                    className="input-field"
                                    value={newAsset.site}
                                    onChange={(e) => setNewAsset(prev => ({ ...prev, site: e.target.value }))}
                                >
                                    <option>HQ</option>
                                    <option>New York</option>
                                    <option>Remote</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Notes</label>
                                <textarea
                                    className="input-field min-h-[80px] resize-none"
                                    placeholder="Optional notes about this asset..."
                                    value={newAsset.notes}
                                    onChange={(e) => setNewAsset(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="btn-secondary flex-1"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddAsset}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                                disabled={submitting || !newAsset.name.trim()}
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Add Asset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card p-8 max-w-sm w-full">
                        <h2 className="text-xl font-bold text-white mb-4">Delete Asset?</h2>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm.name}</span>? This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn-secondary flex-1"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAsset}
                                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-medium flex items-center justify-center gap-2"
                                disabled={deleting}
                            >
                                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Asset Modal */}
            {editingAsset && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-white mb-6">Edit Asset</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Asset Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={editingAsset.name}
                                    onChange={(e) => setEditingAsset(prev => prev ? { ...prev, name: e.target.value } : null)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Category</label>
                                <select
                                    className="input-field"
                                    value={editingAsset.category}
                                    onChange={(e) => setEditingAsset(prev => prev ? { ...prev, category: e.target.value } : null)}
                                >
                                    <option>Laptop</option>
                                    <option>Monitor</option>
                                    <option>Docking Station</option>
                                    <option>Peripheral</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Site/Location</label>
                                <select
                                    className="input-field"
                                    value={editingAsset.site}
                                    onChange={(e) => setEditingAsset(prev => prev ? { ...prev, site: e.target.value } : null)}
                                >
                                    <option>HQ</option>
                                    <option>New York</option>
                                    <option>Remote</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Status</label>
                                <select
                                    className="input-field"
                                    value={editingAsset.status}
                                    onChange={(e) => setEditingAsset(prev => prev ? { ...prev, status: e.target.value } : null)}
                                >
                                    <option>Available</option>
                                    <option>Assigned</option>
                                    <option>Maintenance</option>
                                    <option>Broken</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Assigned To</label>
                                <select
                                    className="input-field"
                                    value={editingAsset.assignedTo || ''}
                                    onChange={(e) => {
                                        const newAssignment = e.target.value || null
                                        // Auto-update status based on assignment
                                        const newStatus = newAssignment ? 'Assigned' : 'Available'
                                        setEditingAsset(prev => prev ? { ...prev, assignedTo: newAssignment, status: newStatus } : null)
                                    }}
                                >
                                    <option value="">Unassigned</option>
                                    <option>Sam Rivera</option>
                                    <option>Alex Chen</option>
                                    <option>Jordan Lee</option>
                                    <option>Taylor Kim</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingAsset(null)}
                                className="btn-secondary flex-1"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateAsset}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                                disabled={submitting || !editingAsset.name.trim()}
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

