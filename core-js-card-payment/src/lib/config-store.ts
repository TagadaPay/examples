import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EnvironmentId = 'production' | 'development';

export interface EnvironmentConfig {
  id: EnvironmentId;
  label: string;
  description: string;
  apiBaseUrl: string;
  sdkEnvironment: 'production' | 'development';
  color: string;
}

export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentConfig> = {
  production: {
    id: 'production',
    label: 'Production',
    description: 'app.tagadapay.com',
    apiBaseUrl: 'https://app.tagadapay.com',
    sdkEnvironment: 'production',
    color: '#ef4444',
  },
  development: {
    id: 'development',
    label: 'Development',
    description: 'app.tagadapay.dev',
    apiBaseUrl: 'https://app.tagadapay.dev',
    sdkEnvironment: 'development',
    color: '#f59e0b',
  },
};

export interface AddressFields {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
}

const DEFAULT_ADDRESS: AddressFields = {
  firstName: 'Test',
  lastName: 'User',
  address1: '123 Main St',
  address2: '',
  city: 'New York',
  state: 'NY',
  zip: '10001',
  country: 'US',
  phone: '+1 555 000 0000',
  email: 'test@example.com',
};

interface ConfigState {
  environmentId: EnvironmentId;
  apiToken: string;
  storeId: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  shippingAddress: AddressFields;
  billingAddress: AddressFields;

  getApiBaseUrl: () => string;
  getSdkEnvironment: () => 'production' | 'development';
  setEnvironment: (id: EnvironmentId) => void;
  setApiToken: (token: string) => void;
  setStoreId: (id: string) => void;
  setCustomerEmail: (email: string) => void;
  setCustomerFirstName: (name: string) => void;
  setCustomerLastName: (name: string) => void;
  setShippingAddress: (address: Partial<AddressFields>) => void;
  setBillingAddress: (address: Partial<AddressFields>) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      environmentId: 'development',
      apiToken: '',
      storeId: '',
      customerEmail: 'test@example.com',
      customerFirstName: 'Test',
      customerLastName: 'User',
      shippingAddress: { ...DEFAULT_ADDRESS },
      billingAddress: { ...DEFAULT_ADDRESS },

      getApiBaseUrl: () => ENVIRONMENTS[get().environmentId].apiBaseUrl,
      getSdkEnvironment: () => ENVIRONMENTS[get().environmentId].sdkEnvironment,

      setEnvironment: (id) => set({ environmentId: id }),
      setApiToken: (token) => set({ apiToken: token }),
      setStoreId: (id) => set({ storeId: id }),
      setCustomerEmail: (email) => set({ customerEmail: email }),
      setCustomerFirstName: (name) => set({ customerFirstName: name }),
      setCustomerLastName: (name) => set({ customerLastName: name }),
      setShippingAddress: (address) => set((s) => ({ shippingAddress: { ...s.shippingAddress, ...address } })),
      setBillingAddress: (address) => set((s) => ({ billingAddress: { ...s.billingAddress, ...address } })),
    }),
    { name: 'tagadapay-card-payment-config' },
  ),
);
