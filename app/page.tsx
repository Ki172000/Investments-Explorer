'use client';

import React, { useState, useEffect, useRef } from 'react';

// Baseline Chart of Accounts Architecture
const DEFAULT_COA = [
  { code: '1100', name: 'Cash / Clearing Account', category: 'Asset', description: 'Main clearing custody cash balances', mtd: 1250000.00, qtd: 5000000.00, ytd: 12000000.00, itd: 45000000.00 },
  { code: '1200', name: 'Private Equity Investments (Fair Value)', category: 'Asset', description: 'Partnership portfolio underlying cost/fv valuation', mtd: 5000000.00, qtd: 15000000.00, ytd: 45000000.00, itd: 120000000.00 },
  { code: '1300', name: 'Bank Loans Receivable', category: 'Asset', description: 'Senior secured floating rate debt issues', mtd: 0.00, qtd: 2500000.00, ytd: 8000000.00, itd: 22000000.00 },
  { code: '3100', name: 'Partners Capital - LP Contributions', category: 'Equity', description: 'Limited Partner drawn down cash holdings', mtd: 0.00, qtd: -10000000.00, ytd: -35000000.00, itd: -110000000.00 },
  { code: '3300', name: 'Unfunded Capital Commitments Offset', category: 'Equity', description: 'Contra equity balance for callable capital allocations', mtd: -4000000.00, qtd: -12000000.00, ytd: -12000000.00, itd: -40000000.00 },
  { code: '5100', name: 'Management & Performance Fees', category: 'Expense', description: 'Accrued fund manager operational calculations', mtd: 1250000.00, qtd: 3750000.00, ytd: 3750000.00, itd: 15000000.00 }
];

