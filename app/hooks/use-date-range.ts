import { useState, useEffect } from 'react';

// Custom hook to manage date range
export const useDateRange = (initialFrom = null, initialTo = null) => {
  const [dateRange, setDateRange] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedRange = localStorage.getItem('dateRange');
      if (savedRange) {
        return JSON.parse(savedRange);
      }
    }
    return {
      from: initialFrom,
      to: initialTo,
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dateRange', JSON.stringify(dateRange));
    }
  }, [dateRange]);

  return [dateRange, setDateRange];
};
