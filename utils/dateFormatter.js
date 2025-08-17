/**
 * Date and Time formatting utilities for UK format and London timezone
 */

/**
 * Format date in UK format (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateUK(date) {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-GB', { 
    timeZone: 'Europe/London',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format time in UK format (HH:MM)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string
 */
export function formatTimeUK(date) {
  const dateObj = new Date(date);
  return dateObj.toLocaleTimeString('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Format date and time in UK format (DD/MM/YYYY HH:MM)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTimeUK(date) {
  const dateObj = new Date(date);
  return dateObj.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDateUK(date);
  }
}

/**
 * Get current London time
 * @returns {Date} Current time in London timezone
 */
export function getCurrentLondonTime() {
  return new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });
}
