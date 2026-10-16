import { useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import './reservation-date-picker.css';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDate(value) {
  return value ? new Date(`${value}T00:00:00`) : new Date();
}

export default function ReservationDatePicker({
  label,
  value,
  onChange,
  afterDate,
  minDate,
  id: inputId,
}) {
  const generatedId = useId();
  const id = inputId || generatedId;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parseDate(value || afterDate));
  const toggle = useRef(null);
  const input = useRef(null);
  const today = dateValue(new Date());
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = new Date(year, monthIndex, 1).getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const earliest = afterDate ? parseDate(afterDate) : null;
  if (earliest) earliest.setDate(earliest.getDate() + 1);
  const afterMinimum = earliest ? dateValue(earliest) : undefined;
  const min =
    afterMinimum && (!minDate || afterMinimum > minDate)
      ? afterMinimum
      : minDate;

  function showCalendar() {
    setMonth(parseDate(value || min));
    setOpen(true);
  }

  function selectDate(nextValue) {
    onChange({ target: { value: nextValue } });
    setOpen(false);
    toggle.current?.focus();
  }

  return (
    <div
      className="reservation-date-picker"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <label htmlFor={id}>{label}</label>
      <div className="reservation-date-control">
        <input
          id={id}
          ref={input}
          required
          type="date"
          value={value}
          min={min}
          onChange={onChange}
          onClick={(event) => {
            event.preventDefault();
            showCalendar();
          }}
        />
        <button
          ref={toggle}
          type="button"
          aria-label={`Choose ${label.toLowerCase()} date`}
          aria-expanded={open}
          aria-controls={`${id}-calendar`}
          onClick={() => (open ? setOpen(false) : showCalendar())}
        >
          <CalendarDays size={18} />
        </button>
      </div>
      {open && (
        <div
          id={`${id}-calendar`}
          className="reservation-calendar"
          role="group"
          aria-label={`${label} calendar`}
        >
          <div className="reservation-calendar-header">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <strong aria-live="polite">
              {month.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </strong>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="reservation-calendar-days">
            {weekdays.map((day) => (
              <span className="reservation-calendar-weekday" key={day}>
                {day}
              </span>
            ))}
            {Array.from({ length: offset }, (_, index) => (
              <span key={`empty-${index}`} />
            ))}
            {Array.from({ length: days }, (_, index) => {
              const date = new Date(year, monthIndex, index + 1);
              const dayValue = dateValue(date);
              return (
                <button
                  key={dayValue}
                  type="button"
                  disabled={Boolean(min && dayValue < min)}
                  aria-label={date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  aria-pressed={value === dayValue}
                  aria-current={today === dayValue ? 'date' : undefined}
                  onClick={() => selectDate(dayValue)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="reservation-calendar-footer">
            <button
              type="button"
              disabled={Boolean(min && today < min)}
              onClick={() => selectDate(today)}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                input.current?.focus();
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
