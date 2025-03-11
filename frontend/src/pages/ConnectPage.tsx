import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';

export default function ConnectPage() {
  const { connected, connecting, connect, select, wallets } = useWalletContext();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (connected) {
      navigate('/dashboard');
    }
  }, [connected, navigate]);

  // Handle wallet selection
  const handleSelectWallet = async (walletName: string) => {
    try {
      setError(null);
      setSelectedWallet(walletName);
      
      // Find the wallet adapter
      const wallet = wallets.find(w => w.adapter.name === walletName);
      
      if (!wallet) {
        setError(`Wallet ${walletName} not found`);
        return;
      }
      
      // Select the wallet
      await select(walletName);
      
      // Connect to the wallet
      await connect();
    } catch (err) {
      console.error('Error connecting to wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to wallet');
    }
  };

  // Wallet options
  const walletOptions = [
    {
      name: 'Phantom',
      icon: 'https://play-lh.googleusercontent.com/obRvW02OTYLzJuvic1ZbVDVXLXzI0Vt_JGOjlxZ92XMdBF_i3kqU92u9SgHvJ5pySdM=w240-h480-rw',
      description: 'Connect to your Phantom Wallet',
    },
    {
      name: 'Solflare',
      icon: 'https://solflare.com/logo.png',
      description: 'Connect to your Solflare Wallet',
    },
    {
      name: 'Backpack',
      icon: 'https://play-lh.googleusercontent.com/EhgMPJGUYrA7-8PNfOdZgVGzxrOw4toX8tQXv-YzIvN6sAMYFunQ55MVo2SS_hLiNm8=w240-h480-rw',
      description: 'Connect to your Backpack Wallet',
    },
    {
      name: 'Ledger',
      icon: 'https://cdn.prod.website-files.com/60f008ba9757da0940af288e/60fbcaf3bd0478862b605203_ledger.jpg',
      description: 'Connect to your Ledger Hardware Wallet',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white p-4 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Connect Your Wallet</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Choose a wallet to connect to the STABLE-FUNDS platform
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Wallet options */}
        <div className="space-y-4">
          {walletOptions.map((wallet) => {
            const isAvailable = wallets.some(w => w.adapter.name.includes(wallet.name));
            const isSelected = selectedWallet === wallet.name;
            const isConnecting = connecting && isSelected;

            return (
              <button
                key={wallet.name}
                onClick={() => handleSelectWallet(wallet.name)}
                disabled={!isAvailable || connecting}
                className={`
                  w-full rounded-lg border p-4 text-left transition-all
                  ${isAvailable 
                    ? 'cursor-pointer hover:border-sky-500 hover:shadow-md dark:hover:border-sky-400' 
                    : 'cursor-not-allowed opacity-50'
                  }
                  ${isSelected 
                    ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20' 
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                  }
                `}
              >
                <div className="flex items-center">
                  <img src={wallet.icon} alt={wallet.name} className="mr-3 h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      {wallet.name}
                      {!isAvailable && ' (Not Installed)'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{wallet.description}</p>
                  </div>
                  {isConnecting && (
                    <svg className="h-5 w-5 animate-spin text-sky-500 dark:text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Help text */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Don't have a wallet?</p>
          <a 
            href="https://solana.com/ecosystem/wallets" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-1 inline-block font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            Learn about Solana wallets
          </a>
        </div>
      </div>
    </div>
  );
} 