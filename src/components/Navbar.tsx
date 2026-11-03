import React from 'react';
import { ShoppingBag, Sparkles, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: 'store' | 'data' | 'algorithms' | 'evaluation' | 'python';
  setActiveTab: (tab: 'store' | 'data' | 'algorithms' | 'evaluation' | 'python') => void;
  activeUser: User;
  allUsers: User[];
  setActiveUserId: (id: string) => void;
  cartCount: number;
  openCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeUser,
  allUsers,
  setActiveUserId,
  cartCount,
  openCart
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0f1115]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single line, no subtitle pill) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('store')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold text-sm tracking-wider shadow-sm">
              <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors whitespace-nowrap">
                AURA
              </span>
              <span className="text-slate-500 text-xs ml-2 font-mono">CF Engine</span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => setActiveTab('store')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'store'
                ? 'bg-slate-800 text-white border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Storefront & Recs
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'data'
                ? 'bg-slate-800 text-white border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Data Collection
          </button>
          <button
            onClick={() => setActiveTab('algorithms')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'algorithms'
                ? 'bg-slate-800 text-white border border-slate-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Algorithms & Math
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'evaluation'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            Precision & Recall
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'python'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40'
            }`}
          >
            Python Code (ML)
          </button>
        </nav>

        {/* Zone 3: Active User Selector & Cart action */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 hidden lg:inline">Active:</span>
            <select
              value={activeUser.id}
              onChange={(e) => setActiveUserId(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-900 text-slate-200">
                  {u.name} {u.id === 'user-current' ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={openCart}
            aria-label="Open Shopping Bag"
            className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
