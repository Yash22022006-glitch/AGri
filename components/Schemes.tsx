
import React, { useState, useEffect } from 'react';
import { searchGovSchemes, GovScheme } from '../services/geminiService';

const Schemes: React.FC = () => {
  const [query, setQuery] = useState('');
  const [schemes, setSchemes] = useState<GovScheme[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Complaint modal states
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState('Subsidies');
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDetails, setComplaintDetails] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const results = await searchGovSchemes(searchQuery);
      setSchemes(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    performSearch(query);
  };

  const handleRaiseComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingComplaint(true);
    // Simulate API call to Municipality Admin
    setTimeout(() => {
      setIsSubmittingComplaint(false);
      setComplaintSubmitted(true);
      setTimeout(() => {
        setIsComplaintModalOpen(false);
        setComplaintSubmitted(false);
        setComplaintTitle('');
        setComplaintDetails('');
      }, 3000);
    }, 1500);
  };

  // Initial load with default suggestions
  useEffect(() => {
    performSearch("PM-KISAN, Kisan Credit Card, Fasal Bima Yojana");
  }, []);

  return (
    <div className="relative min-h-full">
      <div className="p-6 space-y-8 max-w-xl mx-auto flex flex-col items-center">
        {/* Search Header Section */}
        <div className="w-full text-center space-y-4">
          <h2 className="text-xl font-black text-stone-800 tracking-tight">Government Assistance</h2>
          <p className="text-sm text-stone-500 max-w-xs mx-auto">Discover subsidies, loans, and support programs available for your farm.</p>
          
          <form 
            onSubmit={handleSubmit} 
            className="w-full bg-white rounded-2xl shadow-sm border border-stone-200 flex items-center overflow-hidden h-14 transition-all focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent"
          >
            <div className="pl-5 text-stone-400">
              <i className="fa-solid fa-magnifying-glass"></i>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for loans or crop support..."
              className="flex-1 border-none focus:ring-0 bg-transparent px-4 py-2 text-base outline-none text-center placeholder:text-stone-300"
            />
            <button 
              type="submit" 
              className="bg-emerald-600 text-white h-full px-6 font-bold hover:bg-emerald-700 transition-colors active:scale-95"
            >
              Find
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="w-full space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Searching Official Records</p>
            </div>
          ) : schemes.length > 0 ? (
            schemes.map((scheme, index) => (
              <div 
                key={index} 
                className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-building-columns text-xl"></i>
                  </div>
                  
                  <h3 className="text-lg font-black text-stone-800 leading-tight">
                    {scheme.title}
                  </h3>
                  
                  <p className="text-sm text-stone-600 leading-relaxed max-w-sm">
                    {scheme.explanation}
                  </p>
                  
                  <div className="w-full pt-4 border-t border-stone-50">
                    <a
                      href={scheme.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-stone-50 text-emerald-700 px-6 py-3 rounded-xl font-bold text-xs hover:bg-emerald-50 transition-colors group"
                    >
                      Visit Official Portal
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"></i>
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-stone-400">
              <i className="fa-solid fa-box-open text-4xl mb-4 block opacity-20"></i>
              <p className="text-sm">No schemes found for this search.</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] pt-4">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        
        {/* Navigation Spacer */}
        <div className="h-24"></div>
      </div>

      {/* Floating Complaint Button - Raised, Green, and Smaller */}
      <div className="fixed bottom-36 right-6 z-50">
        <button
          onClick={() => setIsComplaintModalOpen(true)}
          className="bg-emerald-600 text-white w-12 h-12 rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center hover:bg-emerald-700 hover:scale-110 active:scale-95 transition-all group"
        >
          <i className="fa-solid fa-headset text-lg"></i>
          <span className="absolute right-14 bg-white text-emerald-700 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Support Hub
          </span>
        </button>
      </div>

      {/* Complaint Modal */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            {complaintSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-check text-2xl"></i>
                </div>
                <h3 className="text-xl font-black text-stone-800 tracking-tight">Complaint Lodged!</h3>
                <p className="text-sm text-stone-500">Your report has been sent to the <span className="text-emerald-700 font-bold">Municipality Admin</span>. You will receive an update via SMS shortly.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-stone-800 tracking-tight">Lodge a Complaint</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Municipality Administration</p>
                  </div>
                  <button 
                    onClick={() => setIsComplaintModalOpen(false)}
                    className="text-stone-300 hover:text-stone-500 transition-colors"
                  >
                    <i className="fa-solid fa-circle-xmark text-2xl"></i>
                  </button>
                </div>

                <form onSubmit={handleRaiseComplaint} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Issue Category</label>
                    <select 
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                      <option>Subsidies & Payments</option>
                      <option>Seed/Fertilizer Quality</option>
                      <option>Local Infrastructure</option>
                      <option>Corruption Report</option>
                      <option>Irrigation Issues</option>
                      <option>Other Concerns</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Subject</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Brief title of the issue"
                      value={complaintTitle}
                      onChange={(e) => setComplaintTitle(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Detailed Description</label>
                    <textarea 
                      required
                      placeholder="Explain the situation in detail..."
                      rows={4}
                      value={complaintDetails}
                      onChange={(e) => setComplaintDetails(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingComplaint}
                    className="w-full bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-emerald-800 transition-all active:scale-95 shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingComplaint ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      'Lodge Official Report'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Schemes;
