import { useState, useCallback } from "react";

/**
 * Simple toggle hook for boolean state.
 * Provides open and close helpers to avoid repeated code.
 * @param {boolean} initial - Initial state of the toggle
 */
export const useToggle = (initial = false) => {
  const [isOpen, setIsOpen] = useState(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return { isOpen, open, close, toggle, set: setIsOpen };
};

export default useToggle;
