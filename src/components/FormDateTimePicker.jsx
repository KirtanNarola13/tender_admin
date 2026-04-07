import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import clsx from 'clsx';

const FormDateTimePicker = ({ label, value, onChange, min, placeholder = 'Select Date & Time', error, align = 'left', up = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);

    // Initial state from value or now
    const initialDate = value ? new Date(value) : new Date();
    const [viewDate, setViewDate] = useState(initialDate);
    
    // Time states
    const getInitialHour = (date) => {
        let h = date.getHours();
        return h === 0 ? 12 : h > 12 ? h - 12 : h;
    };
    const getInitialAmPm = (date) => (date.getHours() >= 12 ? 'PM' : 'AM');
    
    const [hour, setHour] = useState(getInitialHour(initialDate));
    const [minute, setMinute] = useState(initialDate.getMinutes());
    const [ampm, setAmPm] = useState(getInitialAmPm(initialDate));

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                bottom: rect.bottom
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
                triggerRef.current && !triggerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync internal time when value changes from outside
    useEffect(() => {
        if (value) {
            const d = new Date(value);
            setHour(getInitialHour(d));
            setMinute(d.getMinutes());
            setAmPm(getInitialAmPm(d));
        }
    }, [value]);

    // Calendar Math
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handleDateSelect = (date) => {
        if (!date) return;
        
        let h = parseInt(hour);
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        
        const newDate = new Date(date);
        newDate.setHours(h, parseInt(minute), 0, 0);
        
        onChange(newDate.toISOString());
    };

    const handleTimeChange = (newHour, newMin, newAmPm) => {
        const hVal = newHour !== undefined ? newHour : hour;
        const mVal = newMin !== undefined ? newMin : minute;
        const aVal = newAmPm !== undefined ? newAmPm : ampm;

        setHour(hVal);
        setMinute(mVal);
        setAmPm(aVal);

        if (value) {
            const d = new Date(value);
            let h = parseInt(hVal);
            if (aVal === 'PM' && h < 12) h += 12;
            if (aVal === 'AM' && h === 12) h = 0;
            d.setHours(h, parseInt(mVal), 0, 0);
            onChange(d.toISOString());
        }
    };

    const isDisabled = (date) => {
        if (!date || !min) return false;
        const d_day = new Date(date).setHours(0,0,0,0);
        const m_day = new Date(min).setHours(0,0,0,0);
        return d_day < m_day;
    };

    const isSelected = (date) => {
        if (!date || !value) return false;
        const d = new Date(date);
        const sel = new Date(value);
        return d.getDate() === sel.getDate() && d.getMonth() === sel.getMonth() && d.getFullYear() === sel.getFullYear();
    };

    const dropdown = isOpen && createPortal(
        <div 
            ref={dropdownRef}
            style={{
                position: 'fixed',
                top: up ? 'auto' : `${coords.bottom + 8}px`,
                bottom: up ? `${window.innerHeight - coords.top + 8}px` : 'auto',
                left: align === 'right' ? `${coords.left + coords.width - 288}px` : `${coords.left}px`,
                width: '288px',
            }}
            className={clsx(
                "bg-white border border-gray-100 rounded-2xl shadow-2xl z-[9999] p-4 animate-in fade-in duration-200",
                up ? "slide-in-from-bottom-2" : "slide-in-from-top-2"
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronLeft size={18} /></button>
                <span className="font-bold text-gray-800">{monthNames[month]} {year}</span>
                <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronRight size={18} /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1 pb-4 border-b border-gray-100">
                {days.map((date, i) => (
                    <button
                        key={i} type="button"
                        disabled={!date || isDisabled(date)}
                        onClick={() => handleDateSelect(date)}
                        className={clsx(
                            "h-8 flex items-center justify-center text-xs rounded-lg transition-all",
                            !date && "invisible",
                            date && !isSelected(date) && "hover:bg-primary/5 text-gray-700",
                            isSelected(date) && "bg-primary text-white font-bold",
                            isDisabled(date) && "opacity-20 cursor-not-allowed"
                        )}
                    >
                        {date ? date.getDate() : ""}
                    </button>
                ))}
            </div>

            <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Adjust Time</span>
                </div>
                <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                        <select 
                            className="bg-transparent text-xs font-bold px-2 py-1 outline-none appearance-none cursor-pointer"
                            value={hour}
                            onChange={(e) => handleTimeChange(e.target.value, undefined, undefined)}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={h}>{h < 10 ? `0${h}` : h}</option>)}
                        </select>
                        <span className="text-gray-400 font-bold">:</span>
                        <select 
                            className="bg-transparent text-xs font-bold px-2 py-1 outline-none appearance-none cursor-pointer"
                            value={minute < 10 ? `0${minute}` : minute}
                            onChange={(e) => handleTimeChange(undefined, parseInt(e.target.value), undefined)}
                        >
                            {Array.from({ length: 60 }, (_, i) => i).map(m => <option key={m} value={m}>{m < 10 ? `0${m}` : m}</option>)}
                        </select>
                    </div>
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        {['AM', 'PM'].map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => handleTimeChange(undefined, undefined, p)}
                                className={clsx(
                                    "px-3 py-1 rounded-lg text-[10px] font-black transition-all",
                                    ampm === p ? "bg-white text-primary shadow-sm" : "text-gray-400"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full mt-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
                Set Date & Time
            </button>
        </div>,
        document.body
    );

    return (
        <div className="space-y-1.5 w-full text-left">
            {label && (
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => {
                        if (!isOpen) updateCoords();
                        setIsOpen(!isOpen);
                    }}
                    className={clsx(
                        "w-full flex items-center justify-between bg-white border p-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20",
                        isOpen ? "border-primary shadow-sm" : "border-gray-200 hover:border-gray-300",
                        error ? "border-red-300 bg-red-50" : "bg-white"
                    )}
                >
                    <div className="flex items-center gap-3 truncate">
                        <CalendarIcon size={16} className={clsx(isOpen ? "text-primary" : "text-gray-400")} />
                        <span className={clsx("truncate text-[11px] font-bold", !value ? "text-gray-400" : "text-gray-900")}>
                            {value ? new Date(value).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace('am', 'AM').replace('pm', 'PM') : placeholder}
                        </span>
                    </div>
                    <ChevronDown size={16} className={clsx("text-gray-400 transition-transform duration-300 shrink-0", isOpen && "rotate-180")} />
                </button>
                {isOpen && coords.bottom > 0 && dropdown}
            </div>
            {error && <p className="text-[10px] text-red-500 font-medium ml-1">{error}</p>}
        </div>
    );
};

export default FormDateTimePicker;
