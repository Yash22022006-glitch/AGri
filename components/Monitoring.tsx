
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { SensorData } from '../types';

const Monitoring: React.FC = () => {
  const [isMotorOn, setIsMotorOn] = useState(false);
  const [data, setData] = useState<SensorData[]>([]);
  
  // Simulate sensor data
  useEffect(() => {
    const generateInitialData = () => {
      const points = [];
      const now = new Date();
      for (let i = 10; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000);
        points.push({
          time: `${time.getHours()}:${time.getMinutes()}`,
          temperature: 25 + Math.random() * 5,
          humidity: 60 + Math.random() * 20,
          sunlight: 80 + Math.random() * 20,
          waterLevel: 40 + Math.random() * 10
        });
      }
      return points;
    };
    setData(generateInitialData());

    const interval = setInterval(() => {
      setData(prev => {
        const nextTime = new Date();
        const last = prev[prev.length - 1];
        const newDataPoint = {
          time: `${nextTime.getHours()}:${nextTime.getMinutes()}`,
          temperature: 25 + Math.random() * 5,
          humidity: 60 + Math.random() * 20,
          sunlight: 80 + Math.random() * 20,
          waterLevel: last.waterLevel + (isMotorOn ? 2 : -0.5)
        };
        return [...prev.slice(1), newDataPoint];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isMotorOn]);

  const stats = [
    { label: 'Temperature', value: `${data[data.length-1]?.temperature.toFixed(1)}°C`, icon: 'fa-temperature-half', color: 'text-orange-500' },
    { label: 'Humidity', value: `${data[data.length-1]?.humidity.toFixed(0)}%`, icon: 'fa-droplet', color: 'text-blue-500' },
    { label: 'Sunlight', value: `${data[data.length-1]?.sunlight.toFixed(0)} lx`, icon: 'fa-sun', color: 'text-yellow-500' },
    { label: 'Water Level', value: `${data[data.length-1]?.waterLevel.toFixed(1)}%`, icon: 'fa-water', color: 'text-cyan-500' },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center ${stat.color}`}>
              <i className={`fa-solid ${stat.icon} text-lg`}></i>
            </div>
            <div>
              <p className="text-[10px] text-stone-500 uppercase font-bold">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-sm font-bold mb-4 text-stone-700">Field Health Trends</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
              <XAxis dataKey="time" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="temperature" stroke="#f97316" fillOpacity={1} fill="url(#colorTemp)" />
              <Area type="monotone" dataKey="waterLevel" stroke="#06b6d4" fillOpacity={1} fill="url(#colorWater)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Main Irrigation Motor</h3>
            <p className="text-sm opacity-80">{isMotorOn ? 'Pump is currently running...' : 'Pump is standby'}</p>
          </div>
          <button
            onClick={() => setIsMotorOn(!isMotorOn)}
            className={`w-16 h-8 rounded-full transition-all relative ${isMotorOn ? 'bg-emerald-400' : 'bg-stone-600'}`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${isMotorOn ? 'left-9' : 'left-1'}`} />
          </button>
        </div>
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <i className="fa-solid fa-faucet-drip text-9xl"></i>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
