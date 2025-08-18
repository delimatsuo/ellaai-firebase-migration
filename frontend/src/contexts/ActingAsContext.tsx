import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface CustomerCompany {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  healthScore: number; // 0-100
  lastActivity?: Date;
  metrics?: {
    totalCandidates: number;
    activeAssessments: number;
    monthlyActivity: number;
    issueCount: number;
  };
  subscription?: {
    plan: string;
    status: 'active' | 'past_due' | 'canceled';
    nextBilling?: Date;
  };
}

export interface ActingAsSession {
  id: string;
  ellaRecruiterId: string;
  ellaRecruiterEmail: string;
  targetCompanyId: string;
  targetCompanyName: string;
  startedAt: Date;
  endedAt?: Date;
  reason: string;
  estimatedDuration?: number; // in minutes
  status: 'active' | 'ended';
  actions: SessionAction[];
}

export interface SessionAction {
  timestamp: Date;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  details?: any;
}

export interface ActingAsContextType {
  // Session state
  isActingAs: boolean;
  currentSession: ActingAsSession | null;
  sessionDuration: number; // in seconds
  
  // Portfolio management
  customerPortfolio: CustomerCompany[];
  recentCustomers: CustomerCompany[];
  
  // Session management
  startActingAsSession: (companyId: string, reason: string, estimatedDuration?: number) => Promise<void>;
  endActingAsSession: (summary?: string) => Promise<void>;
  switchCustomer: (companyId: string) => Promise<void>;
  
  // Portfolio data
  loadCustomerPortfolio: () => Promise<void>;
  refreshCustomerData: (companyId: string) => Promise<void>;
  
  // Session monitoring
  addSessionAction: (action: Omit<SessionAction, 'timestamp'>) => void;
  getSessionSummary: () => {
    totalActions: number;
    actionsByType: Record<string, number>;
    duration: string;
  };
  
  // Loading states
  loading: boolean;
  portfolioLoading: boolean;
}

const ActingAsContext = createContext<ActingAsContextType | undefined>(undefined);

export const useActingAs = () => {
  const context = useContext(ActingAsContext);
  if (context === undefined) {
    throw new Error('useActingAs must be used within an ActingAsProvider');
  }
  return context;
};

interface ActingAsProviderProps {
  children: ReactNode;
}

