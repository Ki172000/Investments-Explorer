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

// --- iRECS MOCK CUSTODIAN DATA FOR RECONCILIATION ---
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

  // Reconciliation Workset State
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

  // Compute Current Balances from Ledger for Internal GL matching side
  const getInternalGlBalance = (accountCode: string) => {
    let balance = 0;
    // Set baseline structural defaults to match starting demo records
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

  // iRecs Automated Matching Pipeline Loop
  const runAutoReconciliation = () => {
    const newlyMatched: string[] = [];
    
    reconItems.forEach(item => {
      const internalVal = getInternalGlBalance(item.accountCode);
      // Auto match if variance drops to exactly zero
      if (internalVal === item.externalAmount) {
        newlyMatched.push(item.id);
      }
    });

    setMatchedIds(newlyMatched);
    if(newlyMatched.length > 0) {
      alert(`iRecs Engine auto-matched ${newlyMatched.length} transactions with zero variances!`);
    } else {
      alert('Recon complete: No exact baseline variance matches located.');
    }
  };

  async function handleAiParse() {
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

      let status =