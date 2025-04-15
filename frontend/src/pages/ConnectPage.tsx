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
    <div className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10%] opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-cyan-500/20 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style={{ animationDuration: '12s' }}></div>
        </div>
      </div>
      
      {/* Main content card */}
      <div className="relative z-10 w-full max-w-md transform transition-all">
        {/* Logo/brand at the top */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">STABLE-FUNDS</h1>
        </div>

        {/* Card with glass morphism effect */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-300 text-sm">
              Sign in securely with Civic Auth to access your dashboard
            </p>
          </div>

          {/* Card body */}
          <div className="px-8 py-6">
            {/* Civic logo with glow effect */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-70 group-hover:opacity-100 blur group-hover:blur-md transition duration-1000"></div>
                <div className="relative flex items-center justify-center w-20 h-20 bg-slate-800 rounded-full">
                  <img 
                    src="https://auth.civic.com/favicon.ico" 
                    alt="Civic" 
                    className="w-10 h-10 group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Features list with icons */}
            <div className="mb-8">
              <ul className="space-y-4">
                {[
                  { 
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    ),
                    text: "Enhanced security with email or social login" 
                  },
                  { 
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    ),
                    text: "Built-in wallet with no seed phrase to remember" 
                  },
                  { 
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    ),
                    text: "Fast and seamless user experience" 
                  }
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 group">
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors duration-300">
                      {feature.icon}
                    </div>
                    <span className="text-slate-300 text-sm">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sign in button */}
            <div className="mb-4">
              <SignInButton className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center text-sm shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]" />
              
              {civicLoading && (
                <div className="mt-4 flex items-center justify-center text-slate-300 text-sm">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing your request...
                </div>
              )}
            </div>
          </div>

          {/* Card footer */}
          <div className="py-4 px-8 border-t border-white/10 text-center bg-white/5">
            <a 
              href="https://www.civic.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-white transition-colors hover:underline"
            >
              Learn more about Civic Auth
            </a>
          </div>
        </div>
        
        {/* Small extra branding element */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-medium">Stable-Funds</span> Technology
          </p>
        </div>
      </div>
    </div>
  );
} 