import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { documentText } = await request.json();

    // Check if user actually provided text data
    if (!documentText || !documentText.trim()) {
      return NextResponse.json({ error: 'No notice payload text provided.' }, { status: 400 });
    }

    // Normalized mock processing block to simulate structural AI engine response
    const lowercaseText = documentText.toLowerCase();
    
    let transactionType = 'Capital Call';
    let totalAmountInCents = 150000000; // Default $1.5M demo value
    let fundName = 'AGIP Alternative Investments IV';

    // Basic logic mapping based on paste content keywords
    if (lowercaseText.includes('management fee') || lowercaseText.includes('performance')) {
      transactionType = 'Management Fee Notice';
      totalAmountInCents = 4500000; // $45k
    } else if (lowercaseText.includes('loan') || lowercaseText.includes('facility')) {
      transactionType = 'Bank Loan Drawdown';
      totalAmountInCents = 250000000; // $2.5M
    }

    // Dynamic, balanced Geneva double-entry accounting payload lines representation
    const suggestedLedgerLines = transactionType === 'Capital Call' 
      ? [
          { accountCode: 1100, accountName: 'Cash / Clearing Account', debitInCents: totalAmountInCents, creditInCents: 0 },
          { accountCode: 3100, accountName: 'Partners Capital - LP Contributions', debitInCents: 0, creditInCents: totalAmountInCents }
        ]
      : [
          { accountCode: 5100, accountName: 'Management & Performance Fees', debitInCents: totalAmountInCents, creditInCents: 0 },
          { accountCode: 1100, accountName: 'Cash / Clearing Account', debitInCents: 0, creditInCents: totalAmountInCents }
        ];

    return NextResponse.json({
      fundName,
      transactionType,
      totalAmountInCents,
      currency: 'USD',
      noticeDate: new Date().toISOString().split('T')[0],
      suggestedLedgerLines
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal processing error' }, { status: 500 });
  }
}