import { useUser } from '@civic/auth-web3/react';

export default function WalletDisplay() {
  // Civic auth
  const { user } = useUser();
  
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

  return (
    <div className="hidden md:flex items-center glass-card px-2 py-1 rounded-md border border-slate-700/50">
      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
        {email.charAt(0).toUpperCase()}
      </div>
      <p className="ml-2 text-blue-400 font-medium text-xs">{email}</p>
      <div className="ml-2 h-2 w-2"></div>
    </div>
  );
} 