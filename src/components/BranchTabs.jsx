import { useState, useRef, useEffect } from 'react';
import { useBranch } from '../context/BranchContext';
import { Globe, MapPin, ChevronDown, Check } from 'lucide-react';

const BranchTabs = () => {
    const { activeBranch, branches, updateBranch, loading } = useBranch();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeBranchName = activeBranch === 'all' ? 'All Regions' : activeBranch;

    return (
        <div className="bg-white border-b border-gray-200 sticky top-[65px] md:top-0 z-40 py-2.5 px-4 md:px-8 flex items-center justify-start gap-4">
            <div className="relative" ref={dropdownRef}>
                {/* Dropdown Trigger */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="group flex items-center gap-3 bg-gray-50 border border-gray-200 hover:border-primary/50 px-4 py-2 rounded-xl transition-all active:scale-[0.98] shadow-sm active:shadow-inner"
                >
                    <div className="bg-primary/10 p-1.5 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        {activeBranch === 'all' ? <Globe size={16} strokeWidth={2.5} /> : <MapPin size={16} strokeWidth={2.5} />}
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Selected Region</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 leading-none">{activeBranchName}</span>
                            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-gray-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
                        <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-1">Select Territory</p>
                        </div>
                        <div className="max-h-72 overflow-y-auto custom-scrollbar p-1.5">
                            {/* All Regions Option */}
                            <button
                                onClick={() => {
                                    updateBranch('all');
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    activeBranch === 'all'
                                        ? 'bg-primary/5 text-primary'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Globe size={16} className={activeBranch === 'all' ? 'text-primary' : 'text-gray-400'} />
                                    <span>All Regions</span>
                                </div>
                                {activeBranch === 'all' && <Check size={16} strokeWidth={3} />}
                            </button>

                            <div className="my-1 border-t border-gray-50" />

                            {/* Regional Options */}
                            {!loading && branches.map((branch) => (
                                <button
                                    key={branch}
                                    onClick={() => {
                                        updateBranch(branch);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        activeBranch === branch
                                            ? 'bg-primary/5 text-primary'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className={activeBranch === branch ? 'text-primary' : 'text-gray-400'} />
                                        <span>{branch}</span>
                                    </div>
                                    {activeBranch === branch && <Check size={16} strokeWidth={3} />}
                                </button>
                            ))}

                            {loading && (
                                <div className="p-12 text-center">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Updating Territories...</p>
                                </div>
                            )}
                        </div>
                        {!loading && branches.length === 0 && (
                            <div className="p-8 text-center bg-white">
                                <MapPin size={24} className="text-gray-200 mx-auto mb-2" />
                                <p className="text-xs text-gray-400 font-medium">No regions found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default BranchTabs;
