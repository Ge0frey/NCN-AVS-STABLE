import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import api from '../services/api';

// Mock data for demonstration
const mockData = {
  votingPower: 1250,
  activeProposals: [
    {
      id: 1,
      title: 'Increase Collateralization Ratio to 200%',
      description: 'This proposal aims to increase the minimum collateralization ratio from 175% to 200% to enhance protocol stability.',
      proposer: '8xH...3jK',
      status: 'Active',
      votesFor: 12500,
      votesAgainst: 5200,
      votesAbstain: 1800,
      totalVotes: 19500,
      quorum: 15000,
      endTime: Date.now() + 3600000 * 48, // 48 hours from now
      hasVoted: false,
    },
    {
      id: 2,
      title: 'Add EURF Stablecoin Support',
      description: 'Proposal to add support for Euro-pegged stablecoin (EURF) to expand the protocol\'s offerings.',
      proposer: '5tG...9pL',
      status: 'Active',
      votesFor: 18200,
      votesAgainst: 3100,
      votesAbstain: 900,
      totalVotes: 22200,
      quorum: 15000,
      endTime: Date.now() + 3600000 * 24, // 24 hours from now
      hasVoted: true,
      userVote: 'For',
    },
  ],
  pastProposals: [
    {
      id: 3,
      title: 'Reduce Protocol Fees to 0.1%',
      description: 'Proposal to reduce protocol fees from 0.2% to 0.1% to encourage more usage.',
      proposer: '3rF...7mN',
      status: 'Passed',
      votesFor: 25600,
      votesAgainst: 4200,
      votesAbstain: 1100,
      totalVotes: 30900,
      quorum: 15000,
      endTime: Date.now() - 3600000 * 72, // 72 hours ago
      hasVoted: true,
      userVote: 'For',
      executionPayload: 'parameter-update-payload',
      executionStatus: 'Pending'
    },
    {
      id: 4,
      title: 'Integrate with Jito Liquid Staking',
      description: 'Proposal to integrate with Jito Liquid Staking to allow JitoSOL as collateral.',
      proposer: '9qD...2kR',
      status: 'Failed',
      votesFor: 12300,
      votesAgainst: 14500,
      votesAbstain: 2200,
      totalVotes: 29000,
      quorum: 15000,
      endTime: Date.now() - 3600000 * 120, // 120 hours ago
    },
  ],
};