export const ActingAsProvider: React.FC<ActingAsProviderProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const [isActingAs, setIsActingAs] = useState(false);
  const [currentSession, setCurrentSession] = useState<ActingAsSession | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [customerPortfolio, setCustomerPortfolio] = useState<CustomerCompany[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<CustomerCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  // Session timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (currentSession && currentSession.status === 'active') {
      timer = setInterval(() => {
        const now = new Date();
        const startTime = new Date(currentSession.startedAt);
        setSessionDuration(Math.floor((now.getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentSession]);

  // Load portfolio on mount for Ella Recruiters
  useEffect(() => {
    if (userProfile?.role === 'admin' || userProfile?.role === 'system_admin') {
      loadCustomerPortfolio();
    }
  }, [userProfile]);

  const loadCustomerPortfolio = async (): Promise<void> => {
    setPortfolioLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockPortfolio: CustomerCompany[] = [
        {
          id: 'company-1',
          name: 'TechCorp Inc.',
          domain: 'techcorp.com',
          industry: 'Technology',
          size: 'medium',
          status: 'active',
          healthScore: 85,
          lastActivity: new Date('2024-01-15'),
          metrics: {
            totalCandidates: 245,
            activeAssessments: 12,
            monthlyActivity: 89,
            issueCount: 2,
          },
          subscription: {
            plan: 'Professional',
            status: 'active',
            nextBilling: new Date('2024-02-01'),
          },
        },
        {
          id: 'company-2',
          name: 'StartupXYZ',
          domain: 'startupxyz.io',
          industry: 'SaaS',
          size: 'startup',
          status: 'active',
          healthScore: 72,
          lastActivity: new Date('2024-01-14'),
          metrics: {
            totalCandidates: 45,
            activeAssessments: 3,
            monthlyActivity: 34,
            issueCount: 1,
          },
          subscription: {
            plan: 'Basic',
            status: 'active',
            nextBilling: new Date('2024-02-15'),
          },
        },
        {
          id: 'company-3',
          name: 'Enterprise Solutions Ltd',
          domain: 'enterprise-sol.com',
          industry: 'Consulting',
          size: 'large',
          status: 'active',
          healthScore: 94,
          lastActivity: new Date('2024-01-16'),
          metrics: {
            totalCandidates: 1250,
            activeAssessments: 45,
            monthlyActivity: 187,
            issueCount: 0,
          },
          subscription: {
            plan: 'Enterprise',
            status: 'active',
            nextBilling: new Date('2024-03-01'),
          },
        },
      ];

      setCustomerPortfolio(mockPortfolio);
      setRecentCustomers(mockPortfolio.slice(0, 3));
    } catch (error) {
      console.error('Failed to load customer portfolio:', error);
      toast.error('Failed to load customer portfolio');
    } finally {
      setPortfolioLoading(false);
    }
  };

  const startActingAsSession = async (
    companyId: string,
    reason: string,
    estimatedDuration?: number
  ): Promise<void> => {
    setLoading(true);
    try {
      const company = customerPortfolio.find(c => c.id === companyId);
      if (!company) {
        throw new Error('Company not found in portfolio');
      }

      const newSession: ActingAsSession = {
        id: `session-${Date.now()}`,
        ellaRecruiterId: userProfile?.uid || '',
        ellaRecruiterEmail: userProfile?.email || '',
        targetCompanyId: companyId,
        targetCompanyName: company.name,
        startedAt: new Date(),
        reason,
        estimatedDuration,
        status: 'active',
        actions: [],
      };

      // TODO: API call to start session
      // await actingAsService.startSession(newSession);

      setCurrentSession(newSession);
      setIsActingAs(true);
      setSessionDuration(0);

      toast.success(`Started acting as ${company.name}`);
    } catch (error) {
      console.error('Failed to start acting as session:', error);
      toast.error('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const endActingAsSession = async (summary?: string): Promise<void> => {
    if (!currentSession) return;

    setLoading(true);
    try {
      const endedSession = {
        ...currentSession,
        endedAt: new Date(),
        status: 'ended' as const,
      };

      // TODO: API call to end session
      // await actingAsService.endSession(endedSession.id, summary);

      setCurrentSession(null);
      setIsActingAs(false);
      setSessionDuration(0);

      toast.success('Ended acting as session');
    } catch (error) {
      console.error('Failed to end acting as session:', error);
      toast.error('Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  const switchCustomer = async (companyId: string): Promise<void> => {
    if (currentSession?.targetCompanyId === companyId) return;

    setLoading(true);
    try {
      // End current session if exists
      if (currentSession) {
        await endActingAsSession('Switched to another customer');
      }

      // Start new session with default reason
      await startActingAsSession(companyId, 'Customer support - switched from dashboard');
    } catch (error) {
      console.error('Failed to switch customer:', error);
      toast.error('Failed to switch customer');
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomerData = async (companyId: string): Promise<void> => {
    try {
      // TODO: API call to refresh specific customer data
      // const updatedCompany = await customerService.getCompany(companyId);
      
      setCustomerPortfolio(prev => 
        prev.map(company => 
          company.id === companyId 
            ? { ...company, lastActivity: new Date() } // Mock update
            : company
        )
      );
    } catch (error) {
      console.error('Failed to refresh customer data:', error);
      toast.error('Failed to refresh customer data');
    }
  };

  const addSessionAction = (action: Omit<SessionAction, 'timestamp'>): void => {
    if (!currentSession) return;

    const newAction: SessionAction = {
      ...action,
      timestamp: new Date(),
    };

    setCurrentSession(prev => prev ? {
      ...prev,
      actions: [...prev.actions, newAction],
    } : null);
  };

  const getSessionSummary = () => {
    if (!currentSession) {
      return {
        totalActions: 0,
        actionsByType: {},
        duration: '0:00',
      };
    }

    const totalActions = currentSession.actions.length;
    const actionsByType = currentSession.actions.reduce((acc, action) => {
      acc[action.action] = (acc[action.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hours = Math.floor(sessionDuration / 3600);
    const minutes = Math.floor((sessionDuration % 3600) / 60);
    const duration = hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}:${(sessionDuration % 60).toString().padStart(2, '0')}`;

    return {
      totalActions,
      actionsByType,
      duration,
    };
  };

  const value: ActingAsContextType = {
    // Session state
    isActingAs,
    currentSession,
    sessionDuration,
    
    // Portfolio management
    customerPortfolio,
    recentCustomers,
    
    // Session management
    startActingAsSession,
    endActingAsSession,
    switchCustomer,
    
    // Portfolio data
    loadCustomerPortfolio,
    refreshCustomerData,
    
    // Session monitoring
    addSessionAction,
    getSessionSummary,
    
    // Loading states
    loading,
    portfolioLoading,
  };

  return (
    <ActingAsContext.Provider value={value}>
      {children}
    </ActingAsContext.Provider>
  );
};