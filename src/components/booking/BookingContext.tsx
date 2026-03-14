'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { TimeSlot } from '@/utils/pricing';
import { event as gaEvent } from '@/lib/analytics';

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
export type PaymentMethod = 'card' | 'bizum' | 'cash';

export interface BookingState {
  step: number;
  // Step 1: Date & time
  date: Date | null;
  timeSlot: TimeSlot | null;
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
  paymentMethod: PaymentMethod | null;
  // Step 4: Payment
  stripeSessionId: string | null;
  // Pricing
  basePrice: number | 'consult';
  // Reservation ID (after creation)
  reservationId: string | null;
}

type BookingAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_DATE'; date: Date | null }
  | { type: 'SET_TIME_SLOT'; timeSlot: TimeSlot | null }
  | { type: 'SET_GUESTS'; guests: number }
  | { type: 'TOGGLE_EXTRA'; extraId: string }
  | { type: 'SET_CUSTOMER_DATA'; data: Partial<Pick<BookingState, 'name' | 'email' | 'phone' | 'eventType' | 'message' | 'acceptTerms' | 'paymentMethod'>> }
  | { type: 'SET_BASE_PRICE'; price: number | 'consult' }
  | { type: 'SET_STRIPE_SESSION'; sessionId: string }
  | { type: 'SET_RESERVATION_ID'; id: string }
  | { type: 'RESET' };

const initialState: BookingState = {
  step: 1,
  date: null,
  timeSlot: null,
  guests: 20,
  selectedExtras: [],
  name: '',
  email: '',
  phone: '',
  eventType: null,
  message: '',
  acceptTerms: false,
  paymentMethod: null,
  stripeSessionId: null,
  basePrice: 0,
  reservationId: null,
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_DATE':
      return { ...state, date: action.date };
    case 'SET_TIME_SLOT':
      return { ...state, timeSlot: action.timeSlot };
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
  // Create initial state with preselected values
  const getInitialState = (): BookingState => {
    const state = { ...initialState };

    // If date and timeSlot are provided, skip to step 2
    if (initialDate && initialTimeSlot) {
      state.step = 2; // Start at Step 2 (Configuration)
      state.date = new Date(initialDate);
      state.timeSlot = initialTimeSlot;
      // basePrice will be calculated in Step2Configuration
    }

    return state;
  };

  const [state, dispatch] = useReducer(bookingReducer, getInitialState());

  const goToStep = (step: number) => {
    dispatch({ type: 'SET_STEP', step });
  };

  const STEP_NAMES = ['', 'calendar', 'configuration', 'customer_data', 'confirmation'];

  const nextStep = () => {
    const next = Math.min(state.step + 1, 4);
    gaEvent('booking_step', { step_number: next, step_name: STEP_NAMES[next] });
    dispatch({ type: 'SET_STEP', step: next });
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
    return Math.ceil(total * 0.3); // 30% deposit, rounded up
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