export default function GovernancePage() {
  console.log('GovernancePage: Component rendering');
  
  const navigate = useNavigate();
  const { publicKey, connected, isInitialized } = useWalletContext();
  
  console.log('GovernancePage: Wallet state:', { connected, isInitialized, hasPublicKey: !!publicKey });
  
  const [isLoading, setIsLoading] = useState(true);
  const [governanceData, setGovernanceData] = useState(mockData);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [voteType, setVoteType] = useState<'For' | 'Against' | 'Abstain' | null>(null);
  
  // Form state for creating proposal
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDescription, setProposalDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Add NCN state
  const [isNcnEnabled, setIsNcnEnabled] = useState<boolean>(false);
  const [executingProposals, setExecutingProposals] = useState<number[]>([]);

  // Simulate data loading
  useEffect(() => {
    console.log('GovernancePage: Loading effect triggered');
    const timer = setTimeout(() => {
      console.log('GovernancePage: Setting loading to false');
      setIsLoading(false);
      // In a real app, you would fetch data from your API here
    }, 1000);

    return () => {
      console.log('GovernancePage: Cleanup loading effect');
      clearTimeout(timer);
    };
  }, []);

  // Add useEffect to check if NCN is enabled
  useEffect(() => {
    const checkNcnEnabled = async () => {
      try {
        const features = await api.getFeatureFlags();
        setIsNcnEnabled(features.ncnEnabled);
      } catch (error) {
        console.error('Failed to check NCN status:', error);
        setIsNcnEnabled(false);
      }
    };
    
    checkNcnEnabled();
  }, []);

  // Format time remaining
  const formatTimeRemaining = (endTime: number) => {
    const timeRemaining = endTime - Date.now();
    
    if (timeRemaining <= 0) return 'Ended';
    
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  // Handle proposal creation
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proposalTitle || !proposalDescription) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would send the transaction to your API/blockchain here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Add new proposal to the list (in a real app, this would come from the blockchain)
      const newProposal = {
        id: governanceData.activeProposals.length + governanceData.pastProposals.length + 1,
        title: proposalTitle,
        description: proposalDescription,
        proposer: publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-3)}` : 'Unknown',
        status: 'Active',
        votesFor: 0,
        votesAgainst: 0,
        votesAbstain: 0,
        totalVotes: 0,
        quorum: 15000,
        endTime: Date.now() + 3600000 * 72, // 72 hours from now
        hasVoted: false,
      };
      
      setGovernanceData({
        ...governanceData,
        activeProposals: [newProposal, ...governanceData.activeProposals],
      });
      
      setShowSuccessModal(true);
      setShowCreateModal(false);
      setProposalTitle('');
      setProposalDescription('');
    } catch (error) {
      console.error('Error creating proposal:', error);
      // Handle error (show error message)
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle voting on a proposal
  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProposal || !voteType) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would send the transaction to your API/blockchain here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Update proposal with vote (in a real app, this would come from the blockchain)
      const updatedProposals = governanceData.activeProposals.map(proposal => {
        if (proposal.id === selectedProposal.id) {
          const updatedVotesFor = voteType === 'For' ? proposal.votesFor + governanceData.votingPower : proposal.votesFor;
          const updatedVotesAgainst = voteType === 'Against' ? proposal.votesAgainst + governanceData.votingPower : proposal.votesAgainst;
          const updatedVotesAbstain = voteType === 'Abstain' ? proposal.votesAbstain + governanceData.votingPower : proposal.votesAbstain;
          
          return {
            ...proposal,
            votesFor: updatedVotesFor,
            votesAgainst: updatedVotesAgainst,
            votesAbstain: updatedVotesAbstain,
            totalVotes: updatedVotesFor + updatedVotesAgainst + updatedVotesAbstain,
            hasVoted: true,
            userVote: voteType,
          };
        }
        return proposal;
      });
      
      setGovernanceData({
        ...governanceData,
        activeProposals: updatedProposals,
      });
      
      setShowVoteModal(false);
      setSelectedProposal(null);
      setVoteType(null);
    } catch (error) {
      console.error('Error voting on proposal:', error);
      // Handle error (show error message)
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add handler for executing proposals
  const handleExecuteProposal = async (proposalId: number) => {
    if (!isNcnEnabled) return;
    
    try {
      setExecutingProposals(prev => [...prev, proposalId]);
      
      // Generate payload image name based on proposal type and ID
      const proposal = governanceData.pastProposals.find(p => p.id === proposalId);
      let payloadImage = 'default-proposal-execution';
      
      if (proposal) {
        // Determine appropriate payload image based on proposal type
        if (proposal.title.toLowerCase().includes('parameter')) {
          payloadImage = 'parameter-update-payload';
        } else if (proposal.title.toLowerCase().includes('upgrade')) {
          payloadImage = 'program-upgrade-payload';
        } else if (proposal.title.toLowerCase().includes('mint')) {
          payloadImage = 'mint-approval-payload';
        }
      }
      
      payloadImage += `-${proposalId}`;
      
      await api.executeProposal(proposalId, payloadImage);
      
      // Update the proposal status
      setGovernanceData(prevData => ({
        ...prevData,
        pastProposals: prevData.pastProposals.map(p =>
          p.id === proposalId
            ? { ...p, executionStatus: 'Executing' }
            : p
        )
      }));
      
      // Show success message
      setShowSuccessModal(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to execute proposal:', errorMsg);
    } finally {
      setExecutingProposals(prev => prev.filter(id => id !== proposalId));
    }
  };

  // Render loading skeleton
  if (isLoading) {
    console.log('GovernancePage: Rendering loading skeleton');
    return (
      <div className="animate-pulse">
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">Governance</h1>
        <div className="mb-6 h-24 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
        <div className="mb-4 flex space-x-4">
          <div className="h-10 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
          <div className="h-10 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
          ))}
        </div>
      </div>
    );
  }

  console.log('GovernancePage: Rendering main content');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Governance</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          Create Proposal
        </button>
      </div>

      <div className="card p-6">
        <h2 className="mb-2 text-lg font-semibold">Your Voting Power</h2>
        <p className="text-3xl font-bold text-sky-500">{governanceData.votingPower.toLocaleString()} votes</p>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('active')}
          >
            Active Proposals
          </button>
          <button
            className={`btn ${activeTab === 'past' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('past')}
          >
            Past Proposals
          </button>
        </div>

        <div className="space-y-4">
          {(activeTab === 'active' ? governanceData.activeProposals : governanceData.pastProposals).map((proposal) => (
            <div key={proposal.id} className="card p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-xl font-bold">{proposal.title}</h3>
                  <p className="mb-4 text-slate-600 dark:text-slate-300">{proposal.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span>Proposer: {proposal.proposer}</span>
                    <span>Status: {proposal.status}</span>
                    <span>{formatTimeRemaining(proposal.endTime)}</span>
                  </div>
                </div>
                {activeTab === 'active' && !proposal.hasVoted && (
                  <button
                    onClick={() => {
                      setSelectedProposal(proposal);
                      setShowVoteModal(true);
                    }}
                    className="btn btn-outline"
                  >
                    Vote
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>For: {proposal.votesFor.toLocaleString()}</span>
                  <span>Against: {proposal.votesAgainst.toLocaleString()}</span>
                  <span>Abstain: {proposal.votesAbstain.toLocaleString()}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${(proposal.votesFor / proposal.totalVotes) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Votes: {proposal.totalVotes.toLocaleString()}</span>
                  <span>
                    Quorum: {((proposal.totalVotes / proposal.quorum) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Add execution options for passed proposals */}
              {proposal.status === 'Passed' && isNcnEnabled && (
                <div className="execution-options mt-4 pt-4 border-t border-slate-700">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Execute Proposal</h4>
                  <p className="text-xs text-slate-400 mb-2">
                    This proposal can be executed using the Cambrian NCN.
                  </p>
                  
                  <button
                    onClick={() => handleExecuteProposal(proposal.id)}
                    disabled={executingProposals.includes(proposal.id) || 
                            proposal.executionStatus === 'Executing' || 
                            proposal.executionStatus === 'Executed'}
                    className="btn btn-primary btn-sm w-full"
                  >
                    {executingProposals.includes(proposal.id)
                      ? 'Initiating...'
                      : proposal.executionStatus === 'Executing'
                      ? 'Executing...'
                      : proposal.executionStatus === 'Executed'
                      ? 'Executed'
                      : 'Execute via NCN'}
                  </button>
                  
                  {proposal.executionStatus === 'Executed' && proposal.executionResult && (
                    <div className="execution-result mt-2 text-xs bg-green-900/20 p-2 rounded">
                      <h5 className="font-medium text-green-400">Execution Result</h5>
                      <p className="text-slate-300">{proposal.executionResult}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
            <h2 className="mb-4 text-xl font-bold">Create New Proposal</h2>
            <form onSubmit={handleCreateProposal}>
              <div className="mb-4">
                <label className="mb-2 block font-medium">Title</label>
                <input
                  type="text"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-700"
                  placeholder="Enter proposal title"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="mb-2 block font-medium">Description</label>
                <textarea
                  value={proposalDescription}
                  onChange={(e) => setProposalDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-700"
                  placeholder="Enter proposal description"
                  rows={4}
                  required
                ></textarea>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vote Modal */}
      {showVoteModal && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
            <h2 className="mb-4 text-xl font-bold">Vote on Proposal</h2>
            <div className="mb-4">
              <h3 className="mb-2 font-medium">{selectedProposal.title}</h3>
              <p className="text-slate-600 dark:text-slate-300">
                {selectedProposal.description}
              </p>
            </div>
            <form onSubmit={handleVote}>
              <div className="mb-6 space-y-2">
                <label className="block font-medium">Your Vote</label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setVoteType('For')}
                    className={`btn ${
                      voteType === 'For' ? 'btn-primary' : 'btn-outline'
                    }`}
                  >
                    For
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoteType('Against')}
                    className={`btn ${
                      voteType === 'Against' ? 'btn-primary' : 'btn-outline'
                    }`}
                  >
                    Against
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoteType('Abstain')}
                    className={`btn ${
                      voteType === 'Abstain' ? 'btn-primary' : 'btn-outline'
                    }`}
                  >
                    Abstain
                  </button>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowVoteModal(false);
                    setSelectedProposal(null);
                    setVoteType(null);
                  }}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !voteType}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Vote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 text-center shadow-xl dark:bg-slate-800">
            <div className="mb-4 text-green-500">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold">Proposal Created!</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-300">
              Your proposal has been successfully created and is now live for voting.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="btn btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 