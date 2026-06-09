'use client';

import React, { useState } from 'react';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

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
      if (res.ok) setExtractedData(data);
      else alert(data.error || 'Extraction failed');
    } catch (err) {
      alert('An error occurred during verification processing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '30px', maxWidth: '1100px', margin: '0 auto', color: '#222' }}>
      <header style={{ borderBottom: '2px solid #eaeaea', paddingBottom: '15px', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Investments Explorer</h1>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>AI Automated Processing & Double-Entry Asset Ledger</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left Side: Input Document Text */}
        <div>
          <h3 style={{ marginTop: 0 }}>1. Fund Document Notice Text Ingestion</h3>
          <p style={{ fontSize: '0.9rem', color: '#555' }}>Paste text from a capital call memo or loan notice below:</p>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Example: Global Infrastructure Partners IV call notice on June 1, 2026. Requesting a capital drawdown call of $50,000.00 due by June 15, 2026 for investment purposes..."
            style={{ width: '100%', height: '250px', padding: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'inherit' }}
          />
          <button
            onClick={handleAiParse}
            disabled={loading}
            style={{ marginTop: '12px', width: '100%', padding: '12px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'AI Engine Processing Transaction...' : 'Execute Structured AI Ledger Extraction'}
          </button>
        </div>

        {/* Right Side: Render Structured Data View */}
        <div>
          <h3 style={{ marginTop: 0 }}>2. AI Extraction Ledger Verification</h3>
          {!extractedData ? (
            <div style={{ border: '2px dashed #ddd', borderRadius: '6px', height: '315px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              Awaiting payload execution pipeline...
            </div>
          ) : (
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '6px', border: '1px solid #eaeaea' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#0070f3' }}>{extractedData.transactionType} Identifiers</h4>
              <p><strong>Fund Entity:</strong> {extractedData.fundName}</p>
              <p><strong>Notice Date:</strong> {extractedData.noticeDate} | <strong>Due Settlement:</strong> {extractedData.dueDate}</p>
              <p><strong>Total Value Check:</strong> {(extractedData.totalAmountInCents / 100).toLocaleString('en-US', { style: 'currency', currency: extractedData.currency })}</p>

              <h4 style={{ margin: '20px 0 10px 0' }}>Generated Draft Double-Entry Journal Lines</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                    <th style={{ padding: '6px' }}>Code</th>
                    <th style={{ padding: '6px' }}>Account Mapping</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Debit (Cents)</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Credit (Cents)</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.suggestedLedgerLines.map((line: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 6px', fontWeight: 'bold', color: '#555' }}>{line.accountCode}</td>
                      <td style={{ padding: '8px 6px' }}>{line.accountName}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: line.debitInCents > 0 ? '#008000' : '#444' }}>
                        {line.debitInCents.toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: line.creditInCents > 0 ? '#b22222' : '#444' }}>
                        {line.creditInCents.toLocaleString()}
                      </td>
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