import React, { createContext, useState, useContext } from 'react';

const LocationContext = createContext();
export const LocationProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(null); 
  const [locationName, setLocationName] = useState('Sri Lanka'); 

  const value = { 
    userLocation, 
    setUserLocation, 
    locationName, 
    setLocationName 
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  return useContext(LocationContext);
};