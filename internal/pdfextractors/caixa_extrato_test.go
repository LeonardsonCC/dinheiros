package pdfextractors_test

import (
	"os"
	"testing"
	"time"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/pdfextractors"
	"github.com/stretchr/testify/assert"
)

func TestCaixaExtratoExtractor_ExtractTransactions(t *testing.T) {
	accountID := uint(42)
	fullTransactions := []models.Transaction{
		{
			AccountID:   accountID,
			Amount:      6000.00,
			Type:        models.TransactionTypeIncome,
			Description: "CRED PIX",
			Date:        mustParseDate("02/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      1864.37,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("02/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      112.07,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("02/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      350.00,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("02/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      64.00,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("02/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      107.78,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("02/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      259.14,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("02/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      2500.00,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("02/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      8.34,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("05/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      277.43,
			Type:        models.TransactionTypeExpense,
			Description: "PAG BOLETO",
			Date:        mustParseDate("05/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      884.65,
			Type:        models.TransactionTypeExpense,
			Description: "PREST HAB",
			Date:        mustParseDate("06/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      63.84,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("09/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      59.69,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("09/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      100.00,
			Type:        models.TransactionTypeExpense,
			Description: "DB CX CAP",
			Date:        mustParseDate("10/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      30.00,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("11/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      88.89,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("11/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      16.67,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("11/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      42.96,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("12/06/2025"),
		},
		{
			AccountID:   accountID,
			Amount:      21.70,
			Type:        models.TransactionTypeExpense,
			Description: "ENVIO PIX",
			Date:        mustParseDate("18/06/2025"),
		},
	}

	extractor := pdfextractors.NewCaixaExtratoExtractor()

	tests := []struct {
		name     string
		text     string
		expected []models.Transaction
	}{
		{
			name:     "simulating real scenario with multiple transactions",
			text:     getExtractedText(t, "caixa_extrato_ok.txt"),
			expected: fullTransactions,
		},
		{
			name: "ignore incomplete and zero-amount rows",
			text: getExtractedText(t, "caixa_extrato_zero_amount.txt"),
			expected: []models.Transaction{
				fullTransactions[1],
			},
		},
		{
			name: "skip invalid date rows",
			text: getExtractedText(t, "caixa_extrato_invalid_date.txt"),
			expected: []models.Transaction{
				fullTransactions[1],
			},
		},
		{
			name: "skip rows with invalid amount",
			text: getExtractedText(t, "caixa_extrato_invalid_amount.txt"),
			expected: []models.Transaction{
				fullTransactions[1],
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := extractor.ExtractTransactions(tt.text, accountID)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			assertTransactionsEqual(t, got, tt.expected)
		})
	}
}

// Helper to get extracted text from assets_test
func getExtractedText(t *testing.T, fileName string) string {
	t.Helper()
	text, err := os.ReadFile("./assets_test/" + fileName)
	if err != nil {
		t.Fatalf("failed to extract text from %s: %v", fileName, err)
	}
	return string(text)
}

// Helper to parse date in both formats
func mustParseDate(s string) time.Time {
	layouts := []string{"02/01/2006", "02-01-2006"}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t
		}
	}
	panic("invalid date: " + s)
}

// Helper to compare transactions ignoring unexported fields
func assertTransactionsEqual(t *testing.T, a, b []models.Transaction) {
	assert.EqualValues(t, len(b), len(a), "Transaction slice lengths do not match")
	assert.EqualValues(t, a, b, "Transaction slices do not match")
}

// func TestA(t *testing.T) {
// 	t.Log("This is a placeholder test function.")
// 	// This is just a placeholder to ensure the package compiles.
// 	// Actual tests are in TestCaixaExtratoExtractor_ExtractTransactions.
// 	extractor := pdfextractors.NewCaixaExtratoExtractor()
// 	content, err := extractor.ExtractText("./assets_test/CAIXA.pdf")
// 	if err != nil {
// 		t.Fatalf("failed to extract text: %v", err)
// 	}
// 	err = os.WriteFile("./assets_test/caixa_extrato_pdf.txt", []byte(content), 0644)
// 	if err != nil {
// 		t.Fatalf("failed to write file: %v", err)
// 	}
// }
