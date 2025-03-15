// Collateral asset types
export interface CollateralAsset {
  id: string;
  name: string;
  icon: string;
  balance: number;
  value: number;
  price: number;
  apy: number;
  oraclePrice?: number; // Price from NCN oracle
}

// NCN Oracle types
export interface OracleData {
  assetId: string;
  price: number;
  timestamp: number;
  source: string;
  confidence: number;
}

// Jito Restaking types
export interface RestakingVault {
  address: string;
  name: string;
  balance: number;
  delegatedAmount: number;
  apy: number;
}

export interface RestakingPosition {
  vaultAddress: string;
  stakedAmount: number;
  rewards: number;
  lockPeriod: number;
  lockExpiry: number | null;
}

// Governance types with NCN enhancements
export interface GovernanceProposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  status: 'Active' | 'Passed' | 'Failed' | 'Executed' | 'Cancelled';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  quorum: number;
  endTime: number;
  hasVoted: boolean;
  userVote?: 'For' | 'Against' | 'Abstain';
  executionPayload?: string; // Cambrian payload container image name
  executionStatus?: 'Pending' | 'Executing' | 'Executed' | 'Failed';
  executionResult?: string;
}

// NCN Operator types
export interface NcnOperator {
  publicKey: string;
  name: string;
  status: 'Active' | 'Inactive' | 'Slashed';
  stake: number;
  rewardShare: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 