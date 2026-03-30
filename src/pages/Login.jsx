import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const userData = await login(email, password);
            if (userData.role !== 'admin' && userData.role !== 'admin_viewer') {
                logout();
                setError('Access denied. Admin privileges required to access this dashboard.');
                return;
            }
            navigate('/');
        } catch (error) {
            setError('Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>

                <div className="flex flex-col items-center mb-10 relative z-10">
                    <div className="bg-primary/10 p-4 rounded-2xl mb-5 shadow-inner border border-primary/10">
                        <ShieldCheck className="text-primary" size={36} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">KG INFRA</h2>
                    <p className="text-gray-500 text-sm mt-1.5 font-medium uppercase tracking-widest opacity-60">Admin Portal</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3.5 rounded-xl mb-6 flex items-center gap-3 text-sm font-medium animate-shake">
                        <AlertCircle size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                                <Mail className="text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                            </div>
                            <input
                                type="email"
                                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-gray-700 bg-gray-50/50 hover:bg-gray-50 focus:bg-white"
                                placeholder="admin@kginfra.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                                <Lock className="text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                            </div>
                            <input
                                type="password"
                                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-gray-700 bg-gray-50/50 hover:bg-gray-50 focus:bg-white"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                <span className="tracking-wide">Authenticating...</span>
                            </>
                        ) : (
                            <span className="tracking-wide text-lg">Sign In</span>
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-xs text-gray-400 font-medium">© {new Date().getFullYear()} KG INFRASTRUCTURES. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
