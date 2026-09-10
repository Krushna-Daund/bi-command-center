import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext(null);

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    customer_state: '',
    customer_city: '',
    category: '',
    product: '',
    seller_state: '',
    seller_city: '',
    seller: '',
    order_status: '',
    payment_type: '',
    review_score: ''
  });

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      date_from: '',
      date_to: '',
      customer_state: '',
      customer_city: '',
      category: '',
      product: '',
      seller_state: '',
      seller_city: '',
      seller: '',
      order_status: '',
      payment_type: '',
      review_score: ''
    });
  };

  return (
    <FilterContext.Provider value={{ filters, updateFilter, clearFilters, setFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);
