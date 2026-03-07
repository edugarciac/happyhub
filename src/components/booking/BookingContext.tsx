'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { TimeSlot } from '@/utils/pricing';

export interface Extra {
  id: string;
  name: string;
  priceType: 'per_person' | 'fixed';
  basePrice: number;
  description?: string;
}

export const EXTRAS: Extra[] = [
  { id: 'catering', name: 'Catering', priceType: 'per_person', basePrice: 15, description: 'Menú completo por persona' },
  { id: 'animacion', name: 'Animación infantil', priceType: 'fixed', basePrice: 150, description: 'Payasos, magia, juegos' },
  { id: 'decoracion', name: 'Decoración temática', priceType: 'fixed', basePrice: 100, description: 'Globos, banderines, centro mesa' },
  { id: 'fotografia', name: 'Fotografía profesional', priceType: 'fixed', basePrice: 200, description: '2h de sesión + 50 fotos editadas' },
  { id: 'tarta', name: 'Tarta personalizada', priceType: 'fixed', basePrice: 50, description: 'Diseño a medida' },
];

export type EventType = 'cumpleaños' | 'celebracion-familiar' | 'eventos-amigos' | 'eventos-colegio-trabajo' | 'taller' | 'otros';

export interface SelectedSlot {
  date: Date;
  timeSlot: TimeSlot;
  price: number | 'consult'; // 0 means price not yet loaded
}

export interface BookingState {
  step: number;
  // Step 1: Date & time (multi-slot)
  selectedSlots: SelectedSlot[];
  // Step 2: Configuration
  guests: number;
  selectedExtras: string[];
  // Step 3: Customer data
  name: string;
  email: string;
  phone: string;
  eventType: EventType | null;
  message: string;
  acceptTerms: boolean;
  // Step 4: Payment
  stripeSessionId: string | null;
  // Pricing (total of all selected slots)
  basePrice: number | 'consult';
  // Reservation ID (after creation)
  reservationId: string | null;
}

function computeBasePrice(slots: SelectedSlot[]): number | 'consult' {
  if (slots.length === 0) return 0;
  if (slots.some(s => s.price === 'consult')) return 'consult';
  return slots.reduce((sum, s) => sum + (s.price as number), 0);
}

type BookingAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'TOGGLE_SLOT'; slot: SelectedSlot }
  | { type: 'SET_SLOTS'; slots: SelectedSlot[] }
  | { type: 'SET_GUESTS'; guests: number }
  | { type: 'TOGGLE_EXTRA'; extraId: string }
  | { type: 'SET_CUSTOMER_DATA'; data: Partial<Pick<BookingState, 'name' | 'email' | 'phone' | 'eventType' | 'message' | 'acceptTerms'>> }
  | { type: 'SET_BASE_PRICE'; price: number | 'consult' }
  | { type: 'SET_STRIPE_SESSION'; sessionId: string }
  | { type: 'SET_RESERVATION_ID'; id: string }
  | { type: 'RESET' };

const initialState: BookingState = {
  step: 1,
  selectedSlots: [],
  guests: 20,
  selectedExtras: [],
  name: '',
  email: '',
  phone: '',
  eventType: null,
  message: '',
  acceptTerms: false,
  stripeSessionId: null,
  basePrice: 0,
  reservationId: null,
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'TOGGLE_SLOT': {
      const { slot } = action;
      const exists = state.selectedSlots.some(
        s =>
          s.date.getFullYear() === slot.date.getFullYear() &&
          s.date.getMonth() === slot.date.getMonth() &&
          s.date.getDate() === slot.date.getDate() &&
          s.timeSlot === slot.timeSlot
      );
      const newSlots = exists
        ? state.selectedSlots.filter(
            s =>
              !(
                s.date.getFullYear() === slot.date.getFullYear() &&
                s.date.getMonth() === slot.date.getMonth() &&
                s.date.getDate() === slot.date.getDate() &&
                s.timeSlot === slot.timeSlot
              )
          )
        : [...state.selectedSlots, slot];
      return { ...state, selectedSlots: newSlots, basePrice: computeBasePrice(newSlots) };
    }
    case 'SET_SLOTS': {
      const newSlots = action.slots;
      return { ...state, selectedSlots: newSlots, basePrice: computeBasePrice(newSlots) };
    }
    case 'SET_GUESTS':
      return { ...state, guests: action.guests };
    case 'TOGGLE_EXTRA':
      return {
        ...state,
        selectedExtras: state.selectedExtras.includes(action.extraId)
          ? state.selectedExtras.filter(id => id !== action.extraId)
          : [...state.selectedExtras, action.extraId],
      };
    case 'SET_CUSTOMER_DATA':
      return { ...state, ...action.data };
    case 'SET_BASE_PRICE':
      return { ...state, basePrice: action.price };
    case 'SET_STRIPE_SESSION':
      return { ...state, stripeSessionId: action.sessionId };
    case 'SET_RESERVATION_ID':
      return { ...state, reservationId: action.id };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface BookingContextType {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  // Helper functions
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  calculateTotalPrice: () => number | 'consult';
  calculateExtrasPrice: () => number;
  calculateDepositAmount: () => number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: ReactNode;
  initialDate?: string;
  initialTimeSlot?: TimeSlot;
}

export function BookingProvider({ children, initialDate, initialTimeSlot }: BookingProviderProps) {
  const getInitialState = (): BookingState => {
    const state = { ...initialState };

    if (initialDate && initialTimeSlot) {
      state.step = 2;
      // price: 0 means not yet loaded — Step2Configuration will calculate it
      state.selectedSlots = [{ date: new Date(initialDate), timeSlot: initialTimeSlot, price: 0 }];
      state.basePrice = 0;
    }

    return state;
  };

  const [state, dispatch] = useReducer(bookingReducer, getInitialState());

  const goToStep = (step: number) => {
    dispatch({ type: 'SET_STEP', step });
  };

  const nextStep = () => {
    dispatch({ type: 'SET_STEP', step: Math.min(state.step + 1, 4) });
  };

  const prevStep = () => {
    dispatch({ type: 'SET_STEP', step: Math.max(state.step - 1, 1) });
  };

  const calculateExtrasPrice = (): number => {
    return state.selectedExtras.reduce((total, extraId) => {
      const extra = EXTRAS.find(e => e.id === extraId);
      if (!extra) return total;
      if (extra.priceType === 'per_person') {
        return total + extra.basePrice * state.guests;
      }
      return total + extra.basePrice;
    }, 0);
  };

  const calculateTotalPrice = (): number | 'consult' => {
    if (state.basePrice === 'consult') return 'consult';
    return state.basePrice + calculateExtrasPrice();
  };

  const calculateDepositAmount = (): number => {
    const total = calculateTotalPrice();
    if (total === 'consult') return 0;
    return Math.ceil(total * 0.3);
  };

  return (
    <BookingContext.Provider
      value={{
        state,
        dispatch,
        goToStep,
        nextStep,
        prevStep,
        calculateTotalPrice,
        calculateExtrasPrice,
        calculateDepositAmount,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
