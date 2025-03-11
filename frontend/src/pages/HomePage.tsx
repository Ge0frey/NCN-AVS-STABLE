import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import Logo from '../components/layout/Logo';

export default function HomePage() {
  const navigate = useNavigate();
  const { connected } = useWalletContext();

  const handleGetStarted = () => {
    if (connected) {
      navigate('/dashboard');
    } else {
      navigate('/connect');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden py-20 md:py-32">
        {/* Decorative elements */}
        <div className="glow-orb glow-orb-blue w-96 h-96 top-20 right-10 opacity-40"></div>
        <div className="glow-orb glow-orb-purple w-80 h-80 bottom-10 left-10 opacity-40"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <Logo className="scale-150" />
          </div>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-300 md:text-2xl">
            The next generation stablecoin factory built on Solana, powered by Node Consensus Networks and Jito Restaking.
          </p>
          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button
              onClick={handleGetStarted}
              className="btn btn-primary px-8 py-3 text-base"
            >
              Get Started
            </button>
            <a
              href="https://docs.stablefunds.io"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline px-8 py-3 text-base"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 relative">
        <div className="glow-orb glow-orb-orange w-64 h-64 top-1/4 right-1/4 opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="mb-12 text-center text-3xl font-bold gradient-text md:text-4xl">
            Why Choose STABLE-FUNDS?
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="card card-hover transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold gradient-text">Secure & Decentralized</h3>
              <p className="text-slate-300">
                Built on Solana with Node Consensus Networks for enhanced security and true decentralization.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card card-hover transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold gradient-text">Custom Stablecoins</h3>
              <p className="text-slate-300">
                Create and manage your own stablecoins with customizable parameters and collateral options.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card card-hover transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold gradient-text">Earn Rewards</h3>
              <p className="text-slate-300">
                Participate in Jito Restaking to earn additional rewards while securing the network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-slate-800/30 backdrop-blur-sm"></div>
        <div className="glow-orb glow-orb-blue w-72 h-72 bottom-1/4 right-1/4 opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="mb-12 text-center text-3xl font-bold gradient-text md:text-4xl">
            How It Works
          </h2>
          <div className="mx-auto max-w-4xl">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 h-full w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500 md:left-1/2 md:-ml-0.5"></div>
              
              {/* Step 1 */}
              <div className="relative mb-8 md:mb-0">
                <div className="flex md:flex-row-reverse md:items-center">
                  <div className="ml-8 md:ml-0 md:mr-8 md:w-1/2">
                    <div className="card">
                      <h3 className="mb-2 text-xl font-bold gradient-text">1. Connect Your Wallet</h3>
                      <p className="text-slate-300">
                        Connect your Solana wallet to access the STABLE-FUNDS platform and all its features.
                      </p>
                    </div>
                  </div>
                  <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white md:left-1/2 md:-ml-4 shadow-lg shadow-blue-500/50">
                    <span>1</span>
                  </div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="relative mb-8 pt-16 md:mb-0">
                <div className="flex md:items-center">
                  <div className="ml-8 md:ml-8 md:w-1/2">
                    <div className="card">
                      <h3 className="mb-2 text-xl font-bold gradient-text">2. Deposit Collateral</h3>
                      <p className="text-slate-300">
                        Deposit JitoSOL or Stablebonds as collateral to back your stablecoins.
                      </p>
                    </div>
                  </div>
                  <div className="absolute left-0 top-16 flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white md:left-1/2 md:-ml-4 shadow-lg shadow-purple-500/50">
                    <span>2</span>
                  </div>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="relative mb-8 pt-16 md:mb-0">
                <div className="flex md:flex-row-reverse md:items-center">
                  <div className="ml-8 md:ml-0 md:mr-8 md:w-1/2">
                    <div className="card">
                      <h3 className="mb-2 text-xl font-bold gradient-text">3. Create Stablecoins</h3>
                      <p className="text-slate-300">
                        Design and mint your custom stablecoins with your preferred parameters.
                      </p>
                    </div>
                  </div>
                  <div className="absolute left-0 top-16 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white md:left-1/2 md:-ml-4 shadow-lg shadow-indigo-500/50">
                    <span>3</span>
                  </div>
                </div>
              </div>
              
              {/* Step 4 */}
              <div className="relative pt-16">
                <div className="flex md:items-center">
                  <div className="ml-8 md:ml-8 md:w-1/2">
                    <div className="card">
                      <h3 className="mb-2 text-xl font-bold gradient-text">4. Earn & Govern</h3>
                      <p className="text-slate-300">
                        Participate in governance and earn rewards through Jito Restaking.
                      </p>
                    </div>
                  </div>
                  <div className="absolute left-0 top-16 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white md:left-1/2 md:-ml-4 shadow-lg shadow-orange-500/50">
                    <span>4</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 relative">
        <div className="glow-orb glow-orb-purple w-80 h-80 top-1/3 left-1/4 opacity-30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="mb-12 text-center text-3xl font-bold gradient-text md:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="card card-hover">
              <h3 className="mb-2 text-xl font-bold gradient-text">What is STABLE-FUNDS?</h3>
              <p className="text-slate-300">
                STABLE-FUNDS is a stablecoin factory built on Solana that integrates Node Consensus Networks (NCNs), Actively Validated Services (AVS), and Jito Restaking to create a secure and decentralized platform for custom stablecoins.
              </p>
            </div>
            <div className="card card-hover">
              <h3 className="mb-2 text-xl font-bold gradient-text">How are stablecoins collateralized?</h3>
              <p className="text-slate-300">
                Stablecoins on STABLE-FUNDS are collateralized using JitoSOL and Stablebonds, providing a secure and stable backing for your digital assets.
              </p>
            </div>
            <div className="card card-hover">
              <h3 className="mb-2 text-xl font-bold gradient-text">What is Jito Restaking?</h3>
              <p className="text-slate-300">
                Jito Restaking allows you to earn additional rewards by staking your JitoSOL tokens, contributing to network security while generating passive income.
              </p>
            </div>
            <div className="card card-hover">
              <h3 className="mb-2 text-xl font-bold gradient-text">How can I participate in governance?</h3>
              <p className="text-slate-300">
                Token holders can participate in governance by voting on proposals and contributing to the platform's development and decision-making process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/80 backdrop-blur-sm"></div>
        <div className="glow-orb glow-orb-blue w-96 h-96 top-0 left-1/4 opacity-30"></div>
        <div className="glow-orb glow-orb-orange w-64 h-64 bottom-0 right-1/4 opacity-30"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="mb-6 text-3xl font-bold gradient-text md:text-4xl">Ready to Get Started?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-300">
            Join the future of decentralized finance with STABLE-FUNDS today.
          </p>
          <button
            onClick={handleGetStarted}
            className="btn btn-primary px-8 py-3 text-base font-medium"
          >
            Launch App
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-slate-300 glass-panel">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4">
                <Logo />
              </div>
              <p className="mb-4">
                The next generation stablecoin factory built on Solana.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">Whitepaper</a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">API</a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">Community</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">Discord</a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">Twitter</a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">Telegram</a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">Forum</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold text-white">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-slate-300 hover:text-blue-400 transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-700 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} STABLE-FUNDS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 