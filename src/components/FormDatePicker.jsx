import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const FormDatePicker = ({ label, value, onChange, min, placeholder = 'Select Date', error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // If value exists, use it for initial view, otherwise today
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calendar Math
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // Add the days of the month
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(new Date(year, month, d));
    }

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const changeMonth = (offset) => {
        setViewDate(new Date(year, month + offset, 1));
    };

    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    };

    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date) => {
        if (!date || !value) return false;
        const d = new Date(date);
        const sel = new Date(value);
        return d.getDate() === sel.getDate() &&
            d.getMonth() === sel.getMonth() &&
            d.getFullYear() === sel.getFullYear();
    };

    const isDisabled = (date) => {
        if (!date || !min) return false;
        const d = new Date(date);
        const m = new Date(min);
        d.setHours(0,0,0,0);
        m.setHours(0,0,0,0);
        return d < m;
    };

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
                        <CalendarIcon size={18} className={clsx(isOpen ? "text-primary" : "text-gray-400")} />
                        <span className={clsx("truncate", !value ? "text-gray-400" : "text-gray-900 font-medium")}>
                            {value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : placeholder}
                        </span>
                    </div>
                    <ChevronDown size={18} className={clsx("text-gray-400 transition-transform duration-300 shrink-0", isOpen && "rotate-180")} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-4 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button 
                                type="button" 
                                onClick={() => changeMonth(-1)}
                                className="p-1 rounded-lg hover:bg-gray-100 text-gray-600"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="font-bold text-gray-800">
                                {monthNames[month]} {year}
                            </span>
                            <button 
                                type="button" 
                                onClick={() => changeMonth(1)}
                                className="p-1 rounded-lg hover:bg-gray-100 text-gray-600"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Weekday labels */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((date, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={!date || isDisabled(date)}
                                    onClick={() => {
                                        if (date) {
                                            onChange(formatDate(date));
                                            setIsOpen(false);
                                        }
                                    }}
                                    className={clsx(
                                        "h-8 flex items-center justify-center text-xs rounded-lg transition-all",
                                        !date ? "invisible" : "hover:bg-primary/5",
                                        isSelected(date) ? "bg-primary text-white font-bold hover:bg-primary" : "text-gray-700",
                                        isToday(date) && !isSelected(date) && "text-primary font-bold border border-primary/20",
                                        isDisabled(date) && "opacity-20 cursor-not-allowed line-through"
                                    )}
                                >
                                    {date ? date.getDate() : ""}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="text-[10px] text-red-500 font-medium ml-1">{error}</p>}
        </div>
    );
};

export default FormDatePicker;
