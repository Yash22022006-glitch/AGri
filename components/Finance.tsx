
import React, { useState, useMemo } from 'react';
import { Expense, Todo } from '../types';
import { getFinancialAdvice } from '../services/geminiService';

const Finance: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', category: 'Fertilizer', amount: 1500, date: '2024-03-01', description: 'Urea for rice fields' },
    { id: '2', category: 'Labor', amount: 3000, date: '2024-03-05', description: 'Weekly field work' },
    { id: '3', category: 'Seed', amount: 800, date: '2024-02-28', description: 'Hybrid tomato seeds' },
  ]);

  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', task: 'Pay irrigation bill', completed: false, dueDate: '2024-03-20' },
    { id: '2', task: 'Review harvest loan', completed: true, dueDate: '2024-03-10' },
  ]);

  const [budgetLimit, setBudgetLimit] = useState(15000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budgetLimit.toString());

  // Form state for new expense
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const [filterCategory, setFilterCategory] = useState('All');
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const categoriesList = useMemo(() => ['General', 'Fertilizer', 'Labor', 'Seed', 'Equipment', 'Pesticide', 'Irrigation'], []);
  const activeCategories = useMemo(() => ['All', ...new Set(expenses.map(e => e.category))], [expenses]);

  const filteredExpenses = useMemo(() => {
    if (filterCategory === 'All') return expenses;
    return expenses.filter(e => e.category === filterCategory);
  }, [expenses, filterCategory]);

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const budgetProgress = Math.min((totalSpent / budgetLimit) * 100, 100);

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount) return;

    const expense: Expense = {
      id: Date.now().toString(),
      description: newDesc,
      amount: parseFloat(newAmount),
      category: newCategory,
      date: newDate
    };

    setExpenses([expense, ...expenses]);
    setNewDesc('');
    setNewAmount('');
  };

  const saveBudget = () => {
    const val = parseFloat(tempBudget);
    if (!isNaN(val)) setBudgetLimit(val);
    setIsEditingBudget(false);
  };

  const generateAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const res = await getFinancialAdvice(expenses);
      setAdvice(res || "No advice available at this time.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdvice(false);
    }
  };

  const handleBudgetChange = (val: string) => {
    // Only allow numbers and a single decimal point
    if (/^\d*\.?\d*$/.test(val)) {
      setTempBudget(val);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-xl mx-auto">
      {/* Top Budget Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Total Spending</p>
            <p className="text-4xl font-black text-emerald-800">₹{totalSpent.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Budget Limit</p>
            {isEditingBudget ? (
              <div className="flex items-center gap-2 transform scale-125 origin-right transition-all duration-300 animate-in zoom-in-90">
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={tempBudget}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  className="w-24 text-right text-lg font-black text-emerald-600 bg-transparent outline-none border-none p-0 focus:ring-0"
                  autoFocus
                />
                <button 
                  onClick={saveBudget} 
                  className="text-emerald-600 text-xl hover:scale-110 transition-transform active:scale-90 flex items-center justify-center"
                >
                  <i className="fa-solid fa-circle-check"></i>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 group cursor-pointer transition-transform hover:scale-105" onClick={() => {
                setTempBudget(budgetLimit.toString());
                setIsEditingBudget(true);
              }}>
                <p className="text-lg font-black text-stone-700">₹{budgetLimit.toLocaleString()}</p>
                <i className="fa-solid fa-pen text-[10px] text-stone-300 group-hover:text-emerald-500 transition-colors"></i>
              </div>
            )}
          </div>
        </div>
        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${totalSpent > budgetLimit ? 'bg-rose-500' : 'bg-emerald-500'}`} 
            style={{ width: `${budgetProgress}%` }}
          ></div>
        </div>
        <p className="text-[10px] mt-2 text-stone-400 font-medium italic text-right">
          {totalSpent > budgetLimit ? 'Budget exceeded!' : `${(100 - budgetProgress).toFixed(0)}% budget remaining`}
        </p>
      </div>

      {/* AI Advice */}
      <div className="bg-emerald-900 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-sparkles text-emerald-400"></i> AI Financial Advisor
            </h3>
            <button
              onClick={generateAdvice}
              disabled={loadingAdvice}
              className="text-[10px] font-black uppercase tracking-widest bg-emerald-700 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all active:scale-95"
            >
              {loadingAdvice ? 'Analyzing...' : 'Refresh Advice'}
            </button>
          </div>
          {advice ? (
            <div className="text-[12px] leading-relaxed opacity-90 font-medium">
              {advice}
            </div>
          ) : (
            <p className="text-[12px] opacity-60">Click refresh to get personalized saving tips based on your logs.</p>
          )}
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <i className="fa-solid fa-brain text-9xl"></i>
        </div>
      </div>

      {/* Manual Expense Logger */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
        <h3 className="font-black text-stone-800 text-sm uppercase tracking-widest mb-4">Log New Expense</h3>
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider ml-1">Description</label>
              <input 
                type="text" 
                placeholder="Ex: Bag of Urea" 
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 text-stone-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider ml-1">Amount (₹)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 text-stone-800"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider ml-1">Category</label>
              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 text-stone-800"
              >
                {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider ml-1">Date</label>
              <input 
                type="date" 
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-stone-50 border-none rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500 text-stone-800"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.2em] py-3 rounded-xl hover:bg-emerald-800 transition-all active:scale-95 shadow-md shadow-emerald-700/10"
          >
            Add to Ledger
          </button>
        </form>
      </div>

      {/* Tasks Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-stone-800 text-sm uppercase tracking-widest">Financial Tasks</h3>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">{todos.filter(t => !t.completed).length} Pending</span>
        </div>
        <div className="space-y-3">
          {todos.map(todo => (
            <div
              key={todo.id}
              onClick={() => toggleTodo(todo.id)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-stone-50 flex items-center gap-4 cursor-pointer hover:border-emerald-100 transition-all"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                todo.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-200 text-transparent'
              }`}>
                <i className="fa-solid fa-check text-[10px]"></i>
              </div>
              <div className="flex-1">
                <p className={`text-sm ${todo.completed ? 'line-through text-stone-300' : 'text-stone-700 font-bold'}`}>{todo.task}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <i className="fa-regular fa-calendar text-[10px] text-stone-300"></i>
                  <p className="text-[10px] text-stone-400 font-medium">Due: {todo.dueDate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ledger Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-stone-800 text-sm uppercase tracking-widest">Expense Ledger</h3>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-filter text-[10px] text-stone-300"></i>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-[10px] font-bold border-none bg-stone-100 rounded-lg px-2.5 py-1.5 focus:ring-0 cursor-pointer"
            >
              {activeCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          {filteredExpenses.length > 0 ? filteredExpenses.map(exp => (
            <div key={exp.id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex justify-between items-center hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-emerald-700">
                  <i className={`fa-solid ${
                    exp.category === 'Labor' ? 'fa-person-digging' : 
                    exp.category === 'Fertilizer' ? 'fa-flask' : 
                    exp.category === 'Seed' ? 'fa-seedling' : 'fa-receipt'
                  }`}></i>
                </div>
                <div>
                  <p className="text-sm font-black text-stone-800">{exp.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[8px] font-black bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full uppercase tracking-widest">{exp.category}</span>
                    <span className="text-[9px] text-stone-300 font-medium">{exp.date}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm font-black text-emerald-800">₹{exp.amount.toLocaleString()}</p>
            </div>
          )) : (
            <div className="text-center py-10 bg-stone-50/50 rounded-3xl border-2 border-dashed border-stone-100">
              <i className="fa-solid fa-receipt text-3xl text-stone-100 mb-2"></i>
              <p className="text-xs text-stone-300 font-bold uppercase tracking-widest">No entries found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Finance;
