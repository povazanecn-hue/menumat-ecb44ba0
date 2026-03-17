import { create } from 'zustand';

export interface MenuSlots {
  soups: number;
  mains: number;
  desserts: number;
  drinks: number;
}

export interface OnboardingState {
  currentStep: number;
  // Step 1 – Restaurant
  restaurantName: string;
  address: string;
  // Step 2 – Menu Structure
  selectedDays: string[];
  slots: MenuSlots;
  // Step 3 – Pricing
  defaultMargin: number;
  vatRate: number;
  // Step 4/5 – Meta
  selectedTemplate: string;
  restaurantCreated: boolean;
  submitting: boolean;
  // Preview day index
  previewDayIndex: number;
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setRestaurantName: (name: string) => void;
  setAddress: (addr: string) => void;
  setSelectedDays: (days: string[]) => void;
  setSlots: (slots: MenuSlots) => void;
  setDefaultMargin: (margin: number) => void;
  setVatRate: (rate: number) => void;
  setSelectedTemplate: (id: string) => void;
  setRestaurantCreated: (v: boolean) => void;
  setSubmitting: (v: boolean) => void;
  setPreviewDayIndex: (i: number) => void;
  reset: () => void;
}

const INITIAL: Omit<OnboardingState, 'setStep' | 'nextStep' | 'prevStep' | 'setRestaurantName' | 'setAddress' | 'setSelectedDays' | 'setSlots' | 'setDefaultMargin' | 'setVatRate' | 'setSelectedTemplate' | 'setRestaurantCreated' | 'setSubmitting' | 'setPreviewDayIndex' | 'reset'> = {
  currentStep: 0,
  restaurantName: '',
  address: '',
  selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  slots: { soups: 2, mains: 5, desserts: 2, drinks: 2 },
  defaultMargin: 100,
  vatRate: 20,
  selectedTemplate: 'classic',
  restaurantCreated: false,
  submitting: false,
  previewDayIndex: 0,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...INITIAL,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 4) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
  setRestaurantName: (name) => set({ restaurantName: name }),
  setAddress: (addr) => set({ address: addr }),
  setSelectedDays: (days) => set({ selectedDays: days }),
  setSlots: (slots) => set({ slots }),
  setDefaultMargin: (margin) => set({ defaultMargin: margin }),
  setVatRate: (rate) => set({ vatRate: rate }),
  setSelectedTemplate: (id) => set({ selectedTemplate: id }),
  setRestaurantCreated: (v) => set({ restaurantCreated: v }),
  setSubmitting: (v) => set({ submitting: v }),
  setPreviewDayIndex: (i) => set({ previewDayIndex: i }),
  reset: () => set({ ...INITIAL }),
}));
