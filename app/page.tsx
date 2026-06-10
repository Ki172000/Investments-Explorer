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
  const [reconFilter, setReconFilter] = useState<'ALL' | 'UNMATCHED' | 'MATCHED'>('UNMATCHED');
  const [reconData, setReconData] = useState<any[]>([]);

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
      setJournalEntries([
        {
          id: 1,
          date: '2026-06-10',
          fundName: 'AGIP Alternative Investments IV',
          type: 'Management Fee Expense Notice',
          status: 'VALIDATED',
          reason: '',
          lines: [
            { accountCode: '5100', debitInCents: 125000000, creditInCents: 0 },
            { accountCode: '1100', debitInCents: 0, creditInCents: 125000000 }
          ]
        }
      ]);
    }

    setReports(savedReports ? JSON.parse(savedReports) : [
      { id: 'REP01', name: 'Q2_2026_Trial_Balance', type: 'Trial Balance', date: '2026-06-09', format: 'PDF' },
      { id: 'REP02', name: 'General_Ledger_Audit_Log', type: 'Ledger Audit', date: '2026-06-10', format: 'CSV' }
    ]);

    setReconData(savedRecon ? JSON.parse(savedRecon) : [
      { id: 'REC-001', type: 'Cash Clearing', accountCode: '1100', description: 'Institutional Operating Wire Ref: #983421', internalAmount: 0, externalAmount: 1250000, isMatched: false, matchingNotes: '', manualOverride: false },
      { id: 'REC-002', type: 'Portfolio Valuation', accountCode: '1200', description: 'Custodian Valuations Vault Statement Asset Block', internalAmount: 5000000, externalAmount: 5000000, isMatched: true, matchingNotes: 'System Auto-Match', manualOverride: false }
    ]);
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
      setInputText(evt.target?.result as string);
    };
    reader.readAsText(file);
  };

  async function handleAiParse() {
    if (!inputText.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setExtractedBatch([
        {
          id: journalEntries.length + 1,
          transactionType: 'Advisory and Operational Expense',
          fundName: 'AGIP Alternative Investments IV',
          status: 'VALIDATED',
          exceptionReason: '',
          suggestedLedgerLines: [
            { accountCode: '5100', debitInCents: 125000000, creditInCents: 0 },
            { accountCode: '1100', debitInCents: 0, creditInCents: 125000000 }
          ]
        }
      ]);
      setLoading(false);
    }, 400);
  }

  function postToLedgerBatch() {
    if (extractedBatch.length === 0) return;
    let currentEntries = [...journalEntries];
    extractedBatch.forEach((entry) => {
      currentEntries.push({
        id: currentEntries.length > 0 ? Math.max(...currentEntries.map(e => e.id)) + 1 : 1,
        date: '2026-06-10',
        fundName: entry.fundName,
        type: entry.transactionType,
        status: entry.status,
        reason: entry.exceptionReason,
        lines: entry.suggestedLedgerLines || []
      });
    });
    saveAndSyncLedger(currentEntries);
    setExtractedBatch([]);
    setInputText('');
  }

  // Exact Sidebar configuration mapping directly to image_fc963c.png & image_d494fd.png
  const sidebarTabs = [
    { id: 'ingestion', label: 'Document Ingestion Console', icon: '📥' },
    { id: 'ledger', label: 'Transaction General Ledger', icon: '📖' },
    { id: 'coa', label: 'Chart of Accounts Manager', icon: '📊' },
    { id: 'registry', label: 'Partnership Registry Ledger', icon: '👥' },
    { id: 'recon', label: 'Reconciliation Audit Suite', icon: '🔄' },
    { id: 'reports', label: 'Report Depository Vault', icon: '📁' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* LEFT SIDEBAR CONTROLLER */}
      <div style={{ width: '280px', background: '#0b1329', color: '#cbd5e1', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b' }}>
        <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>Asset Explorer Core</span>
          <span style={{ fontSize: '0.8rem', color: '#64748b', cursor: 'pointer' }}>◀</span>
        </div>
        
        <div style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
          {sidebarTabs.map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: isSelected ? '#1e293b' : 'transparent',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  fontSize: '0.88rem',
                  fontWeight: isSelected ? 600 : 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease'
                }}
              >
                <span style={{ fontSize: '1.05rem' }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT CONTENT FRAMEWORK WORKSPACE */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Main Workspace Top Header Row */}
        <div style={{ borderBottom: '1px solid #e2e8f0', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {activeTab === 'ingestion' ? 'Document Ingestion & Exception Breakdown' : sidebarTabs.find(t => t.id === activeTab)?.label}
          </h1>
          <div style={{ fontSize: '0.72rem', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', padding: '6px 12px', borderRadius: '4px', fontWeight: 600, letterSpacing: '0.03em' }}>
            ENVIRONMENT SECURE • ACTIVE
          </div>
        </div>

        {/* Dynamic Panels Content Root */}
        <div style={{ padding: '32px', flexGrow: 1, background: '#ffffff' }}>
          
          {/* VIEW: DOCUMENT INGESTION CONSOLE */}
          {activeTab === 'ingestion' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '40px', alignItems: 'start' }}>
                
                {/* Panel 1: Ingestion Input Box Setup */}
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                    1. Unstructured Document Ingestion Pipeline
                  </h3>
                  
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste unstructured batch financial communication logs here..."
                      style={{ width: '100%', height: '380px', padding: '16px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: '1.5', resize: 'none', background: '#ffffff', outline: 'none' }}
                    />
                    
                    {/* Floating Base Target Button Link */}
                    <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.csv,.json" style={{ display: 'none' }} />
                      <button onClick={() => fileInputRef.current?.click()} style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                        Choose File Base Target...
                      </button>
                    </div>
                  </div>

                  {/* Absolute Full-Width Royal Blue Action Button Component */}
                  <button 
                    onClick={handleAiParse} 
                    disabled={loading || !inputText.trim()} 
                    style={{ width: '100%', marginTop: '16px', padding: '14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: inputText.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.92rem', letterSpacing: '-0.01em', opacity: inputText.trim() ? 1 : 0.6 }}
                  >
                    {loading ? 'Analyzing Pipeline Logs...' : 'Execute Structured Ledger Extraction'}
                  </button>
                </div>

                {/* Panel 2: Live Double Entry Validation Preview Row Container */}
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                    2. Live Double-Entry Batch Preview
                  </h3>
                  
                  {extractedBatch.length === 0 ? (
                    <div style={{ border: '1px dashed #cbd5e1', borderRadius: '6px', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', backgroundColor: '#ffffff', fontSize: '0.88rem' }}>
                      Pipeline resting. Awaiting operational text engine data trigger.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      <div style={{ background: '#f1f5f9', padding: '14px 18px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>Batch Target Ready</span>
                        <button onClick={postToLedgerBatch} style={{ padding: '8px 16px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                          Confirm and Commit Transaction Entry Across Core Modules
                        </button>
                      </div>

                      {extractedBatch.map((entry, entryIdx) => (
                        <div key={entryIdx} style={{ background: '#ffffff', padding: '20px', borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>Record Reference Target Line</span>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem', background: '#dcfce7', color: '#166534', letterSpacing: '0.02em' }}>VALIDATED</span>
                          </div>

                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                                <th style={{ padding: '8px' }}>Account Code</th>
                                <th style={{ padding: '8px' }}>Account Name Mapping</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Debit</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.suggestedLedgerLines?.map((line: any, lineIdx: number) => (
                                <tr key={lineIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: '#0f172a' }}>{line.accountCode}</td>
                                  <td style={{ padding: '10px 8px', color: '#475569' }}>{getCoaName(line.accountCode)}</td>
                                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 500, color: line.debitInCents > 0 ? '#166534' : '#94a3b8' }}>
                                    {line.debitInCents > 0 ? (line.debitInCents / 100).toLocaleString() : '-'}
                                  </td>
                                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 500, color: line.creditInCents > 0 ? '#b91c1c' : '#94a3b8' }}>
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
            </div>
          )}

          {/* VIEW: TRANSACTION GENERAL LEDGER */}
          {activeTab === 'ledger' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>Active Ledger Journal Records</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Entry ID</th>
                    <th style={{ padding: '10px' }}>Value Date</th>
                    <th style={{ padding: '10px' }}>Classification Type</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Status Matrix</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>#{e.id}</td>
                      <td style={{ padding: '12px 10px' }}>{e.date}</td>
                      <td style={{ padding: '12px 10px' }}>{e.type}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', color: '#166534', fontWeight: 700 }}>{e.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: CHART OF ACCOUNTS MANAGER */}
          {activeTab === 'coa' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>Chart of Accounts Directory</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Code</th>
                    <th style={{ padding: '10px' }}>Account Name Metric Mapping</th>
                    <th style={{ padding: '10px' }}>Category Hierarchy</th>
                  </tr>
                </thead>
                <tbody>
                  {coa.map(a => (
                    <tr key={a.code} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 600 }}>{a.code}</td>
                      <td style={{ padding: '12px 10px' }}>{a.name}</td>
                      <td style={{ padding: '12px 10px' }}>{a.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: PARTNERSHIP REGISTRY LEDGER */}
          {activeTab === 'registry' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>Partnership Node Directory</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Token Identifier ID</th>
                    <th style={{ padding: '10px' }}>Legal Entity Name</th>
                    <th style={{ padding: '10px' }}>Registry Class</th>
                  </tr>
                </thead>
                <tbody>
                  {entities.map(ent => (
                    <tr key={ent.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>{ent.id}</td>
                      <td style={{ padding: '12px 10px' }}>{ent.name}</td>
                      <td style={{ padding: '12px 10px' }}>{ent.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: RECONCILIATION AUDIT SUITE */}
          {activeTab === 'recon' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>Reconciliation Core Ledger Track</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Sub-Ledger Map Class</th>
                    <th style={{ padding: '10px' }}>Internal Book Metric</th>
                    <th style={{ padding: '10px' }}>External Statement</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reconData.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>{r.type}</td>
                      <td style={{ padding: '12px 10px' }}>{(r.internalAmount).toLocaleString()}</td>
                      <td style={{ padding: '12px 10px' }}>{(r.externalAmount).toLocaleString()}</td>
                      <td style={{ padding: '12px 10px', color: r.isMatched ? '#166534' : '#b91c1c', fontWeight: 600 }}>
                        {r.isMatched ? 'Matched' : 'Variance Present'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: REPORT DEPOSITORY VAULT */}
          {activeTab === 'reports' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>Secure Generated Reports Vault</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Reference Hash</th>
                    <th style={{ padding: '10px' }}>File Destination Name</th>
                    <th style={{ padding: '10px' }}>Framework Category</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(rep => (
                    <tr key={rep.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>{rep.id}</td>
                      <td style={{ padding: '12px 10px' }}>{rep.name}.{rep.format.toLowerCase()}</td>
                      <td style={{ padding: '12px 10px' }}>{rep.type}</td>
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