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
  const [activeExtraction, setActiveExtraction] = useState<any>(null);

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
    alert(newlyMatched.length > 0 ? `iRecs: Match confirmed for ${newlyMatched.length} systems!` : 'Reconciliation scan finished. Variances remain.');
  };

  async function handleAiParse() {
    if (!inputText.trim()) return alert('Please enter notice text.');
    setLoading(true);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: inputText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');

      let status = 'VALIDATED';
      let exceptionReason = '';
      const totalCalled = data.totalAmountInCents || 0;
      const totalUnfundedAvailable = partners.reduce((sum, p) => sum + p.unfunded, 0);

      if (data.transactionType === 'Capital Call' && totalCalled > totalUnfundedAvailable) {
        status = 'EXCEPTION';
        exceptionReason = 'Breach: Called amount exceeds total available fund unfunded limits.';
      }

      setActiveExtraction({ ...data, status, exceptionReason });
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  function postToLedger() {
    if (!activeExtraction) return;

    const newEntry = {
      id: `JE-${Date.now().toString().slice(-4)}`,
      date: activeExtraction.noticeDate || '2026-06-01',
      fundName: activeExtraction.fundName,
      type: activeExtraction.transactionType,
      status: activeExtraction.status,
      reason: activeExtraction.exceptionReason,
      lines: activeExtraction.suggestedLedgerLines || []
    };

    const updatedLedger = [newEntry, ...journalEntries];
    let updatedPartners = [...partners];
    let updatedReports = [...reports];

    if (activeExtraction.transactionType === 'Capital Call' && activeExtraction.status === 'VALIDATED') {
      const totalAmount = activeExtraction.totalAmountInCents || 0;
      updatedPartners = partners.map(p => ({
        ...p,
        unfunded: Math.max(0, p.unfunded - (totalAmount * p.pct))
      }));
      updatedReports = [
        {
          id: `REP-${Date.now().toString().slice(-4)}`,
          name: `${activeExtraction.fundName.replace(/\s+/g, '_')}_PCAP_Notice_Settlement`,
          type: 'Partner Capital Statement (PCAP)',
          date: activeExtraction.noticeDate || '2026-06-01',
          format: 'XLSX'
        },
        ...reports
      ];
    }

    setPartners(updatedPartners);
    setJournalEntries(updatedLedger);
    setReports(updatedReports);
    localStorage.setItem('inv_partners', JSON.stringify(updatedPartners));
    localStorage.setItem('inv_ledger', JSON.stringify(updatedLedger));
    localStorage.setItem('inv_reports', JSON.stringify(updatedReports));

    alert('Ledger entries processed successfully!');
    setActiveExtraction(null);
    setInputText('');
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '25px', maxWidth: '1300px', margin: '0 auto', color: '#222', background: '#fcfcfc' }}>
      
      <header style={{ borderBottom: '2px solid #002d62', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#002d62' }}>Investments Explorer</h1>
          <p style={{ margin: '3px 0 0 0', color: '#555', fontSize: '0.95rem' }}>AI Architecture Engine • Investran Partnership Ledger & Geneva General Ledger Hybrid Terminal</p>
        </div>
        <div style={{ fontSize: '0.85rem', background: '#002d62', color: 'white', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}>
          SYSTEM ENVIRONMENT ACTIVE
        </div>
      </header>

      <nav style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('ingestion')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: activeTab === 'ingestion' ? '#002d62' : '#eee', color: activeTab === 'ingestion' ? 'white' : '#333', fontWeight: 'bold' }}>
          Notice Ingestion & Exception Parsing
        </button>
        <button onClick={() => setActiveTab('ledger')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: activeTab === 'ledger' ? '#002d62' : '#eee', color: activeTab === 'ledger' ? 'white' : '#333', fontWeight: 'bold' }}>
          Geneva Asset General Ledger
        </button>
        <button onClick={() => setActiveTab('investran')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: activeTab === 'investran' ? '#002d62' : '#eee', color: activeTab === 'investran' ? 'white' : '#333', fontWeight: 'bold' }}>
          Investran Partnership Registry
        </button>
        <button onClick={() => setActiveTab('recon')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: activeTab === 'recon' ? '#d9383a' : '#eee', color: activeTab === 'recon' ? 'white' : '#333', fontWeight: 'bold' }}>
          🔄 iRecs Match & Reconciliation
        </button>
        <button onClick={() => setActiveTab('reports')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: activeTab === 'reports' ? '#002d62' : '#eee', color: activeTab === 'reports' ? 'white' : '#333', fontWeight: 'bold' }}>
          Built-in Report Depository
        </button>
      </nav>

      {activeTab === 'ingestion' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
          <div>
            <h3 style={{ marginTop: 0, color: '#002d62' }}>1. Unstructured Document Ingestion Pipeline</h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw notice text here..."
              style={{ width: '100%', height: '280px', padding: '12px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            <button onClick={handleAiParse} disabled={loading} style={{ marginTop: '12px', width: '100%', padding: '12px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Processing Text Data...' : 'Execute Structured AI Ledger Extraction'}
            </button>
          </div>

          <div>
            <h3 style={{ marginTop: 0, color: '#002d62' }}>2. Live Double-Entry Matching View</h3>
            {!activeExtraction ? (
              <div style={{ border: '2px dashed #ccc', borderRadius: '4px', height: '345px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777', backgroundColor: '#fafafa' }}>
                Pipeline resting. Awaiting operational text data...
              </div>
            ) : (
              <div style={{ background: '#fff', padding: '20px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#002d62' }}>{activeExtraction.transactionType} Data Frame</h4>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', background: activeExtraction.status === 'EXCEPTION' ? '#ffcccc' : '#d4edda', color: activeExtraction.status === 'EXCEPTION' ? '#cc0000' : '#155724' }}>
                    {activeExtraction.status}
                  </span>
                </div>

                {activeExtraction.status === 'EXCEPTION' && (
                  <div style={{ background: '#fff3cd', color: '#856404', padding: '10px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '15px' }}>
                    ⚠️ {activeExtraction.exceptionReason}
                  </div>
                )}

                <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Fund Entity:</strong> {activeExtraction.fundName}</p>
                <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Value:</strong> {((activeExtraction.totalAmountInCents || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginTop: '15px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd', background: '#f5f5f5', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Account Code</th>
                      <th style={{ padding: '6px' }}>Account Name Mapping</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>Debit</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeExtraction.suggestedLedgerLines?.map((line: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '6px', fontWeight: 'bold' }}>{line.accountCode}</td>
                        <td style={{ padding: '6px' }}>{INITIAL_COA[line.accountCode as keyof typeof INITIAL_COA] || line.accountName}</td>
                        <td style={{ padding: '6px', textAlign: 'right', color: 'green' }}>{line.debitInCents > 0 ? (line.debitInCents / 100).toLocaleString() : '-'}</td>
                        <td style={{ padding: '6px', textAlign: 'right', color: 'red' }}>{line.creditInCents > 0 ? (line.creditInCents / 100).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={postToLedger} style={{ marginTop: '15px', width: '100%', padding: '10px', background: '#002d62', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Confirm and Commit Transaction Entry Across Core Modules
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div>
          <h3 style={{ marginTop: 0, color: '#002d62' }}>Geneva Transaction General Ledger</h3>
          {journalEntries.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', background: '#eee', borderRadius: '4px', color: '#666' }}>No entries found in general ledger block.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {journalEntries.map((entry) => (
                <div key={entry.id} style={{ border: '1px solid #ddd', borderRadius: '4px', background: 'white', padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: '#002d62' }}>{entry.id} — {entry.type}</span>
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Date: {entry.date} | Entity: {entry.fundName}</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: '#555', background: '#fafafa' }}>
                        <th style={{ padding: '4px' }}>Code</th>
                        <th style={{ padding: '4px' }}>Account Label</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Debit</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.lines.map((l: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px dotted #eee' }}>
                          <td style={{ padding: '4px', fontWeight: 'bold' }}>{l.accountCode}</td>
                          <td style={{ padding: '4px' }}>{INITIAL_COA[l.accountCode as keyof typeof INITIAL_COA] || l.accountName}</td>
                          <td style={{ padding: '4px', textAlign: 'right' }}>{l.debitInCents > 0 ? (l.debitInCents / 100).toLocaleString() : '-'}</td>
                          <td style={{ padding: '4px', textAlign: 'right' }}>{l.creditInCents > 0 ? (l.creditInCents / 100).toLocaleString() : '-'}</td>
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
          <h3 style={{ marginTop: 0, color: '#002d62' }}>Investran Partnership Capital Account Management Engine</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #ddd', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#002d62', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>LP Identifier</th>
                <th style={{ padding: '12px 10px' }}>Investor Entity Name</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Fund Pro-Rata Share</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Total Initial Commitment</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Remaining Unfunded Capital Balance</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#555' }}>{p.id}</td>
                  <td style={{ padding: '10px' }}>{p.name}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#0070f3' }}>{(p.pct * 100).toFixed(2)}%</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{(p.commitment / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: p.unfunded < p.commitment ? '#b22222' : '#222' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div>
              <h3 style={{ marginTop: 0, color: '#d9383a' }}>Automated Reconciliation Suite (Position, Cash & Commitment Matching)</h3>
              <p style={{ fontSize: '0.9rem', color: '#555', margin: 0 }}>Compares internal Geneva General Ledger book balances against external bank registry feeds and custody positions.</p>
            </div>
            <button onClick={runAutoReconciliation} style={{ padding: '10px 18px', background: '#d9383a', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              ⚡ Execute Automated iRecs Matching Cycle
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #ddd', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#333', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Category</th>
                <th style={{ padding: '10px' }}>Account Mapping</th>
                <th style={{ padding: '10px' }}>External Statement Source Description</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Internal Book GL Balance</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>External Vault Balance</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Break / Variance</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Matching Status</th>
              </tr>
            </thead>
            <tbody>
              {reconItems.map((item) => {
                const internalBal = getInternalGlBalance(item.accountCode);
                const isMatched = matchedIds.includes(item.id);
                const variance = internalBal - item.externalAmount;

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #ddd', backgroundColor: isMatched ? '#f3faf4' : '#fff9f9' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>
                      {item.type === 'Cash' && '💵 Cash'}
                      {item.type === 'Position' && '📊 Position'}
                      {item.type === 'Commitment' && '🤝 Commitment'}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: '#eee', padding: '2px 5px', borderRadius: '3px' }}>{item.accountCode}</span> 
                      <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '5px' }}>({INITIAL_COA[item.accountCode as keyof typeof INITIAL_COA]})</span>
                    </td>
                    <td style={{ padding: '10px', color: '#444' }}>{item.description}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {(internalBal / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>
                      {(item.externalAmount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: variance === 0 ? 'green' : '#d9383a' }}>
                      {(variance / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: isMatched ? '#d4edda' : '#f8d7da', color: isMatched ? '#155724' : '#721c24' }}>
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
          <h3 style={{ marginTop: 0, color: '#002d62' }}>Institutional Financial Report Vault</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #ddd', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Report Identifier</th>
                <th style={{ padding: '10px' }}>Document Manifest Name</th>
                <th style={{ padding: '10px' }}>Accounting Category</th>
                <th style={{ padding: '10px' }}>Target Date</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Available Downloads</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep) => (
                <tr key={rep.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#666' }}>{rep.id}</td>
                  <td style={{ padding: '10px' }}><code>{rep.name}</code></td>
                  <td style={{ padding: '10px' }}>{rep.type}</td>
                  <td style={{ padding: '10px' }}>{rep.date}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button onClick={() => alert(`Downloading ${rep.format}...`)} style={{ background: '#002d62', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      ⬇️ Download .{rep.format.toLowerCase()}
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