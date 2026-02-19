
import React, { useState, useEffect } from 'react';
import { Section, User } from './types';
import CommunityFeed from './components/CommunityFeed';
import Chatbot from './components/Chatbot';
import Monitoring from './components/Monitoring';
import CropRotation from './components/CropRotation';
import Schemes from './components/Schemes';
import Finance from './components/Finance';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>(Section.COMMUNITY);
  const [location, setLocation] = useState<string>("Detecting...");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLocation("Chennai Region, India");
        },
        () => setLocation("Tamil Nadu, India")
      );
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveSection(Section.COMMUNITY);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const navItems = [
    { id: Section.COMMUNITY, icon: 'fa-users', label: 'Community' },
    { id: Section.CHATBOT, icon: 'fa-robot', label: 'AgriBot' },
    { id: Section.MONITORING, icon: 'fa-microchip', label: 'Field Data' },
    { id: Section.CROP_ROTATION, icon: 'fa-arrows-rotate', label: 'Rotation' },
    { id: Section.SCHEMES, icon: 'fa-building-columns', label: 'Schemes' },
    { id: Section.FINANCE, icon: 'fa-wallet', label: 'Finance' },
  ];

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white overflow-hidden shadow-2xl">
      {/* Fixed Header */}
      <header className="bg-emerald-700 text-white p-4 flex justify-between items-center shrink-0 shadow-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/50 flex items-center justify-center border border-emerald-500/30">
            <i className="fa-solid fa-leaf"></i>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none mb-1">
              AgriFlow
            </h1>
            <p className="text-[10px] opacity-70 flex items-center gap-1 font-bold uppercase tracking-tighter">
              <i className="fa-solid fa-location-dot text-[8px]"></i> {location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right mr-2">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">{currentUser.name}</p>
            <p className="text-[8px] opacity-60 font-bold uppercase leading-none">Registered Farmer</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-emerald-600/50 w-10 h-10 rounded-xl hover:bg-rose-500 transition-colors flex items-center justify-center group"
          >
            <i className="fa-solid fa-right-from-bracket group-hover:scale-110 transition-transform"></i>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-stone-50 overflow-hidden relative">
        {activeSection === Section.COMMUNITY && (
          <div className="h-full overflow-y-auto"><CommunityFeed location={location} /></div>
        )}
        {activeSection === Section.CHATBOT && <Chatbot />}
        {activeSection === Section.MONITORING && (
          <div className="h-full overflow-y-auto"><Monitoring /></div>
        )}
        {activeSection === Section.CROP_ROTATION && (
          <div className="h-full overflow-y-auto"><CropRotation location={location} /></div>
        )}
        {activeSection === Section.SCHEMES && (
          <div className="h-full overflow-y-auto"><Schemes /></div>
        )}
        {activeSection === Section.FINANCE && (
          <div className="h-full overflow-y-auto"><Finance /></div>
        )}
      </main>

      {/* Fixed Navigation */}
      <nav className="shrink-0 bg-white border-t border-stone-100 flex justify-around p-2 pb-6 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${activeSection === item.id
                ? 'text-emerald-700 font-bold bg-emerald-50 scale-105'
                : 'text-stone-400 hover:text-stone-600'
              }`}
          >
            <i className={`fa-solid ${item.icon} text-lg mb-1`}></i>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
