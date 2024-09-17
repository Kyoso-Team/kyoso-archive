/**
 * ```plain
 * Example: 1000 => '1,000'
 * ```
 */
export function formatNumber(n: number, maximumFractionDigits?: number) {
  return new Intl.NumberFormat('us-US', {
    maximumFractionDigits
  }).format(n);
}

/**
 * ```plain
 * Example (full): new Date('2023-08-20T20:07:11.768Z') => 'August 20th, 2023'
 * Example (shortened): new Date('2023-08-20T20:07:11.768Z') => 'Aug 20th, 2023'
 * ```
 */
export function formatDate(date: Date, month: 'full' | 'shortened' = 'full') {
  const months =
    month === 'shortened'
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December'
        ];

  const dateStr = date.getDate().toString();
  let cardinal: string = '';

  if (dateStr.at(-2) !== '1') {
    if (dateStr.endsWith('1')) {
      cardinal = 'st';
    } else if (dateStr.endsWith('2')) {
      cardinal = 'nd';
    } else if (dateStr.endsWith('3')) {
      cardinal = 'rd';
    } else {
      cardinal = 'th';
    }
  } else {
    cardinal = 'th';
  }

  return `${months[date.getMonth()]} ${dateStr}${cardinal}, ${date.getFullYear()}`;
}

/**
 * ```plain
 * Example: new Date('2023-08-20T20:07:11.768Z') => '8:07 PM'
 * ```
 */
export function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const period = hours < 12 ? 'AM' : 'PM';

  return `${formattedHours}:${minutes < 10 ? '0' : ''}${minutes} ${period}`;
}

/**
 * ```plain
 * Example: n = 25, digitCount = 5 => '00025'
 * ```
 */
export function formatDigits(n: number, digitCount: number) {
  const nStr = n.toString();
  const missingDigits = digitCount - nStr.length;
  let str = '';

  for (let i = missingDigits; i > 0; i--) {
    str += '0';
  }

  return `${str}${nStr}`;
}

export function fillDateDigits(n: number) {
  return n < 10 ? `0${n}` : n.toString();
}

/**
 * Parses a Date type value and transforms it into a valid string for an HTML input of type datetime-local
 * ```plain
 * Example: new Date('2023-08-20T20:07:11.768Z') => '2023-08-20T20:07:11'
 * Example (only date): new Date('2023-08-20T20:07:11.768Z') => '2023-08-20'
 * ```
 */
export function dateToHtmlInput(date: Date, onlyDate?: boolean) {
  const year = date.getFullYear();
  const month = fillDateDigits(date.getMonth() + 1);
  const day = fillDateDigits(date.getDate());

  if (onlyDate) {
    return `${year}-${month}-${day}`;
  }

  const hour = fillDateDigits(date.getHours());
  const minute = fillDateDigits(date.getMinutes());
  const second = fillDateDigits(date.getSeconds());

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}
