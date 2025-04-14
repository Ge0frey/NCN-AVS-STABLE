import { useWallet } from '@solana/wallet-adapter-react';
import { useUser } from '@civic/auth-web3/react';

export default function WalletDisplay() {
  // Regular Solana wallet
  const { publicKey, wallet } = useWallet();
  
  // Civic auth
  const { user } = useUser();
  
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
    <div className="glass-panel rounded-lg border border-slate-700/50 overflow-hidden">
      <div className="border-b border-slate-700/50 px-4 py-3">
        <h3 className="text-lg font-medium text-white">Wallet Information</h3>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Civic Auth Status */}
        <div className="glass-card rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-slate-200 font-medium">Civic Auth</h4>
            <div className={`h-2.5 w-2.5 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          
          <div className="text-sm">
            {user ? (
              <div>
                <p className="text-white font-medium">Authenticated</p>
                <p className="text-slate-400 mt-1 text-sm">{getUserEmail()}</p>
              </div>
            ) : (
              <p className="text-slate-400">Not authenticated</p>
            )}
          </div>
        </div>
        
        {/* Embedded Wallet */}
        <div className="glass-card rounded-md p-4">
          <h4 className="text-slate-200 font-medium mb-2">Embedded Wallet</h4>
          
          <div className="text-sm">
            {user ? (
              <div>
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
                  <p className="text-white font-medium">Available</p>
                </div>
                <p className="text-slate-400 mt-1 text-xs">
                  This wallet is automatically created for you by Civic Auth
                </p>
              </div>
            ) : (
              <p className="text-slate-400">
                Not authenticated
              </p>
            )}
          </div>
        </div>
        
        {/* Solana Wallet */}
        <div className="glass-card rounded-md p-4">
          <h4 className="text-slate-200 font-medium mb-2">Connected Wallet</h4>
          
          <div className="text-sm">
            {publicKey ? (
              <div>
                <div className="flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                  <p className="text-white font-medium">{wallet?.adapter.name || 'Unknown wallet'}</p>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1 break-all overflow-hidden text-ellipsis">
                  {publicKey.toString()}
                </p>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-red-500"></div>
                <p className="text-slate-400">No wallet connected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 