import { useSettings, useUpdateSettings, useSubmissions } from "@/hooks/use-form-data";
import { Loader2, Save, LayoutDashboard, LogOut, Settings as SettingsIcon, DollarSign, Plus, Minus, Trash2, X, Lock, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PricingConfig } from "@shared/schema";
import { DEFAULT_PRICING_CONFIG } from "@shared/schema";

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-[#6B5E51] rounded-full flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              data-testid="input-admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B5E51] focus:border-transparent text-sm"
              autoFocus
            />
          </div>
          {error && (
            <p data-testid="text-login-error" className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            data-testid="button-admin-login"
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 bg-[#6B5E51] text-white rounded-lg font-medium hover:bg-[#5a4f44] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data: authData, isLoading: isLoadingAuth } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/admin/check"],
    queryFn: async () => {
      const res = await fetch("/api/admin/check", { credentials: "include" });
      return res.json();
    },
    retry: false,
  });

  const isAdmin = authData?.authenticated === true;

  const [, setLocation] = useLocation();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ["/api/submissions"],
    queryFn: async () => {
      const res = await fetch("/api/submissions", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin,
  });
  
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'submissions' | 'settings'>('submissions');

  const [baseRate, setBaseRate] = useState(50);
  const [surplus, setSurplus] = useState<Record<string, number>>({});
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);

  const [newEventType, setNewEventType] = useState("");
  const [newDrinkName, setNewDrinkName] = useState("");
  const [newMatchaName, setNewMatchaName] = useState("");
  const [newMatchaPrice, setNewMatchaPrice] = useState(0);
  const [newGuestRange, setNewGuestRange] = useState("");
  const [newGuestPercent, setNewGuestPercent] = useState(0);
  const [newCannedLabel, setNewCannedLabel] = useState("");
  const [newCannedValue, setNewCannedValue] = useState("");
  const [newCannedPrice, setNewCannedPrice] = useState(0);
  const [newCartLabel, setNewCartLabel] = useState("");
  const [newCartPrice, setNewCartPrice] = useState(0);
  const [newPackageItem, setNewPackageItem] = useState("");
  const [newHourKey, setNewHourKey] = useState("");
  const [newHourPrice, setNewHourPrice] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    if (settings) {
      setBaseRate(settings.baseRate);
      setSurplus(settings.eventSurplus || {});
      setConfig(settings.pricingConfig || DEFAULT_PRICING_CONFIG);
    }
  }, [settings]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
  };

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!authData?.authenticated) {
    return <AdminLogin onSuccess={() => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
    }} />;
  }

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        baseRate,
        hourlyRates: settings?.hourlyRates || {},
        eventSurplus: surplus,
        pricingConfig: config,
      });
      toast({ title: "Settings Saved", description: "All pricing settings have been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
    }
  };

  const updateConfig = (updates: Partial<PricingConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('submissions')}
            data-testid="tab-submissions"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'submissions' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Submissions
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            data-testid="tab-settings"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            Pricing Settings
          </button>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-100">
          <button 
            onClick={() => handleLogout()}
            data-testid="button-logout"
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {activeTab === 'submissions' ? 'Recent Submissions' : 'Pricing Configuration'}
          </h1>
          <p className="text-gray-500 mt-1">
            {activeTab === 'submissions' 
              ? 'View and manage quote requests from your customers.' 
              : 'Adjust all pricing, items, and percentages for the quote calculator.'}
          </p>
        </header>

        {activeTab === 'submissions' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {isLoadingSubmissions ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary"/></div>
            ) : submissions && submissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-sm text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 font-semibold text-sm text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 font-semibold text-sm text-gray-500 uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-4 font-semibold text-sm text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-4 font-semibold text-sm text-gray-500 uppercase tracking-wider">Hours</th>
                      <th className="px-6 py-4 font-semibold text-sm text-gray-500 uppercase tracking-wider">Quote</th>
                      <th className="px-6 py-4 font-semibold text-sm text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 font-semibold text-sm text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50 transition-colors" data-testid={`row-submission-${sub.id}`}>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{sub.fullName}</td>
                        <td className="px-6 py-4 text-gray-600">{sub.mobileNumber}</td>
                        <td className="px-6 py-4 text-gray-600">{sub.eventType}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">{sub.hours} hrs</td>
                        <td className="px-6 py-4 font-bold text-primary">${sub.calculatedCost}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            data-testid={`button-view-submission-${sub.id}`}
                            onClick={() => setSelectedSubmission(sub)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#6B5E51] bg-[#6B5E51]/10 hover:bg-[#6B5E51]/20 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">No submissions found.</div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl space-y-6">
            {isLoadingSettings ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary"/></div>
            ) : (
              <>
                {/* ========== HOURLY PRICING ========== */}
                <Section title="Hourly Pricing" subtitle="Set the total cost for each hour option shown to customers">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(config.hourlyPricing).map(([hours, price]) => (
                      <div key={hours} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {hours} Hour{hours !== "1" ? "s" : ""}
                          </label>
                          <DollarInput value={price} onChange={(v) => updateConfig({ hourlyPricing: { ...config.hourlyPricing, [hours]: v } })} />
                        </div>
                        <button onClick={() => {
                          const next = { ...config.hourlyPricing };
                          delete next[hours];
                          updateConfig({ hourlyPricing: next });
                        }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-5" data-testid={`button-remove-hour-${hours}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <AddRow label="Add Hour Option">
                    <input type="text" placeholder="Hours (e.g. 6)" value={newHourKey} onChange={(e) => setNewHourKey(e.target.value)} className="input-sm flex-1" />
                    <DollarInput value={newHourPrice} onChange={setNewHourPrice} />
                    <button onClick={() => {
                      if (newHourKey) {
                        updateConfig({ hourlyPricing: { ...config.hourlyPricing, [newHourKey]: newHourPrice } });
                        setNewHourKey(""); setNewHourPrice(0);
                      }
                    }} className="btn-add" data-testid="button-add-hour">
                      <Plus className="w-4 h-4" />
                    </button>
                  </AddRow>
                </Section>

                {/* ========== CUSTOM HOURS ========== */}
                <Section title="Custom Hours Pricing" subtitle="Formula: base cost + extra per hour beyond threshold">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledDollarInput label="Base Cost" value={config.customHoursBase} onChange={(v) => updateConfig({ customHoursBase: v })} />
                    <LabeledDollarInput label="Per Extra Hour" value={config.customHoursExtra} onChange={(v) => updateConfig({ customHoursExtra: v })} />
                    <LabeledNumberInput label="Min Hours" value={config.customHoursMin} onChange={(v) => updateConfig({ customHoursMin: v })} />
                  </div>
                </Section>

                {/* ========== BASE PACKAGE ========== */}
                <Section title="Base Package" subtitle="The addon package price and included items">
                  <LabeledDollarInput label="Package Price" value={config.basePackagePrice} onChange={(v) => updateConfig({ basePackagePrice: v })} />
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-gray-600">Included Items:</p>
                    {config.basePackageItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const next = [...config.basePackageItems];
                            next[idx] = e.target.value;
                            updateConfig({ basePackageItems: next });
                          }}
                          className="flex-1 bg-transparent text-sm focus:outline-none"
                        />
                        <button onClick={() => updateConfig({ basePackageItems: config.basePackageItems.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-600" data-testid={`button-remove-package-item-${idx}`}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <AddRow label="Add Item">
                      <input type="text" placeholder="Item name" value={newPackageItem} onChange={(e) => setNewPackageItem(e.target.value)} className="input-sm flex-1" />
                      <button onClick={() => {
                        if (newPackageItem) {
                          updateConfig({ basePackageItems: [...config.basePackageItems, newPackageItem] });
                          setNewPackageItem("");
                        }
                      }} className="btn-add" data-testid="button-add-package-item">
                        <Plus className="w-4 h-4" />
                      </button>
                    </AddRow>
                  </div>
                </Section>

                {/* ========== GUEST COUNT MODIFIERS ========== */}
                <Section title="Guest Count Modifiers" subtitle="Percentage adjustments based on number of guests">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(config.guestModifiers).map(([range, pct]) => (
                      <div key={range} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{range}</label>
                          <PercentInput value={pct} onChange={(v) => updateConfig({ guestModifiers: { ...config.guestModifiers, [range]: v } })} />
                        </div>
                        <button onClick={() => {
                          const next = { ...config.guestModifiers };
                          delete next[range];
                          updateConfig({ guestModifiers: next });
                        }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-5" data-testid={`button-remove-guest-${range}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <AddRow label="Add Guest Range">
                    <input type="text" placeholder="Range (e.g. 300–500)" value={newGuestRange} onChange={(e) => setNewGuestRange(e.target.value)} className="input-sm flex-1" />
                    <PercentInput value={newGuestPercent} onChange={setNewGuestPercent} />
                    <button onClick={() => {
                      if (newGuestRange) {
                        updateConfig({ guestModifiers: { ...config.guestModifiers, [newGuestRange]: newGuestPercent } });
                        setNewGuestRange(""); setNewGuestPercent(0);
                      }
                    }} className="btn-add" data-testid="button-add-guest-range">
                      <Plus className="w-4 h-4" />
                    </button>
                  </AddRow>
                </Section>

                {/* ========== EVENT TYPE SURPLUS ========== */}
                <Section title="Event Type Surplus (%)" subtitle="Percentage adjustment per event type">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(surplus).map(([type, pct]) => (
                      <div key={type} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{type}</label>
                          <PercentInput value={pct} onChange={(v) => setSurplus(prev => ({ ...prev, [type]: v }))} />
                        </div>
                        <button onClick={() => setSurplus(prev => {
                          const next = { ...prev };
                          delete next[type];
                          return next;
                        })} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-5" data-testid={`button-remove-event-${type}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <AddRow label="Add Event Type">
                    <input type="text" placeholder="Event type name" value={newEventType} onChange={(e) => setNewEventType(e.target.value)} className="input-sm flex-1" />
                    <button onClick={() => {
                      if (newEventType) {
                        setSurplus(prev => ({ ...prev, [newEventType]: 0 }));
                        setNewEventType("");
                      }
                    }} className="btn-add" data-testid="button-add-event-type">
                      <Plus className="w-4 h-4" />
                    </button>
                  </AddRow>
                </Section>

                {/* ========== SIGNATURE DRINKS ========== */}
                <Section title="Signature Drinks" subtitle="Drink options and per-drink price">
                  <LabeledDollarInput label="Price Per Drink" value={config.signatureDrinkPrice} onChange={(v) => updateConfig({ signatureDrinkPrice: v })} />
                  <div className="mt-4 space-y-2">
                    {config.signatureDrinksList.map((drink, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <input
                          type="text"
                          value={drink}
                          onChange={(e) => {
                            const next = [...config.signatureDrinksList];
                            next[idx] = e.target.value;
                            updateConfig({ signatureDrinksList: next });
                          }}
                          className="flex-1 bg-transparent text-sm focus:outline-none"
                        />
                        <button onClick={() => updateConfig({ signatureDrinksList: config.signatureDrinksList.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-600" data-testid={`button-remove-drink-${idx}`}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <AddRow label="Add Drink">
                      <input type="text" placeholder="Drink name" value={newDrinkName} onChange={(e) => setNewDrinkName(e.target.value)} className="input-sm flex-1" />
                      <button onClick={() => {
                        if (newDrinkName) {
                          updateConfig({ signatureDrinksList: [...config.signatureDrinksList, newDrinkName] });
                          setNewDrinkName("");
                        }
                      }} className="btn-add" data-testid="button-add-drink">
                        <Plus className="w-4 h-4" />
                      </button>
                    </AddRow>
                  </div>
                </Section>

                {/* ========== MATCHA OPTIONS ========== */}
                <Section title="Matcha Upgrade Options" subtitle="Matcha menu items and their per-unit price">
                  <div className="space-y-3">
                    {Object.entries(config.matchaOptions).map(([name, price]) => (
                      <div key={name} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{name}</label>
                          <DollarInput value={price} onChange={(v) => updateConfig({ matchaOptions: { ...config.matchaOptions, [name]: v } })} />
                        </div>
                        <button onClick={() => {
                          const next = { ...config.matchaOptions };
                          delete next[name];
                          updateConfig({ matchaOptions: next });
                        }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-5" data-testid={`button-remove-matcha-${name}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <AddRow label="Add Matcha Option">
                    <input type="text" placeholder="Name" value={newMatchaName} onChange={(e) => setNewMatchaName(e.target.value)} className="input-sm flex-1" />
                    <DollarInput value={newMatchaPrice} onChange={setNewMatchaPrice} />
                    <button onClick={() => {
                      if (newMatchaName) {
                        updateConfig({ matchaOptions: { ...config.matchaOptions, [newMatchaName]: newMatchaPrice } });
                        setNewMatchaName(""); setNewMatchaPrice(0);
                      }
                    }} className="btn-add" data-testid="button-add-matcha">
                      <Plus className="w-4 h-4" />
                    </button>
                  </AddRow>
                </Section>

                {/* ========== CANNED BEVERAGES ========== */}
                <Section title="Canned Beverages" subtitle="Options and pricing for canned beverage upgrades">
                  <div className="space-y-3">
                    {config.cannedOptions.map((opt, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Label</label>
                            <input type="text" value={opt.label} onChange={(e) => {
                              const next = [...config.cannedOptions];
                              next[idx] = { ...next[idx], label: e.target.value };
                              updateConfig({ cannedOptions: next });
                            }} className="input-sm w-full" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Value</label>
                            <input type="text" value={opt.value} onChange={(e) => {
                              const next = [...config.cannedOptions];
                              next[idx] = { ...next[idx], value: e.target.value };
                              updateConfig({ cannedOptions: next });
                            }} className="input-sm w-full" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Price</label>
                            <DollarInput value={opt.price} onChange={(v) => {
                              const next = [...config.cannedOptions];
                              next[idx] = { ...next[idx], price: v };
                              updateConfig({ cannedOptions: next });
                            }} />
                          </div>
                        </div>
                        <button onClick={() => updateConfig({ cannedOptions: config.cannedOptions.filter((_, i) => i !== idx) })} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" data-testid={`button-remove-canned-${idx}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <AddRow label="Add Canned Option">
                    <input type="text" placeholder="Label" value={newCannedLabel} onChange={(e) => setNewCannedLabel(e.target.value)} className="input-sm flex-1" />
                    <input type="text" placeholder="Value" value={newCannedValue} onChange={(e) => setNewCannedValue(e.target.value)} className="input-sm w-20" />
                    <DollarInput value={newCannedPrice} onChange={setNewCannedPrice} />
                    <button onClick={() => {
                      if (newCannedLabel && newCannedValue) {
                        updateConfig({ cannedOptions: [...config.cannedOptions, { label: newCannedLabel, value: newCannedValue, price: newCannedPrice }] });
                        setNewCannedLabel(""); setNewCannedValue(""); setNewCannedPrice(0);
                      }
                    }} className="btn-add" data-testid="button-add-canned">
                      <Plus className="w-4 h-4" />
                    </button>
                  </AddRow>
                </Section>

                {/* ========== BAKED GOODS ========== */}
                <Section title="Baked Goods Pricing" subtitle="Per-item and bulk pricing for pastries">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledDollarInput label="Per Item Price" value={config.bakedGoodsPerItem} onChange={(v) => updateConfig({ bakedGoodsPerItem: v })} />
                    <LabeledDollarInput label="Bulk Pack Price" value={config.bakedGoodsBulkPrice} onChange={(v) => updateConfig({ bakedGoodsBulkPrice: v })} />
                    <LabeledNumberInput label="Bulk Pack Count" value={config.bakedGoodsBulkCount} onChange={(v) => updateConfig({ bakedGoodsBulkCount: v })} />
                  </div>
                </Section>

                {/* ========== ALTERNATIVE MILK ========== */}
                <Section title="Alternative Milk Pricing" subtitle="Cost tiers based on event duration">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(config.altMilkTiers).map(([hours, cost]) => (
                      <div key={hours} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          {hours} Hour{hours !== "1" ? "s" : ""} Tier
                        </label>
                        <DollarInput value={cost} onChange={(v) => updateConfig({ altMilkTiers: { ...config.altMilkTiers, [hours]: v } })} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LabeledDollarInput label="Extra Per Hour (beyond tiers)" value={config.altMilkExtraPerHour} onChange={(v) => updateConfig({ altMilkExtraPerHour: v })} />
                    <LabeledNumberInput label="Minimum Hours Required" value={config.altMilkMinHours} onChange={(v) => updateConfig({ altMilkMinHours: v })} />
                  </div>
                </Section>

                {/* ========== BRANDING: CUP CUSTOMIZATION ========== */}
                <Section title="Branding: Cup Customization" subtitle="Pricing for sticker and sleeve options">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Stickers</p>
                      <LabeledDollarInput label="Design Fee" value={config.stickerDesignFee} onChange={(v) => updateConfig({ stickerDesignFee: v })} />
                      <LabeledNumberInput label="Base Cups Included" value={config.stickerBaseCups} onChange={(v) => updateConfig({ stickerBaseCups: v })} />
                      <LabeledDollarInput label="Base Print Cost" value={config.stickerBasePrint} onChange={(v) => updateConfig({ stickerBasePrint: v })} />
                      <LabeledNumberInput label="Extra Cup Step" value={config.stickerExtraCupStep} onChange={(v) => updateConfig({ stickerExtraCupStep: v })} />
                      <LabeledDollarInput label="Extra Per Step" value={config.stickerExtraPerStep} onChange={(v) => updateConfig({ stickerExtraPerStep: v })} />
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Sleeves</p>
                      <LabeledDollarInput label="Design Fee" value={config.sleeveDesignFee} onChange={(v) => updateConfig({ sleeveDesignFee: v })} />
                      <LabeledNumberInput label="Base Cups Included" value={config.sleeveBaseCups} onChange={(v) => updateConfig({ sleeveBaseCups: v })} />
                      <LabeledDollarInput label="Base Print Cost" value={config.sleeveBasePrint} onChange={(v) => updateConfig({ sleeveBasePrint: v })} />
                      <LabeledNumberInput label="Extra Cup Step" value={config.sleeveExtraCupStep} onChange={(v) => updateConfig({ sleeveExtraCupStep: v })} />
                      <LabeledDollarInput label="Extra Per Step" value={config.sleeveExtraPerStep} onChange={(v) => updateConfig({ sleeveExtraPerStep: v })} />
                    </div>
                  </div>
                </Section>

                {/* ========== BRANDING: CART ========== */}
                <Section title="Branding: Cart Options" subtitle="Cart branding options and prices">
                  <div className="space-y-3">
                    {Object.entries(config.cartBrandingOptions).map(([name, price]) => (
                      <div key={name} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 capitalize">{name}</label>
                          <DollarInput value={price} onChange={(v) => updateConfig({ cartBrandingOptions: { ...config.cartBrandingOptions, [name]: v } })} />
                        </div>
                        <button onClick={() => {
                          const next = { ...config.cartBrandingOptions };
                          delete next[name];
                          updateConfig({ cartBrandingOptions: next });
                        }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-5" data-testid={`button-remove-cart-${name}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <AddRow label="Add Cart Option">
                    <input type="text" placeholder="Option name" value={newCartLabel} onChange={(e) => setNewCartLabel(e.target.value)} className="input-sm flex-1" />
                    <DollarInput value={newCartPrice} onChange={setNewCartPrice} />
                    <button onClick={() => {
                      if (newCartLabel) {
                        updateConfig({ cartBrandingOptions: { ...config.cartBrandingOptions, [newCartLabel]: newCartPrice } });
                        setNewCartLabel(""); setNewCartPrice(0);
                      }
                    }} className="btn-add" data-testid="button-add-cart-option">
                      <Plus className="w-4 h-4" />
                    </button>
                  </AddRow>
                </Section>

                {/* ========== QUOTE RANGE ========== */}
                <Section title="Quote Range Buffer" subtitle="The buffer amount added to show a cost range (e.g. $1200 – $1600)">
                  <LabeledDollarInput label="Buffer Amount" value={config.costRangeBuffer} onChange={(v) => updateConfig({ costRangeBuffer: v })} />
                </Section>

                {/* Save Button */}
                <div className="sticky bottom-4 flex justify-end pt-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={updateSettings.isPending}
                    data-testid="button-save-settings"
                    className="px-8 py-4 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-lg"
                  >
                    {updateSettings.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save All Changes
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSubmission(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="modal-submission-detail">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
              <button onClick={() => setSelectedSubmission(null)} data-testid="button-close-modal" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Name" value={selectedSubmission.fullName} />
                <DetailItem label="Mobile" value={selectedSubmission.mobileNumber} />
                <DetailItem label="Date" value={selectedSubmission.createdAt ? new Date(selectedSubmission.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'} />
                <DetailItem label="Status" value={selectedSubmission.status} badge />
              </div>

              <hr className="border-gray-100" />

              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Event Type" value={selectedSubmission.eventType} />
                <DetailItem label="Guest Count" value={selectedSubmission.guestCount} />
                <DetailItem label="Hours" value={`${selectedSubmission.hours} hours`} />
                <DetailItem label="Base Package" value={selectedSubmission.hasAddon ? 'Yes' : 'No'} />
              </div>

              <hr className="border-gray-100" />

              {(() => {
                const sigDrinks = selectedSubmission.signatureDrinks || {};
                const activeDrinks = Object.entries(sigDrinks).filter(([, qty]: [string, any]) => qty > 0);
                return activeDrinks.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Signature Drinks</p>
                    <div className="space-y-1">
                      {activeDrinks.map(([name, qty]: [string, any]) => (
                        <div key={name} className="flex justify-between text-sm">
                          <span className="text-gray-600">{name}</span>
                          <span className="font-medium text-gray-900">x{qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <DetailItem label="Signature Drinks" value="None" />
                );
              })()}

              {(() => {
                const matcha = selectedSubmission.matchaUpgrade || {};
                const activeMatcha = Object.entries(matcha).filter(([, qty]: [string, any]) => qty > 0);
                return activeMatcha.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Matcha Upgrades</p>
                    <div className="space-y-1">
                      {activeMatcha.map(([name, qty]: [string, any]) => (
                        <div key={name} className="flex justify-between text-sm">
                          <span className="text-gray-600">{name}</span>
                          <span className="font-medium text-gray-900">x{qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <DetailItem label="Matcha Upgrades" value="None" />
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Canned Beverages" value={selectedSubmission.cannedBeverages === 'none' ? 'None' : `${selectedSubmission.cannedBeverages} cans`} />
                <DetailItem label="Alt Milk (extra hrs)" value={selectedSubmission.alternativeMilk > 0 ? `${selectedSubmission.alternativeMilk} hours` : 'None'} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Baked Goods" value={
                  selectedSubmission.bakedGoods?.useBulk ? 'Bulk Pack' :
                  (selectedSubmission.bakedGoods?.count > 0 ? `${selectedSubmission.bakedGoods.count} items` : 'None')
                } />
                <DetailItem label="Cup Customization" value={
                  selectedSubmission.branding?.cupCustomization === 'stickers' ? 'Stickers' :
                  selectedSubmission.branding?.cupCustomization === 'sleeves' ? 'Sleeves' : 'None'
                } />
              </div>

              {selectedSubmission.branding?.cartBranding !== 'none' && selectedSubmission.branding?.cartBranding && (
                <DetailItem label="Cart Branding" value={selectedSubmission.branding.cartBranding} />
              )}

              {selectedSubmission.emailAddress && (
                <>
                  <hr className="border-gray-100" />
                  <DetailItem label="Email" value={selectedSubmission.emailAddress} />
                </>
              )}

              <hr className="border-gray-100" />

              <div className="bg-[#6B5E51] text-white rounded-xl p-4 text-center">
                <p className="text-xs uppercase tracking-widest opacity-75 mb-1">Estimated Quote</p>
                <p className="text-2xl font-bold" data-testid="text-modal-quote">${selectedSubmission.calculatedCost} – ${selectedSubmission.calculatedCost + (settings?.pricingConfig?.costRangeBuffer ?? 400)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, badge }: { label: string; value: string; badge?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
      {badge ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">{value}</span>
      ) : (
        <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
      <h3 className="font-bold text-gray-900 text-lg mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-5">{subtitle}</p>
      {children}
    </div>
  );
}

function AddRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function DollarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="relative">
      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium"
      />
    </div>
  );
}

function LabeledDollarInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      <DollarInput value={value} onChange={onChange} />
    </div>
  );
}

function LabeledNumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium"
      />
    </div>
  );
}

function PercentInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium"
      />
    </div>
  );
}
