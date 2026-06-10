'use client';

import React, { useState, useEffect, useRef } from 'react';

// Initial enterprise configurations
const DEFAULT_COA = [
  { code: '1100', name: 'Cash / Clearing Account', category: 'Asset' },
  { code: '1200', name: 'Private Equity Investments (Fair Value)', category: 'Asset' },
  { code: '1300', name: 'Bank Loans Receivable', category: 'Asset' },
  { code: '3100', name: 'Partners Capital - LP Contributions', category: 'Equity' },
  { code: '3300', name: 'Unfunded Capital Commitments Offset', category: 'Equity' },
  { code: '5100', name: 'Management & Performance Fees', category: 'Expense' }
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
  const [nextLpSequence, setNextLpSequence] = useState<number>(4); // Strict auto-increment pointer
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [extractedBatch, setExtractedBatch] = useState<any[]>([]);

  // Sub-tabs for Relationship Registry Module
  const [registrySubTab, setRegistrySubTab] = useState<'ALL' | 'LP' | 'GP' | 'AFFILIATE'>('ALL');

  // Reconciliation Core State Framework (iRecs Framework)
  const [reconData, setReconData] = useState<any[]>([]);
  const [reconFilter, setReconFilter] = useState<'ALL' | 'UNMATCHED' | 'MATCHED'>('UNMATCHED');

  // Interactive Form Inputs
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('Asset');

  const [entName, setEntName] = useState('');
  const [entCommitment, setEntCommitment] = useState('');
  const [entUnfunded, setEntUnfunded] = useState('');
  const [entPct, setEntPct] = useState('');
  const [entType, setEntType] = useState('LP');
  const [entFund, setEntFund] = useState('AGIP Alternative Investments IV');

  // Hydrate Data Architecture from Storage Layouts
  useEffect(() => {
    const savedCoa = localStorage.getItem('term_coa_v2');
    const savedEntities = localStorage.getItem('term_entities_v2');
    const savedSeq = localStorage.getItem('term_lp_seq');
    const savedLedger = localStorage.getItem('term_ledger_v2');
    const savedReports = localStorage.getItem('term_reports_v2');
    const savedRecon = localStorage.getItem('term_recon_v2');

    setCoa(savedCoa ? JSON.parse(savedCoa) : DEFAULT_COA);
    setEntities(savedEntities ? JSON.parse(savedEntities) : INITIAL_ENTITIES);
    setNextLpSequence(savedSeq ? parseInt(savedSeq, 10) : 4);
    setJournalEntries(savedLedger ? JSON.parse(savedLedger) : []);
    setReports(savedReports ? JSON.parse(savedReports) : [
      { id: 'REP01', name: 'Q2_2026_Comprehensive_Trial_Balance', type: 'Trial Balance', date: '2026-06-09', format: 'PDF' },
      { id: 'REP02', name: 'Master_General_Ledger_Audit_Track', type: 'Ledger Audit', date: '2026-06-10', format: 'CSV' }
    ]);

    const initialReconFeed = [
      { id: 'REC-001', type: 'Cash Clearing', accountCode: '1100', description: 'Institutional Operating Wire Ref: #983421', internalAmount: 0, externalAmount: 1500000, isMatched: false, matchingNotes: '', manualOverride: false },
      { id: 'REC-002', type: 'Portfolio Valuation', accountCode: '1200', description: 'Custodian Valuations Vault Statement Asset Block', internalAmount: 5000000, externalAmount: 5000000, isMatched: true, matchingNotes: 'System Auto-Match', manualOverride: false },
      { id: 'REC-003', type: 'Registry Allocation', accountCode: '3100', description: 'Partners Capital Base Ingestion Delta', internalAmount: 0, externalAmount: 500000, isMatched: false, matchingNotes: '', manualOverride: false }
    ];
    setReconData(savedRecon ? JSON.parse(savedRecon) : initialReconFeed);
  }, []);

  // Synchronize internal calculations into Reconciliation Core variables
  useEffect(() => {
    setReconData(prev => {
      return prev.map(item => {
        if (item.manualOverride) return item; // Preserve manual user inputs
        
        let calculatedInternal = 0;
        if (item.accountCode === '1200') calculatedInternal = 5000000; 
        if (item.accountCode === '3100') calculatedInternal = 500000; 

        journalEntries.forEach(entry => {
          entry.lines?.forEach((l: any) => {
            if (l.accountCode === item.accountCode) {
              calculatedInternal += (Number(l.debitInCents) - Number(l.creditInCents)) / 100;
            }
          });
        });

        const absInternal = Math.abs(calculatedInternal);
        // Auto-match logic if values balance cleanly
        const automaticallyMatches = absInternal === item.externalAmount;

        return {
          ...item,
          internalAmount: absInternal,
          isMatched: item.matchingNotes === 'User Manual Verification' ? item.isMatched : automaticallyMatches,
          matchingNotes: item.matchingNotes === 'User Manual Verification' ? item.matchingNotes : (automaticallyMatches ? 'System Auto-Match' : 'Variance Present')
        };
      });
    });
  }, [journalEntries]);

  const saveRecon = (data: any[]) => {
    setReconData(data);
    localStorage.setItem('term_recon_v2', JSON.stringify(data));
  };

  const getCoaName = (code: string) => {
    return coa.find(a => a.code === code)?.name || 'Unmapped Target Sub-Ledger';
  };

  // Automated/Manual File Ingestion Router Engine
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      setInputText(text);
      alert(`File parsed into memory buffer: "${file.name}" (${text.length} characters loaded). Proceed with extraction.`);
    };
    reader.readAsText(file);
  };

  async function handleAiParse() {
    if (!inputText.trim()) {
      alert('Provide raw source string text or load an external file target first.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: inputText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const verified = (data.entries || []).map((entry: any) => {
        let status = 'VALIDATED';
        let exceptionReason = '';
        
        if (entry.transactionType === 'Capital Drawdown Record') {
          const lpHeadroom = entities.filter(e => e.type === 'LP').reduce((s, p) => s + p.unfunded, 0);
          if (entry.totalAmountInCents > lpHeadroom) {
            status = 'EXCEPTION';
            exceptionReason = 'Threshold Breach: Outstanding drawdown request violates cumulative unfunded liquidity pool parameters.';
          }
        }
        return { ...entry, status, exceptionReason };
      });

      setExtractedBatch(verified);
    } catch (err: any) {
      alert(err.message || 'Parsing pipeline failure.');
    } finally {
      setLoading(false);
    }
  }

  // Interactive In-Memory Card Alterations
  const updatePreviewLine = (entryIdx: number, lineIdx: number, field: string, val: string) => {
    const freshBatch = [...extractedBatch];
    const numericVal = Math.round(parseFloat(val || '0') * 100);
    if (field === 'debit') freshBatch[entryIdx].suggestedLedgerLines[lineIdx].debitInCents = numericVal;
    if (field === 'credit') freshBatch[entryIdx].suggestedLedgerLines[lineIdx].creditInCents = numericVal;
    if (field === 'code') freshBatch[entryIdx].suggestedLedgerLines[lineIdx].accountCode = val;
    setExtractedBatch(freshBatch);
  };

  function postToLedgerBatch() {
    if (extractedBatch.length === 0) return;

    let updatedLedger = [...journalEntries];
    let updatedEntities = [...entities];

    extractedBatch.forEach((entry) => {
      const uniqueSerial = Math.floor(1000 + Math.random() * 9000);
      const targetId = `JE${uniqueSerial}`; // Aligned directly to JE-XXXX numbering (no formatting dashes inside string)

      const newEntry = {
        id: targetId,
        date: '2026-06-10',
        fundName: entry.fundName,
        type: entry.transactionType,
        status: entry.status,
        reason: entry.exceptionReason,
        lines: entry.suggestedLedgerLines || []
      };
      
      updatedLedger = [newEntry, ...updatedLedger];

      if (entry.transactionType === 'Capital Drawdown Record' && entry.status === 'VALIDATED') {
        updatedEntities = updatedEntities.map(p => {
          if (p.type !== 'LP') return p;
          return {
            ...p,
            unfunded: Math.max(0, p.unfunded - (entry.totalAmountInCents * p.pct))
          };
        });
      }
    });

    setEntities(updatedEntities);
    setJournalEntries(updatedLedger);
    
    localStorage.setItem('term_entities_v2', JSON.stringify(updatedEntities));
    localStorage.setItem('term_ledger_v2', JSON.stringify(updatedLedger));

    setExtractedBatch([]);
    setInputText('');
    alert('Payload committed successfully across modules.');
  }

  // Live General Ledger Manipulations
  const editLedgerLineValue = (entryId: string, lineIdx: number, field: 'code' | 'debit' | 'credit', val: string) => {
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
    setJournalEntries(updated);
    localStorage.setItem('term_ledger_v2', JSON.stringify(updated));
  };

  const deleteLedgerEntry = (entryId: string) => {
    const updated = journalEntries.filter(e => e.id !== entryId);
    setJournalEntries(updated);
    localStorage.setItem('term_ledger_v2', JSON.stringify(updated));
  };

  // Chart of Accounts Handlers
  const addAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    if (coa.some(a => a.code === newCode)) {
      alert('Mapping collision: Serial allocation already initialized.');
      return;
    }
    const updated = [...coa, { code: newCode, name: newName, category: newCat }].sort((a,b) => a.code.localeCompare(b.code));
    setCoa(updated);
    localStorage.setItem('term_coa_v2', JSON.stringify(updated));
    setNewCode('');
    setNewName('');
  };

  const deleteAccount = (code: string) => {
    const updated = coa.filter(a => a.code !== code);
    setCoa(updated);
    localStorage.setItem('term_coa_v2', JSON.stringify(updated));
  };

  // Sequential Capital Account Registration Handlers
  const addEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entName) return;

    let targetId = '';
    if (entType === 'LP') {
      // Build string using fixed padded sequence rule: LP-XX
      const pad = nextLpSequence < 10 ? `0${nextLpSequence}` : `${nextLpSequence}`;
      targetId = `LP-${pad}`;
      const nextSeq = nextLpSequence + 1;
      setNextLpSequence(nextSeq);
      localStorage.setItem('term_lp_seq', nextSeq.toString());
    } else if (entType === 'GP') {
      targetId = `GP-${Math.floor(10 + Math.random() * 90)}`;
    } else {
      targetId = `AFF-${Math.floor(10 + Math.random() * 90)}`;
    }

    const commValue = Math.round(parseFloat(entCommitment || '0') * 100);
    const unfundValue = entUnfunded ? Math.round(parseFloat(entUnfunded) * 100) : commValue;
    const pctValue = entPct ? parseFloat(entPct) / 100 : 0.00;

    const newRow = {
      id: targetId,
      name: entName,
      commitment: commValue,
      unfunded: unfundValue,
      pct: pctValue,
      type: entType,
      targetFund: entFund
    };

    const updated = [...entities, newRow];
    setEntities(updated);
    localStorage.setItem('term_entities_v2', JSON.stringify(updated));
    
    setEntName('');
    setEntCommitment('');
    setEntUnfunded('');
    setEntPct('');
  };

  const deleteEntity = (id: string) => {
    const updated = entities.filter(e => e.id !== id);
    setEntities(updated);
    localStorage.setItem('term_entities_v2', JSON.stringify(updated));
  };

  // Manual Interlocking Reconciliation Routines (iRecs Framework)
  const toggleManualMatch = (id: string) => {
    const updated = reconData.map(item => {
      if (item.id !== id) return item;
      const targetState = !item.isMatched;
      return {
        ...item,
        isMatched: targetState,
        manualOverride: true,
        matchingNotes: targetState ? 'User Manual Verification' : 'Manual Break Uncoupled'
      };
    });
    saveRecon(updated);
  };

  const setManualExternalAmount = (id: string, value: string) => {
    const updated = reconData.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        externalAmount: parseFloat(value || '0'),
        manualOverride: true
      };
    });
    saveRecon(updated);
  };

  const filteredEntities = entities.filter(e => {
    if (registrySubTab === 'ALL') return true;
    return e.type === registrySubTab;
  });

  const filteredReconData = reconData.filter(item => {
    if (reconFilter === 'ALL') return true;
    if (reconFilter === 'MATCHED') return item.isMatched;
    return !item.isMatched;
  });

  const triggerDownload = (fileName: string, format: string) => {
    const dataString = `Investments Explorer Vault File\nReport Designation: ${fileName}\nGenerated: 2026-06-10`;
    const fileBlob = new Blob([dataString], { type: 'text/plain' });
    const downloadUrl = URL.createObjectURL(fileBlob);
    const linkElement = document.createElement('a');
    linkElement.href = downloadUrl;
    linkElement.download = `${fileName}.${format.toLowerCase()}`;
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* SIDEBAR COMPONENT CONTAINER */}
      <div style={{ width: sidebarOpen ? '290px' : '64px', transition: 'width 0.15s ease', background: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', boxSizing: 'border-box' }}>
        <div style={{ padding: '24px 18px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {sidebarOpen && <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#ffffff' }}>Investments Explorer</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <div style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {([
            { id: 'ingestion', label: 'File Import Parsing', icon: '📥' },
            { id: 'ledger', label: 'Transaction General Ledger', icon: '📖' },
            { id: 'coa', label: 'Chart of Accounts Manager', icon: '📊' },
            { id: 'registry', label: 'Partnership Registry Ledger', icon: '👥' },
            { id: 'recon', label: 'Reconciliation Module Terminal', icon: '🔄' },
            { id: 'reports', label: 'Report Depository Vault', icon: '📁' }
          ]).map(tab => (
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
                background: activeTab === tab.id ? '#1e293b' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 500,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'all 0.1s ease'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* CORE FRAME LAYOUT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '18px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#0f172a' }}>
            {activeTab === 'ingestion' && 'Multi-Asset Log File Import Parsing Engine'}
            {activeTab === 'ledger' && 'Interactive Audit Journal Master Adjustment Sheet'}
            {activeTab === 'coa' && 'Chart of Accounts Configuration Matrix'}
            {activeTab === 'registry' && 'Fund Relationship Allocation Grid'}
            {activeTab === 'recon' && 'Reconciliation Module Workspace'}
            {activeTab === 'reports' && 'Corporate Performance Report Vault'}
          </h2>
          <div style={{ fontSize: '0.72rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '4px', fontWeight: 600, color: '#475569' }}>
            ENVIRONMENT SECURE • ACTIVE
          </div>
        </header>

        <main style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
          
          {/* VIEWPORT: FILE IMPORT PARSING */}
          {activeTab === 'ingestion' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyBreak: 'space-between', marginBottom: '12px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: '#0f172a', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>Ingestion Input Buffer</h3>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.csv,.json" style={{ display: 'none' }} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                    Choose File Base Target...
                  </button>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Supports systemic flat-files, text payloads, or transaction reports</span>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste notice files directly or use the automated loader above..."
                  style={{ width: '100%', height: '315px', padding: '14px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem', background: '#ffffff', resize: 'none' }}
                />
                <button onClick={handleAiParse} disabled={loading} style={{ marginTop: '14px', width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                  {loading ? 'Executing Engine Extraction Layout Tokenization...' : 'Execute Structural Ledger Extraction'}
                </button>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: '#0f172a', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>Structured Multi-Entry Verification Matrix</h3>
                </div>
                {extractedBatch.length === 0 ? (
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '6px', height: '430px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', backgroundColor: '#ffffff', fontSize: '0.85rem' }}>
                    Verification channel idle. Initiate parsing pipeline to isolate ledger targets.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#e2e8f0', padding: '12px 16px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Extracted Workspace: {extractedBatch.length} Objects Isolated</span>
                      <button onClick={postToLedgerBatch} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                        Commit All Entries to Modules
                      </button>
                    </div>

                    {extractedBatch.map((entry, entryIdx) => (
                      <div key={entry.id || entryIdx} style={{ background: '#ffffff', padding: '18px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{entry.id} — {entry.transactionType}</span>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.7rem', background: entry.status === 'EXCEPTION' ? '#fee2e2' : '#dcfce7', color: entry.status === 'EXCEPTION' ? '#991b1b' : '#166534' }}>
                            {entry.status}
                          </span>
                        </div>

                        {entry.status === 'EXCEPTION' && (
                          <div style={{ background: '#fef3c7', color: '#92400e', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '12px', border: '1px solid #fde68a' }}>
                            {entry.exceptionReason}
                          </div>
                        )}

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginTop: '12px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc', textAlign: 'left' }}>
                              <th style={{ padding: '6px' }}>Code Target</th>
                              <th style={{ padding: '6px' }}>Sub-Ledger Label</th>
                              <th style={{ padding: '6px', textAlign: 'right' }}>Debit (USD)</th>
                              <th style={{ padding: '6px', textAlign: 'right' }}>Credit (USD)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.suggestedLedgerLines?.map((line: any, lineIdx: number) => (
                              <tr key={lineIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '4px 6px' }}>
                                  <input type="text" value={line.accountCode} onChange={(e) => updatePreviewLine(entryIdx, lineIdx, 'code', e.target.value)} style={{ width: '55px', padding: '4px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'monospace' }} />
                                </td>
                                <td style={{ padding: '4px 6px', color: '#475569' }}>{getCoaName(line.accountCode)}</td>
                                <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                                  <input type="number" defaultValue={(line.debitInCents / 100)} onBlur={(e) => updatePreviewLine(entryIdx, lineIdx, 'debit', e.target.value)} style={{ width: '90px', padding: '4px', textAlign: 'right', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </td>
                                <td style={{ padding: '4px 6px', textAlign: 'right' }}>
                                  <input type="number" defaultValue={(line.creditInCents / 100)} onBlur={(e) => updatePreviewLine(entryIdx, lineIdx, 'credit', e.target.value)} style={{ width: '90px', padding: '4px', textAlign: 'right', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
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

          {/* VIEWPORT: INTERACTIVE TRANSACTION GENERAL LEDGER */}
          {activeTab === 'ledger' && (
            <div>
              {journalEntries.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1', color: '#64748b' }}>No record mappings saved down to operational ledger blocks.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {journalEntries.map((entry) => (
                    <div key={entry.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', background: '#ffffff', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{entry.id}</span>
                          <span style={{ marginLeft: '12px', padding: '2px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{entry.type}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Effective Book Date: {entry.date} | Entity: {entry.fundName}</span>
                          <button onClick={() => deleteLedgerEntry(entry.id)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            Action: Delete Record
                          </button>
                        </div>
                      </div>
                      
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', color: '#475569', background: '#f8fafc' }}>
                            <th style={{ padding: '8px' }}>Account Code Target</th>
                            <th style={{ padding: '8px' }}>Dynamic Allocation Map Label</th>
                            <th style={{ padding: '8px', textAlign: 'right', width: '160px' }}>Debit Balance Override (USD)</th>
                            <th style={{ padding: '8px', textAlign: 'right', width: '160px' }}>Credit Balance Override (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.lines?.map((l: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '6px 8px' }}>
                                <input type="text" value={l.accountCode} onChange={(e) => editLedgerLineValue(entry.id, idx, 'code', e.target.value)} style={{ width: '60px', padding: '4px', fontFamily: 'monospace', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                              </td>
                              <td style={{ padding: '6px 8px', color: '#334155' }}>{getCoaName(l.accountCode)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                                <input type="number" value={l.debitInCents / 100} onChange={(e) => editLedgerLineValue(entry.id, idx, 'debit', e.target.value)} style={{ width: '130px', padding: '4px', textAlign: 'right', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                                <input type="number" value={l.creditInCents / 100} onChange={(e) => editLedgerLineValue(entry.id, idx, 'credit', e.target.value)} style={{ width: '130px', padding: '4px', textAlign: 'right', fontSize: '0.82rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
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

          {/* VIEWPORT: CHART OF ACCOUNTS */}
          {activeTab === 'coa' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '6px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 600 }}>Provision Mapping Track</h4>
                <form onSubmit={addAccount} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Account Number String</label>
                    <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="e.g., 1400" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Sub-Ledger Label Descriptive String</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Retained Ledger Reserves" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Ledger Class</label>
                    <select value={newCat} onChange={(e) => setNewCat(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', background: '#fff' }}>
                      <option value="Asset">Asset</option>
                      <option value="Liability">Liability</option>
                      <option value="Equity">Equity</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Expense">Expense</option>
                    </select>
                  </div>
                  <button type="submit" style={{ padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', marginTop: '6px' }}>
                    Action: Inject Map Entry
                  </button>
                </form>
              </div>

              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Code ID</th>
                      <th style={{ padding: '12px' }}>Account Map Descriptor Label</th>
                      <th style={{ padding: '12px' }}>Classification Framework</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coa.map((account) => (
                      <tr key={account.code} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600 }}>{account.code}</td>
                        <td style={{ padding: '12px' }}>{account.name}</td>
                        <td style={{ padding: '12px' }}><span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#334155' }}>{account.category}</span></td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button onClick={() => deleteAccount(account.code)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                            Action: Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEWPORT: PARTNERSHIP REGISTRY LEDGER WITH AFFILIATE SUB-TABS */}
          {activeTab === 'registry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* SUB-TAB NAV BAR */}
              <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '4px', background: '#ffffff', padding: '8px 8px 0 8px', borderRadius: '6px 6px 0 0', border: '1px solid #e2e8f0', borderBottom: 'none' }}>
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
                      cursor: 'pointer',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    {tabKey} Block Layers
                  </button>
                ))}
              </div>

              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 600 }}>Manual Registry Relationship Provisioner</h4>
                <form onSubmit={addEntity} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '4px' }}>Entity Profile Name Label</label>
                    <input type="text" value={entName} onChange={(e) => setEntName(e.target.value)} placeholder="e.g., Summit Pension Group" required style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '4px' }}>Category Allocation Node</label>
                    <select value={entType} onChange={(e) => setEntType(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem', background: '#fff' }}>
                      <option value="LP">Limited Partner (LP)</option>
                      <option value="GP">General Partner (GP)</option>
                      <option value="Affiliate">Affiliate Vendor / Advisor</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '4px' }}>Gross Commitment Base ($)</label>
                    <input type="number" value={entCommitment} onChange={(e) => setEntCommitment(e.target.value)} disabled={entType !== 'LP'} placeholder={entType !== 'LP' ? 'N/A' : '0.00'} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '4px' }}>Unfunded Capital ($)</label>
                    <input type="number" value={entUnfunded} onChange={(e) => setEntUnfunded(e.target.value)} disabled={entType !== 'LP'} placeholder={entType !== 'LP' ? 'N/A' : 'Defaults to base'} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#475569', marginBottom: '4px' }}>Pro-Rata Weight Ratio (%)</label>
                    <input type="number" step="0.01" value={entPct} onChange={(e) => setEntPct(e.target.value)} disabled={entType !== 'LP'} placeholder={entType !== 'LP' ? 'N/A' : '0.00'} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }} />
                  </div>
                  <button type="submit" style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                    Action: Save Node
                  </button>
                </form>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Structural Token ID</th>
                    <th style={{ padding: '12px' }}>Legal Entity Relationship Identity Title</th>
                    <th style={{ padding: '12px' }}>Structural Group</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Pro-Rata Weight Ratio</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Total Committed Value</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Unfunded Headroom Target Balance</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntities.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#475569', fontFamily: 'monospace' }}>{p.id}</td>
                      <td style={{ padding: '12px' }}>{p.name}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: p.type === 'LP' ? '#eff6ff' : p.type === 'GP' ? '#fdf2f8' : '#f0fdf4', color: p.type === 'LP' ? '#1e40af' : p.type === 'GP' ? '#9d174d' : '#166534' }}>
                          {p.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{p.type === 'LP' ? `${(p.pct * 100).toFixed(2)}%` : '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{p.type === 'LP' ? (p.commitment / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500 }}>
                        {p.type === 'LP' ? (p.unfunded / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '-'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => deleteEntity(p.id)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                          Action: Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEWPORT: RECONCILIATION MODULE WORKSPACE (iRecs Framework Layout Replacement) */}
          {activeTab === 'recon' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['UNMATCHED', 'MATCHED', 'ALL'] as const).map(fKey => (
                    <button
                      key={fKey}
                      onClick={() => setReconFilter(fKey)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: reconFilter === fKey ? '#0f172a' : '#ffffff',
                        color: reconFilter === fKey ? '#ffffff' : '#334155',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Filter Views: {fKey}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Manual Verification Mode Enabled • Simulating Advanced Corporate iRecs Terminal Controls</span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#334155', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Sub-Ledger Map Class</th>
                    <th style={{ padding: '12px' }}>Code</th>
                    <th style={{ padding: '12px' }}>External Statement Transaction Description</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Internal Book Metric Balance</th>
                    <th style={{ padding: '12px', textAlign: 'right', width: '150px' }}>External Statement Balance Target</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Variance Gap Break</th>
                    <th style={{ padding: '12px' }}>Audit Run Notes</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReconData.map((item) => {
                    const varianceBreakValue = item.internalAmount - item.externalAmount;
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: item.isMatched ? '#f0fdf4' : '#fff1f2' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 600 }}>{item.type}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{item.accountCode}</span>
                        </td>
                        <td style={{ padding: '12px', color: '#475569' }}>{item.description}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                          {item.internalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <input
                            type="number"
                            defaultValue={item.externalAmount}
                            onBlur={(e) => setManualExternalAmount(item.id, e.target.value)}
                            style={{ width: '110px', padding: '4px', textAlign: 'right', fontFamily: 'monospace', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.82rem' }}
                          />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: varianceBreakValue === 0 ? '#166534' : '#991b1b' }}>
                          {varianceBreakValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: '0.78rem', color: item.isMatched ? '#166534' : '#b91c1c', fontWeight: 600 }}>
                            {item.matchingNotes}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => toggleManualMatch(item.id)}
                            style={{
                              padding: '6px 12px',
                              background: item.isMatched ? '#ea580c' : '#16a34a',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            {item.isMatched ? 'Action: Uncouple Match' : 'Action: Force Match'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEWPORT: REPORT DEPOSITORY VAULT */}
          {activeTab === 'reports' && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Report Reference Hash</th>
                    <th style={{ padding: '12px' }}>Manifest Filename Destination</th>
                    <th style={{ padding: '12px' }}>Financial Framework Section</th>
                    <th style={{ padding: '12px' }}>Generation Run Stamp Date</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((rep) => (
                    <tr key={rep.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#64748b' }}>{rep.id}</td>
                      <td style={{ padding: '12px' }}><code>{rep.name}</code></td>
                      <td style={{ padding: '12px' }}>{rep.type}</td>
                      <td style={{ padding: '12px' }}>{rep.date}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => triggerDownload(rep.name, rep.format)} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                          Action: Download Export File .{rep.format.toLowerCase()}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}