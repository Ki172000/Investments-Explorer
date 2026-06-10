'use client';

import React, { useState, useEffect, useRef } from 'react';

// Baseline Configurations
const DEFAULT_COA = [
  { code: '1100', name: 'Cash / Clearing Account', category: 'Asset', mtd: 1250000, qtd: 5000000, ytd: 12000000, itd: 45000000 },
  { code: '1200', name: 'Private Equity Investments (Fair Value)', category: 'Asset', mtd: 5000000, qtd: 15000000, ytd: 45000000, itd: 120000000 },
  { code: '1300', name: 'Bank Loans Receivable', category: 'Asset', mtd: 0, qtd: 2500000, ytd: 8000000, itd: 22000000 },
  { code: '3100', name: 'Partners Capital - LP Contributions', category: 'Equity', mtd: 0, qtd: -10000000, ytd: -35000000, itd: -110000000 },
  { code: '3300', name: 'Unfunded Capital Commitments Offset', category: 'Equity', mtd: -4000000, qtd: -12000000, ytd: -12000000, itd: -40000000 },
  { code: '5100', name: 'Management & Performance Fees', category: 'Expense', mtd: 1250000, qtd: 3750000, ytd: 3750000, itd: 15000000 }
];

const INITIAL_ENTITIES = [
  { id: 'LP-01', name: 'Alpha Endowment Fund', commitment: 50000000, unfunded: 40000000, pct: 0.50, type: 'LP', targetFund: 'AGIP Alternative Investments IV' },
  { id: 'LP-02', name: 'Beacon Pension Plan', commitment: 30000000, unfunded: 24000000, pct: 0.30, type: 'LP', targetFund: 'AGIP Alternative Investments IV' },
  { id: 'LP-03', name: 'Kian Wealth Management', commitment: 20000000, unfunded: 16000000, pct: 0.20, type: 'LP', targetFund: 'AGIP Alternative Investments IV' },
  { id: 'GP-01', name: 'AGIP Capital Partners LLC', commitment: 0, unfunded: 0, pct: 0.00, type: 'GP', targetFund: 'AGIP Alternative Investments IV' },
  { id: 'AFF-01', name: 'Globex Institutional Custody', commitment: 0, unfunded: 0, pct: 0.00, type: 'Affiliate', targetFund: 'AGIP Alternative Investments IV' }
];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ingestion');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // App Core State
  const [coa, setCoa] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [nextLpSequence, setNextLpSequence] = useState<number>(4); 
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [extractedBatch, setExtractedBatch] = useState<any[]>([]);

  // Sub-tabs
  const [registrySubTab, setRegistrySubTab] = useState<'ALL' | 'LP' | 'GP' | 'AFFILIATE'>('ALL');
  const [reconFilter, setReconFilter] = useState<'ALL' | 'UNMATCHED' | 'MATCHED'>('UNMATCHED');
  const [reconData, setReconData] = useState<any[]>([]);

  // Account Balances Form Inputs
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('Asset');
  const [newMtd, setNewMtd] = useState('');
  const [newQtd, setNewQtd] = useState('');
  const [newYtd, setNewYtd] = useState('');
  const [newItd, setNewItd] = useState('');

  // Registry Form Inputs
  const [entName, setEntName] = useState('');
  const [entCommitment, setEntCommitment] = useState('');
  const [entUnfunded, setEntUnfunded] = useState('');
  const [entPct, setEntPct] = useState('');
  const [entType, setEntType] = useState('LP');
  const [entFund, setEntFund] = useState('AGIP Alternative Investments IV');

  // Hydrate Data Architecture
  useEffect(() => {
    const savedCoa = localStorage.getItem('term_coa_v3');
    const savedEntities = localStorage.getItem('term_entities_v3');
    const savedSeq = localStorage.getItem('term_lp_seq_v3');
    const savedLedger = localStorage.getItem('term_ledger_v3');
    const savedReports = localStorage.getItem('term_reports_v3');
    const savedRecon = localStorage.getItem('term_recon_v3');

    setCoa(savedCoa ? JSON.parse(savedCoa) : DEFAULT_COA);
    setEntities(savedEntities ? JSON.parse(savedEntities) : INITIAL_ENTITIES);
    setNextLpSequence(savedSeq ? parseInt(savedSeq, 10) : 4);
    
    if (savedLedger) {
      setJournalEntries(JSON.parse(savedLedger));
    } else {
      const seedEntries = [
        {
          id: 1,
          date: '2026-06-01',
          fundName: 'AGIP Alternative Investments IV',
          type: 'Management Fee Expense',
          status: 'VALIDATED',
          reason: '',
          lines: [
            { accountCode: '5100', debitInCents: 125000000, creditInCents: 0 },
            { accountCode: '1100', debitInCents: 0, creditInCents: 125000000 }
          ]
        }
      ];
      setJournalEntries(seedEntries);
    }

    setReports(savedReports ? JSON.parse(savedReports) : [
      { id: 'REP01', name: 'Q2_2026_Trial_Balance', type: 'Trial Balance', date: '2026-06-09', format: 'PDF' },
      { id: 'REP02', name: 'General_Ledger_Audit_Log', type: 'Ledger Audit', date: '2026-06-10', format: 'CSV' }
    ]);

    const initialReconFeed = [
      { id: 'REC-001', type: 'Cash Clearing', accountCode: '1100', description: 'Institutional Operating Wire Ref: #983421', internalAmount: 0, externalAmount: 1250000, isMatched: false, matchingNotes: '', manualOverride: false },
      { id: 'REC-002', type: 'Portfolio Valuation', accountCode: '1200', description: 'Custodian Valuations Vault Statement Asset Block', internalAmount: 5000000, externalAmount: 5000000, isMatched: true, matchingNotes: 'System Auto-Match', manualOverride: false }
    ];
    setReconData(savedRecon ? JSON.parse(savedRecon) : initialReconFeed);
  }, []);

  const saveAndSyncLedger = (updatedEntries: any[]) => {
    setJournalEntries(updatedEntries);
    localStorage.setItem('term_ledger_v3', JSON.stringify(updatedEntries));
  };

  const getCoaName = (code: string) => {
    return coa.find(a => a.code === code)?.name || 'Unmapped Sub-Ledger Account';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      setInputText(text);
      alert(`Loaded ${file.name} to input workspace.`);
    };
    reader.readAsText(file);
  };

  async function handleAiParse() {
    if (!inputText.trim()) {
      alert('Please enter or paste raw data text first.');
      return;
    }
    setLoading(true);
    try {
      setTimeout(() => {
        const mockExtracted = [
          {
            id: journalEntries.length + 1,
            transactionType: 'Management Fee Expense Notice',
            fundName: 'AGIP Alternative Investments IV',
            status: 'VALIDATED',
            exceptionReason: '',
            totalAmountInCents: 125000000,
            suggestedLedgerLines: [
              { accountCode: '5100', debitInCents: 125000000, creditInCents: 0 },
              { accountCode: '1100', debitInCents: 0, creditInCents: 125000000 }
            ]
          }
        ];
        setExtractedBatch(mockExtracted);
        setLoading(false);
      }, 800);
    } catch (err: any) {
      alert('Validation processing failed.');
      setLoading(false);
    }
  }

  const updatePreviewLine = (entryIdx: number, lineIdx: number, field: string, val: string) => {
    const freshBatch = [...extractedBatch];
    if (field === 'debit') freshBatch[entryIdx].suggestedLedgerLines[lineIdx].debitInCents = Math.round(parseFloat(val || '0') * 100);
    if (field === 'credit') freshBatch[entryIdx].suggestedLedgerLines[lineIdx].creditInCents = Math.round(parseFloat(val || '0') * 100);
    if (field === 'code') freshBatch[entryIdx].suggestedLedgerLines[lineIdx].accountCode = val;
    setExtractedBatch(freshBatch);
  };

  function postToLedgerBatch() {
    if (extractedBatch.length === 0) return;

    let currentEntries = [...journalEntries];
    extractedBatch.forEach((entry) => {
      const incrementalId = currentEntries.length > 0 ? Math.max(...currentEntries.map(e => e.id)) + 1 : 1;
      const newEntry = {
        id: incrementalId,
        date: '2026-06-10',
        fundName: entry.fundName,
        type: entry.transactionType,
        status: entry.status,
        reason: entry.exceptionReason,
        lines: entry.suggestedLedgerLines || []
      };
      currentEntries = [...currentEntries, newEntry];
    });

    saveAndSyncLedger(currentEntries);
    setExtractedBatch([]);
    setInputText('');
    alert('Transaction validation entries verified and appended to Ledger.');
  }

  // Manual General Ledger Actions
  const addNewManualEntry = () => {
    const incrementalId = journalEntries.length > 0 ? Math.max(...journalEntries.map(e => e.id)) + 1 : 1;
    const blankEntry = {
      id: incrementalId,
      date: new Date().toISOString().split('T')[0],
      fundName: 'AGIP Alternative Investments IV',
      type: 'Manual Journal Adjustment',
      status: 'VALIDATED',
      reason: '',
      lines: [
        { accountCode: '1100', debitInCents: 0, creditInCents: 0 },
        { accountCode: '5100', debitInCents: 0, creditInCents: 0 }
      ]
    };
    saveAndSyncLedger([...journalEntries, blankEntry]);
  };

  const editLedgerLineValue = (entryId: number, lineIdx: number, field: 'code' | 'debit' | 'credit', val: string) => {
    const updated = journalEntries.map(entry => {
      if (entry.id !== entryId) return entry;
      const freshLines = [...entry.lines];
      
      if (field === 'code') {
        freshLines[lineIdx].accountCode = val;
      } else {
        const parsedVal = Math.round(parseFloat(val || '0') * 100);
        if (field === 'debit') freshLines[lineIdx].debitInCents = parsedVal;
        if (field === 'credit') freshLines[lineIdx].creditInCents = parsedVal;
      }
      return { ...entry, lines: freshLines };
    });
    saveAndSyncLedger(updated);
  };

  const addLineToEntry = (entryId: number) => {
    const updated = journalEntries.map(entry => {
      if (entry.id !== entryId) return entry;
      return {
        ...entry,
        lines: [...entry.lines, { accountCode: '1100', debitInCents: 0, creditInCents: 0 }]
      };
    });
    saveAndSyncLedger(updated);
  };

  const removeLineFromEntry = (entryId: number, lineIdx: number) => {
    const updated = journalEntries.map(entry => {
      if (entry.id !== entryId) return entry;
      return {
        ...entry,
        lines: entry.lines.filter((_: any, idx: number) => idx !== lineIdx)
      };
    });
    saveAndSyncLedger(updated);
  };

  const deleteLedgerEntry = (entryId: number) => {
    const updated = journalEntries.filter(e => e.id !== entryId);
    saveAndSyncLedger(updated);
  };

  // Accounts Manager Handlers
  const addAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    if (coa.some(a => a.code === newCode)) {
      alert('Account code alignment collision.');
      return;
    }
    const updated = [
      ...coa, 
      { 
        code: newCode, 
        name: newName, 
        category: newCat,
        mtd: parseFloat(newMtd || '0'),
        qtd: parseFloat(newQtd || '0'),
        ytd: parseFloat(newYtd || '0'),
        itd: parseFloat(newItd || '0')
      }
    ].sort((a,b) => a.code.localeCompare(b.code));
    
    setCoa(updated);
    localStorage.setItem('term_coa_v3', JSON.stringify(updated));
    setNewCode('');
    setNewName('');
    setNewMtd('');
    setNewQtd('');
    setNewYtd('');
    setNewItd('');
  };

  const deleteAccount = (code: string) => {
    const updated = coa.filter(a => a.code !== code);
    setCoa(updated);
    localStorage.setItem('term_coa_v3', JSON.stringify(updated));
  };

  // Registry Relationships
  const addEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entName) return;

    let targetId = '';
    if (entType === 'LP') {
      const pad = nextLpSequence < 10 ? `0${nextLpSequence}` : `${nextLpSequence}`;
      targetId = `LP-${pad}`;
      const nextSeq = nextLpSequence + 1;
      setNextLpSequence(nextSeq);
      localStorage.setItem('term_lp_seq_v3', nextSeq.toString());
    } else {
      targetId = `${entType.toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    }

    const newRow = {
      id: targetId,
      name: entName,
      commitment: Math.round(parseFloat(entCommitment || '0') * 100),
      unfunded: Math.round(parseFloat(entUnfunded || entCommitment || '0') * 100),
      pct: entPct ? parseFloat(entPct) / 100 : 0.00,
      type: entType,
      targetFund: entFund
    };

    const updated = [...entities, newRow];
    setEntities(updated);
    localStorage.setItem('term_entities_v3', JSON.stringify(updated));
    setEntName('');
    setEntCommitment('');
    setEntUnfunded('');
    setEntPct('');
  };

  const deleteEntity = (id: string) => {
    const updated = entities.filter(e => e.id !== id);
    setEntities(updated);
    localStorage.setItem('term_entities_v3', JSON.stringify(updated));
  };

  // Explicit Tab Descriptor Maps
  const tabsConfig = [
    { id: 'ingestion', label: 'File & Text Import Parsing', icon: '📥' },
    { id: 'ledger', label: 'Transactions - General Ledger', icon: '📖' },
    { id: 'coa', label: 'Accounts Manager', icon: '📊' },
    { id: 'registry', label: 'Funds Partnership Directory', icon: '👥' },
    { id: 'recon', label: 'Reconciliation & Matching', icon: '🔄' },
    { id: 'reports', label: 'Report Depository', icon: '📁' }
  ];

  const getHeaderTitle = () => {
    const match = tabsConfig.find(t => t.id === activeTab);
    return match ? match.label : 'Terminal Core Workspace';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Side Navigation Panel */}
      <div style={{ width: sidebarOpen ? '290px' : '64px', transition: 'width 0.15s ease', background: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b' }}>
        <div style={{ padding: '24px 18px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {sidebarOpen && <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>Terminal Control</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <div style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabsConfig.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 14px',
                border: 'none',
                borderRadius: '6px',
                background: activeTab === tab.id ? '#2563eb' : 'transparent',
                color: '#ffffff',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.icon}</span>
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout Workspace Shell */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '18px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#0f172a' }}>
            {getHeaderTitle()}
          </h2>
          <div style={{ fontSize: '0.72rem', background: '#0f172a', color: 'white', padding: '6px 14px', borderRadius: '4px', fontWeight: 600 }}>
            SYSTEM ENVIRONMENT ACTIVE
          </div>
        </header>

        <main style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
          
          {/* VIEW: FILE & TEXT IMPORT PARSING */}
          {activeTab === 'ingestion' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px' }}>
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>1. Input Text Data</h3>
                  
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste flat notice files or operational logs here..."
                    style={{ width: '100%', height: '315px', padding: '14px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'none' }}
                  />

                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.csv,.json" style={{ display: 'none' }} />
                    <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      Choose File...
                    </button>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Upload external documentation tracks directly</span>
                  </div>

                  <button onClick={handleAiParse} disabled={loading} style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                    {loading ? 'Processing Validation Matrix...' : 'Execute Journal Entry Validation'}
                  </button>
                </div>
              </div>

              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600 }}>2. Validated Double-Entry Results</h3>
                {extractedBatch.length === 0 ? (
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '6px', height: '430px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', backgroundColor: '#ffffff', fontSize: '0.85rem' }}>
                    Pipeline resting. Awaiting operational text data trigger.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#e2e8f0', padding: '12px 16px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Batch Target Ready</span>
                      <button onClick={postToLedgerBatch} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                        Confirm and Commit Transaction Entry Across Core Modules
                      </button>
                    </div>

                    {extractedBatch.map((entry, entryIdx) => (
                      <div key={entryIdx} style={{ background: '#ffffff', padding: '18px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Record Reference Target Line</span>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem', background: '#dcfce7', color: '#166534' }}>VALIDATED</span>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc', textAlign: 'left' }}>
                              <th style={{ padding: '6px' }}>Account Code</th>
                              <th style={{ padding: '6px' }}>Account Name Mapping</th>
                              <th style={{ padding: '6px', textAlign: 'right' }}>Debit</th>
                              <th style={{ padding: '6px', textAlign: 'right' }}>Credit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.suggestedLedgerLines?.map((line: any, lineIdx: number) => (
                              <tr key={lineIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '4px 6px' }}>{line.accountCode}</td>
                                <td style={{ padding: '4px 6px' }}>{getCoaName(line.accountCode)}</td>
                                <td style={{ padding: '4px 6px', textAlign: 'right', color: line.debitInCents > 0 ? '#166534' : 'inherit' }}>
                                  {line.debitInCents > 0 ? (line.debitInCents / 100).toLocaleString() : '-'}
                                </td>
                                <td style={{ padding: '4px 6px', textAlign: 'right', color: line.creditInCents > 0 ? '#b91c1c' : 'inherit' }}>
                                  {line.creditInCents > 0 ? (line.creditInCents / 100).toLocaleString() : '-'}
                                </td>
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

          {/* VIEW: TRANSACTIONS - GENERAL LEDGER */}
          {activeTab === 'ledger' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Audit Journal Record Database</h3>
                <button onClick={addNewManualEntry} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                  + Add New Entry
                </button>
              </div>

              {journalEntries.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>No transactions currently configured in ledger runtime.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {journalEntries.map((entry) => (
                    <div key={entry.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', background: '#ffffff', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>Entry #{entry.id}</span>
                          <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: '#64748b' }}>Date: {entry.date} | Class: {entry.type}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => addLineToEntry(entry.id)} style={{ padding: '4px 10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                            + Add Row Line
                          </button>
                          <button onClick={() => deleteLedgerEntry(entry.id)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>
                            Delete Entry Record
                          </button>
                        </div>
                      </div>
                      
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', color: '#475569', background: '#f8fafc' }}>
                            <th style={{ padding: '8px' }}>Account Code</th>
                            <th style={{ padding: '8px' }}>Account Name Metric Mapping</th>
                            <th style={{ padding: '8px', textAlign: 'right', width: '180px' }}>Debit Balance (USD)</th>
                            <th style={{ padding: '8px', textAlign: 'right', width: '180px' }}>Credit Balance (USD)</th>
                            <th style={{ padding: '8px', textAlign: 'center', width: '80px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.lines?.map((l: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '6px 8px' }}>
                                <input type="text" value={l.accountCode} onChange={(e) => editLedgerLineValue(entry.id, idx, 'code', e.target.value)} style={{ width: '70px', padding: '4px', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                              </td>
                              <td style={{ padding: '6px 8px', color: '#334155' }}>{getCoaName(l.accountCode)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                                <input type="number" value={l.debitInCents / 100} onChange={(e) => editLedgerLineValue(entry.id, idx, 'debit', e.target.value)} style={{ width: '140px', padding: '4px', textAlign: 'right', fontSize: '0.82rem' }} />
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                                <input type="number" value={l.creditInCents / 100} onChange={(e) => editLedgerLineValue(entry.id, idx, 'credit', e.target.value)} style={{ width: '140px', padding: '4px', textAlign: 'right', fontSize: '0.82rem' }} />
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                <button onClick={() => removeLineFromEntry(entry.id, idx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: ACCOUNTS MANAGER */}
          {activeTab === 'coa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 600 }}>Create New Account Track</h4>
                <form onSubmit={addAccount} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Code</label>
                    <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="1100" required style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Account Descriptor Title</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Cash Account" required style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Category</label>
                    <select value={newCat} onChange={(e) => setNewCat(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}>
                      <option value="Asset">Asset</option>
                      <option value="Liability">Liability</option>
                      <option value="Equity">Equity</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Expense">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>MTD ($)</label>
                    <input type="number" value={newMtd} onChange={(e) => setNewMtd(e.target.value)} placeholder="0" style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>QTD ($)</label>
                    <input type="number" value={newQtd} onChange={(e) => setNewQtd(e.target.value)} placeholder="0" style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>YTD ($)</label>
                    <input type="number" value={newYtd} onChange={(e) => setNewYtd(e.target.value)} placeholder="0" style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>ITD ($)</label>
                    <input type="number" value={newItd} onChange={(e) => setNewItd(e.target.value)} placeholder="0" style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <button type="submit" style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                    Save Account
                  </button>
                </form>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Account Code</th>
                    <th style={{ padding: '12px' }}>Account Descriptor Name</th>
                    <th style={{ padding: '12px' }}>Category Hierarchy</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>MTD Balance</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>QTD Balance</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>YTD Balance</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ITD Balance</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coa.map((account) => (
                    <tr key={account.code} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600 }}>{account.code}</td>
                      <td style={{ padding: '12px' }}>{account.name}</td>
                      <td style={{ padding: '12px' }}><span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', background: '#f1f5f9' }}>{account.category}</span></td>
                      <td style={{ padding: '12px', textAlign: 'right', color: account.mtd < 0 ? '#b91c1c' : 'inherit' }}>{account.mtd?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: account.qtd < 0 ? '#b91c1c' : 'inherit' }}>{account.qtd?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: account.ytd < 0 ? '#b91c1c' : 'inherit' }}>{account.ytd?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: account.itd < 0 ? '#b91c1c' : 'inherit' }}>{account.itd?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => deleteAccount(account.code)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: FUNDS PARTNERSHIP DIRECTORY */}
          {activeTab === 'registry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '4px', background: '#ffffff', padding: '8px 8px 0 8px', borderRadius: '6px', border: '1px solid #e2e8f0', borderBottom: 'none' }}>
                {(['ALL', 'LP', 'GP', 'Affiliate'] as const).map(tabKey => (
                  <button
                    key={tabKey}
                    onClick={() => setRegistrySubTab(tabKey.toUpperCase() as any)}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      background: 'transparent',
                      borderBottom: registrySubTab === tabKey.toUpperCase() ? '3px solid #2563eb' : '3px solid transparent',
                      color: registrySubTab === tabKey.toUpperCase() ? '#2563eb' : '#64748b',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {tabKey} Group Records
                  </button>
                ))}
              </div>

              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 600 }}>Add Partnership Node</h4>
                <form onSubmit={addEntity} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Legal Entity Name</label>
                    <input type="text" value={entName} onChange={(e) => setEntName(e.target.value)} placeholder="Summit Capital" required style={{ width: '100%', padding: '6px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Partner Tier</label>
                    <select value={entType} onChange={(e) => setEntType(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '0.82rem', background: '#fff' }}>
                      <option value="LP">Limited Partner (LP)</option>
                      <option value="GP">General Partner (GP)</option>
                      <option value="Affiliate">Affiliate Vendor</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Total Commitment ($)</label>
                    <input type="number" value={entCommitment} onChange={(e) => setEntCommitment(e.target.value)} disabled={entType !== 'LP'} style={{ width: '100%', padding: '6px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Unfunded Baseline ($)</label>
                    <input type="number" value={entUnfunded} onChange={(e) => setEntUnfunded(e.target.value)} disabled={entType !== 'LP'} style={{ width: '100%', padding: '6px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '4px' }}>Pro-Rata Weight (%)</label>
                    <input type="number" step="0.01" value={entPct} onChange={(e) => setEntPct(e.target.value)} disabled={entType !== 'LP'} style={{ width: '100%', padding: '6px', fontSize: '0.82rem' }} />
                  </div>
                  <button type="submit" style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                    Save Partner Node
                  </button>
                </form>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Token Identifier ID</th>
                    <th style={{ padding: '12px' }}>Legal Entity Registered Corporate Name</th>
                    <th style={{ padding: '12px' }}>Registry Class</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Pro-Rata Weight Ratio</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Committed Value</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Unfunded Capital Pool</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.filter(e => registrySubTab === 'ALL' || e.type === registrySubTab).map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>{p.id}</td>
                      <td style={{ padding: '12px' }}>{p.name}</td>
                      <td style={{ padding: '12px' }}><span style={{ padding: '3px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: '#eff6ff' }}>{p.type}</span></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{p.type === 'LP' ? `${(p.pct * 100).toFixed(2)}%` : '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{p.type === 'LP' ? (p.commitment / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{p.type === 'LP' ? (p.unfunded / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => deleteEntity(p.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: RECONCILIATION & MATCHING */}
          {activeTab === 'recon' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['UNMATCHED', 'MATCHED', 'ALL'].map((fKey: any) => (
                    <button
                      key={fKey}
                      onClick={() => setReconFilter(fKey)}
                      style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #cbd5e1', background: reconFilter === fKey ? '#0f172a' : '#ffffff', color: reconFilter === fKey ? '#ffffff' : '#334155', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Filter Views: {fKey}
                    </button>
                  ))}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#334155', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Sub-Ledger Map Class</th>
                    <th style={{ padding: '12px' }}>Code</th>
                    <th style={{ padding: '12px' }}>External Statement Transaction Description</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Internal Book Metric Balance</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>External Statement Balance Target</th>
                    <th style={{ padding: '12px' }}>Audit Run Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {reconData.filter(item => reconFilter === 'ALL' || (reconFilter === 'MATCHED' ? item.isMatched : !item.isMatched)).map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: item.isMatched ? '#f0fdf4' : '#fff1f2' }}>
                      <td style={{ padding: '14px 12px', fontWeight: 600 }}>{item.type}</td>
                      <td style={{ padding: '12px' }}><code>{item.accountCode}</code></td>
                      <td style={{ padding: '12px' }}>{item.description}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{item.internalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{item.externalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                      <td style={{ padding: '12px', fontSize: '0.78rem', color: item.isMatched ? '#166534' : '#b91c1c', fontWeight: 600 }}>{item.isMatched ? 'System Auto-Match' : 'Variance Present'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: REPORT DEPOSITORY */}
          {activeTab === 'reports' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Reference Hash</th>
                  <th style={{ padding: '12px' }}>File Destination</th>
                  <th style={{ padding: '12px' }}>Framework Category</th>
                  <th style={{ padding: '12px' }}>Generation Date</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((rep) => (
                  <tr key={rep.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{rep.id}</td>
                    <td style={{ padding: '12px' }}><code>{rep.name}.{rep.format.toLowerCase()}</code></td>
                    <td style={{ padding: '12px' }}>{rep.type}</td>
                    <td style={{ padding: '12px' }}>{rep.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </main>
      </div>
    </div>
  );
}