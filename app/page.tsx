import React from 'react';

export default function Home() {
  return (
    <div style={{ 
      fontFamily: 'sans-serif', 
      padding: '40px', 
      maxWidth: '800px', 
      margin: '0 auto',
      color: '#333' 
    }}>
      <header style={{ borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#111', marginBottom: '8px' }}>
          Investments Explorer
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#666', margin: 0 }}>
          AI-Powered Financial Reporting for Alternative Investments
        </p>
      </header>
      
      <main style={{ marginTop: '40px' }}>
        <section style={{ 
          background: '#f9f9f9', 
          padding: '24px', 
          borderRadius: '8px', 
          border: '1px solid #eaeaea' 
        }}>
          <h2 style={{ marginTop: 0, color: '#222' }}>System Initialization Complete</h2>
          <p>The application engine is prepared. Next modules to deploy:</p>
          <ul style={{ lineHeight: '1.6' }}>
            <li><strong>Intelligent Data Ingestion:</strong> Capital Call / Distribution Notice Parsing</li>
            <li><strong>Ledger Engine:</strong> Multi-Currency Trial Balances & Partner Allocations</li>
            <li><strong>Financial Statements:</strong> SOI (Schedule of Investments) & PCAP Generation</li>
          </ul>
        </section>
      </main>
    </div>
  );
}