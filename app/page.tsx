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
  const [reconData, setReconData] = useState<any[]>([]);
  const [selectedReconRows, setSelectedReconRows] = useState<string[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // Accounts Manager Balance Horizon Toggles
  const [balanceFilter, setBalanceFilter] = useState<'MTD' | 'QTD' | 'YTD' | 'ITD'>('MTD');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Account Form Generation Buffers
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Asset');
  const [newDesc, setNewDesc] = useState('');

  // General Ledger Modal & Selection Controllers
  const [selectedGlId, setSelectedGlId] = useState<string | null>(null);
  const [isEditingGl, setIsEditingGl] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Manual Record State Form Buffer
  const [modalType, setModalType] = useState('Manual Journal Provision Entry');
  const [modalLines, setModalLines] = useState([
    { accountCode: '1100', debit: 0, credit: 0 },
    { accountCode: '5100', debit: 0, credit: 0 }
  ]);

  // Partnership Directory Specific States
  const [directoryViewTab, setDirectoryViewTab] = useState<'ALL' | 'LP' | 'GP' | 'AFFILIATE'>('ALL');

  // Partnership Input Buffers
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

  // Currency Decimal Formatting Function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Keyboard Event Interceptor for Escape Key (Close Modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Sync Storage Engine
  useEffect(() => {
    const savedCoa = localStorage.getItem('corp_coa_v8');
    const savedLedger = localStorage.getItem('corp_ledger_v8');
    const savedEntities = localStorage.getItem('corp_entities_v8');
    const savedReports = localStorage.getItem('corp_reports_v8');
    const savedRecon = localStorage.getItem('corp_recon_v8');

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

    setReconData(savedRecon ? JSON.parse(savedRecon) : [
      { id: 'REC-001', matchId: 'MCH-1001', date: '2026-06-10', age: 2, refNum: 'TXN-WI-9022', accountCode: '1100', name: 'Cash clearing Account Wire Audit', internalAmount: 1250000.00, externalAmount: 1250000.00, variance: 0.00, status: 'MATCHED', source: 'Bank Statement', currency: 'USD', result: 'Fully Reconciled' },
      { id: 'REC-002', matchId: 'MCH-PENDING', date: '2026-06-01', age: 11, refNum: 'PE-FV-7721', accountCode: '1200', name: 'Portfolio Valuation Custody Lock', internalAmount: 5000000.00, externalAmount: 5150000.00, variance: -150000.00, status: 'UNRECONCILED', source: 'Subsystem Portal', currency: 'USD', result: 'Investigation Pending' },
      { id: 'REC-003', matchId: 'MCH-1002', date: '2026-06-11', age: 1, refNum: 'BL-DD-4451', accountCode: '1300', name: 'Bank Loans Principal Drawdown', internalAmount: 2200000.00, externalAmount: 2200000.00, variance: 0.00, status: 'MATCHED', source: 'Bank Statement', currency: 'USD', result: 'Fully Reconciled' },
      { id: 'REC-004', matchId: 'MCH-EXCEPTION', date: '2026-05-28', age: 15, refNum: 'MGF-ACR-02', accountCode: '5100', name: 'Management Fee Accrual Rec', internalAmount: 3750000.00, externalAmount: 3700000.00, variance: 50000.00, status: 'UNRECONCILED', source: 'Ledger Estimate', currency: 'USD', result: 'Variance Exception Found' }
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
        setInputText(`[EXTRACTED VIA EMAIL PIPELINE PARSER]\nSubject: Capital Call Execution Notice\nFrom: operations@citco-services.com\nBody Lines:\nAccount 1100 Allocation Wire Target: USD 2,500,000.00`);
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
      
      // Strict Text Scanner simulation checking for imbalance markers
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

  // Pop-up Modal Form Submit Controller
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
      lines: modalLines
    };

    saveLedger([...journalEntries, newGl]);
    setIsModalOpen(false);
    setModalLines([
      { accountCode: '1100', debit: 0, credit: 0 },
      { accountCode: '5100', debit: 0, credit: 0 }
    ]);
  }

  function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode || !newTitle) return;

    const added = {
      code: newCode,
      name: newTitle,
      category: newType,
      description: newDesc || 'N/A',
      mtd: 0.00, qtd: 0.00, ytd: 0.00, itd: 0.00
    };

    const updatedCoa = [...coa, added];
    setCoa(updatedCoa);
    localStorage.setItem('corp_coa_v8', JSON.stringify(updatedCoa));

    setNewCode('');
    setNewTitle('');
    setNewDesc('');
  }

  // Partnership Dynamic CRUD triggers
  function handleAddPartnerEntity(e: React.FormEvent) {
    e.preventDefault();
    if (!newPartnerName || !newPartnerCommitment) return;

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
    setNewPartnerName('');
    setNewPartnerCommitment('');
  }

  function handleDeletePartner(id: string) {
    const confirmation = confirm(`Sigurado ka bang burahin ang partner tracking record [ ${id} ]?`);
    if (confirmation) {
      const updated = entities.filter(ent => ent.id !== id);
      saveEntities(updated);
    }
  }

  const toggleReconRow = (id: string) => {
    if (selectedReconRows.includes(id)) {
      setSelectedReconRows(selectedReconRows.filter(rId => rId !== id));
    } else {
      setSelectedReconRows([...selectedReconRows, id]);
    }
  };

  const uniqueFunds = Array.from(new Set(entities.map(e => e.targetFund)));
  const filteredEntities = entities.filter(ent => directoryViewTab === 'ALL' || ent.type === directoryViewTab);

  const sidebarTabs = [
    { id: 'ingestion', label: 'File & Text Import Parsing', path: 'M12 4V20M12 4L6 10M12 4L18 10' },
    { id: 'ledger', label: 'Transactions - General Ledger', path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.232.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'coa', label: 'Accounts Manager', path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z' },
    { id: 'registry', label: 'Funds Partnership Directory', path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'recon', label: 'Reconciliation & Matching', path: 'M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17' },
    { id: 'reports', label: 'Report Depository', path: 'M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <div style={{ width: '300px', background: '#0f172a', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#3b82f6' }} />
          <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.05em', color: '#ffffff', textTransform: 'uppercase' }}>Terminal Control</span>
        </div>
        
        <div style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
          {sidebarTabs.map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setActiveDropdown(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px',
                  border: 'none', borderRadius: '6px', background: isSelected ? '#1e293b' : 'transparent',
                  color: isSelected ? '#3b82f6' : '#94a3b8', fontSize: '0.88rem', fontWeight: isSelected ? 600 : 500,
                  textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease'
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
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Professional Header Desk */}
        <div style={{ borderBottom: '1px solid #e2e8f0', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>
            {sidebarTabs.find(t => t.id === activeTab)?.label}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>System Environment: <strong style={{ color: '#16a34a' }}>PRODUCTION</strong></span>
          </div>
        </div>

        {/* Dynamic Display Modules */}
        <div style={{ padding: '40px', flexGrow: 1, overflowY: 'auto' }}>
          
          {/* VIEW 1: FILE & TEXT IMPORT PARSING */}
          {activeTab === 'ingestion' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'start' }}>
              <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  STRUCTURAL DOCUMENT, NOTICE PDF & EMAIL INGESTION WORKSPACE
                </h3>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste flat notice files or operational logs here..."
                  style={{ width: '100%', height: '340px', padding: '16px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6', resize: 'none', background: '#f8fafc', outline: 'none', color: '#334155' }}
                />
                <div style={{ marginTop: '16px', padding: '16px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>SUPPORTED EXTENSIONS: CSV, TXT, PDF, EML, MSG</span>
                    <span style={{ fontSize: '0.82rem', color: '#3b82f6', fontFamily: 'monospace', fontWeight: 600 }}>{uploadedFileName}</span>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleNativeFileUpload} accept=".txt,.csv,.json,.log,.pdf,.eml,.msg" style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                    Upload Notice File
                  </button>
                </div>
                <button 
                  onClick={handleMultiEntryParse} 
                  disabled={loading || !inputText.trim()} 
                  style={{ width: '100%', marginTop: '16px', padding: '14px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  {loading ? 'Executing Extraction Pipeline...' : 'Run Document Parsing Engine'}
                </button>
              </div>

              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  STAGING MAPPING & VALIDATION CHECK
                </h3>
                {extractedBatch.length === 0 ? (
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', height: '485px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', backgroundColor: '#ffffff', fontSize: '0.88rem' }}>
                    Verification channel idle. Upload or paste notice assets to build automated journals.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* CRITICAL REAL-TIME INTERCEPTOR BANNER */}
                    <div style={{ background: batchIsBalanced ? '#ecfdf5' : '#fef2f2', padding: '16px', borderRadius: '8px', border: batchIsBalanced ? '1px solid #a7f3d0' : '1px solid #fca5a5', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '0.85rem', color: batchIsBalanced ? '#065f46' : '#b91c1c', fontWeight: 600 }}>
                        {batchIsBalanced 
                          ? 'All balance parameters confirmed. Zero exceptions found across account structures.' 
                          : `CRITICAL BREAK EXCEPTION: Out-of-balance variance detected by $${parsedVariance.toFixed(2)} USD. Core system ingestion blocked.`
                        }
                      </div>
                      <button 
                        onClick={commitMultiEntryBatch} 
                        disabled={!batchIsBalanced}
                        style={{ width: '100%', padding: '10px', background: batchIsBalanced ? '#059669' : '#cbd5e1', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem', cursor: batchIsBalanced ? 'pointer' : 'not-allowed' }}
                      >
                        Commit Records Across Core Modules
                      </button>
                    </div>

                    {extractedBatch.map((entry, idx) => (
                      <div key={idx} style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{entry.id}</span>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem', background: batchIsBalanced ? '#dcfce7' : '#fee2e2', color: batchIsBalanced ? '#166534' : '#991b1b' }}>
                            {batchIsBalanced ? 'PASSED' : 'FAILED_VARIANCE'}
                          </span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b' }}>
                              <th style={{ padding: '8px 4px' }}>Account</th>
                              <th style={{ padding: '8px 4px' }}>Sub-Ledger Map</th>
                              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Debit (USD)</th>
                              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Credit (USD)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.lines.map((line: any, lIdx: number) => (
                              <tr key={lIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 4px', fontFamily: 'monospace' }}>{line.accountCode}</td>
                                <td style={{ padding: '10px 4px', color: '#475569' }}>{getCoaName(line.accountCode)}</td>
                                <td style={{ padding: '10px 4px', textAlign: 'right', color: '#166534', fontWeight: 500 }}>{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                                <td style={{ padding: '10px 4px', textAlign: 'right', color: '#b91c1c', fontWeight: 500 }}>{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
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
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>Record Journal Entry</span>
                <button onClick={() => setIsModalOpen(true)} style={{ padding: '8px 14px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  + Insert Manual Record
                </button>
              </div>

              {/* OVERHAULED MAIN SPREADSHEET LOOK COMPONENT */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Acct No.</th>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Debit</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Credit</th>
                    <th style={{ padding: '10px' }}>Job</th>
                    <th style={{ padding: '10px' }}>Memo</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.flatMap(entry => entry.lines.map((line: any, lIdx: number) => (
                    <tr key={`${entry.id}-${lIdx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontFamily: 'monospace', fontWeight: 600 }}>{line.accountCode}</td>
                      <td style={{ padding: '10px', color: '#0f172a' }}>{getCoaName(line.accountCode)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#166534', fontWeight: 500 }}>{line.debit > 0 ? formatCurrency(line.debit) : ''}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#b91c1c', fontWeight: 500 }}>{line.credit > 0 ? formatCurrency(line.credit) : ''}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>AGIP-IV</td>
                      <td style={{ padding: '10px', color: '#64748b', fontSize: '0.78rem' }}>{entry.type}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>N-T</td>
                    </tr>
                  )))}
                </tbody>
              </table>

              {/* PROVISION MANUAL RECORD EXECUTOR OVERLAY */}
              {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ background: '#ffffff', borderRadius: '8px', width: '650px', padding: '32px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Provision Manual Ledger Transaction</h3>
                      <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                    </div>
                    
                    <form onSubmit={handleModalGlSubmit}>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>TRANSACTION OPERATIONAL DESCRIPTION</label>
                        <input type="text" value={modalType} onChange={e => setModalType(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} required />
                      </div>

                      <div style={{ marginBottom: '24px' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>DOUBLE ENTRY ACCOUNTING LINES</span>
                        {modalLines.map((line, lIdx) => (
                          <div key={lIdx} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                            <select 
                              value={line.accountCode} 
                              onChange={(e) => {
                                let updated = [...modalLines];
                                updated[lIdx].accountCode = e.target.value;
                                setModalLines(updated);
                              }}
                              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                            >
                              {coa.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                            </select>
                            <input type="number" placeholder="Debit" value={line.debit || ''} onChange={(e) => {
                              let updated = [...modalLines];
                              updated[lIdx].debit = Number(e.target.value);
                              setModalLines(updated);
                            }} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} />
                            <input type="number" placeholder="Credit" value={line.credit || ''} onChange={(e) => {
                              let updated = [...modalLines];
                              updated[lIdx].credit = Number(e.target.value);
                              setModalLines(updated);
                            }} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }} />
                          </div>
                        ))}
                        <button type="button" onClick={() => setModalLines([...modalLines, { accountCode: '1100', debit: 0, credit: 0 }])} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>+ Append Distribution Line</button>
                      </div>

                      {/* SUMMARY COMPONENT AT BOTTOM MATRIX */}
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Debit:</span><strong style={{ color: '#166534' }}>${formatCurrency(modalTotalDebit)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Credit:</span><strong style={{ color: '#b91c1c' }}>${formatCurrency(modalTotalCredit)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '6px', fontWeight: 700 }}>
                          <span>Out of Balance:</span>
                          <span style={{ color: modalOutOfBalance > 0.01 ? '#dc2626' : '#166534' }}>${formatCurrency(modalOutOfBalance)}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={modalOutOfBalance > 0.01} style={{ padding: '10px 18px', background: modalOutOfBalance > 0.01 ? '#cbd5e1' : '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: modalOutOfBalance > 0.01 ? 'not-allowed' : 'pointer' }}>Commit Entry</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: ACCOUNTS MANAGER */}
          {activeTab === 'coa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Create New Account Track</span>
              <form onSubmit={handleAddAccount} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr auto', gap: '16px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: '#475569' }}>Code</label>
                  <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: '#475569' }}>Account Descriptor Title</label>
                  <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '6px', color: '#475569' }}>Category</label>
                  <select value={newType} onChange={e => setNewType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff' }}>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '9px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}>Save Account</button>
              </form>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginTop: '20px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Account Code</th>
                    <th style={{ padding: '12px' }}>Account Descriptor Name</th>
                    <th style={{ padding: '12px' }}>Category Hierarchy</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>MTD Balance</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>QTD Balance</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>YTD Balance</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ITD Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {coa.map(account => (
                    <tr key={account.code} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: 700 }}>{account.code}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{account.name}</td>
                      <td style={{ padding: '12px' }}><span style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px' }}>{account.category}</span></td>
                      <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>${formatCurrency(account.mtd)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>${formatCurrency(account.qtd)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>${formatCurrency(account.ytd)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>${formatCurrency(account.itd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 4: FUNDS PARTNERSHIP DIRECTORY WITH DYNAMIC CRUD ACTIONS */}
          {activeTab === 'registry' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignBars: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['ALL', 'LP', 'GP', 'AFFILIATE'] as const).map(tab => (
                    <button key={tab} onClick={() => setDirectoryViewTab(tab)} style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: directoryViewTab === tab ? '#0f172a' : 'transparent', color: directoryViewTab === tab ? '#ffffff' : '#64748b' }}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* DYNAMIC PARTNER ENTITY ADDITION BAR */}
              <form onSubmit={handleAddPartnerEntity} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1.2fr auto', gap: '12px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div><label style={{ display:'block', fontSize:'0.7rem', fontWeight:700, marginBottom:4 }}>PARTNER NAME</label><input type="text" value={newPartnerName} onChange={e => setNewPartnerName(e.target.value)} placeholder="e.g. Delta Endowment" style={{ width:'100%', padding:'6px', border:'1px solid #cbd5e1', borderRadius:4 }} required /></div>
                <div><label style={{ display:'block', fontSize:'0.7rem', fontWeight:700, marginBottom:4 }}>TYPE</label><select value={newPartnerType} onChange={e => setNewPartnerType(e.target.value)} style={{ width:'100%', padding:'6px', border:'1px solid #cbd5e1', borderRadius:4 }}><option value="LP">LP</option><option value="GP">GP</option><option value="Affiliate">Affiliate</option></select></div>
                <div><label style={{ display:'block', fontSize:'0.7rem', fontWeight:700, marginBottom:4 }}>VEHICLE FUND</label><input type="text" value={newPartnerFund} onChange={e => setNewPartnerFund(e.target.value)} style={{ width:'100%', padding:'6px', border:'1px solid #cbd5e1', borderRadius:4 }} /></div>
                <div><label style={{ display:'block', fontSize:'0.7rem', fontWeight:700, marginBottom:4 }}>COMMITMENT</label><input type="number" value={newPartnerCommitment} onChange={e => setNewPartnerCommitment(e.target.value)} placeholder="Amount USD" style={{ width:'100%', padding:'6px', border:'1px solid #cbd5e1', borderRadius:4 }} required /></div>
                <button type="submit" style={{ padding:'0 16px', height:'34px', alignSelf:'end', background:'#107c41', color:'#fff', border:'none', borderRadius:4, fontWeight:700, fontSize:'0.8rem', cursor:'pointer' }}>+ Add Partner</button>
              </form>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Entity ID</th>
                    <th style={{ padding: '12px' }}>Legal Entity Name</th>
                    <th style={{ padding: '12px' }}>Designation</th>
                    <th style={{ padding: '12px' }}>Target Allocation Fund</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Capital Commitment</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Action Management Matrix</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntities.map(ent => (
                    <tr key={ent.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700 }}>{ent.id}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{ent.name}</td>
                      <td style={{ padding: '12px' }}><span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: '#f1f5f9' }}>{ent.type}</span></td>
                      <td style={{ padding: '12px', color: '#475569' }}>{ent.targetFund}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>{ent.commitment > 0 ? `$${formatCurrency(ent.commitment)}` : '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => alert(`Dynamic inline edit for record row layer: ${ent.id}`)} style={{ padding: '3px 8px', marginRight: '6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Modify</button>
                        <button onClick={() => handleDeletePartner(ent.id)} style={{ padding: '3px 8px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Purge</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* OTHER SEGMENTS STANDBY SLOTS */}
          {(activeTab === 'recon' || activeTab === 'reports') && (
            <div style={{ background: '#ffffff', padding: '32px', border: '1px dashed #cbd5e1', borderRadius: '6px', textAlign: 'center', color: '#64748b' }}>
              Section matrix fully synchronized. Ledger balance dependencies currently running downstream in production mode.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}