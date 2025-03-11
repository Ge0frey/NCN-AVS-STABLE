# Frontend Integration Guide

This guide explains how to integrate the NCN (Node Consensus Network) and Jito Restaking features with the existing STABLE-FUNDS frontend.

## Overview

The integration follows a non-intrusive approach that preserves your existing frontend functionality while enhancing it with NCN and Jito Restaking capabilities. The bridge layer provides API endpoints that the frontend can use to interact with these new features.

## Key Integration Points

### 1. WalletContext.tsx

Enhance the existing WalletContext to support Jito Restaking:

```tsx
// Add to imports
import { JitoClient } from '@jito/restaking-client';

// Add to WalletContextProps
jitoClient: JitoClient | null;
isJitoEnabled: boolean;

// Add to WalletProvider state
const [jitoClient, setJitoClient] = useState<JitoClient | null>(null);
const [isJitoEnabled, setIsJitoEnabled] = useState<boolean>(false);

// Add useEffect to initialize Jito client
useEffect(() => {
  const initializeJitoClient = async () => {
    try {
      // Check if NCN features are enabled
      const response = await fetch('http://localhost:3001/api/features');
      const { data } = await response.json();
      
      setIsJitoEnabled(data.jitoRestakingEnabled);
      
      if (data.jitoRestakingEnabled && connection) {
        const jitoClient = new JitoClient(connection);
        setJitoClient(jitoClient);
      }
    } catch (error) {
      console.error('Failed to initialize Jito client:', error);
      setJitoClient(null);
      setIsJitoEnabled(false);
    }
  };
  
  if (connection) {
    initializeJitoClient();
  }
}, [connection]);

// Add to contextValue
jitoClient,
isJitoEnabled,
```

### 2. CollateralPage.tsx

Enhance the CollateralPage to display oracle-powered price feeds:

```tsx
// Add to imports
import { useEffect, useState } from 'react';

// Add to component state
const [oraclePrices, setOraclePrices] = useState<Record<string, number>>({});
const [isOracleEnabled, setIsOracleEnabled] = useState<boolean>(false);

// Add useEffect to fetch oracle prices
useEffect(() => {
  const fetchOraclePrices = async () => {
    try {
      // Check if NCN features are enabled
      const featuresResponse = await fetch('http://localhost:3001/api/features');
      const { data: featureData } = await featuresResponse.json();
      
      setIsOracleEnabled(featureData.ncnEnabled);
      
      if (featureData.ncnEnabled) {
        // Fetch oracle prices for each asset
        const prices: Record<string, number> = {};
        
        for (const asset of collateralData.collateralAssets) {
          const response = await fetch(`http://localhost:3001/api/oracle/price/${asset.id}`);
          const { data } = await response.json();
          
          if (data && data.price) {
            prices[asset.id] = data.price;
          }
        }
        
        setOraclePrices(prices);
      }
    } catch (error) {
      console.error('Failed to fetch oracle prices:', error);
      setIsOracleEnabled(false);
    }
  };
  
  fetchOraclePrices();
}, [collateralData.collateralAssets]);

// Modify the collateral asset display to show oracle prices
{collateralData.collateralAssets.map((asset) => (
  <div key={asset.id} className="collateral-asset-card">
    {/* Existing asset display */}
    
    {/* Add oracle price display */}
    {isOracleEnabled && oraclePrices[asset.id] && (
      <div className="oracle-price">
        <span className="label">Oracle Price:</span>
        <span className="value">${oraclePrices[asset.id].toFixed(2)}</span>
        <span className="source">Source: NCN Oracle</span>
      </div>
    )}
  </div>
))}
```

### 3. StakePage.tsx

Add a dedicated tab for Jito Restaking options:

```tsx
// Add to imports
import { useState, useEffect } from 'react';
import { useWalletContext } from '../context/WalletContext';

// Add to component state
const [jitoVaults, setJitoVaults] = useState<any[]>([]);
const [jitoPositions, setJitoPositions] = useState<any[]>([]);
const [activeTab, setActiveTab] = useState<'regular' | 'jito'>('regular');

// Add useEffect to fetch Jito vaults and positions
useEffect(() => {
  const fetchJitoData = async () => {
    try {
      if (!isJitoEnabled) return;
      
      // Fetch Jito vaults
      const vaultsResponse = await fetch('http://localhost:3001/api/restaking/vaults');
      const { data: vaultsData } = await vaultsResponse.json();
      setJitoVaults(vaultsData || []);
      
      // Fetch user positions if connected
      if (publicKey) {
        const positionsResponse = await fetch(`http://localhost:3001/api/restaking/positions/${publicKey.toBase58()}`);
        const { data: positionsData } = await positionsResponse.json();
        setJitoPositions(positionsData || []);
      }
    } catch (error) {
      console.error('Failed to fetch Jito data:', error);
    }
  };
  
  fetchJitoData();
}, [isJitoEnabled, publicKey]);

