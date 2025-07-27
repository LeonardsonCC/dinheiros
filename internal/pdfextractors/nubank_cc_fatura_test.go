package pdfextractors_test

import (
	"testing"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/pdfextractors"
)

func TestNubankCCFaturaExtractor_ExtractTransactions(t *testing.T) {
	accountID := uint(42)
	fullTransactions := []models.Transaction{
		{Date: mustParseDate("09/05/2025"), Amount: 299.80, Type: models.TransactionTypeExpense, Description: "Hostel Alemanha - Parcela 7/10", AccountID: accountID},
		{Date: mustParseDate("19/05/2025"), Amount: 75.51, Type: models.TransactionTypeExpense, Description: "Magalupay*Netshoes - Parcela 1/4", AccountID: accountID},
		{Date: mustParseDate("21/05/2025"), Amount: 5.99, Type: models.TransactionTypeExpense, Description: "Ferreirarosahome", AccountID: accountID},
		{Date: mustParseDate("08/06/2025"), Amount: 40.00, Type: models.TransactionTypeExpense, Description: "Ferias Co", AccountID: accountID},
		{Date: mustParseDate("30/05/2025"), Amount: 381.30, Type: models.TransactionTypeIncome, Description: "Pagamento em 30 MAI", AccountID: accountID},
	}

	extractor := pdfextractors.NewNubankCCFaturaExtractor()

	tests := []struct {
		name     string
		text     string
		expected []models.Transaction
	}{
		{
			name:     "simulating real scenario with multiple transactions",
			text:     getExtractedText(t, "nubank_cc_fatura_ok.txt"),
			expected: fullTransactions,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := extractor.ExtractTransactions(tt.text, accountID)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			assertTransactionsEqual(t, tt.expected, got)
		})
	}
}
