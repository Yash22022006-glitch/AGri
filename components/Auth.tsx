

import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    aadhar: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (view === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: `${formData.phone}@agriflow.app`,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              phone: formData.phone,
              age: formData.age,
              aadhar: formData.aadhar,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Check if session is established (auto-login)
          if (data.session) {
            const user: User = {
              name: data.user.user_metadata.name || formData.name,
              phone: data.user.user_metadata.phone || formData.phone,
              age: data.user.user_metadata.age || formData.age,
              aadhar: data.user.user_metadata.aadhar || formData.aadhar,
            };
            onLogin(user);
          } else {
            // If email confirmation is required, this block runs
            alert('Signup successful! Please check if you need to confirm your account (if email confirmation is enabled). Try logging in.');
            setView('login');
          }
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: `${formData.phone}@agriflow.app`,
          password: formData.password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          const user: User = {
            name: data.user.user_metadata.name || 'Farmer',
            phone: data.user.user_metadata.phone || formData.phone,
            age: data.user.user_metadata.age || '',
            aadhar: data.user.user_metadata.aadhar || '',
          };
          onLogin(user);
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Clear error on input change
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-stone-50 overflow-hidden">
      <div className="w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95 duration-500">

        {/* Compact Branding */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 mb-3 rotate-3">
            <i className="fa-solid fa-leaf text-white text-2xl"></i>
          </div>
          <h2 className="text-2xl font-black text-stone-800 tracking-tight leading-none">
            AgriFlow
          </h2>
          <p className="mt-1 text-[10px] text-stone-500 font-bold uppercase tracking-widest">
            Farmer Assistant
          </p>
        </div>

        {view === 'login' ? (
          /* Simple Compact Login */
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
              <form className="space-y-3" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold text-center border border-red-100">
                    {error}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Username (Mobile)</label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="Mobile Number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold placeholder:text-stone-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold placeholder:text-stone-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.2em] py-3.5 rounded-xl hover:bg-emerald-800 transition-all active:scale-95 shadow-md shadow-emerald-700/10 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'SIGN IN'}
                </button>
              </form>
            </div>

            <div className="text-center space-y-0.5">
              <p className="text-xs text-stone-500 font-medium">Don't have an account?</p>
              <button
                onClick={() => { setView('signup'); setError(null); }}
                className="text-xs font-black text-emerald-700 hover:text-emerald-800 underline decoration-emerald-200 underline-offset-4"
              >
                Sign up.
              </button>
            </div>
          </div>
        ) : (
          /* Simple Compact Signup */
          <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
              <form className="space-y-2.5" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold text-center border border-red-100">
                    {error}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold placeholder:text-stone-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="10 digits"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold placeholder:text-stone-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Age</label>
                    <input
                      name="age"
                      type="number"
                      required
                      placeholder="Age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full bg-stone-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold placeholder:text-stone-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Aadhar</label>
                    <input
                      name="aadhar"
                      type="text"
                      required
                      placeholder="UID"
                      value={formData.aadhar}
                      onChange={handleChange}
                      className="w-full bg-stone-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold placeholder:text-stone-300"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">Password</label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-black font-bold placeholder:text-stone-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.2em] py-3.5 rounded-xl hover:bg-emerald-800 transition-all active:scale-95 shadow-md shadow-emerald-700/10 mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : 'CREATE ACCOUNT'}
                </button>
              </form>
            </div>

            <div className="text-center space-y-0.5">
              <p className="text-xs text-stone-500 font-medium">Already have an account?</p>
              <button
                onClick={() => { setView('login'); setError(null); }}
                className="text-xs font-black text-emerald-700 hover:text-emerald-800 underline decoration-emerald-200 underline-offset-4"
              >
                Log in.
              </button>
            </div>
          </div>
        )}

        {/* Small Decorative Footer */}
        <div className="flex justify-center gap-6 opacity-10 text-stone-400 pt-2">
          <i className="fa-solid fa-wheat-awn text-xl"></i>
          <i className="fa-solid fa-tractor text-xl"></i>
        </div>
      </div>
    </div>
  );
};

export default Auth;

