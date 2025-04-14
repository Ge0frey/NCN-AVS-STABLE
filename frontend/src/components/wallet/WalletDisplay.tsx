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
    <div className="flex items-center">
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
        {email.charAt(0).toUpperCase()}
      </div>
      <p className="ml-2 text-blue-400 font-medium text-sm">{email}</p>
      <div className="ml-2 h-2 w-2 "></div>
    </div>
  );
} 