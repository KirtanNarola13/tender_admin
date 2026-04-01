import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

const FormSelect = ({ label, value, onChange, options, placeholder = 'Select an option', icon: Icon, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="space-y-1.5 w-full text-left" ref={dropdownRef}>
            {label && (
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={clsx(
                        "w-full flex items-center justify-between bg-white border p-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20",
                        isOpen ? "border-primary shadow-sm" : "border-gray-200 hover:border-gray-300",
                        error ? "border-red-300 bg-red-50" : "bg-white"
                    )}
                >
                    <div className="flex items-center gap-3 truncate">
                        {Icon && (
                            <Icon size={18} className={clsx(isOpen ? "text-primary" : "text-gray-400")} />
                        )}
                        <span className={clsx("truncate", !selectedOption ? "text-gray-400" : "text-gray-900 font-medium")}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown size={18} className={clsx("text-gray-400 transition-transform duration-300 shrink-0", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
                            {options.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-400 italic">
                                    No options available
                                </div>
                            ) : (
                                options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={clsx(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all group",
                                            value === option.value
                                                ? "bg-primary/5 text-primary font-bold"
                                                : "text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        <div className="flex flex-col items-start truncate overflow-hidden">
                                            <span className="truncate w-full">{option.label}</span>
                                            {option.sublabel && (
                                                <span className="text-[10px] text-gray-400 font-normal truncate w-full">{option.sublabel}</span>
                                            )}
                                        </div>
                                        {value === option.value && <Check size={16} strokeWidth={3} className="shrink-0" />}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="text-[10px] text-red-500 font-medium ml-1">{error}</p>}
        </div>
    );
};

export default FormSelect;
