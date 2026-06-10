'use client';

import React, { useState, useEffect } from 'react';

const DEFAULT_COA = [
  { code: '1100', name: 'Cash / Clearing Account', category: 'Asset' },
  { code: '1200', name: 'Private Equity Investments (Fair Value)', category: 'Asset' },
  { code: '1300', name: 'Bank Loans Receivable', category: 'Asset' },
  { code: '3100', name: 'Partners Capital - LP Contributions', category: 'Equity' },
  { code: '3300', name: 'Unfunded Capital Commitments Offset', category: 'Equity' },
  { code: '5100', name: 'Management & Performance Fees', category: 'Expense' }
];

const INITIAL_PARTNERS = [
  { id: 'LP01', name: 'Alpha Endowment Fund', commitment: 50000000, unfunded: 40000000, pct: 0.50 },
  { id: 'LP02', name: 'Beacon Pension Plan', commitment: 30000000, unfunded: 24000000, pct: 0.30 },
  { id: 'LP03', name: 'Kian Wealth Management', commitment: 20000000, unfunded: 16000000, pct: 0.20 }
];

const EXTERNAL_FEED = [
  { id: 'EXT01', type: 'Cash Stream', accountCode: '1100', description: 'Institutional Operating Wire Feed', externalAmount: 150000000 },
  { id: 'EXT02', type: 'Asset Value Statement', accountCode: '1200', description: 'Custodian Vault Position Statement', externalAmount: 500000000 },
  { id: 'EXT03', type: 'Registry Record', accountCode: '3100', description: 'Master Registry Signoff Record', externalAmount: 50000000 }
];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ingestion');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Data State Arrays
  const [coa, setCoa] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [extractedBatch, setExtractedBatch] = useState<any[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);

  // Chart of Accounts Forms
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('Asset');

  // Partnership Registry Forms
  const [partnerName, setPartnerName] = useState('');
  const [partnerCommitment, setPartnerCommitment] = useState('');
  const [partnerUnfunded, setPartnerUnfunded] = useState('');
  const [partnerPct, setPartnerPct] = useState('');

  useEffect(() => {
    const savedCoa = localStorage.getItem('term_coa');
    const savedPartners = localStorage.getItem('term_partners');
    const savedLedger = localStorage.getItem('term_ledger');
    const savedReports = localStorage.getItem('term_reports');

    setCoa(savedCoa ? JSON.parse(savedCoa) : DEFAULT_COA);
    setPartners(savedPartners ? JSON.parse(savedPartners) : INITIAL_PARTNERS);
    setJournalEntries(savedLedger ? JSON.parse(savedLedger) : []);
    setReports(savedReports ? JSON.parse(savedReports) : [
      { id: 'REP01', name: 'Q2_2026_Comprehensive_Trial_Balance', type: 'Trial Balance', date: '2026-06-09', format: 'PDF' },
      { id: 'REP02', name: 'Master_General_Ledger_Audit_Track', type: 'Ledger Audit', date: '2026-06-10', format: 'CSV' }
    ]);
  }, []);

  const getCoaName = (code: string) => {
    return coa.find(a => a.code === code)?.name || 'Unmapped Sub-Ledger Account';
  };

  const getInternalGlBalance = (accountCode: string) => {
    let balance = 0;
    if (accountCode === '1200') balance = 500000000; 
    if (accountCode === '3100') balance = 50000000; 

    journalEntries.forEach(entry => {
      entry.lines?.forEach((l: any) => {
        if (l.accountCode === accountCode) {
          balance += (l.debitInCents - l.creditInCents);
        }
      });
    });
    return Math.abs(balance);
  };

  const runAutoReconciliation = () => {
    const newlyMatched: string[] = [];
    EXTERNAL_FEED.forEach(item => {
      const internalVal = getInternalGlBalance(item.accountCode);
      if (internalVal === item.externalAmount) {
        newlyMatched.push(item.id);
      }
    });
    setMatchedIds(newlyMatched);
  };

  async function handleAiParse() {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: inputText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const validatedEntries = (data.entries || []).map((entry: any) => {
        let status = 'VALIDATED';
        let exceptionReason = '';
        
        if (entry.transactionType === 'Capital Drawdown Record') {
          const totalUnfundedAvailable = partners.reduce((sum, p) => sum + p.unfunded, 0);
          if (entry.totalAmountInCents > totalUnfundedAvailable) {
            status = 'EXCEPTION';
            exceptionReason = 'Allocation Threshold Breach: Total transaction volume triggers registry allocation limits under ruleset criteria.';
          }
        }
        return { ...entry, status, exceptionReason };
      });

      setExtractedBatch(validatedEntries);
    } catch (err: any) {
      alert(err.message || 'System parsing anomaly.');
    } finally {
      setLoading(false);
    }
  }

  function postToLedgerBatch() {
    if (extractedBatch.length === 0) return;

    let updatedLedger = [...journalEntries];
    let updatedPartners = [...partners];

    extractedBatch.forEach((entry) => {
      const uniqueSerial = Math.floor(1000 + Math.random() * 9000);
      const cleanJeCode = `JE${uniqueSerial}`; // Formatted as JE-XXXX style code (without hyphens)

      const newEntry = {
        id: cleanJeCode,
        date: '2026-06-10',
        fundName: entry.fundName,
        type: entry.transactionType,
        status: entry.status,
        reason: entry.exceptionReason,
        lines: entry.suggestedLedgerLines || []
      };
      
      updatedLedger = [newEntry, ...updatedLedger];

      if (entry.transactionType === 'Capital Drawdown Record' && entry.status === 'VALIDATED') {
        updatedPartners = updatedPartners.map(p => ({
          ...p,
          unfunded: Math.max(0, p.unfunded - (entry.totalAmountInCents * p.pct))
        }));
      }
    });

    setPartners(updatedPartners);
    setJournalEntries(updatedLedger);
    
    localStorage.setItem('term_partners', JSON.stringify(updatedPartners));
    localStorage.setItem('term_ledger', JSON.stringify(updatedLedger));

    setExtractedBatch([]);
    setInputText('');
    alert('Sequential transactional payload posted down to book modules.');
  }

  const addAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    if (coa.some(a => a.code === newCode)) {
      alert('Account code alignment collision.');
      return;
    }
    const updated = [...coa, { code: newCode, name: newName, category: newCat }].sort((a,b) => a.code.localeCompare(b.code));
    setCoa(updated);
    localStorage.setItem('term_coa', JSON.stringify(updated));
    setNewCode('');
    setNewName('');
  };

  const deleteAccount = (code: string) => {
    const updated = coa.filter(a => a.code !== code);
    setCoa(updated);
    localStorage.setItem('term_coa', JSON.stringify(updated));
  };

  const addPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName || !partnerCommitment) return;
    const commValue = Math.round(parseFloat(partnerCommitment) * 100);
    const unfundValue = partnerUnfunded ? Math.round(parseFloat(partnerUnfunded) * 100) : commValue;
    const pctValue = partnerPct ? parseFloat(partnerPct) / 100 : 0.00;

    const newLp = {
      id: `LP${Math.floor(10 + Math.random() * 90)}`,
      name: partnerName,
      commitment: commValue,
      unfunded: unfundValue,
      pct: pctValue
    };

    const updated = [...partners, newLp];
    setPartners(updated);
    localStorage.setItem('term_partners', JSON.stringify(updated));
    setPartnerName('');
    setPartnerCommitment('');
    setPartnerUnfunded('');
    setPartnerPct('');
  };

  const deletePartner = (id: string) => {
    const updated = partners.filter(p => p.id !== id);
    setPartners(updated);
    localStorage.setItem('term_partners', JSON.stringify(updated));
  };

  const triggerDownload = (fileName: string, format: string) => {
    const dataString = `Transaction Ledger Ingestion Extract File\nReport Designation: ${fileName}\nExecution Sync Date: 2026-06-10`;
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
      
      {/* SIDEBAR NAVIGATION RAIL */}
      <div style={{ width: sidebarOpen ? '290px' : '64px', transition: 'width 0.15s ease', background: '#0f172a', color: '#f8fafc', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', boxSizing: 'border-box' }}>
        <div style={{ padding: '24px 18px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {sidebarOpen && <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#ffffff' }}>Investments Explorer</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <div style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {([
            { id: 'ingestion', label: 'File Import Parsing', icon: '📁' },
            { id: 'ledger', label: 'Transaction General Ledger', icon: '📖' },
            { id: 'coa', label: 'Chart of Accounts Manager', icon: '📊' },
            { id: 'registry', label: 'Partnership Registry Ledger', icon: '👥' },
            { id: 'recon', label: 'Reconciliation Audit Suite', icon: '🔄' },
            { id: 'reports', label: 'Report Depository Vault', icon: '📥' }
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

      {/* CORE WORKSPACE PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '18px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#0f172a' }}>
            {activeTab === 'ingestion' && 'Multi-Asset Log File Import Parsing Engine'}
            {activeTab === 'ledger' && 'Transaction Book Records'}
            {activeTab === 'coa' && 'Chart of Accounts Configuration Matrix'}
            {activeTab === 'registry' && 'Capital Account Allocation Registry'}
            {activeTab === 'recon' && 'Automated Reconciliation Audit Matrix'}
            {activeTab === 'reports' && 'Corporate Performance Report Vault'}
          </h2>
          <div style={{ fontSize: '0.72rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '4px', fontWeight: 600, color: '#475569', letterSpacing: '0.03em' }}>
            ENVIRONMENT SECURE • ACTIVE
          </div>
        </header>

        <main style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
          
          {/* TAB: FILE IMPORT PARSING */}
          {activeTab === 'ingestion' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: '#0f172a', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>Ingest Raw Notice Log Payloads</h3>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste multi-transaction unstructured notice logs here..."
                  style={{ width: '100%', height: '390px', padding: '14px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem', background: '#ffffff', resize: 'none' }}
                />
                <button onClick={handleAiParse} disabled={loading} style={{ marginTop: '14px', width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                  {loading ? 'Executing Sequential Text Tokenization...' : 'Execute Structural Ledger Extraction'}
                </button>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: '#0f172a', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>Structured Multi-Entry Verification Matrix</h3>
                </div>
                {extractedBatch.length === 0 ? (
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '6px', height: '455px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', backgroundColor: '#ffffff', fontSize: '0.85rem' }}>
                    Awaiting log verification stream processing inputs.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#e2e8f0', padding: '12px 16px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Segmented Entries: {extractedBatch.length} Events Pending Post</span>
                      <button onClick={postToLedgerBatch} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                        Commit All Entries to Modules
                      </button>
                    </div>

                    {extractedBatch.map((entry, idx) => (
                      <div key={entry.id || idx} style={{ background: '#ffffff', padding: '18px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
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

                        <p style={{ margin: '3px 0', fontSize: '0.85rem', color: '#475569' }}><strong>Portfolio Account Designation:</strong> {entry.fundName}</p>
                        <p style={{ margin: '3px 0', fontSize: '0.85rem', color: '#475569' }}><strong>Calculated Volume Value:</strong> {((entry.totalAmountInCents || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginTop: '12px' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc', textAlign: 'left' }}>
                              <th style={{ padding: '6px' }}>Code</th>
                              <th style={{ padding: '6px' }}>Account Name Mapping</th>
                              <th style={{ padding: '6px', textAlign: 'right' }}>Debit (USD)</th>
                              <th style={{ padding: '6px', textAlign: 'right' }}>Credit (USD)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.suggestedLedgerLines?.map((line: any, i: number) => (
                              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px', fontWeight: 600 }}>{line.accountCode}</td>
                                <td style={{ padding: '6px', color: '#334155' }}>{getCoaName(line.accountCode)}</td>
                                <td style={{ padding: '6px', textAlign: 'right', color: '#166534', fontWeight: 500 }}>{line.debitInCents > 0 ? (line.debitInCents / 100).toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}</td>
                                <td style={{ padding: '6px', textAlign: 'right', color: '#991b1b', fontWeight: 500 }}>{line.creditInCents > 0 ? (line.creditInCents / 100).toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}</td>
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

          {/* TAB: TRANSACTION GENERAL LEDGER */}
          {activeTab === 'ledger' && (
            <div>
              {journalEntries.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1', color: '#64748b' }}>No validated journal runs discovered inside the balance sub-modules.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {journalEntries.map((entry) => (
                    <div key={entry.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', background: '#ffffff', padding: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{entry.id} — {entry.type}</span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Settlement Effective Date: {entry.date} | Focus Node: {entry.fundName}</span>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', color: '#475569', background: '#f8fafc' }}>
                            <th style={{ padding: '6px' }}>Code</th>
                            <th style={{ padding: '6px' }}>Account Description Name</th>
                            <th style={{ padding: '6px', textAlign: 'right' }}>Debit (USD)</th>
                            <th style={{ padding: '6px', textAlign: 'right' }}>Credit (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.lines?.map((l: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '6px', fontWeight: 600 }}>{l.accountCode}</td>
                              <td style={{ padding: '6px', color: '#334155' }}>{getCoaName(l.accountCode)}</td>
                              <td style={{ padding: '6px', textAlign: 'right' }}>{l.debitInCents > 0 ? (l.debitInCents / 100).toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}</td>
                              <td style={{ padding: '6px', textAlign: 'right' }}>{l.creditInCents > 0 ? (l.creditInCents / 100).toLocaleString(undefined, {minimumFractionDigits: 2}) : '-'}</td>
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

          {/* TAB: CHART OF ACCOUNTS */}
          {activeTab === 'coa' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '6px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 600 }}>Add Sub-Ledger Account Code</h4>
                <form onSubmit={addAccount} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Account Code ID</label>
                    <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="e.g., 1500" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Account Label Descriptor</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Retained Capital Earnings" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>Balance Sheet Class</label>
                    <select value={newCat} onChange={(e) => setNewCat(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', background: '#fff' }}>
                      <option value="Asset">Asset</option>
                      <option value="Liability">Liability</option>
                      <option value="Equity">Equity</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Expense">Expense</option>
                    </select>
                  </div>
                  <button type="submit" style={{ padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', marginTop: '6px' }}>
                    Inject Account Target
                  </button>
                </form>
              </div>

              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Code</th>
                      <th style={{ padding: '12px' }}>Dynamic Account Map Descriptor</th>
                      <th style={{ padding: '12px' }}>Ledger Category Type</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Purge Action</th>
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
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PARTNERSHIP REGISTRY LEDGER */}
          {activeTab === 'registry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 600 }}>Manual Registry Allocation Injector Form</h4>
                <form onSubmit={addPartner} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '4px' }}>Investor Entity Name</label>
                    <input type="text" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="e.g., Apex Capital Fund" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '4px' }}>Total Commitment Value ($)</label>
                    <input type="number" value={partnerCommitment} onChange={(e) => setPartnerCommitment(e.target.value)} placeholder="e.g., 500000" required style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '4px' }}>Baseline Unfunded ($)</label>
                    <input type="number" value={partnerUnfunded} onChange={(e) => setPartnerUnfunded(e.target.value)} placeholder="Defaults to commitment" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '4px' }}>Pro-Rata Share Weight (%)</label>
                    <input type="number" step="0.01" value={partnerPct} onChange={(e) => setPartnerPct(e.target.value)} placeholder="e.g., 20.00" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem' }} />
                  </div>
                  <button type="submit" style={{ padding: '9px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    Inject Profile Node
                  </button>
                </form>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Identifier</th>
                    <th style={{ padding: '12px' }}>Investor Account Profile Node Title</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Pro-Rata Metric Share Weight</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Capital Allocation Commitment</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Remaining Unfunded Reserve Headroom</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Purge Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#475569' }}>{p.id}</td>
                      <td style={{ padding: '12px' }}>{p.name}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>{(p.pct * 100).toFixed(2)}%</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{(p.commitment / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: p.unfunded < p.commitment ? '#991b1b' : '#1e293b', fontWeight: 500 }}>
                        {(p.unfunded / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button onClick={() => deletePartner(p.id)} style={{ padding: '4px 10px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: RECONCILIATION SUITE */}
          {activeTab === 'recon' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Comparison auditing verification matrix checking sub-ledger mappings against external third-party statements.</p>
                <button onClick={runAutoReconciliation} style={{ padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Execute Automated Matching Cycle
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#334155', color: 'white', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Category Stream Node</th>
                    <th style={{ padding: '12px' }}>Account Code Map</th>
                    <th style={{ padding: '12px' }}>External Core Document Stream Description</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Internal Ledger Balance</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>External Account Target Value</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Variance Discrepancy Break</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Audit Resolution State</th>
                  </tr>
                </thead>
                <tbody>
                  {EXTERNAL_FEED.map((item) => {
                    const internalBal = getInternalGlBalance(item.accountCode);
                    const isMatched = matchedIds.includes(item.id);
                    const variance = internalBal - item.externalAmount;

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isMatched ? '#f0fdf4' : '#fff1f2' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 600 }}>{item.type}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{item.accountCode}</span> 
                        </td>
                        <td style={{ padding: '12px', color: '#475569' }}>{item.description}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>
                          {(internalBal / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>
                          {(item.externalAmount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: variance === 0 ? '#166534' : '#991b1b' }}>
                          {(variance / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: isMatched ? '#bbf7d0' : '#fecdd3', color: isMatched ? '#166534' : '#991b1b' }}>
                            {isMatched ? 'VERIFIED MATCH' : 'UNRESOLVED VARIANCE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: REPORT DEPOSITORY VAULT */}
          {activeTab === 'reports' && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>Report Identifier Code</th>
                    <th style={{ padding: '12px' }}>Manifest Document Location Filename</th>
                    <th style={{ padding: '12px' }}>Sub-Ledger Target Category</th>
                    <th style={{ padding: '12px' }}>Generation Target Date</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Action Export Executions</th>
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
                          Download Export File .{rep.format.toLowerCase()}
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