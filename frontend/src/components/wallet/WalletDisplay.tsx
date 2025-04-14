import { useWallet } from '@solana/wallet-adapter-react';
import { useUser } from '@civic/auth-web3/react';
import { useCallback } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export default function WalletDisplay() {
  // Regular Solana wallet
  const { publicKey, wallet, select, connect } = useWallet();
  const { setVisible } = useWalletModal();
  
  // Civic auth
  const { user } = useUser();
  
  // Open wallet modal to connect
  const openWalletModal = useCallback(() => {
    setVisible(true);
  }, [setVisible]);
  
  // Extract user info safely
  const getUserEmail = () => {
    if (!user) return '';
    
    try {
      if (typeof user === 'object') {
        return user?.email || user?.id || user?.sub || 'Authenticated user';
      }
      return 'Authenticated user';
    } catch (e) {
      return 'Authenticated user';
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-3 text-lg font-medium text-slate-900 dark:text-white">Wallet Information</h3>
      
      {/* Civic Auth Status */}
      <div className="mb-4">
        <h4 className="mb-1 font-medium text-slate-700 dark:text-slate-300">Civic Auth</h4>
        <div className="flex items-center">
          <div className={`mr-2 h-2.5 w-2.5 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {user ? 'Authenticated' : 'Not authenticated'}
          </p>
        </div>
        {user && (
          <div className="mt-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {getUserEmail()}
            </p>
          </div>
        )}
      </div>
      
      {/* Embedded Wallet */}
      <div className="mb-4">
        <h4 className="mb-1 font-medium text-slate-700 dark:text-slate-300">Embedded Wallet</h4>
        {user ? (
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              An embedded wallet is available through Civic Auth
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              This wallet is automatically created for you by Civic Auth
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Not authenticated
          </p>
        )}
      </div>
      
      {/* Solana Wallet */}
      <div>
        <h4 className="mb-1 font-medium text-slate-700 dark:text-slate-300">Connected Wallet</h4>
        {publicKey ? (
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {wallet?.adapter.name || 'Unknown wallet'}
            </p>
            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
              {publicKey.toString()}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              No wallet connected
            </p>
            <button 
              onClick={openWalletModal}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 