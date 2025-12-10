import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, User } from 'lucide-react'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleLogin = (role: 'admin' | 'employee') => {
        login(role)
        navigate('/dashboard')
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">

            <div className="w-full max-w-md">
                {/* Logo section */}
                <div className="text-center mb-10">
                    <img src="/logo.svg" alt="Equip" className="w-20 h-20 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-white mb-2">Equip</h1>
                    <p className="text-gray-400">Enterprise IT Asset Management</p>
                </div>

                {/* Login card */}
                <div className="card p-8">
                    <h2 className="text-xl font-semibold text-center text-white mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-center text-gray-400 mb-8">
                        Select a demo role to explore the system
                    </p>

                    <div className="space-y-4">
                        {/* Admin login */}
                        <button
                            onClick={() => handleLogin('admin')}
                            className="w-full flex items-center gap-4 p-4 bg-navy-500/10 hover:bg-navy-500/20 border border-navy-500/30 hover:border-navy-500/50 rounded-xl transition-all duration-200 group"
                        >
                            <div className="w-12 h-12 bg-navy-500/30 rounded-lg flex items-center justify-center group-hover:bg-navy-500/50 transition-all">
                                <Shield className="w-6 h-6 text-navy-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-white">Demo as Admin</p>
                                <p className="text-sm text-gray-400">
                                    Full access: manage assets, approve requests
                                </p>
                            </div>
                        </button>

                        {/* Employee login */}
                        <button
                            onClick={() => handleLogin('employee')}
                            className="w-full flex items-center gap-4 p-4 bg-surface-elevated hover:bg-surface-hover border border-navy-800/30 hover:border-navy-700/50 rounded-xl transition-all duration-200 group"
                        >
                            <div className="w-12 h-12 bg-surface-hover rounded-lg flex items-center justify-center group-hover:bg-navy-500/20 transition-all">
                                <User className="w-6 h-6 text-gray-400 group-hover:text-navy-400" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-white">Demo as Employee</p>
                                <p className="text-sm text-gray-400">
                                    View your assets, submit equipment requests
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* Info text */}
                    <p className="mt-8 text-center text-xs text-gray-500">
                        This is a demo environment with sample data.
                        <br />
                        No authentication required for testing.
                    </p>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-gray-500">
                    Built by{' '}
                    <a
                        href="https://github.com/Brandon-Mardis"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navy-400 hover:text-navy-300"
                    >
                        Brandon Mardis
                    </a>
                </p>
            </div>
        </div>
    )
}
