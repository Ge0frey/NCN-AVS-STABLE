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
  
}

export default App
