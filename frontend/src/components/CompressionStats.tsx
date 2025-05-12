import { useWalletContext } from '../context/WalletContext';

const CompressionStats = () => {
  return (
    <div className="card overflow-hidden border border-slate-200/10 mb-6">
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-5">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          ZK Compression Benefits
        </h2>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
            <h3 className="font-semibold mb-2 text-blue-400">Stablecoin Creation</h3>
            <div className="flex justify-between">
              <span className="text-slate-400">Regular</span>
              <span className="font-mono text-slate-300">~0.01 SOL</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-400">Compressed</span>
              <span className="font-mono text-green-400">~0.0001 SOL</span>
            </div>
            <div className="mt-2 text-right text-sm text-green-500">
              100x cheaper!
            </div>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
            <h3 className="font-semibold mb-2 text-blue-400">Smart Vault Creation</h3>
            <div className="flex justify-between">
              <span className="text-slate-400">Regular</span>
              <span className="font-mono text-slate-300">~0.024 SOL</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-400">Compressed</span>
              <span className="font-mono text-green-400">~0.0002 SOL</span>
            </div>
            <div className="mt-2 text-right text-sm text-green-500">
              120x cheaper!
            </div>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
            <h3 className="font-semibold mb-2 text-blue-400">Collateral Account</h3>
            <div className="flex justify-between">
              <span className="text-slate-400">Regular</span>
              <span className="font-mono text-slate-300">~0.0016 SOL</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-slate-400">Compressed</span>
              <span className="font-mono text-green-400">~0.00001 SOL</span>
            </div>
            <div className="mt-2 text-right text-sm text-green-500">
              160x cheaper!
            </div>
          </div>
        </div>
        
        <p className="text-sm text-slate-400 mt-4">
          ZK Compression maintains all the security guarantees of Solana while drastically reducing state costs.
          This enables STABLE-FUNDS to scale to millions of users without increasing infrastructure costs.
        </p>
      </div>
    </div>
  );
};

export default CompressionStats; 