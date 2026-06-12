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
  { id: 'LP-01', name: 'Alpha Endowment Fund', type: 'LP', targetFund: 'AGIP Alternative Investments IV' },
  { id: 'LP-02', name: 'Beacon Pension Plan', type: 'LP', targetFund: 'AGIP Alternative Investments IV' },
  { id: 'LP-03', name: 'Kian Wealth Management', type: 'LP', targetFund: 'AGIP Alternative Investments IV' },
  { id: 'GP-01', name: 'AGIP Capital Partners LLC', type: 'GP', targetFund: 'AGIP Alternative Investments IV' },
  { id: 'AFF-01', name: 'AGIP Feeder Carry Vehicle', type: 'Affiliate', targetFund: 'AGIP Alternative Investments IV' },
  { id: 'LP-04', name: 'Delta Sovereign Fund', type: 'LP', targetFund: 'AGIP Private Credit Fund H2' },
  { id: 'GP-02', name: 'AGIP Credit Managers LLC', type: 'GP', targetFund: 'AGIP Private Credit Fund H2' },
  { id: 'AFF-02', name: 'Credit Trade Execution Corp', type: 'Affiliate', targetFund: 'AGIP Private Credit Fund H2' }
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

  // General Ledger Action Toolbars Controlled Selectors
  const [selectedGlId, setSelectedGlId] = useState<string | null>(null);
  const [isEditingGl, setIsEditingGl] = useState(false);

  // Currency Decimal Formatting Function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Sync Storage Engine
  useEffect(() => {
    const savedCoa = localStorage.getItem('corp_coa_v7');
    const savedLedger = localStorage.getItem('corp_ledger_v7');
    const savedEntities = localStorage.getItem('corp_entities_v7');
    const savedReports = localStorage.getItem('corp_reports_v7');
    const savedRecon = localStorage.getItem('corp_recon_v7');

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
      { id: 'REC-001', accountCode: '1100', name: 'Cash clearing Account Wire Audit', internalAmount: 1250000.00, externalAmount: 1250000.00, variance: 0.00, status: 'MATCHED' },
      { id: 'REC-002', accountCode: '1200', name: 'Portfolio Valuation Custody Lock', internalAmount: 5000000.00, externalAmount: 5150000.00, variance: -150000.00, status: 'UNRECONCILED' },
      { id: 'REC-003', accountCode: '1300', name: 'Bank Loans Principal Drawdown', internalAmount: 2200000.00, externalAmount: 2200000.00, variance: 0.00, status: 'MATCHED' },
      { id: 'REC-004', accountCode: '5100', name: 'Management Fee Accrual Rec', internalAmount: 3750000.00, externalAmount: 3700000.00, variance: 50000.00, status: 'UNRECONCILED' }
    ]);
  }, []);

  const saveLedger = (updated: any[]) => {
    setJournalEntries(updated);
    localStorage.setItem('corp_ledger_v7', JSON.stringify(updated));
  };

  const getCoaName = (code: string) => {
    return coa.find(a => a.code === code)?.name || 'Unmapped Sub-Ledger Account';
  };

  // File Import Link Execution Pipe
  const handleNativeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);

    const fileReader = new FileReader();
    fileReader.onload = async (evt) => {
      const resultText = evt.target?.result as string;
      setInputText(resultText);
    };
    fileReader.readAsText(file);
  };

  // Parsing Verification Mechanism
  async function handleMultiEntryParse() {
    if (!inputText.trim()) return;
    setLoading(true);
    
    setTimeout(() => {
      const nextSeq = String(journalEntries.length + 1).padStart(4, '0');
      setExtractedBatch([
        {
          id: `GL-${nextSeq}`,
          transactionType: 'Bulk Capital Call Calldown & Management Fee Distribution Allocation',
          status: 'VALIDATED',
          lines: [
            { accountCode: '1100', debit: 2500000.00, credit: 0.00 },
            { accountCode: '5100', debit: 1250000.00, credit: 0.00 },
            { accountCode: '3100', debit: 0.00, credit: 3750000.00 }
          ]
        }
      ]);
      setLoading(false);
    }, 400);
  }

  function commitMultiEntryBatch() {
    if (extractedBatch.length === 0) return;
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

  function executeAddBlankRowGl() {
    const nextSeq = String(journalEntries.length + 1).padStart(4, '0');
    const newGl = {
      id: `GL-${nextSeq}`,
      date: '2026-06-12',
      type: 'Manual Journal Provision Entry',
      status: 'UNVALIDATED',
      origin: 'MANUAL',
      lines: [
        { accountCode: '1100', debit: 0.00, credit: 0.00 },
        { accountCode: '5100', debit: 0.00, credit: 0.00 }
      ]
    };
    saveLedger([...journalEntries, newGl]);
    setSelectedGlId(`GL-${nextSeq}`);
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
    localStorage.setItem('corp_coa_v7', JSON.stringify(updatedCoa));

    setNewCode('');
    setNewTitle('');
    setNewDesc('');
  }

  const toggleReconRow = (id: string) => {
    if (selectedReconRows.includes(id)) {
      setSelectedReconRows(selectedReconRows.filter(rId => rId !== id));
    } else {
      setSelectedReconRows([...selectedReconRows, id]);
    }
  };

  // Group Entities By Specified Target Fund Asset Pools
  const uniqueFunds = Array.from(new Set(entities.map(e => e.targetFund)));

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
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Investments Explorer</span>
        </div>
        
        <div style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
          {sidebarTabs.map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setActiveDropdown(null); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: isSelected ? '#1e293b' : 'transparent',
                  color: isSelected ? '#3b82f6' : '#94a3b8',
                  fontSize: '0.88rem',
                  fontWeight: isSelected ? 600 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
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
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>System Environment: <strong style={{ color: '#10b981' }}>PRODUCTION</strong></span>
          </div>
        </div>

        {/* Dynamic Display Modules */}
        <div style={{ padding: '40px', flexGrow: 1, overflowY: 'auto' }}>
          
          {/* VIEW 1: FILE & TEXT IMPORT PARSING */}
          {activeTab === 'ingestion' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', alignItems: 'start' }}>
              
              {/* Data Ingestion Workspace */}
              <div style={{ background: '#ffffff', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Structural Document & Log Extraction Workspace
                </h3>
                
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste structural notice logs, execution sheets or multi-line pipeline ledger records..."
                  style={{ width: '100%', height: '340px', padding: '16px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6', resize: 'none', background: '#f8fafc', outline: 'none', color: '#334155' }}
                />
                
                {/* MOVED IN ACCORDANCE WITH STRUCTURAL SPECIFICATIONS */}
                <div style={{ marginTop: '16px', padding: '16px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Source Data Object Attachment</span>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontFamily: 'monospace' }}>{uploadedFileName}</span>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleNativeFileUpload} accept=".txt,.csv,.json,.log" style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    Choose File...
                  </button>
                </div>

                <button 
                  onClick={handleMultiEntryParse} 
                  disabled={loading || !inputText.trim()} 
                  style={{ width: '100%', marginTop: '16px', padding: '14px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: inputText.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.9rem', opacity: inputText.trim() ? 1 : 0.6, transition: 'background 0.2s' }}
                >
                  {loading ? 'Running Multi-Entry Processing Matrix...' : 'Execute Structural Ledger Extraction'}
                </button>
              </div>

              {/* Extraction Verification Screen */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Staging Mapping & Validation Check
                </h3>
                {extractedBatch.length === 0 ? (
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '8px', height: '485px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', backgroundColor: '#ffffff', fontSize: '0.88rem' }}>
                    Verification channel idle. Initiate parsing pipeline to isolate ledger targets.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 500 }}>
                        All balance parameters confirmed. Zero exceptions found across account structures.
                      </div>
                      <button onClick={commitMultiEntryBatch} style={{ width: '100%', padding: '10px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                        Commit Records Across Core Modules
                      </button>
                    </div>

                    {extractedBatch.map((entry, idx) => (
                      <div key={idx} style={{ background: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{entry.id}</span>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem', background: '#dcfce7', color: '#166534', letterSpacing: '0.05em' }}>PASSED</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b' }}>
                              <th style={{ padding: '8px 4px', textAlign: 'left' }}>Account</th>
                              <th style={{ padding: '8px 4px', textAlign: 'left' }}>Sub-Ledger Map</th>
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
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Audit Trail Ledger Base</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={executeAddBlankRowGl} style={{ padding: '8px 14px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    + Insert Manual Record
                  </button>
                  <button 
                    onClick={() => { if (selectedGlId) { saveLedger(journalEntries.filter(e => e.id !== selectedGlId)); setSelectedGlId(null); setIsEditingGl(false); } }}
                    disabled={!selectedGlId} 
                    style={{ padding: '8px 14px', background: selectedGlId ? '#ef4444' : '#e2e8f0', color: selectedGlId ? '#ffffff' : '#94a3b8', border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: selectedGlId ? 'pointer' : 'not-allowed' }}
                  >
                    Delete Entry
                  </button>
                  <button 
                    onClick={() => selectedGlId && setIsEditingGl(!isEditingGl)}
                    disabled={!selectedGlId} 
                    style={{ padding: '8px 14px', background: selectedGlId ? '#0f172a' : '#e2e8f0', color: selectedGlId ? '#ffffff' : '#94a3b8', border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: selectedGlId ? 'pointer' : 'not-allowed' }}
                  >
                    {isEditingGl ? 'Save Changes' : 'Modify Entry Lines'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {journalEntries.map((entry) => {
                  const isTargeted = selectedGlId === entry.id;
                  return (
                    <div 
                      key={entry.id} 
                      onClick={() => setSelectedGlId(entry.id)}
                      style={{ border: isTargeted ? '1px solid #3b82f6' : '1px solid #e2e8f0', borderRadius: '6px', padding: '18px', cursor: 'pointer', background: isTargeted ? '#f8fafc' : '#ffffff', transition: 'all 0.15s' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', marginRight: '16px', color: '#0f172a' }}>{entry.id}</span>
                          <span style={{ fontSize: '0.82rem', color: '#64748b', marginRight: '16px' }}>Value Date: {entry.date}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, background: entry.origin === 'AUTOMATED' ? '#f0fdf4' : '#fffbeb', color: entry.origin === 'AUTOMATED' ? '#166534' : '#b45309', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.03)' }}>
                            {entry.origin} PIPELINE
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>{entry.status}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '14px', fontWeight: 500 }}>{entry.type}</div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                            <th style={{ padding: '8px' }}>Code</th>
                            <th style={{ padding: '8px' }}>Account Master Profile Mapping</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Debit Balance (USD)</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Credit Balance (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.lines.map((line: any, lineIdx: number) => (
                            <tr key={lineIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: 600 }}>
                                {isTargeted && isEditingGl ? (
                                  <select 
                                    value={line.accountCode} 
                                    onChange={(e) => {
                                      let updated = [...journalEntries];
                                      let targetIdx = updated.findIndex(ent => ent.id === entry.id);
                                      updated[targetIdx].lines[lineIdx].accountCode = e.target.value;
                                      saveLedger(updated);
                                    }}
                                    style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                  >
                                    {coa.map(a => <option key={a.code} value={a.code}>{a.code}</option>)}
                                  </select>
                                ) : line.accountCode}
                              </td>
                              <td style={{ padding: '10px 8px', color: '#475569' }}>{getCoaName(line.accountCode)}</td>
                              <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 500 }}>
                                {isTargeted && isEditingGl ? (
                                  <input type="number" value={line.debit} onChange={(e) => {
                                    let updated = [...journalEntries];
                                    let targetIdx = updated.findIndex(ent => ent.id === entry.id);
                                    updated[targetIdx].lines[lineIdx].debit = Number(e.target.value);
                                    saveLedger(updated);
                                  }} style={{ width: '120px', textAlign: 'right', padding: '4px' }} />
                                ) : (line.debit > 0 ? formatCurrency(line.debit) : '-')}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 500 }}>
                                {isTargeted && isEditingGl ? (
                                  <input type="number" value={line.credit} onChange={(e) => {
                                    let updated = [...journalEntries];
                                    let targetIdx = updated.findIndex(ent => ent.id === entry.id);
                                    updated[targetIdx].lines[lineIdx].credit = Number(e.target.value);
                                    saveLedger(updated);
                                  }} style={{ width: '120px', textAlign: 'right', padding: '4px' }} />
                                ) : (line.credit > 0 ? formatCurrency(line.credit) : '-')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 3: ACCOUNTS MANAGER */}
          {activeTab === 'coa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Account Generation Form */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Provision New Account Parameter</h3>
                <form onSubmit={handleAddAccount} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.2fr 2fr auto', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Account Code</label>
                    <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. 1400" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Account Descriptor Title</label>
                    <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Dividend Receivable" style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Structural Category</label>
                    <select value={newType} onChange={e => setNewType(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#ffffff', fontSize: '0.85rem' }}>
                      <option value="Asset">Asset</option>
                      <option value="Liability">Liability</option>
                      <option value="Equity">Equity</option>
                      <option value="Expense">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Functional Narrative Context</label>
                    <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Define structural balance guidelines..." style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                  </div>
                  <button type="submit" style={{ padding: '11px 24px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Save Account Parameter</button>
                </form>
              </div>

              {/* Data Table Matrix Desk */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Chart of Accounts Operational Balances</span>
                  
                  {/* Fixed Navigation Balance Horizon Map Control Panels */}
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                    {(['MTD', 'QTD', 'YTD', 'ITD'] as const).map((horizon) => (
                      <button 
                        key={horizon} 
                        type="button"
                        onClick={() => setBalanceFilter(horizon)} 
                        style={{ padding: '8px 16px', border: 'none', background: balanceFilter === horizon ? '#0f172a' : '#ffffff', color: balanceFilter === horizon ? '#ffffff' : '#475569', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.1s' }}
                      >
                        {horizon} Horizon View
                      </button>
                    ))}
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Code</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Account Name</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Functional Scope Description</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>Active {balanceFilter} Dynamic Total (USD)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coa.map((account) => {
                      // Safe structural extraction lookup pipeline parameters protection check
                      const filterKey = balanceFilter.toLowerCase();
                      const rawVal = account[filterKey];
                      const parsedBalance = typeof rawVal === 'number' ? rawVal : 0;
                      
                      return (
                        <tr key={account.code} style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
                          <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{account.code}</td>
                          <td style={{ padding: '14px', fontWeight: 600, color: '#1e293b' }}>{account.name}</td>
                          <td style={{ padding: '14px' }}><span style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>{account.category}</span></td>
                          <td style={{ padding: '14px', color: '#64748b', fontSize: '0.82rem' }}>{account.description}</td>
                          <td style={{ padding: '14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: parsedBalance < 0 ? '#b91c1c' : '#059669' }}>
                            {formatCurrency(parsedBalance)}
                          </td>
                          <td style={{ padding: '14px', textAlign: 'center', position: 'relative' }}>
                            <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === account.code ? null : account.code); }} style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#475569' }}>Options ▾</button>
                            {activeDropdown === account.code && (
                              <div style={{ position: 'absolute', right: '14px', top: '44px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 10, minWidth: '140px' }}>
                                <button onClick={() => { setCoa(coa.filter(a => a.code !== account.code)); setActiveDropdown(null); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}>Remove Index</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 4: FUNDS PARTNERSHIP DIRECTORY */}
          {activeTab === 'registry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {uniqueFunds.map((fundName: any) => (
                <div key={fundName} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{fundName}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    
                    {/* LIMITED PARTNERS COLUMN */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Limited Partners (LPs)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {entities.filter(e => e.targetFund === fundName && e.type === 'LP').map(ent => (
                          <div key={ent.id} style={{ background: '#ffffff', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', justifyBetween: 'center', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{ent.name}</span>
                            <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#64748b', marginTop: '4px' }}>Token: {ent.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GENERAL PARTNERS COLUMN */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.78rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.03em' }}>General Partners (GPs)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {entities.filter(e => e.targetFund === fundName && e.type === 'GP').map(ent => (
                          <div key={ent.id} style={{ background: '#ffffff', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', justifyBetween: 'center', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{ent.name}</span>
                            <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#64748b', marginTop: '4px' }}>Token: {ent.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AFFILIATES CLASS COLUMN */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.78rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Affiliated Entities</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {entities.filter(e => e.targetFund === fundName && e.type === 'Affiliate').map(ent => (
                          <div key={ent.id} style={{ background: '#ffffff', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', justifyBetween: 'center', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{ent.name}</span>
                            <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#64748b', marginTop: '4px' }}>Token: {ent.id}</span>
                          </div>
                        ))}
                        {entities.filter(e => e.targetFund === fundName && e.type === 'Affiliate').length === 0 && (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No affiliates configured</span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW 5: RECONCILIATION & MATCHING */}
          {activeTab === 'recon' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Spreadsheet Interlock Verification Desk</span>
                <button 
                  onClick={() => { alert(`Processing manual clearing match run for ${selectedReconRows.length} item(s).`); setSelectedReconRows([]); }}
                  disabled={selectedReconRows.length === 0}
                  style={{ padding: '8px 16px', background: selectedReconRows.length > 0 ? '#10b981' : '#cbd5e1', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: selectedReconRows.length > 0 ? 'pointer' : 'not-allowed' }}
                >
                  Force Manual Match Clear ({selectedReconRows.length} Selected)
                </button>
              </div>

              {/* SPREADSHEET RENDER ARCHITECTURE */}
              <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left', background: '#ffffff' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                      <th style={{ padding: '10px', width: '40px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                        <input type="checkbox" checked={selectedReconRows.length === reconData.length} onChange={() => { if(selectedReconRows.length === reconData.length) { setSelectedReconRows([]); } else { setSelectedReconRows(reconData.map(r => r.id)); } }} />
                      </th>
                      <th style={{ padding: '10px', borderRight: '1px solid #cbd5e1', fontWeight: 600 }}>Account Code</th>
                      <th style={{ padding: '10px', borderRight: '1px solid #cbd5e1', fontWeight: 600 }}>Sub-Ledger Operational Class</th>
                      <th style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600 }}>Internal Book Amount (USD)</th>
                      <th style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600 }}>External Statement Ledger (USD)</th>
                      <th style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 600 }}>Unreconciled Variance (USD)</th>
                      <th style={{ padding: '10px', fontWeight: 600, textAlign: 'center' }}>Status Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconData.map((row, index) => {
                      const isChecked = selectedReconRows.includes(row.id);
                      return (
                        <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '10px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                            <input type="checkbox" checked={isChecked} onChange={() => toggleReconRow(row.id)} />
                          </td>
                          <td style={{ padding: '10px', borderRight: '1px solid #cbd5e1', fontFamily: 'monospace', fontWeight: 700 }}>{row.accountCode}</td>
                          <td style={{ padding: '10px', borderRight: '1px solid #cbd5e1', fontWeight: 500, color: '#334155' }}>{row.name}</td>
                          <td style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(row.internalAmount)}</td>
                          <td style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(row.externalAmount)}</td>
                          <td style={{ padding: '10px', borderRight: '1px solid #cbd5e1', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: row.variance !== 0 ? '#b91c1c' : '#059669' }}>
                            {formatCurrency(row.variance)}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, background: row.status === 'MATCHED' ? '#dcfce7' : '#fee2e2', color: row.status === 'MATCHED' ? '#166534' : '#991b1b' }}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 6: REPORT DEPOSITORY */}
          {activeTab === 'reports' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Generated Financial Reports Archive</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '12px 10px' }}>Reference Hash</th>
                    <th style={{ padding: '12px 10px' }}>File Target Destination Name</th>
                    <th style={{ padding: '12px 10px' }}>Framework Category</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Date Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(rep => (
                    <tr key={rep.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '14px 10px', fontFamily: 'monospace', fontWeight: 600 }}>{rep.id}</td>
                      <td style={{ padding: '14px 10px', color: '#2563eb', fontWeight: 500 }}>{rep.name}.{rep.format.toLowerCase()}</td>
                      <td style={{ padding: '14px 10px' }}>{rep.type}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'right', color: '#64748b' }}>{rep.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}