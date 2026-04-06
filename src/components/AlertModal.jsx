import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react';
import clsx from 'clsx';
import { useEffect } from 'react';

const AlertModal = ({ isOpen, onClose, type = 'success', title, message }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const config = {
        success: {
            bg: 'bg-emerald-50',
            iconBg: 'bg-emerald-100',
            text: 'text-emerald-600',
            border: 'border-emerald-200',
            icon: <CheckCircle size={20} />,
        },
        error: {
            bg: 'bg-red-50',
            iconBg: 'bg-red-100',
            text: 'text-red-600',
            border: 'border-red-200',
            icon: <AlertTriangle size={20} />,
        },
        info: {
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100',
            text: 'text-blue-600',
            border: 'border-blue-200',
            icon: <Info size={20} />,
        }
    }[type] || {
        bg: 'bg-gray-50',
        iconBg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-200',
        icon: <Info size={20} />,
    };

    return (
        <div 
            className="fixed top-6 right-6 z-[100000] w-full max-w-sm pointer-events-none"
        >
            <div 
                className={clsx(
                    "bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-l-4 overflow-hidden animate-in slide-in-from-right-10 duration-500 pointer-events-auto",
                    config.border
                )}
            >
                <div className="p-4 flex items-start gap-4">
                    <div className={clsx(config.iconBg, config.text, "p-2 rounded-xl shrink-0")}>
                        {config.icon}
                    </div>
                    <div className="flex-1 pt-0.5">
                        <h4 className="text-sm font-black text-gray-900 leading-none mb-1.5 uppercase tracking-wider">
                            {title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notification')}
                        </h4>
                        <p className="text-xs text-gray-600 font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
                {/* Progress bar to show remaining time */}
                <div className="h-1 bg-gray-100 w-full">
                    <div 
                        className={clsx("h-full animate-progress-shrink origin-left", config.text.replace('text', 'bg'))}
                        style={{ animationDuration: '5000ms' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
