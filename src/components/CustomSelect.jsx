import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

/**
 * CustomSelect — compact inline dropdown for filter/sort bars.
 * Props:
 *   value        string
 *   onChange     (value) => void
 *   options      [{ value, label }]
 *   className    optional extra classes on the trigger button
 */
const CustomSelect = ({ value, onChange, options, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = options.find(o => o.value === value);

    return (
        <div className="relative shrink-0" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(v => !v)}
                className={clsx(
                    'flex items-center gap-1.5 px-3 py-3 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20',
                    isOpen && 'border-primary shadow-sm',
                    className
                )}
            >
                <span className="whitespace-nowrap">{selected?.label ?? 'Select'}</span>
                <ChevronDown size={13} className={clsx('text-gray-400 transition-transform duration-200', isOpen && 'rotate-180')} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1.5 min-w-[160px] bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={clsx(
                                'w-full flex items-center justify-between px-3 py-3 rounded-md text-xs transition-all text-left',
                                value === opt.value
                                    ? 'bg-primary/8 text-primary font-semibold'
                                    : 'text-gray-600 hover:bg-gray-50 font-medium'
                            )}
                        >
                            <span>{opt.label}</span>
                            {value === opt.value && <Check size={13} strokeWidth={3} className="shrink-0" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
