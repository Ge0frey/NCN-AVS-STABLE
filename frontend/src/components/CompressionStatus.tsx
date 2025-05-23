import { useWalletContext } from '../context/WalletContext';
import { useState, useEffect } from 'react';

const CompressionStatus = () => {
  const { 
    isCompressionEnabled,
    compressionClient
  } = useWalletContext();
  
  const [savingsPercentage, setSavingsPercentage] = useState<number>(0);
  const [totalCompressedAccounts, setTotalCompressedAccounts] = useState<number>(0);
  
  // Calculate approximate savings for the hackathon demo
  useEffect(() => {
    if (!isCompressionEnabled) return;
    
    // For hackathon, estimate the savings based on local storage data
    const compressedStablecoins = JSON.parse(localStorage.getItem('compressed-stablecoins') || '[]');
    const compressedVaults = JSON.parse(localStorage.getItem('compressed-vaults') || '[]');
    
    // Each regular account costs ~0.02 SOL, compressed ~0.0001 SOL
    const regularCost = (compressedStablecoins.length + compressedVaults.length) * 0.02;
    const compressedCost = (compressedStablecoins.length + compressedVaults.length) * 0.0001;
    
    const totalSavings = regularCost - compressedCost;
    const savingsPercent = (totalSavings / regularCost) * 100;
    
    setSavingsPercentage(savingsPercent > 0 ? savingsPercent : 99.5); // Default to 99.5% if no data
    setTotalCompressedAccounts(compressedStablecoins.length + compressedVaults.length);
  }, [isCompressionEnabled]);
  
  if (!isCompressionEnabled) {
    return null;
  }
  
  return (
    <div className="card overflow-hidden border border-slate-200/10 mb-6">
      <div className="bg-gradient-to-r from-green-900/40 to-blue-900/40 p-5">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          ZK Compression Status
        </h2>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Storage Cost Savings</p>
            <p className="text-2xl font-bold text-green-400">
              {savingsPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">Compared to regular accounts</p>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Compressed Accounts</p>
            <p className="text-2xl font-bold text-blue-400">
              {totalCompressedAccounts}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total compressed accounts</p>
          </div>
        </div>
        
        <p className="text-sm text-slate-400 mt-4">
          ZK Compression reduces on-chain storage costs by up to 100x while maintaining Solana's security and performance.
        </p>
      </div>
    </div>
  );
};

export default CompressionStatus; 