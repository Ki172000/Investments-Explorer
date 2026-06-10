'use client';

import React, { useState, useEffect } from 'react';

const INITIAL_PARTNERS = [
  { id: 'LP-01', name: 'Alpha Endowment Fund', commitment: 50000000, unfunded: 40000000, pct: 0.50 },
  { id: 'LP-02', name: 'Beacon Pension Plan', commitment: 30000000, unfunded: 24000000, pct: 0.30 },
  { id: 'LP-03', name: 'Kian Wealth Management', commitment: 20000000, unfunded: 16000000, pct: 0.20 }
];

const INITIAL_COA = {
  1100: 'Cash / Clearing Account',
  1200: 'Private Equity Investments (Fair Value)',
  1300: 'Bank Loans Receivable',
  3100: 'Partners Capital - LP Contributions',
  3300: 'Unfunded Capital Commitments Offset',
  5100: 'Management & Performance Fees'
};

const EXTERNAL_FEED = [
  { id: 'EXT-01', type: 'Cash', accountCode: '1100', description: 'State Street Operating Wire Feed', externalAmount: 150000000, status: 'UNMATCHED' },
  { id: 'EXT-02', type: 'Position', accountCode: '1200', description: 'Citco Custody Position Statement', externalAmount: 500000000, status: 'UNMATCHED' },
  { id: 'EXT-03', type: 'Commitment', accountCode: '3100', description: 'Alpha Endowment Signoff Registry', externalAmount: 50000000, status: 'UNMATCHED' }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ingestion' | 'ledger' | 'investran' | 'recon' | 'reports'>('ingestion');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [partners, setPartners] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [extractedBatch, setExtractedBatch] = useState<any[]>([]);

  const [reconItems, setReconItems] = useState<any[]>(EXTERNAL_FEED);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);

  useEffect(() => {
    const savedPartners = localStorage.getItem('inv_partners');
    const savedLedger = localStorage.getItem('inv_ledger');
    const savedReports = localStorage.getItem('inv_reports');

    setPartners(savedPartners ? JSON.parse(savedPartners) : INITIAL_PARTNERS);
    setJournalEntries(savedLedger ? JSON.parse(savedLedger) : []);
    setReports(savedReports ? JSON.parse(savedReports) : [
      { id: 'REP-01', name: 'Q1_2026_Trial_Balance_Summary', type: 'Trial Balance', date: '2026-03-31', format: 'PDF' }
    ]);
  }, []);

  const getInternalGlBalance = (accountCode: string) => {
    let balance = 0;
    if (accountCode === '1200') balance = 500000000; 
    if (accountCode === '3100') balance = 50000000; 

    journalEntries.forEach(entry => {
      entry.lines.forEach((l: any) => {
        if (l.accountCode === accountCode) {
          balance += (l.debitInCents - l.creditInCents);
        }
      });
    });
    return Math.abs(balance);
  };

  const runAutoReconciliation = () => {
    const newlyMatched: string[] = [];
    reconItems.forEach(item => {
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
        
        if (entry.transactionType === 'Capital Call') {
          const totalUnfundedAvailable = partners.reduce((sum, p) => sum + p.unfunded, 0);
          if (entry.totalAmountInCents > totalUnfundedAvailable) {
            status = 'EXCEPTION';
            exceptionReason = 'Breach: Called amount exceeds total available fund unfunded limits.';
          }
        }
        return { ...entry, status, exceptionReason };
      });

      setExtractedBatch(validatedEntries);
    } catch (err: any) {
      alert(err.message || 'Processing error occurred.');
    } finally {
      setLoading(false);
    }
  }

  function postToLedgerBatch() {
    if (extractedBatch.length === 0) return;

    let updatedLedger = [...journalEntries];
    let updatedPartners = [...partners];

    extractedBatch.forEach((entry, index) => {
      const newEntry = {
        id: `JE-${Date.now().toString().slice(-4)}-${index}`,
        date: '2026-06-10',
        fundName: entry.fundName,
        type: entry.transactionType,
        status: entry.status,
        reason: entry.exceptionReason,
        lines: entry.suggestedLedgerLines || []
      };
      
      updatedLedger = [newEntry, ...updatedLedger];

      if (entry.transactionType === 'Capital Call' && entry.status === 'VALIDATED') {
        updatedPartners = updatedPartners.map(p => ({
          ...p,
          unfunded: Math.max(0, p.unfunded - (entry.totalAmountInCents * p.pct))
        }));
      }
    });

    setPartners(updatedPartners);
    setJournalEntries(updatedLedger);
    
    localStorage.setItem('inv_partners', JSON.stringify(updatedPartners));
    localStorage.setItem('inv_ledger', JSON.stringify(updatedLedger));

    setExtractedBatch([]);
    setInputText('');
    alert('All batch entries processed and committed successfully.');
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '30px', maxWidth: '1400px', margin: '0 auto', color: '#333', background: '#f8f9fa' }}>
      
      <header style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', fontWeight: 600, letterSpacing: '-0.02em' }}>Investments Explorer</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Investran Partnership Ledger and Geneva General Ledger Multi-Asset Terminal</p>
        </div>
        <div style={{ fontSize: '0.75rem', background: '#1e293b', color: '#f8fafc', padding: '6px 14px', borderRadius: '4px', fontWeight: 600, letterSpacing: '0.05em' }}>
          SYSTEM ENVIRONMENT ACTIVE
        </div>
      </header>

      <nav style={{ display: 'flex', gap: '8px', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        {([
          { id: 'ingestion', label: 'Notice Ingestion & Exception Parsing' },
          { id: 'ledger', label: 'Geneva Asset General Ledger' },
          { id: 'investran', label: 'Investran Partnership Registry' },
          { id: 'recon', label: 'iRecs Match & Reconciliation' },
          { id: 'reports', label: 'Built-in Report Depository' }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '6px',
              background: activeTab === tab.id ? '#0f172a' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#475569',
              fontWeight: 500,
              fontSize: '0.88rem',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'ingestion' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px' }}>
          <div>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>1. Unstructured Document Ingestion Pipeline</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>Paste complex multi-transaction notice documents below:</p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw batch text data here..."
              style={{ width: '100%', height: '350px', padding: '14px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem', background: '#ffffff', resize: 'none' }}
            />
            <button onClick={handleAiParse} disabled={loading} style={{ marginTop: '14px', width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              {loading ? 'Processing Multi-Entry Batch...' : 'Execute Structured Batch Ledger Extraction'}
            </button>
          </div>

          <div>
            <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>2. Live Double-Entry Batch Preview</h3>
            {extractedBatch.length === 0 ? (
              <div style={{ border: '1px dashed #cbd5e1', borderRadius: '6px', height: '415px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', backgroundColor: '#ffffff', fontSize: '0.9rem' }}>
                Pipeline resting. Awaiting batch text data execution.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto', paddingRight: '5px' }}>
                <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>Detected Entities: {extractedBatch.length} Transactions</span>
                  <button onClick={postToLedgerBatch} style={{ padding: '8px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    Commit All Entries to Modules
                  </button>
                </div>

                {extractedBatch.map((entry, idx) => (
                  <div key={entry.id || idx} style={{ background: '#ffffff', padding: '18px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{entry.transactionType}</span>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem', background: entry.status === 'EXCEPTION' ? '#fee2e2' : '#dcfce7', color: entry.status === 'EXCEPTION' ? '#991b1b' : '#166534' }}>
                        {entry.status}
                      </span>
                    </div>

                    {entry.status === 'EXCEPTION' && (
                      <div style={{ background: '#fef3c7', color: '#92400e', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '12px', border: '1px solid #fde68a' }}>
                        {entry.exceptionReason}
                      </div>
                    )}

                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}><strong>Entity:</strong> {entry.fundName}</p>
                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}><strong>Value:</strong> {((entry.totalAmountInCents || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginTop: '10px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc', textAlign: 'left' }}>
                          <th style={{ padding: '6px' }}>Code</th>
                          <th style={{ padding: '6px' }}>Account Mapping</th>
                          <th style={{ padding: '6px', textAlign: 'right' }}>Debit</th>
                          <th style={{ padding: '6px', textAlign: 'right' }}>Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.suggestedLedgerLines?.map((line: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px', fontWeight: 600 }}>{line.accountCode}</td>
                            <td style={{ padding: '6px', color: '#334155' }}>{INITIAL_COA[line.accountCode as keyof typeof INITIAL_COA] || line.accountName}</td>
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

      {activeTab === 'ledger' && (
        <div>
          <h3 style={{ marginTop: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 600, marginBottom: '15px' }}>Geneva Transaction General Ledger</h3>
          {journalEntries.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1', color: '#64748b' }}>No transactions committed to the General Ledger.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {journalEntries.map((entry) => (
                <div key={entry.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', background: '#ffffff', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{entry.id} — {entry.type}</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Date: {entry.date} | Entity: {entry.fundName}</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: '#475569', background: '#f8fafc' }}>
                        <th style={{ padding: '6px' }}>Code</th>
                        <th style={{ padding: '6px' }}>Account Label</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>Debit</th>
                        <th style={{ padding: '6px', textAlign: 'right' }}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.lines.map((l: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px', fontWeight: 600 }}>{l.accountCode}</td>
                          <td style={{ padding: '6px', color: '#334155' }}>{INITIAL_COA[l.accountCode as keyof typeof INITIAL_COA] || l.accountName}</td>
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

      {activeTab === 'investran' && (
        <div>
          <h3 style={{ marginTop: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 600, marginBottom: '15px' }}>Investran Partnership Capital Account Registry</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>LP Identifier</th>
                <th style={{ padding: '12px' }}>Investor Entity Name</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Pro-Rata Share</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Total Commitment</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Remaining Unfunded Capital Balance</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#334155' }}>{p.id}</td>
                  <td style={{ padding: '12px' }}>{p.name}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>{(p.pct * 100).toFixed(2)}%</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{(p.commitment / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: p.unfunded < p.commitment ? '#991b1b' : '#334155', fontWeight: 500 }}>
                    {(p.unfunded / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'recon' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ marginTop: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 600 }}>Automated Reconciliation Suite</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Comparison matrix mapping internal book records to third-party bank data feeds.</p>
            </div>
            <button onClick={runAutoReconciliation} style={{ padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              Execute Automated Matching Cycle
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#334155', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Account Mapping</th>
                <th style={{ padding: '12px' }}>External Feed Source Description</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Internal Book GL Balance</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>External Vault Balance</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Variance Break</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Matching Status</th>
              </tr>
            </thead>
            <tbody>
              {reconItems.map((item) => {
                const internalBal = getInternalGlBalance(item.accountCode);
                const isMatched = matchedIds.includes(item.id);
                const variance = internalBal - item.externalAmount;

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isMatched ? '#f0fdf4' : '#fff1f2' }}>
                    <td style={{ padding: '14px 12px', fontWeight: 600, color: '#1e293b' }}>{item.type}</td>
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
                        {isMatched ? 'MATCHED' : 'UNRESOLVED BREAK'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'reports' && (
        <div>
          <h3 style={{ marginTop: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 600, marginBottom: '15px' }}>Institutional Financial Report Vault</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Report Identifier</th>
                <th style={{ padding: '12px' }}>Document Manifest Name</th>
                <th style={{ padding: '12px' }}>Accounting Category</th>
                <th style={{ padding: '12px' }}>Target Date</th>
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
                    <button onClick={() => alert(`Downloading manifest structure...`)} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      Download .{rep.format.toLowerCase()}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}