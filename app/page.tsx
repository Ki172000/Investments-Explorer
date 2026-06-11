'use client';

import React, { useState, useEffect, useRef } from 'react';

// Baseline Configurations
const DEFAULT_COA = [
  { code: '1100', name: 'Cash / Clearing Account', category: 'Asset', description: 'Main clearing custody cash balances', mtd: 1250000, qtd: 5000000, ytd: 12000000, itd: 45000000 },
  { code: '1200', name: 'Private Equity Investments (Fair Value)', category: 'Asset', description: 'Partnership portfolio underlying cost/fv valuation', mtd: 5000000, qtd: 15000000, ytd: 45000000, itd: 120000000 },
  { code: '1300', name: 'Bank Loans Receivable', category: 'Asset', description: 'Senior secured floating rate debt issues', mtd: 0, qtd: 2500000, ytd: 8000000, itd: 22000000 },
  { code: '3100', name: 'Partners Capital - LP Contributions', category: 'Equity', description: 'Limited Partner drawn down cash holdings', mtd: 0, qtd: -10000000, ytd: -35000000, itd: -110000000 },
  { code: '3300', name: 'Unfunded Capital Commitments Offset', category: 'Equity', description: 'Contra equity balance for callable capital allocations', mtd: -4000000, qtd: -12000000, ytd: -12000000, itd: -40000000 },
  { code: '5100', name: 'Management & Performance Fees', category: 'Expense', description: 'Accrued fund manager operational calculations', mtd: 1250000, qtd: 3750000, ytd: 3750000, itd: 15000000 }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('ingestion');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // App Core States
  const [coa, setCoa] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [extractedBatch, setExtractedBatch] = useState<any[]>([]);

  // Accounts Manager UI States
  const [balanceFilter, setBalanceFilter] = useState<'MTD' | 'QTD' | 'YTD' | 'ITD'>('MTD');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Account Form Control
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Asset');
  const [newDesc, setNewDesc] = useState('');

  // Selected GL Entry for explicit edit/delete actions
  const [selectedGlId, setSelectedGlId] = useState<string | null>(null);
  const [isEditingGl, setIsEditingGl] = useState(false);

  // Hydrate from Storage Architecture
  useEffect(() => {
    const savedCoa = localStorage.getItem('term_coa_v4');
    const savedLedger = localStorage.getItem('term_ledger_v4');

    setCoa(savedCoa ? JSON.parse(savedCoa) : DEFAULT_COA);
    
    if (savedLedger) {
      setJournalEntries(JSON.parse(savedLedger));
    } else {
      setJournalEntries([
        {
          id: 'GL-0001',
          date: '2026-06-10',
          type: 'Automated System Ingestion - Multi-Line Allocation',
          status: 'VALIDATED',
          origin: 'AUTOMATED',
          lines: [
            { accountCode: '5100', debit: 1250000, credit: 0 },
            { accountCode: '1100', debit: 0, credit: 1250000 }
          ]
        },
        {
          id: 'GL-0002',
          date: '2026-06-11',
          type: 'Manual Prior Period Rebalancing Adjustment',
          status: 'VALIDATED',
          origin: 'MANUAL',
          lines: [
            { accountCode: '1200', debit: 500000, credit: 0 },
            { accountCode: '3300', debit: 0, credit: 500000 }
          ]
        }
      ]);
    }
  }, []);

  const saveLedger = (updated: any[]) => {
    setJournalEntries(updated);
    localStorage.setItem('term_ledger_v4', JSON.stringify(updated));
  };

  const getCoaName = (code: string) => {
    return coa.find(a => a.code === code)?.name || 'Unmapped Sub-Ledger Account';
  };

  // Multi-entry unstructured pipeline logic simulator
  async function handleMultiEntryParse() {
    if (!inputText.trim()) return;
    setLoading(true);
    
    setTimeout(() => {
      // Simulate validation engine parsing multiple transaction lines with nested exceptions if necessary
      setExtractedBatch([
        {
          id: `GL-000${journalEntries.length + 1}`,
          transactionType: 'Bulk Capital Call & Management Fee Distribution Allocation',
          status: 'VALIDATED',
          exceptionReason: 'None. Double-entry balancing validated across multi-tier accounts.',
          lines: [
            { accountCode: '1100', debit: 2500000, credit: 0 },
            { accountCode: '5100', debit: 1250000, credit: 0 },
            { accountCode: '3100', debit: 0, credit: 3750000 }
          ]
        }
      ]);
      setLoading(false);
    }, 500);
  }

  function commitMultiEntryBatch() {
    if (extractedBatch.length === 0) return;
    let current = [...journalEntries];
    
    extractedBatch.forEach((batchItem) => {
      current.push({
        id: batchItem.id,
        date: '2026-06-11',
        type: batchItem.transactionType,
        status: batchItem.status,
        origin: 'AUTOMATED',
        lines: batchItem.lines
      });
    });

    saveLedger(current);
    setExtractedBatch([]);
    setInputText('');
  }

  // Add Account Structure Execution
  function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode || !newTitle) return;

    const added = {
      code: newCode,
      name: newTitle,
      category: newType,
      description: newDesc || 'N/A',
      mtd: 0, qtd: 0, ytd: 0, itd: 0
    };

    const updatedCoa = [...coa, added];
    setCoa(updatedCoa);
    localStorage.setItem('term_coa_v4', JSON.stringify(updatedCoa));

    setNewCode('');
    setNewTitle('');
    setNewDesc('');
  }

  function deleteAccount(code: string) {
    const updated = coa.filter(a => a.code !== code);
    setCoa(updated);
    localStorage.setItem('term_coa_v4', JSON.stringify(updated));
    setActiveDropdown(null);
  }

  // GL Controlled Action Functions
  function executeAddBlankRowGl() {
    const nextSeq = String(journalEntries.length + 1).padStart(4, '0');
    const newGl = {
      id: `GL-${nextSeq}`,
      date: '2026-06-11',
      type: 'Manual Journal Provision Entry',
      status: 'UNVALIDATED',
      origin: 'MANUAL',
      lines: [
        { accountCode: '1100', debit: 0, credit: 0 },
        { accountCode: '5100', debit: 0, credit: 0 }
      ]
    };
    saveLedger([...journalEntries, newGl]);
    setSelectedGlId(`GL-${nextSeq}`);
  }

  function executeDeleteSelectedGl() {
    if (!selectedGlId) return;
    const updated = journalEntries.filter(e => e.id !== selectedGlId);
    saveLedger(updated);
    setSelectedGlId(null);
    setIsEditingGl(false);
  }

  const sidebarTabs = [
    { id: 'ingestion', label: 'File & Text Import Parsing', icon: '📥' },
    { id: 'ledger', label: 'Transactions - General Ledger', icon: '📖' },
    { id: 'coa', label: 'Accounts Manager', icon: '📊' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* 1. BRANDED SIDEBAR: INVESTMENTS EXPLORER */}
      <div style={{ width: '280px', background: '#0b1329', color: '#cbd5e1', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b' }}>
        <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>Investments Explorer</span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>◀</span>
        </div>
        
        <div style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
          {sidebarTabs.map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setActiveDropdown(null);
                }}
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

      {/* WORKSPACE APP FRAMEWORK CONTAINER */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Header Panel Status Bar */}
        <div style={{ borderBottom: '1px solid #e2e8f0', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {sidebarTabs.find(t => t.id === activeTab)?.label}
          </h1>
          <div style={{ fontSize: '0.72rem', background: '#0f172a', color: '#ffffff', padding: '6px 12px', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.05em' }}>
            SYSTEM ENVIRONMENT ACTIVE
          </div>
        </div>

        {/* Workspace Display Area */}
        <div style={{ padding: '32px', flexGrow: 1 }}>
          
          {/* TAB VIEW 1: FILE & TEXT IMPORT PARSING (MULTI-ENTRY PIPELINE) */}
          {activeTab === 'ingestion' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '40px', alignItems: 'start' }}>
                
                {/* Text Data Area */}
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                    1. Input Text Data (Supports Multi-Entry Parsing Run)
                  </h3>
                  
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste multi-line structural notice logs or bulk transaction allocations..."
                      style={{ width: '100%', height: '380px', padding: '16px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: '1.5', resize: 'none', background: '#ffffff', outline: 'none' }}
                    />
                  </div>

                  <button 
                    onClick={handleMultiEntryParse} 
                    disabled={loading || !inputText.trim()} 
                    style={{ width: '100%', marginTop: '16px', padding: '14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: inputText.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.92rem', opacity: inputText.trim() ? 1 : 0.6 }}
                  >
                    {loading ? 'Executing Multi-Line Balance Engine...' : 'Execute Structural Ledger Extraction'}
                  </button>
                </div>

                {/* Verification/Validation Breakdown Panel */}
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                    2. Validated Multi-Entry Results & Exception Logs
                  </h3>
                  
                  {extractedBatch.length === 0 ? (
                    <div style={{ border: '1px dashed #cbd5e1', borderRadius: '6px', height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', backgroundColor: '#ffffff', fontSize: '0.88rem' }}>
                      Verification channel idle. Initiate parsing pipeline to isolate ledger targets.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      <div style={{ background: '#f1f5f9', padding: '14px 18px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>Multi-Entry Batch Target Map</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Exception Check: Passed</div>
                        </div>
                        <button onClick={commitMultiEntryBatch} style={{ padding: '8px 16px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                          Confirm and Commit Transaction Entry Across Core Modules
                        </button>
                      </div>

                      {extractedBatch.map((entry, idx) => (
                        <div key={idx} style={{ background: '#ffffff', padding: '20px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{entry.id}</span>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem', background: '#dcfce7', color: '#166534' }}>VALIDATED</span>
                          </div>
                          
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>{entry.transactionType}</div>

                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', textTransform: 'uppercase', color: '#64748b' }}>
                                <th style={{ padding: '6px', textAlign: 'left' }}>Account</th>
                                <th style={{ padding: '6px', textAlign: 'left' }}>Name Mapping</th>
                                <th style={{ padding: '6px', textAlign: 'right' }}>Debit</th>
                                <th style={{ padding: '6px', textAlign: 'right' }}>Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.lines.map((line: any, lIdx: number) => (
                                <tr key={lIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '8px 6px', fontFamily: 'monospace' }}>{line.accountCode}</td>
                                  <td style={{ padding: '8px 6px' }}>{getCoaName(line.accountCode)}</td>
                                  <td style={{ padding: '8px 6px', textAlign: 'right', color: '#166534' }}>{line.debit > 0 ? line.debit.toLocaleString() : '-'}</td>
                                  <td style={{ padding: '8px 6px', textAlign: 'right', color: '#b91c1c' }}>{line.credit > 0 ? line.credit.toLocaleString() : '-'}</td>
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

          {/* TAB VIEW 2: TRANSACTIONS - GENERAL LEDGER */}
          {activeTab === 'ledger' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '24px' }}>
              
              {/* Action Toolbar Panel Top (NO INLINE TEXT BOX CHAOS) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>Audit Journal Record Database</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={executeAddBlankRowGl} style={{ padding: '8px 14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    + Add Row Ledger
                  </button>
                  <button 
                    onClick={executeDeleteSelectedGl}
                    disabled={!selectedGlId} 
                    style={{ padding: '8px 14px', background: selectedGlId ? '#ef4444' : '#cbd5e1', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: selectedGlId ? 'pointer' : 'not-allowed' }}
                  >
                    Delete Entry
                  </button>
                  <button 
                    onClick={() => selectedGlId && setIsEditingGl(!isEditingGl)}
                    disabled={!selectedGlId} 
                    style={{ padding: '8px 14px', background: selectedGlId ? '#0f172a' : '#cbd5e1', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600, cursor: selectedGlId ? 'pointer' : 'not-allowed' }}
                  >
                    {isEditingGl ? 'Lock Changes' : 'Edit Entry'}
                  </button>
                </div>
              </div>

              {/* Controlled GL Data Layout Loop */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {journalEntries.map((entry) => {
                  const isTargeted = selectedGlId === entry.id;
                  return (
                    <div 
                      key={entry.id} 
                      onClick={() => setSelectedGlId(entry.id)}
                      style={{ 
                        border: isTargeted ? '2px solid #2563eb' : '1px solid #e2e8f0', 
                        borderRadius: '6px', 
                        padding: '16px',
                        cursor: 'pointer',
                        background: isTargeted ? '#f8fafc' : '#ffffff',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', marginRight: '12px', color: '#0f172a' }}>{entry.id}</span>
                          <span style={{ fontSize: '0.82rem', color: '#64748b', marginRight: '12px' }}>Date: {entry.date}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, background: entry.origin === 'AUTOMATED' ? '#eff6ff' : '#fef3c7', color: entry.origin === 'AUTOMATED' ? '#1d4ed8' : '#b45309', padding: '2px 6px', borderRadius: '4px' }}>
                            {entry.origin} MATCH
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534' }}>{entry.status}</span>
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '12px', fontWeight: 500 }}>{entry.type}</div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                            <th style={{ padding: '8px' }}>Account Code</th>
                            <th style={{ padding: '8px' }}>Account Name Metric Mapping</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Debit Balance (USD)</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Credit Balance (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.lines.map((line: any, lineIdx: number) => (
                            <tr key={lineIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>
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
                                  <input 
                                    type="number" 
                                    value={line.debit}
                                    onChange={(e) => {
                                      let updated = [...journalEntries];
                                      let targetIdx = updated.findIndex(ent => ent.id === entry.id);
                                      updated[targetIdx].lines[lineIdx].debit = Number(e.target.value);
                                      saveLedger(updated);
                                    }}
                                    style={{ width: '100px', textAlign: 'right', padding: '4px' }}
                                  />
                                ) : (line.debit > 0 ? line.debit.toLocaleString() : '-')}
                              </td>
                              <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 500 }}>
                                {isTargeted && isEditingGl ? (
                                  <input 
                                    type="number" 
                                    value={line.credit}
                                    onChange={(e) => {
                                      let updated = [...journalEntries];
                                      let targetIdx = updated.findIndex(ent => ent.id === entry.id);
                                      updated[targetIdx].lines[lineIdx].credit = Number(e.target.value);
                                      saveLedger(updated);
                                    }}
                                    style={{ width: '100px', textAlign: 'right', padding: '4px' }}
                                  />
                                ) : (line.credit > 0 ? line.credit.toLocaleString() : '-')}
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

          {/* TAB VIEW 3: ACCOUNTS MANAGER */}
          {activeTab === 'coa' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Account Form Generation Buffer */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 600 }}>Create New Account Track</h3>
                <form onSubmit={handleAddAccount} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 2fr auto', gap: '12px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Code</label>
                    <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. 1400" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Account Title</label>
                    <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Dividend Accrual Map" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Account Type</label>
                    <select value={newType} onChange={e => setNewType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', background: '#ffffff' }}>
                      <option value="Asset">Asset</option>
                      <option value="Liability">Liability</option>
                      <option value="Equity">Equity</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Expense">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Description</label>
                    <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Purpose mapping details..." style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                  </div>
                  <button type="submit" style={{ padding: '9px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    Save Account
                  </button>
                </form>
              </div>

              {/* Main Directory & Horizon Balance Aggregation Panel */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Chart of Accounts Matrix</span>
                  
                  {/* Balance Filters Toggle */}
                  <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                    {(['MTD', 'QTD', 'YTD', 'ITD'] as const).map((horizon) => (
                      <button
                        key={horizon}
                        onClick={() => setBalanceFilter(horizon)}
                        style={{
                          padding: '6px 14px',
                          border: 'none',
                          background: balanceFilter === horizon ? '#0f172a' : '#ffffff',
                          color: balanceFilter === horizon ? '#ffffff' : '#475569',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {horizon} Balance View
                      </button>
                    ))}
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#0b1329', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '12px 10px' }}>Account Code</th>
                      <th style={{ padding: '12px 10px' }}>Account Descriptor Name</th>
                      <th style={{ padding: '12px 10px' }}>Category Hierarchy</th>
                      <th style={{ padding: '12px 10px' }}>Description Map Context</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Active {balanceFilter} Dynamic Total</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coa.map((account) => {
                      // Dynamically pull correct currency profile property
                      const balance = account[balanceFilter.toLowerCase()] || 0;
                      const isNegative = balance < 0;

                      return (
                        <tr key={account.code} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 700 }}>{account.code}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 500 }}>{account.name}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ fontSize: '0.75rem', padding: '3px 8px', background: '#f1f5f9', borderRadius: '4px', fontWeight: 600, color: '#475569' }}>
                              {account.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '0.82rem' }}>{account.description || 'No context specified'}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 600, color: isNegative ? '#b91c1c' : '#1e293b' }}>
                            {isNegative ? `-$${Math.abs(balance).toLocaleString('.2')}` : `$${balance.toLocaleString('.2')}`}
                          </td>
                          
                          {/* Drops down cell row action panel */}
                          <td style={{ padding: '12px 10px', textAlign: 'center', position: 'relative' }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === account.code ? null : account.code);
                              }}
                              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              Options ▾
                            </button>
                            
                            {activeDropdown === account.code && (
                              <div style={{ position: 'absolute', right: '10px', top: '40px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '120px' }}>
                                <button 
                                  onClick={() => alert(`Modify profile routing configurations for account: ${account.code}`)}
                                  style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.8rem', cursor: 'pointer', color: '#334155' }}
                                >
                                  Modify/Edit
                                </button>
                                <button 
                                  onClick={() => deleteAccount(account.code)}
                                  style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'none', fontSize: '0.8rem', cursor: 'pointer', color: '#ef4444', borderTop: '1px solid #f1f5f9' }}
                                >
                                  Remove Account
                                </button>
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

        </div>
      </div>
    </div>
  );
}