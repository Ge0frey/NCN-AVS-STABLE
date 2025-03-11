import { Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Solana Wallet Adapter
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, SolflareWalletAdapter, LedgerWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { useMemo } from 'react'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

// Pages
import HomePage from './pages/HomePage'
import ConnectPage from './pages/ConnectPage'
import DashboardPage from './pages/DashboardPage'
import StablecoinsPage from './pages/StablecoinsPage'
import CreateStablecoinPage from './pages/CreateStablecoinPage'
import CollateralPage from './pages/CollateralPage'
import DepositCollateralPage from './pages/DepositCollateralPage'
import WithdrawCollateralPage from './pages/WithdrawCollateralPage'
import MintPage from './pages/MintPage'
import RedeemPage from './pages/RedeemPage'
import StakePage from './pages/StakePage'
import GovernancePage from './pages/GovernancePage'

function App() {
  // Set up network and wallet configuration
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter()
    ],
    []
  )

  return (
    <ThemeProvider>
      <ConnectionProvider endpoint={endpoint}>
        <SolanaWalletProvider wallets={wallets} autoConnect>
          <WalletProvider>
            <WalletModalProvider>
              <Layout>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/connect" element={<ConnectPage />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/stablecoins" element={
                    <ProtectedRoute>
                      <StablecoinsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/stablecoins/create" element={
                    <ProtectedRoute>
                      <CreateStablecoinPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/collateral" element={
                    <ProtectedRoute>
                      <CollateralPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/collateral/deposit" element={
                    <ProtectedRoute>
                      <DepositCollateralPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/collateral/withdraw" element={
                    <ProtectedRoute>
                      <WithdrawCollateralPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/mint" element={
                    <ProtectedRoute>
                      <MintPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/redeem" element={
                    <ProtectedRoute>
                      <RedeemPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/stake" element={
                    <ProtectedRoute>
                      <StakePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/governance" element={
                    <ProtectedRoute>
                      <GovernancePage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </WalletModalProvider>
          </WalletProvider>
        </SolanaWalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  )
}

export default App
