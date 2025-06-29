package pdfextractors_test

import (
	"testing"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/pdfextractors"
)

func TestCaixaCCFaturaExtractor_ExtractTransactions(t *testing.T) {
	accountID := uint(42)
	fullTransactions := []models.Transaction{
		{Date: mustParseDate("18/04/2025"), Amount: 27.4, Type: models.TransactionTypeExpense, Description: "PADARIA", AccountID: accountID},
		{Date: mustParseDate("20/04/2025"), Amount: 163, Type: models.TransactionTypeExpense, Description: "PizzaVoMaria", AccountID: accountID},
		{Date: mustParseDate("21/04/2025"), Amount: 85.00, Type: models.TransactionTypeExpense, Description: "JeronimoFlorianop", AccountID: accountID},
		{Date: mustParseDate("21/04/2025"), Amount: 159.90, Type: models.TransactionTypeExpense, Description: "LOJAS RENNER FL 91", AccountID: accountID},
		{Date: mustParseDate("23/04/2025"), Amount: 12.43, Type: models.TransactionTypeExpense, Description: "AMAZON BR", AccountID: accountID},
		{Date: mustParseDate("23/04/2025"), Amount: 238.32, Type: models.TransactionTypeExpense, Description: "AMAZON BR", AccountID: accountID},
		{Date: mustParseDate("23/04/2025"), Amount: 4.14, Type: models.TransactionTypeExpense, Description: "AMAZON BR", AccountID: accountID},
		{Date: mustParseDate("23/04/2025"), Amount: 16.99, Type: models.TransactionTypeExpense, Description: "AMAZON BR", AccountID: accountID},
		{Date: mustParseDate("24/04/2025"), Amount: 218.40, Type: models.TransactionTypeExpense, Description: "LIVORNO MASSAS E PIZZA", AccountID: accountID},
		{Date: mustParseDate("24/04/2025"), Amount: 32.68, Type: models.TransactionTypeExpense, Description: "RAIA1479", AccountID: accountID},
		{Date: mustParseDate("28/04/2025"), Amount: 19.90, Type: models.TransactionTypeExpense, Description: "AmazonPrimeBR", AccountID: accountID},
		{Date: mustParseDate("29/04/2025"), Amount: 11.70, Type: models.TransactionTypeExpense, Description: "PAPELARIA NYCE", AccountID: accountID},
		{Date: mustParseDate("29/04/2025"), Amount: 33.90, Type: models.TransactionTypeExpense, Description: "AMAZON BR", AccountID: accountID},
		{Date: mustParseDate("30/04/2025"), Amount: 235.14, Type: models.TransactionTypeExpense, Description: "BERLINF*AC CIDADE UNIV", AccountID: accountID},
		{Date: mustParseDate("01/05/2025"), Amount: 37.90, Type: models.TransactionTypeExpense, Description: "AMAZON BR", AccountID: accountID},
		{Date: mustParseDate("03/05/2025"), Amount: 10.99, Type: models.TransactionTypeExpense, Description: "DAISO BRASIL-VILLA ROM", AccountID: accountID},
		{Date: mustParseDate("03/05/2025"), Amount: 46.00, Type: models.TransactionTypeExpense, Description: "REDECINE FLN", AccountID: accountID},
		{Date: mustParseDate("03/05/2025"), Amount: 109.91, Type: models.TransactionTypeExpense, Description: "VITAMAR COMERCIO DE C", AccountID: accountID},
		{Date: mustParseDate("03/05/2025"), Amount: 86.24, Type: models.TransactionTypeExpense, Description: "HNA*OBOTICARIO", AccountID: accountID},
		{Date: mustParseDate("03/05/2025"), Amount: 50.00, Type: models.TransactionTypeExpense, Description: "SALAO GONSALI", AccountID: accountID},
		{Date: mustParseDate("03/05/2025"), Amount: 48.40, Type: models.TransactionTypeExpense, Description: "CASA AMIMAR COMERCIO L", AccountID: accountID},
		{Date: mustParseDate("05/05/2025"), Amount: 60.00, Type: models.TransactionTypeExpense, Description: "NOVATEC EDITORA", AccountID: accountID},
		{Date: mustParseDate("05/05/2025"), Amount: 15.96, Type: models.TransactionTypeExpense, Description: "SUPERMERCADOS IMPERATR", AccountID: accountID},
		{Date: mustParseDate("05/05/2025"), Amount: 38.00, Type: models.TransactionTypeExpense, Description: "MCandomilFarias", AccountID: accountID},
		{Date: mustParseDate("06/05/2025"), Amount: 70.00, Type: models.TransactionTypeExpense, Description: "BTINGRESSOS", AccountID: accountID},
		{Date: mustParseDate("06/05/2025"), Amount: 38.00, Type: models.TransactionTypeExpense, Description: "MCandomilFarias", AccountID: accountID},
		{Date: mustParseDate("09/05/2025"), Amount: 97.00, Type: models.TransactionTypeExpense, Description: "MOOCHACHO", AccountID: accountID},
		{Date: mustParseDate("10/05/2025"), Amount: 15.00, Type: models.TransactionTypeExpense, Description: "POSTO MIRIM", AccountID: accountID},
		{Date: mustParseDate("11/05/2025"), Amount: 34.20, Type: models.TransactionTypeExpense, Description: "AMAZON MARKETPLACE", AccountID: accountID},
		{Date: mustParseDate("13/05/2025"), Amount: 136.63, Type: models.TransactionTypeExpense, Description: "FARMACIA SAO JOAO", AccountID: accountID},
		{Date: mustParseDate("14/05/2025"), Amount: 25.72, Type: models.TransactionTypeExpense, Description: "QuatroEstacoes", AccountID: accountID},
		{Date: mustParseDate("14/05/2025"), Amount: 40.87, Type: models.TransactionTypeExpense, Description: "SUPERMERCADOS IMPERATR", AccountID: accountID},
		{Date: mustParseDate("15/05/2025"), Amount: 32.31, Type: models.TransactionTypeExpense, Description: "MP*BERTPARILLA", AccountID: accountID},
		{Date: mustParseDate("16/05/2025"), Amount: 175.95, Type: models.TransactionTypeExpense, Description: "AMAZON BR", AccountID: accountID},
		{Date: mustParseDate("18/05/2025"), Amount: 38.45, Type: models.TransactionTypeExpense, Description: "AMAZON BR", AccountID: accountID},
		{Date: mustParseDate("18/04/2025"), Amount: 25.91, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("21/04/2025"), Amount: 21.97, Type: models.TransactionTypeExpense, Description: "UBER * PENDING", AccountID: accountID},
		{Date: mustParseDate("17/04/2025"), Amount: 24.90, Type: models.TransactionTypeExpense, Description: "DL *GOOGLE YouTubePrem", AccountID: accountID},
		{Date: mustParseDate("23/04/2025"), Amount: 19.99, Type: models.TransactionTypeExpense, Description: "EBANX*CRUNCHYROLL", AccountID: accountID},
		{Date: mustParseDate("25/04/2025"), Amount: 59.9, Type: models.TransactionTypeExpense, Description: "NETFLIX.COM", AccountID: accountID},
		{Date: mustParseDate("08/05/2025"), Amount: 1.99, Type: models.TransactionTypeExpense, Description: "DL     *GOOGLE YouTube", AccountID: accountID},
		{Date: mustParseDate("11/05/2025"), Amount: 34.90, Type: models.TransactionTypeExpense, Description: "EBN*SPOTIFY", AccountID: accountID},
		{Date: mustParseDate("17/05/2025"), Amount: 26.90, Type: models.TransactionTypeExpense, Description: "Google YouTubePremium", AccountID: accountID},
		{Date: mustParseDate("24/04/2025"), Amount: 38.92, Type: models.TransactionTypeExpense, Description: "UBER * PENDING", AccountID: accountID},
		{Date: mustParseDate("24/04/2025"), Amount: 14.91, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("24/04/2025"), Amount: 39.96, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("25/04/2025"), Amount: 18.94, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("25/04/2025"), Amount: 23.95, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("25/04/2025"), Amount: 24.90, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("02/05/2025"), Amount: 14.97, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("02/05/2025"), Amount: 15.94, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("05/05/2025"), Amount: 23.96, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("05/05/2025"), Amount: 16.94, Type: models.TransactionTypeExpense, Description: "UBER * PENDING", AccountID: accountID},
		{Date: mustParseDate("06/05/2025"), Amount: 29.95, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("06/05/2025"), Amount: 14.94, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("07/05/2025"), Amount: 23.97, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("19/05/2025"), Amount: 23.54, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("19/05/2025"), Amount: 14.93, Type: models.TransactionTypeExpense, Description: "UBER* TRIP", AccountID: accountID},
		{Date: mustParseDate("17/04/2025"), Amount: 1549.30, Type: models.TransactionTypeExpense, Description: "NULL                      01 DE 04", AccountID: accountID},
		{Date: mustParseDate("24/04/2025"), Amount: 559.98, Type: models.TransactionTypeExpense, Description: "MERCADOLIVRE*EBAZARCOM    01 DE 05", AccountID: accountID},
	}

	extractor := pdfextractors.NewCaixaCCFaturaExtractor()

	tests := []struct {
		name     string
		text     string
		expected []models.Transaction
	}{
		{
			name:     "simulating real scenario with multiple transactions",
			text:     getExtractedText(t, "caixa_cc_fatura_ok.txt"),
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
