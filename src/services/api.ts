// API service layer with session-based isolation
const API_BASE = '/api'

// Timeout wrapper to prevent infinite loading on slow cold starts
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 30000): Promise<Response> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        })
        clearTimeout(timeout)
        return response
    } catch (error) {
        clearTimeout(timeout)
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timed out - please try again')
        }
        throw error
    }
}

// Session handling - each user gets their own sandbox

function getSessionId(): string {
    let sessionId = localStorage.getItem('equip-session-id')
    if (!sessionId) {
        sessionId = crypto.randomUUID()
        localStorage.setItem('equip-session-id', sessionId)
    }
    return sessionId
}

function getHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json',
        'X-Session-ID': getSessionId(),
    }
}

// Types

export interface Asset {
    id: number
    tag: string
    name: string
    category: string
    status: string
    site: string
    assignedTo: string | null
    purchaseDate: string
}

export interface AssetInput {
    name: string
    category: string
    site: string
    notes?: string
}

export interface Request {
    id: number
    type: string
    asset: string | null
    description: string
    priority: string
    status: string
    user: string
    createdAt: string
}

export interface RequestInput {
    type: string
    description: string
    priority: string
    user: string
}

export interface Stats {
    totalAssets: number
    assigned: number
    available: number
    maintenance: number
    broken: number
    pendingRequests: number
    approvedRequests: number
    deniedRequests: number
    completedRequests: number
}

// API calls

export async function fetchAssets(status?: string, user?: string): Promise<Asset[]> {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    if (user) params.set('user', user)

    const query = params.toString()
    const res = await fetchWithTimeout(`${API_BASE}/assets${query ? `?${query}` : ''}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch assets')
    return res.json()
}

export async function createAsset(asset: AssetInput): Promise<Asset> {
    const res = await fetchWithTimeout(`${API_BASE}/assets`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(asset),
    })
    if (!res.ok) throw new Error('Failed to create asset')
    return res.json()
}

export async function deleteAsset(id: number): Promise<void> {
    const res = await fetchWithTimeout(`${API_BASE}/assets/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error('Failed to delete asset')
}

export interface AssetUpdate {
    name?: string
    category?: string
    site?: string
    status?: string
    assignedTo?: string | null
}

export async function updateAsset(id: number, updates: AssetUpdate): Promise<Asset> {
    const res = await fetchWithTimeout(`${API_BASE}/assets/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update asset')
    return res.json()
}

export async function fetchRequests(status?: string, user?: string): Promise<Request[]> {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    if (user) params.set('user', user)

    const query = params.toString()
    const res = await fetchWithTimeout(`${API_BASE}/requests${query ? `?${query}` : ''}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch requests')
    return res.json()
}

export async function createRequest(request: RequestInput): Promise<Request> {
    const res = await fetchWithTimeout(`${API_BASE}/requests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error('Failed to create request')
    return res.json()
}

export async function updateRequestStatus(id: number, status: string): Promise<Request> {
    const res = await fetchWithTimeout(`${API_BASE}/requests/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error('Failed to update request')
    return res.json()
}

export async function fetchStats(): Promise<Stats> {
    const res = await fetchWithTimeout(`${API_BASE}/stats`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch stats')
    return res.json()
}
