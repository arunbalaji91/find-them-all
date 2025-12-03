/**
 * Format a Firestore timestamp into a readable date string
 * @param {Object|Date|null} timestamp - Firestore Timestamp, Date object, or null
 * @param {string} format - Format type: 'full', 'dateOnly', or 'relative'
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp, format = 'full') => {
  if (!timestamp) {
    return 'Unknown date';
  }

  try {
    // Handle Firestore Timestamp object
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Invalid date';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    switch (format) {
      case 'full':
        // Format: "Dec 3, 2025 at 2:30 PM"
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

      case 'dateOnly':
        // Format: "Dec 3, 2025"
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

      case 'relative':
        // Format: "2 hours ago", "5 minutes ago", etc.
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) {
          return 'just now';
        } else if (diffMins < 60) {
          return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
        } else if (diffHours < 24) {
          return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffDays < 7) {
          return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
        } else {
          // If more than a week, show the full date
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        }

      default:
        return date.toLocaleString();
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid date';
  }
};

/**
 * Truncate a string to a specified length and add ellipsis
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length before truncation
 * @returns {string} Truncated string with ellipsis if needed
 */
export const truncateString = (str, length = 8) => {
  if (!str) {
    return '';
  }

  if (str.length <= length) {
    return str;
  }

  return `${str.substring(0, length)}...`;
};
