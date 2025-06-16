package pdfextractors

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/ledongthuc/pdf"

	"github.com/LeonardsonCC/dinheiros/internal/models"
)

type nubankExtratoExtractor struct{}

func NewNubankExtratoExtractor() *nubankExtratoExtractor {
	return &nubankExtratoExtractor{}
}

func (s *nubankExtratoExtractor) Name() string {
	return "Nubank - Extrato"
}

func (s *nubankExtratoExtractor) ExtractText(filePath string) (string, error) {
	file, reader, err := pdf.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open PDF file: %v", err)
	}
	defer func() {
		_ = file.Close()
	}()

	var textBuilder string
	for pageIndex := 1; pageIndex <= reader.NumPage(); pageIndex++ {
		page := reader.Page(pageIndex)
		if page.V.IsNull() {
			continue
		}
		content, err := page.GetPlainText(nil)
		if err != nil {
			return "", fmt.Errorf("failed to extract text from page %d: %v", pageIndex, err)
		}
		textBuilder += content
	}
	return textBuilder, nil
}

func (e *nubankExtratoExtractor) Extract(filePath string, accountID uint) ([]models.Transaction, error) {
	text, err := e.ExtractText(filePath)
	if err != nil {
		return nil, err
	}

	transactions, err := e.ExtractTransactions(text, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to extract transactions: %v", err)
	}

	return transactions, nil
}

func (e *nubankExtratoExtractor) ExtractTransactions(text string, accountID uint) ([]models.Transaction, error) {
	lines := e.splitLines(text)

	var transactions []models.Transaction
	var currentDate time.Time

	monthMap := map[string]string{
		"JAN": "01", "FEV": "02", "MAR": "03", "ABR": "04", "MAI": "05", "JUN": "06",
		"JUL": "07", "AGO": "08", "SET": "09", "OUT": "10", "NOV": "11", "DEZ": "12",
	}

	for i := 0; i < len(lines); i++ {
		line := lines[i]

		// Check for a date line
		dateParts := strings.Fields(line)
		if len(dateParts) == 3 {
			if month, ok := monthMap[dateParts[1]]; ok {
				dateStr := fmt.Sprintf("%s-%s-%s", dateParts[0], month, dateParts[2])
				if d, err := time.Parse("02-01-2006", dateStr); err == nil {
					currentDate = d
					continue
				}
			}
		}

		if currentDate.IsZero() {
			continue
		}

		// Transaction block starts with "Transferência", "Pagamento", or "Reembolso"
		if strings.HasPrefix(line, "Transferência") || strings.HasPrefix(line, "Pagamento de fatura") || strings.HasPrefix(line, "Reembolso") {
			description := line

			// The next lines until the amount are part of the description
			j := i + 1
			var descriptionDetailsLines []string
			for j < len(lines) && !isTransactionAmount(lines[j]) {
				descriptionDetailsLines = append(descriptionDetailsLines, lines[j])
				j++
			}

			if len(descriptionDetailsLines) > 0 {
				firstDetailLine := descriptionDetailsLines[0]
				if strings.Contains(firstDetailLine, " - ") {
					name := strings.Split(firstDetailLine, " - ")[0]
					description = fmt.Sprintf("%s %s", description, name)
				} else if line != "Pagamento de fatura" {
					description = fmt.Sprintf("%s %s", description, firstDetailLine)
				}
			}

			if j < len(lines) { // Found an amount
				amountStr := lines[j]
				amount, err := e.parseAmount(amountStr)
				if err == nil && amount > 0 {
					description = strings.Join(strings.Fields(description), " ")

					txType := models.TransactionTypeExpense
					if strings.Contains(line, "recebida") || strings.Contains(line, "Reembolso") {
						txType = models.TransactionTypeIncome
					}

					transaction := models.Transaction{
						Date:        currentDate,
						Amount:      amount,
						Type:        txType,
						Description: description,
						AccountID:   accountID,
					}
					transactions = append(transactions, transaction)
					i = j // Continue search from after the amount
				}
			}
		}
	}

	return transactions, nil
}

// isTransactionAmount checks if a string is a valid transaction amount.
// It's different from a simple number parser because it assumes amounts have two decimal places.
func isTransactionAmount(s string) bool {
	s = strings.TrimSpace(s)
	// Must not contain alphabetic characters, except for a possible R$ prefix.
	if strings.ContainsAny(strings.TrimPrefix(s, "R$ "), "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") {
		return false
	}
	// Replace thousand separators and use dot for decimal.
	s = strings.ReplaceAll(s, ".", "")
	s = strings.ReplaceAll(s, ",", ".")
	// Check if it's a valid float.
	if _, err := strconv.ParseFloat(s, 64); err != nil {
		return false
	}
	// It should have a decimal point and two digits after.
	if !strings.Contains(s, ".") {
		return false
	}
	parts := strings.Split(s, ".")
	return len(parts) == 2 && len(parts[1]) == 2
}

func (e *nubankExtratoExtractor) parseAmount(amountStr string) (float64, error) {
	amountStr = strings.TrimSpace(amountStr)
	amountStr = strings.ReplaceAll(amountStr, ".", "")
	amountStr = strings.ReplaceAll(amountStr, ",", ".")
	return strconv.ParseFloat(amountStr, 64)
}

func (e *nubankExtratoExtractor) splitLines(s string) []string {
	// Split on newlines and tabs
	fields := strings.FieldsFunc(s, func(r rune) bool {
		return r == '\n' || r == '\r'
	})
	var lines []string
	for _, f := range fields {
		trimmed := strings.TrimSpace(f)
		if trimmed != "" {
			lines = append(lines, trimmed)
		}
	}
	return lines
}
