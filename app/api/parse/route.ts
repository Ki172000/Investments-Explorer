import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { documentText } = await request.json();

    if (!documentText || !documentText.trim()) {
      return NextResponse.json({ error: 'No notice payload text provided.' }, { status: 400 });
    }

    const cleanText = documentText.trim();
    
    // Split the document into discrete transaction blocks using common batch headers
    const blocks = cleanText.split(/transaction architecture batch file|transaction frame|batch file/i);
    const extractedEntries: any[] = [];

    // Skip index 0 if it only contains the main header text before the first file block
    blocks.forEach((block, index) => {
      if (index === 0 && !block.toLowerCase().includes('target fund entity')) return;
      
      const lowercaseBlock = block.toLowerCase();
      if (!lowercaseBlock.trim()) return;

      // --- 1. DETERMINE TRANSACTION TYPE ---
      let transactionType = 'Capital Call';
      if (lowercaseBlock.includes('management fee') || lowercaseBlock.includes('advisory fee') || lowercaseBlock.includes('invoice amount')) {
        transactionType = 'Management Fee Notice';
      } else if (lowercaseBlock.includes('distribution') || lowercaseBlock.includes('return of capital') || lowercaseBlock.includes('divestment')) {
        transactionType = 'Fund Distribution';
      }

      // --- 2. EXTRACT ENTITY NAME ---
      let fundName = 'AGIP Alternative Investments IV';
      const fundRegex = /(?:fund entity|target fund entity|partnership|fund)\s*:\s*([^\n\r]+)/i;
      const fundMatch = block.match(fundRegex);
      if (fundMatch && fundMatch[1]) {
        fundName = fundMatch[1].trim();
      }

      // --- 3. EXTRACT NUMERIC EXPOSURE (CENTS) ---
      let amountInCents = 0;
      const amountRegex = /(?:\$|php|eur|gbp)\s*([0-9,]+(?:\.[0-9]{2})?)/i;
      const amountMatch = block.match(amountRegex);
      if (amountMatch && amountMatch[1]) {
        const normalized = amountMatch[1].replace(/,/g, '');
        amountInCents = Math.round(parseFloat(normalized) * 100);
      }

      if (amountInCents === 0) return; // Skip invalid blocks

      // --- 4. GENERATE BALANCED GENEVA DOUBLE-ENTRY SCHEMA ---
      let lines: any[] = [];
      if (transactionType === 'Capital Call') {
        lines = [
          { accountCode: '1100', accountName: 'Cash / Clearing Account', debitInCents: amountInCents, creditInCents: 0 },
          { accountCode: '3100', accountName: 'Partners Capital - LP Contributions', debitInCents: 0, creditInCents: amountInCents }
        ];
      } else if (transactionType === 'Management Fee Notice') {
        lines = [
          { accountCode: '5100', accountName: 'Management & Performance Fees', debitInCents: amountInCents, creditInCents: 0 },
          { accountCode: '1100', accountName: 'Cash / Clearing Account', debitInCents: 0, creditInCents: amountInCents }
        ];
      } else if (transactionType === 'Fund Distribution') {
        lines = [
          { accountCode: '3100', accountName: 'Partners Capital - LP Contributions', debitInCents: amountInCents, creditInCents: 0 },
          { accountCode: '1100', accountName: 'Cash / Clearing Account', debitInCents: 0, creditInCents: amountInCents }
        ];
      }

      extractedEntries.push({
        id: `EXT-${Math.floor(1000 + Math.random() * 9000)}`,
        fundName,
        transactionType,
        totalAmountInCents: amountInCents,
        currency: 'USD',
        suggestedLedgerLines: lines
      });
    });

    return NextResponse.json({ entries: extractedEntries });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal batch processing error' }, { status: 500 });
  }
}