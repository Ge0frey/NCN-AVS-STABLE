import { useUser } from '@civic/auth-web3/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WalletDisplay() {
  // Civic auth
  const { user, signOut } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  
  // Extract user info safely
  const getUserEmail = () => {
    if (!user) return '';
    
    try {
      if (typeof user === 'object') {
        return user?.email || user?.id || user?.sub || '';
      }
      return '';
    } catch (e) {
      return '';
    }
  };

  const email = getUserEmail();

  if (!email) return null;

  const handleSignOut = async () => {
    try {
      if (signOut) {
        await signOut();
      }
      setShowDropdown(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = () => {
    setShowDropdown(false);
  };

  return (
    <div className="hidden md:block relative">
      <button 
        onClick={toggleDropdown}
        className="flex items-center glass-card px-2 py-1 rounded-md border border-slate-700/50 hover:border-blue-500/50 transition-colors"
      >
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
          {email.charAt(0).toUpperCase()}
        </div>
        <p className="ml-2 text-blue-400 font-medium text-xs">{email}</p>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`ml-2 h-4 w-4 transition-transform text-blue-400 ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={handleClickOutside}
          ></div>
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md glass-panel py-1 shadow-lg backdrop-blur-md">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700/50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v1a1 1 0 102 0V9z" clipRule="evenodd" />
              </svg>
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
} 