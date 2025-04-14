import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, useUser } from '@civic/auth-web3/react';

export default function ConnectPage() {
  const { user, isLoading: civicLoading } = useUser();
  const navigate = useNavigate();

  // Redirect to dashboard if already connected
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4">
      {/* Subtle background gradient - much less prominent */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950 z-0"></div>
      
      {/* Card container - simplified and darker */}
      <div className="relative z-10 w-full max-w-md bg-slate-800/60 border border-slate-700/30 rounded-lg shadow-lg overflow-hidden backdrop-blur-sm">
        {/* Card header - more subtle gradient */}
        <div className="bg-slate-800 p-6 text-center border-b border-slate-700/30">
          <h1 className="text-2xl font-medium text-slate-100 mb-1">Welcome to STABLE-FUNDS</h1>
          <p className="text-slate-400 text-sm">
            Securely access the platform with Civic Auth
          </p>
        </div>

        {/* Card body - simplified and cleaner */}
        <div className="p-8 flex flex-col items-center">
          {/* Civic logo - simpler styling */}
          <div className="mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full">
              <img 
                src="https://auth.civic.com/favicon.ico" 
                alt="Civic" 
                className="w-10 h-10"
              />
            </div>
          </div>

          {/* Features list - more minimal */}
          <div className="w-full mb-8">
            <h3 className="text-slate-300 font-medium mb-3 text-center text-sm">Why use Civic Auth?</h3>
            <ul className="space-y-2">
              {[
                { text: "Enhanced security with email or social login" },
                { text: "Built-in wallet with no seed phrase to remember" },
                { text: "Fast and seamless user experience" }
              ].map((feature, index) => (
                <li key={index} className="flex items-center text-slate-400 text-sm">
                  <span className="mr-2">•</span>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sign in button - more minimal */}
          <div className="w-full">
            <div className="flex flex-col items-center">
              <SignInButton className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded transition-colors duration-200 flex items-center justify-center text-sm" />
              
              {civicLoading && (
                <div className="mt-4 flex items-center text-slate-400 text-sm">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card footer - more subtle */}
        <div className="p-3 border-t border-slate-700/30 text-center">
          <a 
            href="https://www.civic.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            Learn more about Civic Auth
          </a>
        </div>
      </div>
    </div>
  );
} 