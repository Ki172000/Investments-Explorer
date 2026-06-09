'use client';

import React, { useState, useEffect } from 'react';

// --- INITIAL SEED DATA FOR DEMO ---
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

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<'ingestion' | 'ledger' | 'investran' | 'reports'>('ingestion');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
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

      let status = 'VALIDATED';
      let exceptionReason = '';
      const totalCalled = data.totalAmountInCents || 0;

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

    saveToLocalStorage(updatedPartners, updatedLedger, updatedReports);
    alert(activeExtraction.status === 'EXCEPTION' ? 'Posted as EXCEPTION block.' : 'Ledger balanced and posted across modules successfully!');
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
                  <h4 style={{ margin: 0, color: '#0