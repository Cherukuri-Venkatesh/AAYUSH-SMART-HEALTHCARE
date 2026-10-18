/**
 * Universal Timezone-Safe Date Utility
 * Completely eliminates UTC vs Local Timezone date shifts (e.g. IST +05:30).
 */

// Formats any Date object, timestamp, or string into local YYYY-MM-DD
export const formatLocalDate = (input) => {
  if (!input) return '';
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return input.trim();
  }

  let d;
  if (typeof input === 'string') {
    if (input.includes('T')) {
      d = new Date(input);
    } else if (input.includes('-')) {
      const parts = input.trim().split('-');
      if (parts.length === 3) {
        d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        d = new Date(input);
      }
    } else {
      d = new Date(input);
    }
  } else if (input instanceof Date) {
    d = input;
  } else {
    d = new Date(input);
  }

  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Formats a date into D/M/YYYY for localized buttons
export const formatToDisplayDate = (input) => {
  if (!input) return '';
  let d;
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    const parts = input.trim().split('-');
    d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  } else if (input instanceof Date) {
    d = input;
  } else {
    d = new Date(input);
  }
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

// Generates next N days starting from local today
export const getUpcomingDays = (count = 7) => {
  const days = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const key = formatLocalDate(d);
    days.push({
      key,
      date: key,
      label: formatToDisplayDate(d),
      dayLabel: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateLabel: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    });
  }
  return days;
};

// Converts HH:mm (24-hour) to hh:mm AM/PM (12-hour)
export const formatTo12Hour = (time24) => {
  if (!time24) return '';
  const [hoursRaw, minutesRaw] = String(time24).split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw || 0);
  if (isNaN(hours)) return time24;
  const period = hours >= 12 ? 'PM' : 'AM';
  const normalizedHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(normalizedHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
};

// Converts hh:mm AM/PM (12-hour) to HH:mm:00 (24-hour)
export const formatTo24Hour = (time12) => {
  if (!time12) return '';
  const parts = String(time12).trim().split(' ');
  if (parts.length < 2) return time12;
  const time = parts[0];
  const modifier = parts[1].toUpperCase();
  let [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours)) return time12;
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00`;
};
