// Inside app/page.tsx, locate the table element and replace its headers and body rows with this snippet:
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