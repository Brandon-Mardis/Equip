import { Laptop, Monitor, Package, Mouse, Usb } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

// icons for each asset type
export const categoryIcons: Record<string, LucideIcon> = {
    'Laptop': Laptop,
    'Monitor': Monitor,
    'Docking Station': Usb,
    'Peripheral': Mouse,
    'Other': Package,
}

// sample data - will be replaced with API calls later
export const allAssets = [
    { id: 1, tag: 'EQ-LAP-001', name: 'Dell XPS 15', category: 'Laptop', status: 'Assigned', site: 'HQ', assignedTo: 'Sam Rivera', purchaseDate: '2024-03-15' },
    { id: 2, tag: 'EQ-LAP-002', name: 'MacBook Pro 16"', category: 'Laptop', status: 'Available', site: 'HQ', assignedTo: null, purchaseDate: '2024-01-20' },
    { id: 3, tag: 'EQ-MON-042', name: 'Dell UltraSharp 27"', category: 'Monitor', status: 'Assigned', site: 'HQ', assignedTo: 'Sam Rivera', purchaseDate: '2024-02-10' },
    { id: 4, tag: 'EQ-MON-043', name: 'LG 4K Monitor', category: 'Monitor', status: 'Maintenance', site: 'New York', assignedTo: null, purchaseDate: '2023-11-05' },
    { id: 5, tag: 'EQ-DOC-018', name: 'Dell WD19 Dock', category: 'Docking Station', status: 'Assigned', site: 'HQ', assignedTo: 'Sam Rivera', purchaseDate: '2024-03-15' },
    { id: 6, tag: 'EQ-LAP-003', name: 'ThinkPad X1 Carbon', category: 'Laptop', status: 'Broken', site: 'Remote', assignedTo: 'Jordan Lee', purchaseDate: '2023-08-22' },
    { id: 7, tag: 'EQ-PER-089', name: 'Logitech MX Master 3', category: 'Peripheral', status: 'Assigned', site: 'HQ', assignedTo: 'Sam Rivera', purchaseDate: '2024-03-15' },
    { id: 8, tag: 'EQ-MON-044', name: 'Samsung 32" Curved', category: 'Monitor', status: 'Available', site: 'New York', assignedTo: null, purchaseDate: '2024-04-01' },
    { id: 9, tag: 'EQ-LAP-004', name: 'HP EliteBook 840', category: 'Laptop', status: 'Assigned', site: 'New York', assignedTo: 'Alex Chen', purchaseDate: '2024-02-28' },
    { id: 10, tag: 'EQ-LAP-005', name: 'Dell Latitude 5520', category: 'Laptop', status: 'Available', site: 'HQ', assignedTo: null, purchaseDate: '2024-05-10' },
    { id: 11, tag: 'EQ-DOC-019', name: 'Lenovo USB-C Dock', category: 'Docking Station', status: 'Available', site: 'HQ', assignedTo: null, purchaseDate: '2024-06-01' },
    { id: 12, tag: 'EQ-PER-090', name: 'Logitech MX Keys', category: 'Peripheral', status: 'Assigned', site: 'HQ', assignedTo: 'Alex Chen', purchaseDate: '2024-02-28' },
]

export const allRequests = [
    { id: 1, type: 'New Equipment', asset: null, description: 'Need a second monitor for productivity', priority: 'Normal', status: 'Pending', user: 'Sam Rivera', createdAt: '2025-01-08' },
    { id: 2, type: 'Repair', asset: 'ThinkPad X1 Carbon', description: 'Screen flickering issue', priority: 'High', status: 'Approved', user: 'Jordan Lee', createdAt: '2025-01-07' },
    { id: 3, type: 'Replace', asset: 'Logitech Keyboard', description: 'Keys are worn out and sticky', priority: 'Low', status: 'Completed', user: 'Alex Chen', createdAt: '2025-01-05' },
    { id: 4, type: 'New Equipment', asset: null, description: 'Requesting docking station for home office', priority: 'Normal', status: 'Denied', user: 'Taylor Kim', createdAt: '2025-01-04' },
    { id: 5, type: 'Repair', asset: 'Dell Monitor', description: 'Dead pixels appearing', priority: 'Normal', status: 'Pending', user: 'Sam Rivera', createdAt: '2025-01-02' },
]

// TODO: optimize these - running filter multiple times is wasteful
export function getAssetStats() {
    return {
        total: allAssets.length,
        assigned: allAssets.filter(a => a.status === 'Assigned').length,
        available: allAssets.filter(a => a.status === 'Available').length,
        maintenance: allAssets.filter(a => a.status === 'Maintenance').length,
        broken: allAssets.filter(a => a.status === 'Broken').length,
    }
}

export function getRequestStats() {
    return {
        pending: allRequests.filter(r => r.status === 'Pending').length,
        approved: allRequests.filter(r => r.status === 'Approved').length,
        denied: allRequests.filter(r => r.status === 'Denied').length,
        completed: allRequests.filter(r => r.status === 'Completed').length,
    }
}

export const statusColors: Record<string, string> = {
    'Available': 'status-available',
    'Assigned': 'status-assigned',
    'Maintenance': 'status-maintenance',
    'Broken': 'status-broken',
}
