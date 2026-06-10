import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { documentText } = await request.json();

    if (!documentText || !documentText.trim()) {
      return NextResponse.json({ error: 'Empty operational log payload.' }, { status: 400 });
    }

    const cleanText = documentText.trim();
    const blocks = cleanText.split(/transaction architecture batch file|transaction frame|batch file/i);
    const extractedEntries: any[] = [];

    blocks.forEach((block) => {
      const lowercaseBlock = block.toLowerCase();
      if (!lowercaseBlock.trim() || !lowercaseBlock.includes('target fund entity')) return;

      // Classify transaction type using institutional definitions
      let transactionType = 'Capital Drawdown Record';
      if (lowercaseBlock.includes('management fee') || lowercaseBlock.includes('advisory fee') || lowercaseBlock.includes('invoice amount')) {
        transactionType = 'Management Fees Notice';
      } else if (lowercaseBlock.includes('distribution') || lowercaseBlock.includes('return of capital') || lowercaseBlock.includes('divestment')) {
        transactionType = 'Fund Distribution Run';
      } else if (lowercaseBlock.includes('rebalancing') || lowercaseBlock.includes('true-up')) {
        transactionType = 'Prior-Period Adjustment Rebalancing';
      }

      // Extract Target Portfolio Legal Entity
      let fundName = 'AGIP Alternative Investments IV';
      const fundRegex = /(?:fund entity|target fund entity|partnership|fund)\s*:\s*([^\n\r]+)/i;
      const fundMatch = block.match(fundRegex);
      if (fundMatch && fundMatch[1]) {
        fundName = fundMatch[1].trim();
      }

      // Extract Numeric Settlement Amount
      let amountInCents = 0;
      const amountRegex = /(?:\$|php|eur|gbp)\s*([0-9,]+(?:\.[0-9]{2})?)/i;
      const amountMatch = block.match(amountRegex);
      if (amountMatch && amountMatch[1]) {
        const normalized = amountMatch[1].replace(/,/g, '');
        amountInCents = Math.round(parseFloat(normalized) * 100);
      }

      if (amountInCents === 0) return;

      // Map Ledger Legs
      let lines: any[] = [];
      if (transactionType === 'Capital Drawdown Record') {
        lines = [
          { accountCode: '1100', debitInCents: amountInCents, creditInCents: 0 },
          { accountCode: '3100', debitInCents: 0, creditInCents: amountInCents }
        ];
      } else if (transactionType === 'Management Fees Notice') {
        lines = [
          { accountCode: '5100', debitInCents: amountInCents, creditInCents: 0 },
          { accountCode: '1100', debitInCents: 0, creditInCents: amountInCents }
        ];
      } else if (transactionType === 'Fund Distribution Run') {
        lines = [
          { accountCode: '3100', debitInCents: amountInCents, creditInCents: 0 },
          { accountCode: '1100', debitInCents: 0, creditInCents: amountInCents }
        ];
      } else if (transactionType === 'Prior-Period Adjustment Rebalancing') {
        lines = [
          { accountCode: '3100', debitInCents: amountInCents, creditInCents: 0 },
          { accountCode: '1100', debitInCents: 0, creditInCents: amountInCents }
        ];
      }

      const uniqueToken = Math.floor(1000 + Math.random() * 9000);

      extractedEntries.push({
        id: `JE${uniqueToken}`,
        fundName,
        transactionType,
        totalAmountInCents: amountInCents,
        suggestedLedgerLines: lines
      });
    });

    return NextResponse.json({ entries: extractedEntries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Processing engine failure' }, { status: 500 });
  }
}