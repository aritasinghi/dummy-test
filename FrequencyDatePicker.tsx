import React, { useState, useRef, useEffect, useCallback } from 'react';
import './FrequencyDatePicker.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

interface FrequencyDatePickerProps {
    frequency:    Frequency;
    value:        string;                    // YYYY-MM-DD (empty = no selection)
    onChange:     (value: string) => void;
    disabled?:    boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_HDR  = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function toYMD(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getMondayOfWeek(d: Date): Date {
    const day = d.getDay();                       // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;       // shift to Monday
    const mon = new Date(d);
    mon.setDate(d.getDate() + diff);
    return mon;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth()    === b.getMonth()
        && a.getDate()     === b.getDate();
}

function isSameWeek(a: Date, b: Date): boolean {
    return isSameDay(getMondayOfWeek(a), getMondayOfWeek(b));
}

function getCalendarDays(year: number, month: number): Date[] {
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const days: Date[] = [];
    // pad start
    for (let i = 0; i < first.getDay(); i++)
        days.push(new Date(year, month, 1 - (first.getDay() - i)));
    // month days
    for (let d = 1; d <= last.getDate(); d++)
        days.push(new Date(year, month, d));
    // pad end
    while (days.length % 7 !== 0)
        days.push(new Date(year, month + 1, days.length - last.getDate() - first.getDay() + 1));
    return days;
}

function formatDisplay(value: string, frequency: Frequency): string {
    if (!value) return '';
    const d = new Date(value + 'T00:00:00');
    if (frequency === 'MONTHLY') return `${d.getMonth() + 1}.${d.getFullYear()}`;
    if (frequency === 'WEEKLY') {
        const mon = getMondayOfWeek(d);
        return `${mon.getDate()}.${mon.getMonth() + 1}.${mon.getFullYear()}`;
    }
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function getPlaceholder(frequency: Frequency): string {
    if (frequency === 'WEEKLY')  return 'Select week';
    if (frequency === 'MONTHLY') return 'Select month';
    return 'Select date';
}

// ─── Day Calendar (DAILY + YEARLY) ───────────────────────────────────────────

function DayCalendar({ value, viewDate, onViewChange, onSelect }: {
    value:        string;
    viewDate:     Date;
    onViewChange: (d: Date) => void;
    onSelect:     (d: Date) => void;
}) {
    const today = new Date();
    const days  = getCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
    const sel   = value ? new Date(value + 'T00:00:00') : null;

    const prevMonth = () => onViewChange(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const nextMonth = () => onViewChange(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    return (
        <div className="fdp__popup">
            <div className="fdp__header">
                <button className="fdp__nav" onClick={prevMonth}>&#8249;</button>
                <span className="fdp__header-label">
                    {MONTH_FULL[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button className="fdp__nav" onClick={nextMonth}>&#8250;</button>
            </div>
            <div className="fdp__day-grid">
                {DAYS_HDR.map(d => (
                    <div key={d} className="fdp__day-hdr">{d}</div>
                ))}
                {days.map((day, i) => {
                    const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                    const isToday        = isSameDay(day, today);
                    const isSelected     = sel ? isSameDay(day, sel) : false;
                    return (
                        <button
                            key={i}
                            onClick={() => { if (isCurrentMonth) onSelect(day); }}
                            className={[
                                'fdp__day',
                                !isCurrentMonth ? 'fdp__day--outside' : '',
                                isToday         ? 'fdp__day--today'   : '',
                                isSelected      ? 'fdp__day--selected': '',
                            ].join(' ')}
                        >
                            {day.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Week Calendar (WEEKLY) ───────────────────────────────────────────────────

function WeekCalendar({ value, viewDate, onViewChange, onSelect, onClear }: {
    value:        string;
    viewDate:     Date;
    onViewChange: (d: Date) => void;
    onSelect:     (d: Date) => void;
    onClear:      () => void;
}) {
    const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
    const today  = new Date();
    const days   = getCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
    const selMon = value ? getMondayOfWeek(new Date(value + 'T00:00:00')) : null;

    const prevMonth = () => onViewChange(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const nextMonth = () => onViewChange(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const isHovered  = (day: Date) => hoveredDay ? isSameWeek(day, hoveredDay) : false;
    const isSelected = (day: Date) => selMon ? isSameWeek(day, selMon) : false;

    return (
        <div className="fdp__popup">
            <div className="fdp__header">
                <button className="fdp__nav" onClick={prevMonth}>&#8249;</button>
                <span className="fdp__header-label">
                    {MONTH_FULL[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button className="fdp__nav" onClick={nextMonth}>&#8250;</button>
            </div>
            <div className="fdp__day-grid">
                {DAYS_HDR.map(d => (
                    <div key={d} className="fdp__day-hdr">{d}</div>
                ))}
                {days.map((day, i) => {
                    const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                    const isToday        = isSameDay(day, today);
                    const hovered        = isHovered(day);
                    const selected       = isSelected(day);

                    // Determine position in week row for rounded ends
                    const colIndex = i % 7;
                    const isFirst  = colIndex === 0;
                    const isLast   = colIndex === 6;

                    return (
                        <button
                            key={i}
                            className={[
                                'fdp__day fdp__day--week',
                                !isCurrentMonth ? 'fdp__day--outside'  : '',
                                isToday         ? 'fdp__day--today'    : '',
                                selected        ? 'fdp__day--week-sel' : '',
                                !selected && hovered ? 'fdp__day--week-hover' : '',
                                isFirst         ? 'fdp__day--week-first' : '',
                                isLast          ? 'fdp__day--week-last'  : '',
                            ].join(' ')}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                            onClick={() => onSelect(getMondayOfWeek(day))}
                        >
                            {day.getDate()}
                        </button>
                    );
                })}
            </div>
            <div className="fdp__week-footer">
                <button className="fdp__footer-btn fdp__footer-btn--clear" onClick={onClear}>
                    CLEAR
                </button>
                <button className="fdp__footer-btn fdp__footer-btn--ready"
                    onClick={() => selMon && onSelect(selMon)}
                    disabled={!value}>
                    READY
                </button>
            </div>
        </div>
    );
}

// ─── Month Calendar (MONTHLY) ─────────────────────────────────────────────────

function MonthCalendar({ value, viewDate, onViewChange, onSelect }: {
    value:        string;
    viewDate:     Date;
    onViewChange: (d: Date) => void;
    onSelect:     (month: number, year: number) => void;
}) {
    const sel       = value ? new Date(value + 'T00:00:00') : null;
    const today     = new Date();
    const prevYear  = () => onViewChange(new Date(viewDate.getFullYear() - 1, 0, 1));
    const nextYear  = () => onViewChange(new Date(viewDate.getFullYear() + 1, 0, 1));

    return (
        <div className="fdp__popup fdp__popup--month">
            <div className="fdp__header">
                <button className="fdp__nav" onClick={prevYear}>&#8249;</button>
                <span className="fdp__header-label">{viewDate.getFullYear()}</span>
                <button className="fdp__nav" onClick={nextYear}>&#8250;</button>
            </div>
            <div className="fdp__month-grid">
                {MONTHS.map((m, i) => {
                    const isSelected = sel
                        ? sel.getMonth() === i && sel.getFullYear() === viewDate.getFullYear()
                        : false;
                    const isToday = today.getMonth() === i
                        && today.getFullYear() === viewDate.getFullYear();
                    return (
                        <button
                            key={m}
                            onClick={() => onSelect(i, viewDate.getFullYear())}
                            className={[
                                'fdp__month-btn',
                                isSelected ? 'fdp__month-btn--selected' : '',
                                isToday    ? 'fdp__month-btn--today'    : '',
                            ].join(' ')}
                        >
                            {m}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const FrequencyDatePicker: React.FC<FrequencyDatePickerProps> = ({
    frequency,
    value,
    onChange,
    disabled = false,
}) => {
    const [open,     setOpen]     = useState(false);
    const [viewDate, setViewDate] = useState(() => value ? new Date(value + 'T00:00:00') : new Date());
    const containerRef            = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close on ESC
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const handleDaySelect = useCallback((day: Date) => {
        onChange(toYMD(day));
        setOpen(false);
    }, [onChange]);

    const handleWeekSelect = useCallback((monday: Date) => {
        onChange(toYMD(monday));
        // stay open until READY clicked
    }, [onChange]);

    const handleWeekReady = useCallback(() => setOpen(false), []);

    const handleWeekClear = useCallback(() => {
        onChange('');
    }, [onChange]);

    const handleMonthSelect = useCallback((month: number, year: number) => {
        const d = new Date(year, month, 1);
        onChange(toYMD(d));
        setOpen(false);
    }, [onChange]);

    const displayValue  = formatDisplay(value, frequency);
    const placeholder   = getPlaceholder(frequency);

    return (
        <div className="fdp" ref={containerRef}>
            {/* Input trigger */}
            <button
                type="button"
                className={`fdp__input${open ? ' fdp__input--open' : ''}${disabled ? ' fdp__input--disabled' : ''}`}
                onClick={() => { if (!disabled) setOpen(v => !v); }}
                disabled={disabled}
            >
                <span className={displayValue ? 'fdp__value' : 'fdp__placeholder'}>
                    {displayValue || placeholder}
                </span>
                <svg className="fdp__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="14" height="13" rx="2"/>
                    <path d="M3 8h14M7 2v4M13 2v4"/>
                </svg>
            </button>

            {/* Popup */}
            {open && (
                <>
                    {/* DAILY + YEARLY → standard day picker */}
                    {(frequency === 'DAILY' || frequency === 'YEARLY') && (
                        <DayCalendar
                            value={value}
                            viewDate={viewDate}
                            onViewChange={setViewDate}
                            onSelect={handleDaySelect}
                        />
                    )}

                    {/* WEEKLY → week row picker */}
                    {frequency === 'WEEKLY' && (
                        <WeekCalendar
                            value={value}
                            viewDate={viewDate}
                            onViewChange={setViewDate}
                            onSelect={handleWeekSelect}
                            onClear={handleWeekClear}
                        />
                    )}

                    {/* MONTHLY → month grid only */}
                    {frequency === 'MONTHLY' && (
                        <MonthCalendar
                            value={value}
                            viewDate={viewDate}
                            onViewChange={setViewDate}
                            onSelect={handleMonthSelect}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default FrequencyDatePicker;
export type { FrequencyDatePickerProps, Frequency };
