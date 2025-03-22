import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface StakeResultState {
  success: boolean;
  amount: number;
  vaultName: string;
  signature?: string;
  error?: string;
  lockPeriod?: number;
}

export default function StakeResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<StakeResultState | null>(null);
  const [showModal, setShowModal] = useState(true);
  
  useEffect(() => {
    // Get state from location or redirect back to stake page if missing
    if (location.state && 'success' in location.state) {
      setResult(location.state as StakeResultState);
    } else {
      // No transaction data, redirect back to staking page
      navigate('/stake', { replace: true });
    }
  }, [location, navigate]);

  const handleClose = () => {
    setShowModal(false);
    // Redirect back to staking page after animation completes
    // Pass a refresh flag if the transaction was successful
    setTimeout(() => {
      navigate('/stake', { 
        state: { 
          refresh: result?.success === true 
        } 
      });
    }, 300);
  };

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-30 -mt-16">
          <div className="w-64 h-64 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-full blur-3xl"></div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text inline-block mb-3">
            Jito Restaking
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Stake your SOL in Jito vaults to earn higher yields.
          </p>
        </div>
      </div>

      {/* Transaction Result Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-xl p-1 bg-gradient-to-r from-blue-500 to-purple-500 shadow-xl transform transition-all animate-scaleIn">
            <div className="bg-slate-900 rounded-lg p-6">
              <div className="mb-6 flex justify-center">
                {result.success ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100/10 text-green-400 border border-green-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100/10 text-red-400 border border-red-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-bold text-center mb-4">
                {result.success ? 'Staking Successful!' : 'Transaction Failed'}
              </h3>

              <div className="mb-6 rounded-lg bg-slate-800/50 overflow-hidden border border-slate-700/50 shadow-inner">
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700/50">
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-slate-300">Transaction Details</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/30">
                      <p className="text-xs text-slate-400 mb-1">Amount</p>
                      <p className="text-sm font-semibold">{result.amount.toLocaleString()} SOL</p>
                    </div>
                    
                    <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/30">
                      <p className="text-xs text-slate-400 mb-1">Vault</p>
                      <p className="text-sm font-semibold">{result.vaultName}</p>
                    </div>
                    
                    {result.lockPeriod !== undefined && (
                      <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/30">
                        <p className="text-xs text-slate-400 mb-1">Lock Period</p>
                        <p className="text-sm font-semibold">
                          {result.lockPeriod > 0 ? `${result.lockPeriod} days` : 'No lock (flexible)'}
                        </p>
                      </div>
                    )}

                    {result.signature && (
                      <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/30">
                        <p className="text-xs text-slate-400 mb-1">Transaction Signature</p>
                        <p className="text-sm font-mono break-all text-blue-400 hover:text-blue-300 transition-colors">
                          <a 
                            href={`https://explorer.solana.com/tx/${result.signature}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            {result.signature}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </p>
                      </div>
                    )}

                    {result.error && (
                      <div className="bg-red-900/20 p-3 rounded-md border border-red-700/30">
                        <p className="text-xs text-red-400 mb-1">Error</p>
                        <p className="text-sm font-semibold text-red-400">{result.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleClose}
                  className="btn btn-outline py-2.5"
                >
                  Back to Staking
                </button>
                
                {result.success && (
                  <Link
                    to="/dashboard"
                    className="btn btn-primary py-2.5"
                  >
                    View Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 