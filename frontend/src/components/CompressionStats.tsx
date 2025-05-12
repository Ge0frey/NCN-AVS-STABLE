import { useWalletContext } from '../context/WalletContext';

const CompressionStats = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">ZK Compression Benefits</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Stablecoin Creation</h3>
          <div className="flex justify-between">
            <span className="text-gray-600">Regular</span>
            <span className="font-mono">~0.01 SOL</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600">Compressed</span>
            <span className="font-mono text-green-600">~0.0001 SOL</span>
          </div>
          <div className="mt-2 text-right text-sm text-green-700">
            100x cheaper!
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Smart Vault Creation</h3>
          <div className="flex justify-between">
            <span className="text-gray-600">Regular</span>
            <span className="font-mono">~0.024 SOL</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600">Compressed</span>
            <span className="font-mono text-green-600">~0.0002 SOL</span>
          </div>
          <div className="mt-2 text-right text-sm text-green-700">
            120x cheaper!
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Collateral Account</h3>
          <div className="flex justify-between">
            <span className="text-gray-600">Regular</span>
            <span className="font-mono">~0.0016 SOL</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600">Compressed</span>
            <span className="font-mono text-green-600">~0.00001 SOL</span>
          </div>
          <div className="mt-2 text-right text-sm text-green-700">
            160x cheaper!
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-4">
        ZK Compression maintains all the security guarantees of Solana while drastically reducing state costs.
        This enables STABLE-FUNDS to scale to millions of users without increasing infrastructure costs.
      </p>
    </div>
  );
};

export default CompressionStats; 