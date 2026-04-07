import { useState, useEffect, useCallback } from 'react';
import { Key, Store, Users, RefreshCw, MapPin, ChevronDown } from 'lucide-react';
import { useConfigStore, ENVIRONMENTS, type EnvironmentId, type AddressFields } from '@/lib/config-store';
import { apiRequest } from '@/lib/api';

const ENV_IDS: EnvironmentId[] = ['production', 'development'];

interface StoreItem {
  id: string;
  name: string;
  baseCurrency?: string;
}

export function ConfigPanel() {
  const config = useConfigStore();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressTab, setAddressTab] = useState<'shipping' | 'billing'>('shipping');

  const fetchStores = useCallback(async () => {
    const apiBaseUrl = config.getApiBaseUrl();
    if (!config.apiToken || !apiBaseUrl) return;
    setIsLoadingStores(true);
    try {
      const res = await apiRequest<{ stores: StoreItem[] }>({
        method: 'POST',
        path: '/api/public/v1/stores/list',
        apiBaseUrl,
        apiToken: config.apiToken,
        body: { page: 1, pageSize: 50 },
      });
      if (res.ok && res.data.stores) setStores(res.data.stores);
    } catch {
      // silent
    } finally {
      setIsLoadingStores(false);
    }
  }, [config.apiToken, config.getApiBaseUrl]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* Environment */}
        <div className="card px-4 py-4">
          <p className="label mb-3">Environment</p>
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {ENV_IDS.map((envId) => {
              const env = ENVIRONMENTS[envId];
              const isActive = config.environmentId === envId;
              return (
                <button
                  key={envId}
                  onClick={() => config.setEnvironment(envId)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: env.color }} />
                  {env.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 font-mono text-[10px] text-slate-400">{config.getApiBaseUrl()}</p>
        </div>

        {/* API Credentials */}
        <div className="card px-4 py-4">
          <p className="label mb-3"><Key size={10} className="mr-1 inline" />API Credentials</p>
          <div className="space-y-3">
            <div>
              <label className="label">API Token</label>
              <input
                type="password"
                value={config.apiToken}
                onChange={(e) => config.setApiToken(e.target.value)}
                className="input-field-mono text-xs"
                placeholder="org:admin token…"
              />
              <p className="mt-1 text-[10px] text-slate-400">Dashboard → API Keys → org:admin</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="label mb-0"><Store size={10} className="mr-1 inline" />Store</label>
                <button
                  onClick={fetchStores}
                  disabled={isLoadingStores}
                  className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <RefreshCw size={9} className={isLoadingStores ? 'animate-spin' : ''} />
                </button>
              </div>
              <input
                type="text"
                value={config.storeId}
                onChange={(e) => config.setStoreId(e.target.value)}
                className="input-field-mono text-xs"
                placeholder="store_xxxxxxxx"
              />
              {stores.length > 0 && (
                <div className="mt-1.5 max-h-32 space-y-0.5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  {stores.map((s) => {
                    const isActive = config.storeId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => config.setStoreId(s.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${
                          isActive ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <Store size={10} className={isActive ? 'text-blue-500' : 'text-slate-400'} />
                        <div className="min-w-0 flex-1">
                          <div className={`truncate text-[11px] font-medium ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>
                            {s.name}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-mono text-[9px] text-slate-400">{s.id}</span>
                            {s.baseCurrency && (
                              <span className="shrink-0 rounded-md bg-slate-100 px-1 py-px text-[8px] text-slate-500">
                                {s.baseCurrency}
                              </span>
                            )}
                          </div>
                        </div>
                        {isActive && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="card px-4 py-4">
          <p className="label mb-3"><Users size={10} className="mr-1 inline" />Customer</p>
          <div className="space-y-2">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={config.customerEmail}
                onChange={(e) => config.setCustomerEmail(e.target.value)}
                className="input-field text-xs"
                placeholder="test@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">First Name</label>
                <input
                  type="text"
                  value={config.customerFirstName}
                  onChange={(e) => config.setCustomerFirstName(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  type="text"
                  value={config.customerLastName}
                  onChange={(e) => config.setCustomerLastName(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Shipping / Billing Address */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setAddressOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <MapPin size={11} className="text-slate-400" />
            Shipping &amp; Billing Address
            <span className="rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-medium text-amber-700">
              required for Airwallex
            </span>
          </span>
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform duration-200 ${addressOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {addressOpen && (
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
            <div className="mb-3 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(['shipping', 'billing'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAddressTab(tab)}
                  className={`flex flex-1 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                    addressTab === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <AddressForm
              value={addressTab === 'shipping' ? config.shippingAddress : config.billingAddress}
              onChange={addressTab === 'shipping' ? config.setShippingAddress : config.setBillingAddress}
            />
          </div>
        )}
      </div>

    </div>
  );
}

function AddressForm({
  value,
  onChange,
}: {
  value: AddressFields;
  onChange: (fields: Partial<AddressFields>) => void;
}) {
  const field = (key: keyof AddressFields, label: string, placeholder = '', colSpan = 1) => (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
      <label className="label">{label}</label>
      <input
        type="text"
        value={value[key]}
        onChange={(e) => onChange({ [key]: e.target.value })}
        className="input-field text-xs"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      {field('firstName', 'First Name', 'Test')}
      {field('lastName', 'Last Name', 'User')}
      {field('address1', 'Address Line 1', '123 Main St', 2)}
      {field('address2', 'Address Line 2', 'Apt 4B (optional)', 2)}
      {field('city', 'City', 'New York')}
      {field('state', 'State', 'NY')}
      {field('zip', 'ZIP / Postal', '10001')}
      <div>
        <label className="label">
          Country <span className="text-amber-600">*</span>
        </label>
        <input
          type="text"
          value={value.country}
          onChange={(e) => onChange({ country: e.target.value })}
          className="input-field text-xs"
          placeholder="US"
          maxLength={2}
        />
        <p className="mt-0.5 text-[9px] text-amber-600">ISO 2-letter code — required for Airwallex</p>
      </div>
      {field('phone', 'Phone', '+1 555 000 0000')}
      {field('email', 'Email', 'test@example.com')}
    </div>
  );
}
