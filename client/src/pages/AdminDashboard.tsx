import { useAuth } from "@/hooks/use-auth";
import { useSettings, useUpdateSettings, useSubmissions } from "@/hooks/use-form-data";
import { Loader2, Save, LayoutDashboard, LogOut, Settings as SettingsIcon, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, isLoading: isLoadingAuth, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { data: submissions, isLoading: isLoadingSubmissions } = useSubmissions();
  
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'submissions' | 'settings'>('submissions');

  // Form state for settings
  const [rates, setRates] = useState<Record<string, number>>({});
  const [baseRate, setBaseRate] = useState(50);

  // Initialize form state when settings load
  useEffect(() => {
    if (settings) {
      setRates(settings.hourlyRates);
      setBaseRate(settings.baseRate);
    }
  }, [settings]);

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        baseRate,
        hourlyRates: rates,
      });
      toast({
        title: "Settings Saved",
        description: "Hourly rates have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    }
  };

  const handleRateChange = (hour: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setRates(prev => ({
      ...prev,
      [hour]: numValue
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'submissions' 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Submissions
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'bg-primary/10 text-primary' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            Pricing Settings
          </button>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-100">
           <div className="flex items-center gap-3 px-4 py-3 mb-2">
             <img 
               src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}`} 
               alt="Profile" 
               className="w-8 h-8 rounded-full bg-gray-200"
             />
             <div className="overflow-hidden">
               <p className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
               <p className="text-xs text-gray-500 truncate">{user.email}</p>
             </div>
           </div>
           <button 
             onClick={() => logout()}
             className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
           >
             <LogOut className="w-4 h-4" />
             Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {activeTab === 'submissions' ? 'Recent Submissions' : 'Pricing Configuration'}
          </h1>
          <p className="text-gray-500 mt-1">
            {activeTab === 'submissions' 
              ? 'View and manage quote requests from your customers.' 
              : 'Adjust hourly rates and base pricing for the calculator.'}
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
                       <th className="px-6 py-4 font-semibold text-sm text-gray-500 uppercase tracking-wider">Hours</th>
                       <th className="px-6 py-4 font-semibold text-sm text-gray-500 uppercase tracking-wider">Quote</th>
                       <th className="px-6 py-4 font-semibold text-sm text-gray-500 uppercase tracking-wider">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {submissions.map((sub) => (
                       <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 text-sm text-gray-500">
                           {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}
                         </td>
                         <td className="px-6 py-4 font-medium text-gray-900">{sub.fullName}</td>
                         <td className="px-6 py-4 text-gray-600">{sub.mobileNumber}</td>
                         <td className="px-6 py-4 text-gray-900 font-medium">{sub.hours} hrs</td>
                         <td className="px-6 py-4 font-bold text-primary">${sub.calculatedCost}</td>
                         <td className="px-6 py-4">
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                             {sub.status}
                           </span>
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
          <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            {isLoadingSettings ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8 text-primary"/></div>
            ) : (
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Default Base Rate (per hour)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="number" 
                      value={baseRate}
                      onChange={(e) => setBaseRate(parseInt(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Used when no specific hourly rate is defined below.</p>
                </div>
                
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    Custom Hourly Rates
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Overrides base rate</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["1", "2", "3", "4"].map((hour) => (
                      <div key={hour} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          {hour} Hour{hour !== "1" && "s"} Cost
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            value={rates[hour] || 0}
                            onChange={(e) => handleRateChange(hour, e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-sm font-medium"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                   <button
                     onClick={handleSaveSettings}
                     disabled={updateSettings.isPending}
                     className="px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                   >
                     {updateSettings.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                     Save Changes
                   </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
