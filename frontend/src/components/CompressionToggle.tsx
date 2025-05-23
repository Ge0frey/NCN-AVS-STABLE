import { useWalletContext } from '../context/WalletContext';

const CompressionToggle = () => {
  const { 
    isCompressionEnabled,
    setCompressionEnabled,
    compressionClient
  } = useWalletContext();
  
  if (!compressionClient) {
    return null;
  }
  
  return (
    <div className="flex items-center">
      <label className="flex items-center cursor-pointer">
        <span className="mr-2 text-sm text-slate-300">ZK Compression</span>
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={isCompressionEnabled}
            onChange={(e) => setCompressionEnabled(e.target.checked)}
          />
          <div className={`block w-10 h-6 rounded-full ${isCompressionEnabled ? 'bg-green-500' : 'bg-slate-600'}`}></div>
          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${isCompressionEnabled ? 'transform translate-x-4' : ''}`}></div>
        </div>
      </label>
    </div>
  );
};

export default CompressionToggle; 