// Add tab navigation
<div className="tabs">
  <button
    className={activeTab === 'regular' ? 'active' : ''}
    onClick={() => setActiveTab('regular')}
  >
    Regular Staking
  </button>
  {isJitoEnabled && (
    <button
      className={activeTab === 'jito' ? 'active' : ''}
      onClick={() => setActiveTab('jito')}
    >
      Jito Restaking
    </button>
  )}
</div>

{/* Conditional rendering based on active tab */}
{activeTab === 'regular' ? (
  <div className="regular-staking">
    {/* Existing staking UI */}
  </div>
) : (
  <div className="jito-restaking">
    <h2>Jito Restaking Vaults</h2>
    
    {/* Display Jito vaults */}
    <div className="vaults-list">
      {jitoVaults.map((vault) => (
        <div key={vault.address} className="vault-card">
          <h3>{vault.name}</h3>
          <p>APY: {vault.apy}%</p>
          <p>Total Balance: {vault.balance}</p>
          <p>Delegated: {vault.delegatedAmount}</p>
          
          {/* Staking form */}
          <form onSubmit={handleJitoStake}>
            <input
              type="number"
              name="amount"
              placeholder="Amount to stake"
              min="0.1"
              step="0.1"
              required
            />
            <select name="lockPeriod">
              <option value="0">No lock (flexible)</option>
              <option value="30">30-day lock</option>
              <option value="90">90-day lock</option>
            </select>
            <input type="hidden" name="vaultAddress" value={vault.address} />
            <button type="submit">Stake</button>
          </form>
        </div>
      ))}
    </div>
    
    {/* Display user positions */}
    {jitoPositions.length > 0 && (
      <div className="user-positions">
        <h2>Your Positions</h2>
        
        {jitoPositions.map((position, index) => (
          <div key={index} className="position-card">
            <p>Staked: {position.stakedAmount}</p>
            <p>Rewards: {position.rewards}</p>
            <p>Lock Period: {position.lockPeriod} days</p>
            {position.lockExpiry && (
              <p>Lock Expires: {new Date(position.lockExpiry).toLocaleDateString()}</p>
            )}
            
            {/* Unstaking form */}
            <form onSubmit={handleJitoUnstake}>
              <input
                type="number"
                name="amount"
                placeholder="Amount to unstake"
                min="0.1"
                step="0.1"
                max={position.stakedAmount}
                required
              />
              <input type="hidden" name="vaultAddress" value={position.vaultAddress} />
              <button type="submit">Unstake</button>
            </form>
          </div>
        ))}
      </div>
    )}
  </div>
)}

// Add handlers for Jito staking and unstaking
const handleJitoStake = async (e) => {
  e.preventDefault();
  
  if (!publicKey) {
    alert('Please connect your wallet');
    return;
  }
  
  const formData = new FormData(e.target);
  const amount = parseFloat(formData.get('amount') as string);
  const lockPeriod = parseInt(formData.get('lockPeriod') as string);
  const vaultAddress = formData.get('vaultAddress') as string;
  
  try {
    const response = await fetch('http://localhost:3001/api/restaking/stake', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress: publicKey.toBase58(),
        vaultAddress,
        amount,
        lockPeriod
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Staking successful!');
      // Refresh data
      fetchJitoData();
    } else {
      alert(`Staking failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error staking to Jito vault:', error);
    alert('Staking failed. See console for details.');
  }
};

const handleJitoUnstake = async (e) => {
  e.preventDefault();
  
  if (!publicKey) {
    alert('Please connect your wallet');
    return;
  }
  
  const formData = new FormData(e.target);
  const amount = parseFloat(formData.get('amount') as string);
  const vaultAddress = formData.get('vaultAddress') as string;
  
  try {
    const response = await fetch('http://localhost:3001/api/restaking/unstake', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress: publicKey.toBase58(),
        vaultAddress,
        amount
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Unstaking successful!');
      // Refresh data
      fetchJitoData();
    } else {
      alert(`Unstaking failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error unstaking from Jito vault:', error);
    alert('Unstaking failed. See console for details.');
  }
};
```

### 4. GovernancePage.tsx

Enhance the governance page with decentralized proposal execution:

```tsx
// Add to imports
import { useState, useEffect } from 'react';

// Add to component state
const [isNcnEnabled, setIsNcnEnabled] = useState<boolean>(false);

// Add useEffect to check if NCN is enabled
useEffect(() => {
  const checkNcnEnabled = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/features');
      const { data } = await response.json();
      
      setIsNcnEnabled(data.ncnEnabled);
    } catch (error) {
      console.error('Failed to check NCN status:', error);
      setIsNcnEnabled(false);
    }
  };
  
  checkNcnEnabled();
}, []);

