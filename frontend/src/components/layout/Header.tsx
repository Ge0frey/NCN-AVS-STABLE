import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWalletContext } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import WalletButton from '../wallet/WalletButton';

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton: boolean;
}

export default function Header({ onMenuClick, showMenuButton }: HeaderProps) {
  const { connected, balance, isLoading } = useWalletContext();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-700/50">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Menu button (mobile) & Logo */}
        <div className="flex items-center">
          {showMenuButton && (
            <button
              type="button"
              className="mr-4 rounded-md p-2 text-slate-300 hover:text-blue-400 transition-colors"
              onClick={onMenuClick}
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold gradient-text">STABLE-FUNDS</span>
          </Link>
        </div>

        {/* Center: Navigation (desktop) */}
        {connected && (
          <nav className="hidden md:block">
            <ul className="flex space-x-4">
              <li>
                <Link 
                  to="/dashboard" 
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === '/dashboard' 
                      ? 'gradient-text' 
                      : 'text-slate-300 hover:text-blue-400'
                  }`}
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/stablecoins" 
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/stablecoins') 
                      ? 'gradient-text' 
                      : 'text-slate-300 hover:text-blue-400'
                  }`}
                >
                  Stablecoins
                </Link>
              </li>
              <li>
                <Link 
                  to="/collateral" 
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/collateral') 
                      ? 'gradient-text' 
                      : 'text-slate-300 hover:text-blue-400'
                  }`}
                >
                  Collateral
                </Link>
              </li>
              <li>
                <Link 
                  to="/stake" 
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === '/stake' 
                      ? 'gradient-text' 
                      : 'text-slate-300 hover:text-blue-400'
                  }`}
                >
                  Stake
                </Link>
              </li>
              <li>
                <Link 
                  to="/governance" 
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    location.pathname === '/governance' 
                      ? 'gradient-text' 
                      : 'text-slate-300 hover:text-blue-400'
                  }`}
                >
                  Governance
                </Link>
              </li>
            </ul>
          </nav>
        )}

        {/* Right: Theme toggle & Wallet */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md p-2 text-slate-300 hover:text-blue-400 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* Wallet connection */}
          <WalletButton />

          {/* Balance (if connected) */}
          {connected && (
            <div className="hidden sm:block">
              <div className="gradient-border rounded-md px-3 py-1.5 text-sm font-medium bg-slate-800/50 backdrop-blur-sm">
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  <span className="gradient-text font-bold">{balance.toFixed(4)} SOL</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 