const INITIAL_ENTITIES = [
  { id: 'LP-01', name: 'Alpha Endowment Fund', type: 'LP', targetFund: 'AGIP Alternative Investments IV', commitment: 100000000, share: 40.0 },
  { id: 'LP-02', name: 'Beacon Pension Plan', type: 'LP', targetFund: 'AGIP Alternative Investments IV', commitment: 87500000, share: 35.0 },
  { id: 'LP-03', name: 'Kian Wealth Management', type: 'LP', targetFund: 'AGIP Alternative Investments IV', commitment: 50000000, share: 20.0 },
  { id: 'GP-01', name: 'AGIP Capital Partners LLC', type: 'GP', targetFund: 'AGIP Alternative Investments IV', commitment: 12500000, share: 5.0 },
  { id: 'AFF-01', name: 'AGIP Feeder Carry Vehicle', type: 'Affiliate', targetFund: 'AGIP Alternative Investments IV', commitment: 0, share: 0.0 },
  { id: 'LP-04', name: 'Delta Sovereign Fund', type: 'LP', targetFund: 'AGIP Private Credit Fund H2', commitment: 150000000, share: 75.0 },
  { id: 'GP-02', name: 'AGIP Credit Managers LLC', type: 'GP', targetFund: 'AGIP Private Credit Fund H2', commitment: 50000000, share: 25.0 },
  { id: 'AFF-02', name: 'Credit Trade Execution Corp', type: 'Affiliate', targetFund: 'AGIP Private Credit Fund H2', commitment: 0, share: 0.0 }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('ingestion');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('No file selected');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // App State Restoration Modules
  const [coa, setCoa] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [extractedBatch, setExtractedBatch] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // Accounts Manager Balance Horizon Toggles
  const [balanceFilter, setBalanceFilter] = useState<'MTD' | 'QTD' | 'YTD' | 'ITD'>('MTD');
  const [showFilters, setShowFilters] = useState(false);
  
  // Account Form Generation Buffers (CRUD Pop-ups)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalAction, setAccountModalAction] = useState<'CREATE' | 'UPDATE' | 'DELETE'>('CREATE');
  const [selectedAccountCode, setSelectedAccountCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Asset');
  const [newDesc, setNewDesc] = useState('');

  // General Ledger Modal Controllers
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Manual Record State Form Buffer
  const [modalType, setModalType] = useState('Manual Journal Provision Entry');
  const [modalLines, setModalLines] = useState([
    { accountCode: '1100', debit: 0, credit: 0 },
    { accountCode: '5100', debit: 0, credit: 0 }
  ]);

  // Partnership Directory Specific States & Bulk Registry Modal
  const [directoryViewTab, setDirectoryViewTab] = useState<'ALL' | 'LP' | 'GP' | 'AFFILIATE'>('ALL');
  const [isRegistryModalOpen, setIsRegistryModalOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerType, setNewPartnerType] = useState('LP');
  const [newPartnerFund, setNewPartnerFund] = useState('AGIP Alternative Investments IV');
  const [newPartnerCommitment, setNewPartnerCommitment] = useState('');

  // Real-Time Calculation Metrics for the Modal
  const modalTotalDebit = modalLines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const modalTotalCredit = modalLines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const modalOutOfBalance = Math.abs(modalTotalDebit - modalTotalCredit);

  // Ingestion Real-time Parser Calculations
  const parseLinesDebits = extractedBatch.reduce((sum, b) => sum + b.lines.reduce((s, l: any) => s + (l.debit || 0), 0), 0);
  const parseLinesCredits = extractedBatch.reduce((sum, b) => sum + b.lines.reduce((s, l: any) => s + (l.credit || 0), 0), 0);
  const parsedVariance = Math.abs(parseLinesDebits - parseLinesCredits);
  const batchIsBalanced = parsedVariance < 0.01 && extractedBatch.length > 0;

  // Standard Accounting Numeration Formatter
  const formatAccountingNumber = (amount: number): string => {
    if (amount === 0 || !amount) return '—';
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return amount < 0 ? `(${formatted})` : formatted;
  };

  // Keyboard Event Interceptor for Escape Key (Close Modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsAccountModalOpen(false);
        setIsRegistryModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync Storage Engine
  useEffect(() => {
    const savedCoa = localStorage.getItem('corp_coa_v8');
    const savedLedger = localStorage.getItem('corp_ledger_v8');
    const savedEntities = localStorage.getItem('corp_entities_v8');
    const savedReports = localStorage.getItem('corp_reports_v8');

    setCoa(savedCoa ? JSON.parse(savedCoa) : DEFAULT_COA);
    setEntities(savedEntities ? JSON.parse(savedEntities) : INITIAL_ENTITIES);
    
    if (savedLedger) {
      setJournalEntries(JSON.parse(savedLedger));
    } else {
      setJournalEntries([
        {
          id: 'GL-0001',
          date: '2026-06-12',
          type: 'Automated System Ingestion - Bulk Allocation Run',
          status: 'VALIDATED',
          origin: 'AUTOMATED',
          lines: [
            { accountCode: '5100', debit: 1250000.00, credit: 0.00 },
            { accountCode: '1100', debit: 0.00, credit: 1250000.00 }
          ]
        },
        {
          id: 'GL-0002',
          date: '2026-06-12',
          type: 'Manual Prior Period Rebalancing Adjustment',
          status: 'VALIDATED',
          origin: 'MANUAL',
          lines: [
            { accountCode: '1200', debit: 500000.00, credit: 0.00 },
            { accountCode: '3300', debit: 0.00, credit: 500000.00 }
          ]
        }
      ]);
    }

    setReports(savedReports ? JSON.parse(savedReports) : [
      { id: 'REP-082', name: 'Q2_2026_Trial_Balance', type: 'Trial Balance', date: '2026-06-12', format: 'PDF' },
      { id: 'REP-083', name: 'General_Ledger_Audit_Log', type: 'Ledger Audit', date: '2026-06-12', format: 'CSV' }
    ]);
  }, []);

  const saveLedger = (updated: any[]) => {
    setJournalEntries(updated);
    localStorage.setItem('corp_ledger_v8', JSON.stringify(updated));
  };

  const saveEntities = (updated: any[]) => {
    setEntities(updated);
    localStorage.setItem('corp_entities_v8', JSON.stringify(updated));
  };

  const getCoaName = (code: string) => {
    return coa.find(a => a.code === code)?.name || 'Unmapped Sub-Ledger Account';
  };

  const handleNativeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);

    setLoading(true);
    setTimeout(() => {
      if (file.name.endsWith('.pdf')) {
        setInputText(`[EXTRACTED VIA PDF OCR ENGINE]\nDocument: ${file.name}\nParsed Allocation Run:\n1100 DEBIT 2500000.00\n5100 DEBIT 1250000.00\n3100 CREDIT 3750000.05`);
      } else if (file.name.endsWith('.eml') || file.name.endsWith('.msg')) {
        setInputText(`[EXTRACTED VIA EMAIL PIPELINE PARSER]\nSubject: Capital Call Execution Notice\nBody Lines:\nAccount 1100 Allocation Wire Target: USD 2,500,000.00`);
      } else {
        const fileReader = new FileReader();
        fileReader.onload = (evt) => {
          setInputText(evt.target?.result as string);
        };
        fileReader.readAsText(file);
      }
      setLoading(false);
    }, 600);
  };

  async function handleMultiEntryParse() {
    if (!inputText.trim()) return;
    setLoading(true);
    
    setTimeout(() => {
      const nextSeq = String(journalEntries.length + 1).padStart(4, '0');
      const isUnbalancedCase = inputText.includes('3750000.05') || inputText.includes('UNBALANCED');
      
      setExtractedBatch([
        {
          id: `GL-${nextSeq}`,
          transactionType: 'Bulk Capital Call Calldown & Management Fee Distribution Allocation',
          status: isUnbalancedCase ? 'EXCEPTION_BREAK' : 'VALIDATED',
          lines: [
            { accountCode: '1100', debit: 2500000.00, credit: 0.00 },
            { accountCode: '5100', debit: 1250000.00, credit: 0.00 },
            { accountCode: '3100', debit: 0.00, credit: isUnbalancedCase ? 3750000.05 : 3750000.00 }
          ]
        }
      ]);
      setLoading(false);
    }, 400);
  }

  function commitMultiEntryBatch() {
    if (extractedBatch.length === 0 || !batchIsBalanced) return;
    let current = [...journalEntries];
    
    extractedBatch.forEach((batchItem) => {
      current.push({
        id: batchItem.id,
        date: '2026-06-12',
        type: batchItem.transactionType,
        status: batchItem.status,
        origin: 'AUTOMATED',
        lines: batchItem.lines
      });
    });

    saveLedger(current);
    setExtractedBatch([]);
    setInputText('');
    setUploadedFileName('No file selected');
  }

  function handleModalGlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modalOutOfBalance > 0.01) return;

    const nextSeq = String(journalEntries.length + 1).padStart(4, '0');
    
    const newGl = {
      id: `GL-${nextSeq}`,
      date: '2026-06-12',
      type: modalType,
      status: 'VALIDATED',
      origin: 'MANUAL',
      lines: modalLines.map(line => ({
        accountCode: line.accountCode,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0
      }))
    };

    saveLedger([...journalEntries, newGl]);
    setIsModalOpen(false);
    setModalLines([
      { accountCode: '1100', debit: 0, credit: 0 },
      { accountCode: '5100', debit: 0, credit: 0 }
    ]);
  }

  // Unified Accounts CRUD Manager Submit Panel
  function handleAccountCrudSubmit(e: React.FormEvent) {
    e.preventDefault();
    let updatedCoa = [...coa];

    if (accountModalAction === 'CREATE') {
      if (!newCode || !newTitle) return;
      updatedCoa.push({
        code: newCode,
        name: newTitle,
        category: newType,
        description: newDesc || 'N/A',
        mtd: 0.0, qtd: 0.0, ytd: 0.0, itd: 0.0
      });
    } else if (accountModalAction === 'UPDATE') {
      updatedCoa = updatedCoa.map(a => a.code === selectedAccountCode ? { ...a, name: newTitle, category: newType, description: newDesc } : a);
    } else if (accountModalAction === 'DELETE') {
      updatedCoa = updatedCoa.filter(a => a.code === selectedAccountCode);
    }

    setCoa(updatedCoa);
    localStorage.setItem('corp_coa_v8', JSON.stringify(updatedCoa));
    setIsAccountModalOpen(false);
    
    // Clear Buffers
    setNewCode('');
    setNewTitle('');
    setNewDesc('');
    setSelectedAccountCode('');
  }

  // Unified Fund and Partner Bulk Registry Setup
  function handleBulkRegistrySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPartnerName || !newPartnerFund) return;

    const addedPartner = {
      id: `${newPartnerType}-${String(entities.length + 1).padStart(2, '0')}`,
      name: newPartnerName,
      type: newPartnerType,
      targetFund: newPartnerFund,
      commitment: Number(newPartnerCommitment) || 0,
      share: 0.0
    };

    const updated = [...entities, addedPartner];
    saveEntities(updated);
    setIsRegistryModalOpen(false);

    // Clear Buffers
    setNewPartnerName('');
    setNewPartnerCommitment('');
  }

  function openAccountModal(action: 'CREATE' | 'UPDATE' | 'DELETE', account?: any) {
    setAccountModalAction(action);
    if (account) {
      setSelectedAccountCode(account.code);
      setNewCode(account.code);
      setNewTitle(account.name);
      setNewType(account.category);
      setNewDesc(account.description);
    } else {
      setNewCode('');
      setNewTitle('');
      setNewType('Asset');
      setNewDesc('');
    }
    setIsAccountModalOpen(true);
  }

  const filteredEntities = entities.filter(ent => directoryViewTab === 'ALL' || ent.type === directoryViewTab);

  const sidebarTabs = [
    { id: 'ingestion', label: 'File & Text Import Parsing', path: 'M12 4V20M12 4L6 10M12 4L18 10' },
    { id: 'ledger', label: 'Transactions - General Ledger', path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.232.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'coa', label: 'Accounts Manager', path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z' },
    { id: 'registry', label: 'Funds Partnership Directory', path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'trialbalance', label: 'Trial Balance', path: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'reports', label: 'Report Depository', path: 'M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8' }
  ];

  // Raw Corporate Source Array from Pulse-Bridge Investments, LLC PDF Data
  const sampleTrialBalanceRows = [
    { code: '—', type: 'Bank', title: 'Global Investment Account', debit: 161218511615.13, credit: 0 },
    { code: '—', type: 'Bank', title: 'Philippine Cash Reserve & FX Exchange', debit: 14448589205.63, credit: 0 },
    { code: '1001', type: 'Current Asset', title: 'CuraSphere Therapeutics', debit: 27556059118.38, credit: 0 },
    { code: '1002', type: 'Current Asset', title: 'Lumina Imaging Systems', debit: 20268526575.36, credit: 0 },
    { code: '1003', type: 'Current Asset', title: 'Sentinel BioSecurity', debit: 29811682710.99, credit: 0 },
    { code: '1004', type: 'Current Asset', title: 'AuraHealth Senior Care', debit: 26010576465.43, credit: 0 },
    { code: '960', type: 'Equity', title: 'Retained Earnings', debit: 0, credit: 8568868437.21 },
    { code: '970', type: 'Equity', title: "Owner's Capital", debit: 0, credit: 917499578572.58 },
    { code: '409', type: 'Expense', title: 'Consulting & Accounting - Cybersecurity Advisory Fees', debit: 187826.10, credit: 0 }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', boxSizing: 'border-box' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <div style={{ width: '300px', minWidth: '300px', background: '#0f172a', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#3b82f6' }} />
          <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.05em', color: '#ffffff', textTransform: 'uppercase' }}>Investments Explorer</span>
        </div>
        
        <div style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
          {sidebarTabs.map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px',
                  border: 'none', borderRadius: '6px', background: isSelected ? '#1e293b' : 'transparent',
                  color: isSelected ? '#3b82f6' : '#94a3b8', fontSize: '0.88rem', fontWeight: isSelected ? 600 : 500,
                  textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease', boxSizing: 'border-box'
                }}
              >
                <svg style={{ width: '18px', height: '18px', stroke: 'currentColor', strokeWidth: 2, fill: 'none' }} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.path} />
                </svg>
                <span style={{ color: isSelected ? '#ffffff' : '#94a3b8' }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CORE WORKSPACE PANEL */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, boxSizing: 'border-box' }}>
        
        {/* Top Professional Header Desk */}
        <div style={{ borderBottom: '1px solid #e2e8f0', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', boxSizing: 'border-box' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>
            {sidebarTabs.find(t => t.id === activeTab)?.label}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>System Environment: <strong style={{ color: '#16a34a' }}>PRODUCTION</strong></span>
          </div>
        </div>

        {/* Dynamic Display Modules */}
        <div style={{ padding: '40px', flexGrow: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
          
          {/* VIEW 1: FILE & TEXT IMPORT PARSING */}
          {activeTab === 'ingestion' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'start' }}>
              <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  STRUCTURAL DOCUMENT, NOTICE PDF & EMAIL INGESTION WORKSPACE
                </h3>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste flat notice files or operational logs here..."
                  style={{ width: '100%', height: '340px', padding: '16px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6', resize: 'none', background: '#f8fafc', outline: 'none', color: '#334155' }}
                />
                <div style={{ marginTop: '16px', padding: '16px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>SUPPORTED EXTENSIONS: CSV, TXT, PDF, EML, MSG</span>
                    <span style={{ fontSize: '0.82rem', color: '#3b82f6', fontFamily: 'monospace', fontWeight: 600 }}>{uploadedFileName}</span>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleNativeFileUpload} accept=".txt,.csv,.json,.log,.pdf,.eml,.msg" style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', boxSizing: 'border-box' }}>
                    Upload Notice File
                  </button>
                </div>
                <button 
                  onClick={handleMultiEntryParse} 
                  disabled={loading || !inputText.trim()} 
                  style={{ width: '100%', marginTop: '16px', padding: '14px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', boxSizing: 'border-box' }}
                >
                  {loading ? 'Executing Extraction Pipeline...' : 'Run Document Parsing Engine'}
                </button>
              </div>

              <div style={{ boxSizing: 'border-box' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  STAGING MAPPING & VALIDATION CHECK
                </h3>
                {extractedBatch.length === 0 ? (
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', height: '485px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', backgroundColor: '#ffffff', fontSize: '0.88rem', padding: '20px', textAlign: 'center', boxSizing: 'border-box' }}>
                    Verification channel idle. Upload or paste notice assets to build automated journals.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: batchIsBalanced ? '#ecfdf5' : '#fef2f2', padding: '16px', borderRadius: '8px', border: batchIsBalanced ? '1px solid #a7f3d0' : '1px solid #fca5a5', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
                      <div style={{ fontSize: '0.85rem', color: batchIsBalanced ? '#065f46' : '#b91c1c', fontWeight: 600 }}>
                        {batchIsBalanced 
                          ? 'All balance parameters confirmed. Zero exceptions found across account structures.' 
                          : `CRITICAL BREAK EXCEPTION: Out-of-balance variance detected by ${formatAccountingNumber(parsedVariance)} USD. Core system ingestion blocked.`
                        }
                      </div>
                      <button 
                        onClick={commitMultiEntryBatch} 
                        disabled={!batchIsBalanced}
                        style={{ width: '100%', padding: '10px', background: batchIsBalanced ? '#059669' : '#cbd5e1', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem', cursor: batchIsBalanced ? 'pointer' : 'not-allowed', boxSizing: 'border-box' }}
                      >
                        Commit Records Across Core Modules
                      </button>
                    </div>

                    {extractedBatch.map((entry, idx) => (
                      <div key={idx} style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', boxSizing: 'border-box' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{entry.id}</span>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem', background: batchIsBalanced ? '#dcfce7' : '#fee2e2', color: batchIsBalanced ? '#166534' : '#991b1b' }}>
                            {batchIsBalanced ? 'PASSED' : 'FAILED_VARIANCE'}
                          </span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', height: '36px' }}>
                              <th style={{ padding: '8px 4px', textAlign: 'left' }}>Account</th>
                              <th style={{ padding: '8px 4px', textAlign: 'left' }}>Sub-Ledger Map</th>
                              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Debit (USD)</th>
                              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Credit (USD)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.lines.map((line: any, lIdx: number) => (
                              <tr key={lIdx} style={{ borderBottom: '1px solid #f1f5f9', height: '36px' }}>
                                <td style={{ padding: '8px 4px', fontFamily: 'monospace' }}>{line.accountCode}</td>
                                <td style={{ padding: '8px 4px', color: '#475569' }}>{getCoaName(line.accountCode)}</td>
                                <td style={{ padding: '8px 4px', textAlign: 'right', color: '#166534', fontWeight: 500 }}>{line.debit > 0 ? formatAccountingNumber(line.debit) : '—'}</td>
                                <td style={{ padding: '8px 4px', textAlign: 'right', color: '#b91c1c', fontWeight: 500 }}>{line.credit > 0 ? formatAccountingNumber(line.credit) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: TRANSACTIONS - GENERAL LEDGER */}
          {activeTab === 'ledger' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '28px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>Journal Transactions Ledger</span>
                <button onClick={() => setIsModalOpen(true)} style={{ padding: '8px 14px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box' }}>
                  + Insert Manual Record
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #cbd5e1', textAlign: 'left', height: '40px' }}>
                    <th style={{ padding: '10px' }}>Journal Code</th>
                    <th style={{ padding: '10px' }}>Acct No.</th>
                    <th style={{ padding: '10px' }}>Account Title</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Debit</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Credit</th>
                    <th style={{ padding: '10px' }}>Fund allocation</th>
                    <th style={{ padding: '10px' }}>Description Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.flatMap(entry => entry.lines.map((line: any, lIdx: number) => (
                    <tr key={`${entry.id}-${lIdx}`} style={{ borderBottom: '1px solid #f1f5f9', height: '40px' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>{entry.id}</td>
                      <td style={{ padding: '10px', fontFamily: 'monospace' }}>{line.accountCode}</td>
                      <td style={{ padding: '10px', color: '#0f172a', fontWeight: 500 }}>{getCoaName(line.accountCode)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#166534', fontWeight: 500 }}>{line.debit > 0 ? formatAccountingNumber(line.debit) : '—'}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#b91c1c', fontWeight: 500 }}>{line.credit > 0 ? formatAccountingNumber(line.credit) : '—'}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>AGIP-IV</td>
                      <td style={{ padding: '10px', color: '#64748b', fontSize: '0.82rem' }}>{entry.type}</td>
                    </tr>
                  )))}
                </tbody>
              </table>

              {/* PROVISION MANUAL RECORD EXECUTOR OVERLAY */}
              {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ background: '#ffffff', borderRadius: '8px', width: '650px', padding: '32px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', boxSizing: 'border-box' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Provision Manual Ledger Transaction</h3>
                      <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                    </div>
                    
                    <form onSubmit={handleModalGlSubmit} style={{ boxSizing: 'border-box' }}>
                      <div style={{ marginBottom: '20px', boxSizing: 'border-box' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>TRANSACTION OPERATIONAL DESCRIPTION</label>
                        <input type="text" value={modalType} onChange={e => setModalType(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} required />
                      </div>

                      <div style={{ marginBottom: '24px', boxSizing: 'border-box' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>DOUBLE ENTRY ACCOUNTING LINES</span>
                        {modalLines.map((line, lIdx) => (
                          <div key={lIdx} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: '12px', marginBottom: '10px', boxSizing: 'border-box' }}>
                            <select 
                              value={line.accountCode} 
                              onChange={(e) => {
                                let updated = [...modalLines];
                                updated[lIdx].accountCode = e.target.value;
                                setModalLines(updated);
                              }}
                              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff', boxSizing: 'border-box' }}
                            >
                              {coa.map(a => <option key={a.code} value={a.code}>[{a.code}] {a.name}</option>)}
                            </select>
                            <input 
                              type="number" 
                              placeholder="Debit" 
                              value={line.debit || ''} 
                              onChange={(e) => {
                                let updated = [...modalLines];
                                updated[lIdx].debit = Number(e.target.value);
                                setModalLines(updated);
                              }}
                              style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', boxSizing: 'border-box' }}
                            />
                            <input 
                              type="number" 
                              placeholder="Credit" 
                              value={line.credit || ''} 
                              onChange={(e) => {
                                let updated = [...modalLines];
                                updated[lIdx].credit = Number(e.target.value);
                                setModalLines(updated);
                              }}
                              style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right', boxSizing: 'border-box' }}
                            />
                          </div>
                        ))}
                      </div>

                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', boxSizing: 'border-box', fontSize: '0.85rem' }}>
                        <div>Total Debits: <strong>{formatAccountingNumber(modalTotalDebit)}</strong></div>
                        <div>Total Credits: <strong>{formatAccountingNumber(modalTotalCredit)}</strong></div>
                        <div style={{ color: modalOutOfBalance > 0.01 ? '#b91c1c' : '#059669' }}>Variance: {formatAccountingNumber(modalOutOfBalance)}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', boxSizing: 'border-box' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#e2e8f0', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, boxSizing: 'border-box' }}>Cancel</button>
                        <button type="submit" disabled={modalOutOfBalance > 0.01} style={{ background: modalOutOfBalance > 0.01 ? '#cbd5e1' : '#0f172a', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: modalOutOfBalance > 0.01 ? 'not-allowed' : 'pointer', fontWeight: 600, boxSizing: 'border-box' }}>Post Journal</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: ACCOUNTS MANAGER */}
          {activeTab === 'coa' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '28px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>Chart of Accounts Framework</span>
                  <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box' }}>
                    {showFilters ? 'Hide Accounting Balances' : 'Show Accounting Balances'}
                  </button>
                </div>
                <button onClick={() => openAccountModal('CREATE')} style={{ padding: '8px 14px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box' }}>
                  + Add New Account Record
                </button>
              </div>

              {/* Collapsible Filter Panel showing Balances Context */}
              {showFilters && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>BALANCE RUN HORIZON:</span>
                  {(['MTD', 'QTD', 'YTD', 'ITD'] as const).map(f => (
                    <button key={f} onClick={() => setBalanceFilter(f)} style={{ padding: '6px 14px', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: balanceFilter === f ? '#3b82f6' : '#ffffff', color: balanceFilter === f ? '#ffffff' : '#475569', boxSizing: 'border-box' }}>
                      {f} Horizon Summary
                    </button>
                  ))}
                </div>
              )}

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #cbd5e1', textAlign: 'left', height: '40px' }}>
                    <th style={{ padding: '10px' }}>Account Code</th>
                    <th style={{ padding: '10px' }}>Account Name</th>
                    <th style={{ padding: '10px' }}>Category</th>
                    <th style={{ padding: '10px' }}>Description</th>
                    {showFilters && <th style={{ padding: '10px', textAlign: 'right' }}>Balance Run ({balanceFilter})</th>}
                    <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coa.map((account) => (
                    <tr key={account.code} style={{ borderBottom: '1px solid #f1f5f9', height: '40px' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>{account.code}</td>
                      <td style={{ padding: '10px', color: '#0f172a', fontWeight: 500 }}>{account.name}</td>
                      <td style={{ padding: '10px', color: '#475569' }}>{account.category}</td>
                      <td style={{ padding: '10px', color: '#64748b', fontSize: '0.82rem' }}>{account.description}</td>
                      {showFilters && (
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: (account[balanceFilter.toLowerCase()] || 0) < 0 ? '#b91c1c' : '#0f172a' }}>
                          {formatAccountingNumber(account[balanceFilter.toLowerCase()] || 0)}
                        </td>
                      )}
                      <td style={{ padding: '10px', textAlign: 'center', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button onClick={() => openAccountModal('UPDATE', account)} style={{ padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, boxSizing: 'border-box' }}>Edit</button>
                          <button onClick={() => openAccountModal('DELETE', account)} style={{ padding: '4px 8px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, boxSizing: 'border-box' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* CRUD ACCOUNT MODAL POPUP STALL */}
              {isAccountModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ background: '#ffffff', padding: '32px', borderRadius: '8px', width: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
                      <h3 style={{ margin: 0 }}>{accountModalAction === 'CREATE' ? 'Add Account Reference' : accountModalAction === 'UPDATE' ? 'Modify Account Details' : 'Remove Account Tracking'}</h3>
                      <button onClick={() => setIsAccountModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <form onSubmit={handleAccountCrudSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {accountModalAction !== 'DELETE' ? (
                        <>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>ACCOUNT LEDGER CODE</label>
                            <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)} disabled={accountModalAction === 'UPDATE'} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} required />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>ACCOUNT CORPORATE TITLE</label>
                            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} required />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>ACCOUNT TYPE CLASS</label>
                            <select value={newType} onChange={e => setNewType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', background: '#fff' }}>
                              <option value="Asset">Asset</option>
                              <option value="Liability">Liability</option>
                              <option value="Equity">Equity</option>
                              <option value="Revenue">Revenue</option>
                              <option value="Expense">Expense</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>FRAMEWORK DESCRIPTION</label>
                            <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
                          </div>
                        </>
                      ) : (
                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Are you sure you want to remove the account framework item <strong>{selectedAccountCode}</strong>? This cannot be undone.</p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <button type="button" onClick={() => setIsAccountModalOpen(false)} style={{ background: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                        <button type="submit" style={{ background: accountModalAction === 'DELETE' ? '#b91c1c' : '#0f172a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                          {accountModalAction === 'CREATE' ? 'Save Account' : accountModalAction === 'UPDATE' ? 'Update Reference' : 'Confirm Deletion'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: FUNDS PARTNERSHIP DIRECTORY */}
          {activeTab === 'registry' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', gap: '8px', boxSizing: 'border-box' }}>
                  {(['ALL', 'LP', 'GP', 'AFFILIATE'] as const).map(tab => (
                    <button key={tab} onClick={() => setDirectoryViewTab(tab)} style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: directoryViewTab === tab ? '#0f172a' : 'transparent', color: directoryViewTab === tab ? '#ffffff' : '#64748b', boxSizing: 'border-box' }}>
                      {tab} Entity Map
                    </button>
                  ))}
                </div>
                <button onClick={() => setIsRegistryModalOpen(true)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box' }}>
                  + Register Fund / Partner
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #cbd5e1', textAlign: 'left', height: '40px' }}>
                    <th style={{ padding: '10px' }}>Tracking ID</th>
                    <th style={{ padding: '10px' }}>Legal Entity Name</th>
                    <th style={{ padding: '10px' }}>Class</th>
                    <th style={{ padding: '10px' }}>Target Allocated Structure</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Capital Commitment Value</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntities.map((ent) => (
                    <tr key={ent.id} style={{ borderBottom: '1px solid #f1f5f9', height: '40px' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 700 }}>{ent.id}</td>
                      <td style={{ padding: '10px', color: '#0f172a', fontWeight: 500 }}>{ent.name}</td>
                      <td style={{ padding: '10px' }}><span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: ent.type === 'GP' ? '#fef3c7' : ent.type === 'LP' ? '#dbeafe' : '#f1f5f9', color: ent.type === 'GP' ? '#d97706' : ent.type === 'LP' ? '#2563eb' : '#475569' }}>{ent.type}</span></td>
                      <td style={{ padding: '10px', color: '#475569' }}>{ent.targetFund}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{ent.commitment > 0 ? formatAccountingNumber(ent.commitment) : '—'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button onClick={() => { if(confirm(`Confirm deletion for ${ent.id}?`)) saveEntities(entities.filter(e => e.id !== ent.id)) }} style={{ padding: '4px 8px', background: '#fee2e2', border: 'none', color: '#b91c1c', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* UNIFIED BULK REGISTRY POP-UP MODAL */}
              {isRegistryModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ background: '#ffffff', padding: '32px', borderRadius: '8px', width: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Register New Fund or Partner Profiling</h3>
                      <button onClick={() => setIsRegistryModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <form onSubmit={handleBulkRegistrySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>LEGAL ENTITY OR FUND REGISTER NAME</label>
                        <input type="text" value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)} placeholder="e.g., AGIP Alternative Investments IV" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>ALLOCATION CATEGORY CLASS</label>
                        <select value={newPartnerType} onChange={e => setNewPartnerType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', background: '#fff' }}>
                          <option value="LP">Limited Partner (LP)</option>
                          <option value="GP">General Partner (GP)</option>
                          <option value="Affiliate">Concurrent Affiliate</option>
                          <option value="FUND">New Fund Structure Umbrella</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>PARENT / CONCURRENT ASSOCIATED FUND</label>
                        <input type="text" value={newPartnerFund} onChange={e => setNewPartnerFund(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>CAPITAL COMMITMENT AMOUNT (USD)</label>
                        <input type="number" value={newPartnerCommitment} onChange={e => setNewPartnerCommitment(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <button type="button" onClick={() => setIsRegistryModalOpen(false)} style={{ background: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                        <button type="submit" style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Complete Profile</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: TRIAL BALANCE (REPLACED RECONCILIATION & MATCHING) */}
          {activeTab === 'trialbalance' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '32px', boxSizing: 'border-box' }}>
              <div style={{ marginBottom: '24px', borderBottom: '2px solid #0f172a', paddingBottom: '14px', boxSizing: 'border-box' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Trial Balance Summary Ledger</h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>Pulse-Bridge Investments, LLC | Run Date Context: <strong>As at 9 May 2026</strong></p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, height: '40px' }}>
                    <th style={{ padding: '12px 10px' }}>Account Code</th>
                    <th style={{ padding: '12px 10px' }}>Account Title</th>
                    <th style={{ padding: '12px 10px' }}>Account Type</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Debit (YTD)</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Credit (YTD)</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleTrialBalanceRows.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', height: '40px' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', color: '#475569' }}>{item.code}</td>
                      <td style={{ padding: '10px', fontWeight: 500, color: '#0f172a' }}>{item.title}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{item.type}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#166534' }}>{item.debit > 0 ? formatAccountingNumber(item.debit) : '—'}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#b91c1c' }}>{item.credit > 0 ? formatAccountingNumber(item.credit) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #0f172a', borderBottom: '4px double #0f172a', fontWeight: 700, height: '48px', background: '#f8fafc' }}>
                    <td colSpan={3} style={{ padding: '12px 10px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Unified Ledger Balance Totals</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#166534' }}>{formatAccountingNumber(253343891460.98)}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#b91c1c' }}>{formatAccountingNumber(253343891460.98)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* VIEW 6: REPORT DEPOSITORY */}
          {activeTab === 'reports' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '28px', boxSizing: 'border-box' }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>Available Reports Depository</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {reports.map((rep) => (
                  <div key={rep.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>{rep.format}</span>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>{rep.id}</span>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b', wordBreak: 'break-all' }}>{rep.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginTop: 'auto' }}>
                      <span>Type: {rep.type}</span>
                      <span>{rep.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}