// Modify the proposal display to show execution options
{activeProposals.map((proposal) => (
  <div key={proposal.id} className="proposal-card">
    {/* Existing proposal display */}
    
    {/* Add execution options for passed proposals */}
    {proposal.status === 'Passed' && isNcnEnabled && (
      <div className="execution-options">
        <h4>Execute Proposal</h4>
        <p>This proposal can be executed using the Cambrian NCN.</p>
        
        <button
          onClick={() => handleExecuteProposal(proposal.id)}
          disabled={proposal.executionStatus === 'Executing' || proposal.executionStatus === 'Executed'}
        >
          {proposal.executionStatus === 'Executing'
            ? 'Executing...'
            : proposal.executionStatus === 'Executed'
            ? 'Executed'
            : 'Execute'}
        </button>
        
        {proposal.executionStatus === 'Executed' && proposal.executionResult && (
          <div className="execution-result">
            <h5>Execution Result</h5>
            <p>{proposal.executionResult}</p>
          </div>
        )}
      </div>
    )}
  </div>
))}

// Add handler for executing proposals
const handleExecuteProposal = async (proposalId) => {
  try {
    // Determine the appropriate payload image based on the proposal
    const payloadImage = `proposal-execution-${proposalId}`;
    
    const response = await fetch('http://localhost:3001/api/governance/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        proposalId,
        payloadImage
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Proposal execution initiated!');
      // Update the proposal status
      setActiveProposals(prevProposals =>
        prevProposals.map(p =>
          p.id === proposalId
            ? { ...p, executionStatus: 'Executing' }
            : p
        )
      );
    } else {
      alert(`Execution failed: ${result.error}`);
    }
  } catch (error) {
    console.error('Error executing proposal:', error);
    alert('Execution failed. See console for details.');
  }
};
```

### 5. DashboardPage.tsx

Add an NCN information panel to the dashboard:

```tsx
// Add to imports
import { useState, useEffect } from 'react';

// Add to component state
const [ncnOperators, setNcnOperators] = useState<any[]>([]);
const [isNcnEnabled, setIsNcnEnabled] = useState<boolean>(false);

// Add useEffect to fetch NCN operators
useEffect(() => {
  const fetchNcnData = async () => {
    try {
      // Check if NCN features are enabled
      const featuresResponse = await fetch('http://localhost:3001/api/features');
      const { data: featureData } = await featuresResponse.json();
      
      setIsNcnEnabled(featureData.ncnEnabled);
      
      if (featureData.ncnEnabled) {
        // Fetch NCN operators
        const operatorsResponse = await fetch('http://localhost:3001/api/oracle/operators');
        const { data: operatorsData } = await operatorsResponse.json();
        
        setNcnOperators(operatorsData || []);
      }
    } catch (error) {
      console.error('Failed to fetch NCN data:', error);
      setIsNcnEnabled(false);
    }
  };
  
  fetchNcnData();
}, []);

// Add NCN information panel to the dashboard
{isNcnEnabled && (
  <div className="dashboard-card ncn-info">
    <h3>NCN Network Status</h3>
    
    <div className="ncn-operators">
      <h4>Active Operators</h4>
      
      <div className="operators-list">
        {ncnOperators.map((operator) => (
          <div key={operator.publicKey} className="operator-item">
            <span className="name">{operator.name}</span>
            <span className={`status ${operator.status.toLowerCase()}`}>
              {operator.status}
            </span>
            <span className="stake">{operator.stake} tokens</span>
          </div>
        ))}
      </div>
    </div>
    
    <div className="ncn-stats">
      <div className="stat">
        <span className="label">Total Operators</span>
        <span className="value">{ncnOperators.length}</span>
      </div>
      <div className="stat">
        <span className="label">Active Operators</span>
        <span className="value">
          {ncnOperators.filter(op => op.status === 'Active').length}
        </span>
      </div>
      <div className="stat">
        <span className="label">Total Stake</span>
        <span className="value">
          {ncnOperators.reduce((sum, op) => sum + op.stake, 0)}
        </span>
      </div>
    </div>
  </div>
)}
```

## Testing the Integration

1. Start the bridge server:

```bash
cd NCNs-AVS-JITO-PROGRAMS/bridge
npm run dev
```

2. Start your frontend application:

```bash
cd frontend
npm run dev
```

3. Test the integration by:
   - Checking the CollateralPage for oracle prices
   - Exploring the Jito Restaking tab on the StakePage
   - Viewing NCN information on the DashboardPage
   - Testing proposal execution on the GovernancePage

## Troubleshooting

- If the NCN features are not appearing, check that the bridge server is running and the feature flags are enabled in the `.env` file.
- If you encounter CORS errors, ensure that the bridge server is properly configured to allow requests from your frontend.
- If the Jito Restaking features are not working, verify that the Jito client is properly initialized in the WalletContext.