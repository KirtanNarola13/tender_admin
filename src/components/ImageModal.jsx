import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useState, useEffect } from 'react';

const ImageModal = ({ isOpen, onClose, imageUrl, altText }) => {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setRotation(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                <button
                    onClick={() => setScale(s => Math.min(s + 0.5, 4))}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn size={24} />
                </button>
                <button
                    onClick={() => setScale(s => Math.max(s - 0.5, 0.5))}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut size={24} />
                </button>
                <button
                    onClick={() => setRotation(r => r + 90)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                    title="Rotate"
                >
                    <RotateCw size={24} />
                </button>
                <div className="w-px h-6 bg-white/20 mx-2"></div>
                <button
                    onClick={onClose}
                    className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors"
                    title="Close"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Image Container */}
            <div
                className="relative overflow-hidden w-full h-full flex items-center justify-center cursor-move"
                onClick={(e) => e.stopPropagation()} // Stop click bubbling
            >
                <img
                    src={imageUrl}
                    alt={altText || "Preview"}
                    className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out"
                    style={{
                        transform: `scale(${scale}) rotate(${rotation}deg)`,
                        cursor: scale > 1 ? 'grab' : 'default'
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Click outside to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};

export default ImageModal;
