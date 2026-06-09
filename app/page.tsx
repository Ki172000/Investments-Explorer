'use client';

import React, { useState, useEffect } from 'react';

// --- INITIAL SEED DATA FOR DEMO ---
const INITIAL_PARTNERS = [
  { id: 'LP-01', name: 'Alpha Endowment Fund', commitment: 50000000, unfunded: 40000000, pct: 0.50 }, // $500k commitment
  { id: 'LP-02', name: 'Beacon Pension Plan', commitment: 30000000, unfunded: 24000000, pct: 0.30 },    // $300k commitment
  { id: 'LP-03', name: 'Convergence Wealth Management', commitment: 20000000, unfunded: 16000000, pct: 0.20 } // $200k commitment
];

const INITIAL_COA = {
  1100: 'Cash / Clearing Account',
  1200: 'Private Equity Investments (Fair Value)',
  1300: 'Bank Loans Receivable',
  3100: 'Partners Capital - LP Contributions',
  3300: 'Unfunded Capital Commitments Offset',
  5100: 'Management & Performance Fees'
};

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<'ingestion' | 'ledger' | 'investran' | 'reports'>('ingestion');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Simulated Local DB State
  const [partners, setPartners] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [activeExtraction, setActiveExtraction] = useState<any>(null);

  // Initialize data on load
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

  // Sync helpers
  const saveToLocalStorage = (newPartners: any[], newLedger: any[], newReports: any[]) => {
    setPartners(newPartners);
    setJournalEntries(newLedger);
    setReports(newReports);
    localStorage.setItem('inv_partners', JSON.stringify(newPartners));
    localStorage.setItem('inv_ledger', JSON.stringify(newLedger));
    localStorage.setItem('inv_reports', JSON.stringify(newReports));
  };

  // --- 1. AI INGESTION ENGINE ---
  const handleAiParse = async () => {
    if (!inputText.trim()) return alert('Please paste some text documentation first.');
    setLoading(true);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: inputText }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Extraction failed');

      // Add operational logic: Run Exception Matching Check against the "Investran" partner state
      let status = 'VALIDATED';
      let exceptionReason = '';
      const totalCalled = data.totalAmountInCents || 0;

      // Verify aggregate remaining unfunded capacity
      const totalUnfundedAvailable = partners.reduce((sum, p) => sum + p.unfunded, 0);
      if (data.transactionType === 'Capital Call' && totalCalled > totalUnfundedAvailable) {
        status = 'EXCEPTION';
        exceptionReason = `Breach: Called amount (${(totalCalled/100).toLocaleString()}) exceeds total available fund unfunded limits (${(totalUnfundedAvailable/100).toLocaleString()}).`;
      }

      setActiveExtraction({ ...data, status, exceptionReason });
    } catch (err: any) {
      alert(err.message || 'An error occurred during pipeline execution.');
    } finally {
      setLoading(false);
    }
  };

  // --- POST TRANSACTION TO LEDGERS ---
  const postToLedger = () => {
    if (!activeExtraction) return;

    // Create unique reference record
    const newEntry = {
      id: `JE-${Date.now().toString().slice(-4)}`,
      date: activeExtraction.noticeDate || new Date().toISOString().split('T')[0],
      fundName: activeExtraction.fundName,
      type: activeExtraction.transactionType,
      status: activeExtraction.status,
      reason: activeExtraction.exceptionReason,
      lines: activeExtraction.suggestedLedgerLines
    };

    const updatedLedger = [newEntry, ...journalEntries];
    let updatedPartners = [...partners];
    let updatedReports = [...reports];

    // If it's a validated capital call, execute the Investran Pro-Rata allocation waterfall downstream
    if (activeExtraction.transactionType === 'Capital Call' && activeExtraction.status === 'VALIDATED') {
      const totalAmount = activeExtraction.totalAmountInCents;
      
      // Reduce individual partner unfunded commitment fields based on their explicit pro-rata LP percentage
      updatedPartners = partners.map(p => ({
        ...p,
        unfunded: Math.max(0, p.unfunded - (totalAmount * p.pct))
      }));

      // Automatically compile frozen PCAP download records inside the repository
      updatedReports = [
        {
          id: `REP-${Date.now().toString().slice(-4)}`,
          name: `${activeExtraction.fundName.replace(/\s+/g, '_')}_PCAP_Notice_Settlement`,
          type: 'Partner Capital Statement (PCAP)',
          date: activeExtraction.noticeDate,
          format: 'XLSX'
        },
        ...reports
      ];
    }

    saveToLocalStorage(updatedPartners, updatedLedger, updatedReports);
    alert(activeExtraction.status === 'EXCEPTION' ? 'Posted as EXCEPTION block.' : 'Ledger balanced and posted across sub-systems successfully!');
    setActiveExtraction(null);
    setInputText('');
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '25px', maxWidth: '1300px', margin: '0 auto', color: '#222', background: '#fcfcfc' }}>
      
      {/* HEADER SECTION */}
      <header style={{ borderBottom: '2px solid #002d62', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#002d62' }}>Investments Explorer</h1>
          <p style={{ margin: '3px 0 0 0', color: '#555', fontSize: '0.95rem' }}>AI Architecture Engine • Investran Partnership Ledger & Geneva General Ledger Hybrid Terminal</p>
        </div>
        <div style={{ fontSize: '0.85rem', background: '#002d62', color: 'white', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}>
          SYSTEM ENVIRONMENT ACTIVE
        </div>
      </header>

      {/* CORE NAVIGATION MENU TABS */}
      <nav style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('ingestion')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: activeTab === 'ingestion' ? '#002d62' : '#eee', color: activeTab === 'ingestion' ? 'white' : '#333', fontWeight: 'bold' }}>
          🤖 Notice Ingestion & Exception Parsing
        </button>
        <button onClick={() => setActiveTab('ledger')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: activeTab === 'ledger' ? '#002d62' : '#eee', color: activeTab === 'ledger' ? 'white' : '#333', fontWeight: 'bold' }}>
          📈 Geneva Asset General Ledger
        </button>
        <button onClick={() => setActiveTab('investran')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: activeTab === 'investran' ? '#002d62' : '#eee', color: activeTab === 'investran' ? 'white' : '#333', fontWeight: 'bold' }}>
          👥 Investran Partnership Registry
        </button>
        <button onClick={() => setActiveTab('reports')} style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '4px', background: activeTab === 'reports' ? '#002d62' : '#eee', color: activeTab === 'reports' ? 'white' : '#333', fontWeight: 'bold' }}>
          📁 Built-in Report Depository
        </button>
      </nav>

      {/* TAB 1: INGESTION WORKSPACE */}
      {activeTab === 'ingestion' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
          <div>
            <h3 style={{ marginTop: 0, color: '#002d62' }}>1. Unstructured Document Ingestion Pipeline</h3>
            <p style={{ fontSize: '0.88rem', color: '#555' }}>Drop raw copy-pasted text from Capital Calls, Bank Loan notices, or Rollovers into the processor box below:</p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw text here..."
              style={{ width: '100%', height: '280px', padding: '12px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
            <button
              onClick={handleAiParse}
              disabled={loading}
              style={{ marginTop: '12px', width: '100%', padding: '12px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}
            >
              {loading ? 'AI Engine Mapping and Evaluating Rules...' : 'Execute Structured AI Ledger Extraction'}
            </button>
          </div>

          <div>
            <h3 style={{ marginTop: 0, color: '#002d62' }}>2. Live Double-Entry Matching View</h3>
            {!activeExtraction ? (
              <div style={{ border: '2px dashed #ccc', borderRadius: '4px', height: '345px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777', backgroundColor: '#fafafa' }}>
                Pipeline resting. Awaiting operational text data...
              </div>
            ) : (
              <div style={{ background: '#fff', padding: '20px', borderRadius: '4px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#002d62' }}>{activeExtraction.transactionType} Data Frame</h4>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', background: activeExtraction.status === 'EXCEPTION' ? '#ffcccc' : '#d4edda', color: activeExtraction.status === 'EXCEPTION' ? '#cc0000' : '#155724' }}>
                    {activeExtraction.status}
                  </span>
                </div>

                {activeExtraction.status === 'EXCEPTION' && (
                  <div style={{ background: '#fff3cd', color: '#856404', padding: '10px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '15px', border: '1px solid #ffeeba' }}>
                    ⚠️ <strong>Exception Log:</strong> {activeExtraction.exceptionReason}
                  </div>
                )}

                <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Fund Entity:</strong> {activeExtraction.fundName}</p>
                <p style={{ margin: '6px 0', fontSize: '0.9rem' }}><strong>Value Run:</strong> {((activeExtraction.totalAmountInCents || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: activeExtraction.currency || 'USD' })}</p>

                <h5 style={{ margin: '15px 0 8px 0', fontSize: '0.9rem', textTransform: 'uppercase', color: '#555' }}>Double-Entry Balancing Lines (Geneva GL Mapping)</h5>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '15px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd', background: '#f5f5f5', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Account Code</th>
                      <th style={{ padding: '6px' }}>Account Name Mapping</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>Debit (Cents)</th>
                      <th style={{ padding: '6px', textAlign: 'right' }}>Credit (Cents)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeExtraction.suggestedLedgerLines?.map((line: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '6px', fontWeight: 'bold' }}>{line.accountCode}</td>
                        <td style={{ padding: '6px' }}>{INITIAL_COA[line.accountCode as keyof typeof INITIAL_COA] || line.accountName}</td>
                        <td style={{ padding: '6px', textAlign: 'right', color: 'green' }}>{line.debitInCents > 0 ? line.debitInCents.toLocaleString() : '-'}</td>
                        <td style={{ padding: '6px', textAlign: 'right', color: 'red' }}>{line.creditInCents > 0 ? line.creditInCents.toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button onClick={postToLedger} style={{ width: '100%', padding: '10px', background: '#002d62', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Confirm and Commit Transaction Entry Across Core Modules
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GENEVA ASSET GENERAL LEDGER */}
      {activeTab === 'ledger' && (
        <div>
          <h3 style={{ marginTop: 0, color: '#002d62' }}>Geneva Transaction General Ledger (Double-Entry Audit)</h3>
          <p style={{ fontSize: '0.9rem', color: '#555' }}>Historical records of all validated journal entries mapped across system metrics.</p>
          {journalEntries.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', background: '#eee', borderRadius: '4px', color: '#666' }}>No entries found in current general ledger trial block.</div>
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
                        <th style={{ padding: '4px', textAlign: 'right' }}>Debit (Cents)</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Credit (Cents)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.lines.map((l: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px dotted #eee' }}>
                          <td style={{ padding: '4px', fontWeight: 'bold' }}>{l.accountCode}</td>
                          <td style={{ padding: '4px' }}>{INITIAL_COA[l.accountCode as keyof typeof INITIAL_COA] || l.accountName}</td>
                          <td style={{ padding: '4px', textAlign: 'right' }}>{l.debitInCents > 0 ? l.debitInCents.toLocaleString() : '-'}</td>
                          <td style={{ padding: '4px', textAlign: 'right' }}>{l.creditInCents > 0 ? l.creditInCents.toLocaleString() : '-'}</td>
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

      {/* TAB 3: INVESTRAN PARTNERSHIP REGISTRY */}
      {activeTab === 'investran' && (
        <div>
          <h3 style={{ marginTop: 0, color: '#002d62' }}>Investran Partnership Capital Account Management Engine</h3>
          <p style={{ fontSize: '0.9rem', color: '#555' }}>Tracks Limited Partner registry data, committed allocations, and remaining capital obligations.</p>
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

      {/* TAB 4: BUILT-IN REPORT DEPOSITORY */}
      {activeTab === 'reports' && (
        <div>
          <h3 style={{ marginTop: 0, color: '#002d62' }}>Institutional Financial Report Vault & Download Depository</h3>
          <p style={{ fontSize: '0.9rem', color: '#555' }}>Download frozen statements, audit trials, and PCAPs generated automatically by the platform workflow operations.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #ddd', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Report Identifier</th>
                <th style={{ padding: '10px' }}>Document Manifest Name</th>
                <th style={{ padding: '10px' }}>Accounting Statement Category</th>
                <th style={{ padding: '10px' }}>Generation Target Date</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Available Downloads</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep) => (
                <tr key={rep.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#666' }}>{rep.id}</td>
                  <td style={{ padding: '10px', fontWeight: '500' }}><code>{rep.name}</code></td>
                  <td style={{ padding: '10px' }}>{rep.type}</td>
                  <td style={{ padding: '10px' }}>{rep.date || '2026-06-01'}