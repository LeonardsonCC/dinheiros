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
		{AccountID: 42, Amount: 5112.83, Type: "income", Description: "TEDSALARIO", Date: mustParseDate("01/08/2024")},
		{AccountID: 42, Amount: 300, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("01/08/2024")},
		{AccountID: 42, Amount: 1692.32, Type: "expense", Description: "PAG BOLETO", Date: mustParseDate("01/08/2024")},
		{AccountID: 42, Amount: 106.9, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("01/08/2024")},
		{AccountID: 42, Amount: 55, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("01/08/2024")},
		{AccountID: 42, Amount: 68.8, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("01/08/2024")},
		{AccountID: 42, Amount: 265.83, Type: "expense", Description: "PAG BOLETO", Date: mustParseDate("06/08/2024")},
		{AccountID: 42, Amount: 300, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("07/08/2024")},
		{AccountID: 42, Amount: 133.53, Type: "expense", Description: "PAG BOLETO", Date: mustParseDate("09/08/2024")},
		{AccountID: 42, Amount: 20, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("12/08/2024")},
		{AccountID: 42, Amount: 227.62, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("12/08/2024")},
		// missing
		{AccountID: 42, Amount: 59.9, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("29/08/2024")},
		{AccountID: 42, Amount: 6486.29, Type: "income", Description: "TEDSALARIO", Date: mustParseDate("30/08/2024")},
		{AccountID: 42, Amount: 14.9, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("30/08/2024")},
		{AccountID: 42, Amount: 74.77, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("30/08/2024")},
		{AccountID: 42, Amount: 5105.57, Type: "income", Description: "TEDSALARIO", Date: mustParseDate("02/09/2024")},
		{AccountID: 42, Amount: 106.9, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("02/09/2024")},
		{AccountID: 42, Amount: 1715.94, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("02/09/2024")},
		{AccountID: 42, Amount: 55, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("02/09/2024")},
		{AccountID: 42, Amount: 350, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("02/09/2024")},
		{AccountID: 42, Amount: 227.62, Type: "expense", Description: "ENVIO PIX", Date: mustParseDate("02/09/2024")},
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
