
import React, { useState, useEffect } from 'react';
import { getCropRotationSuggestions } from '../services/geminiService';
import { CropSuggestion } from '../types';

const CropRotation: React.FC<{ location: string }> = ({ location }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CropSuggestion[]>([]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const data = await getCropRotationSuggestions(location, "Transitioning from monsoon to winter (cool, mild humidity)");
      setSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [location]);

  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-2">Next 3-Month Plan</h2>
        <p className="text-sm opacity-90 mb-4">Our AI advisor suggests these rotations to maintain soil health and maximize yield in {location}.</p>
        <button
          onClick={fetchSuggestions}
          disabled={loading}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
          Refresh Analysis
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white h-24 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-emerald-700 font-bold">{s.crop}</h4>
                  <p className="text-xs text-stone-400 font-medium uppercase">{s.timing}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                  <i className="fa-solid fa-seedling"></i>
                </div>
              </div>
              <p className="text-sm text-stone-600 mb-3"><span className="font-bold text-stone-800">Method:</span> {s.method}</p>
              <div className="bg-stone-50 p-3 rounded-lg border-l-4 border-emerald-500">
                <p className="text-xs text-stone-500 italic">“{s.reason}”</p>
              </div>
              <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50/30 rounded-bl-full flex items-center justify-center font-bold text-stone-200">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CropRotation;
