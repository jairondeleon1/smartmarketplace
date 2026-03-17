import React, { createContext, useContext } from 'react';

const AccessibilityContext = createContext({});

export function AccessibilityProvider({ children }) {
  return (
    <AccessibilityContext.Provider value={{}}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useA11y() {
  return useContext(AccessibilityContext);
}