import { useRef, MouseEvent } from 'react';

// Closes a modal only when the press AND the release both happen on the backdrop.
// A plain onClick also fires when a text selection started inside the modal ends
// over the backdrop, which closed modals mid-edit.
export function useBackdropClose() {
  const pressedOnBackdrop = useRef(false);

  return (onClose: () => void) => ({
    onMouseDown: (e: MouseEvent<HTMLElement>) => {
      pressedOnBackdrop.current = e.target === e.currentTarget;
    },
    onClick: (e: MouseEvent<HTMLElement>) => {
      if (pressedOnBackdrop.current && e.target === e.currentTarget) onClose();
      pressedOnBackdrop.current = false;
    },
  });
}
