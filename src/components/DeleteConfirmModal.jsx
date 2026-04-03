import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, itemName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div className="bg-red-50 p-6 flex items-center gap-4">
                    <div className="bg-red-100 p-3 rounded-full text-red-600">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{title || 'Delete Confirmation'}</h2>
                        <p className="text-sm text-red-600 font-medium mt-0.5">This action cannot be undone.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="ml-auto text-gray-400 hover:text-gray-600 transition-colors bg-white/50 p-1.5 rounded-lg border border-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 leading-relaxed text-sm">
                        {message || `Are you sure you want to delete "${itemName}"? All associated data, including tasks, will be permanently removed.`}
                    </p>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Permanent Deletion</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-3 pt-0 sm:pt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-md border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition-all text-sm shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="flex-1 px-4 py-3 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition-all text-sm shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};

export default DeleteConfirmModal;
