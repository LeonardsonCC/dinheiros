package pdfextractors

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/ledongthuc/pdf"
)

type caixaCCFaturaExtractor struct{}

func NewCaixaCCFaturaExtractor() *caixaCCFaturaExtractor {
	return &caixaCCFaturaExtractor{}
}

func (s *caixaCCFaturaExtractor) Name() string {
	return "Caixa - Cartão de Crédito Fatura"
}

func (s *caixaCCFaturaExtractor) ExtractText(filePath string) (string, error) {
	file, reader, err := pdf.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open PDF file: %v", err)
	}
	defer file.Close()

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

func (e *caixaCCFaturaExtractor) Extract(filePath string, accountID uint) ([]models.Transaction, error) {
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

func (e *caixaCCFaturaExtractor) ExtractTransactions(text string, accountID uint) ([]models.Transaction, error) {
	var transactions []models.Transaction
	lines := strings.Split(text, "\n")
	var currentYear = 2025 // fallback to current year, could be dynamic

	for i := 0; i < len(lines); i++ {
		line := strings.TrimSpace(lines[i])
		// Detect start of a transaction table
		if strings.HasPrefix(line, "COMPRAS (Cartão") || strings.HasPrefix(line, "COMPRAS PARCELADAS (Cartão") {
			// Find the column header
			headersFound := false
			for j := i + 1; j < len(lines); j++ {
				h := strings.TrimSpace(lines[j])
				if strings.HasPrefix(h, "Data") {
					i = j + 1 // move to first data row
					headersFound = true
					break
				}
			}
			if !headersFound {
				continue
			}

			// Collect transactions until next blank or 'Total' line
			for i < len(lines) {
				// Skip empty lines
				if strings.TrimSpace(lines[i]) == "" {
					i++
					continue
				}
				if strings.HasPrefix(strings.TrimSpace(lines[i]), "Total") {
					break
				}
				// Try to parse 4 lines (date, desc, city, amount)
				if i+3 < len(lines) {
					dateStr := strings.TrimSpace(lines[i])
					desc := strings.TrimSpace(lines[i+1])
					cityOrAmount := strings.TrimSpace(lines[i+2])
					amountStr := strings.TrimSpace(lines[i+3])
					if isValidDate(dateStr) && isValidAmount(amountStr) {
						parsedDate, _ := parseDayMonth(dateStr, currentYear)
						amount := parseAmountType(amountStr)
						transactions = append(transactions, models.Transaction{
							Date:        parsedDate,
							Amount:      amount,
							Type:        models.TransactionTypeExpense,
							Description: desc,
							AccountID:   accountID,
						})
						i += 4
						continue
					}
					// Sometimes city is missing, try 3-line parse
					if isValidDate(dateStr) && isValidAmount(cityOrAmount) {
						parsedDate, _ := parseDayMonth(dateStr, currentYear)
						amount := parseAmountType(cityOrAmount)
						transactions = append(transactions, models.Transaction{
							Date:        parsedDate,
							Amount:      amount,
							Type:        models.TransactionTypeExpense,
							Description: desc,
							AccountID:   accountID,
						})
						i += 3
						continue
					}
				}
				i++ // fallback: move to next line
			}
		}
	}
	return transactions, nil
}

// Helper: check if string is a valid date in DD/MM format
func isValidDate(s string) bool {
	if len(s) != 5 || s[2] != '/' {
		return false
	}
	return true
}

// Helper: check if string is a valid amount (e.g., 27,40D)
func isValidAmount(s string) bool {
	if len(s) < 2 {
		return false
	}
	last := s[len(s)-1]
	return last == 'D' || last == 'C'
}

// Helper: parse DD/MM to time.Time
func parseDayMonth(s string, year int) (time.Time, error) {
	return time.Parse("02/01/2006", s+"/"+fmt.Sprint(year))
}

// Helper: parse amount string and return value and type
func parseAmountType(s string) float64 {
	amountStr := strings.ReplaceAll(s[:len(s)-1], ".", "")
	amountStr = strings.ReplaceAll(amountStr, ",", ".")
	amount, _ := strconv.ParseFloat(amountStr, 64)
	return amount
}

func (e *caixaCCFaturaExtractor) isTransactionRow(row []string) bool {
	return false
}

func (e *caixaCCFaturaExtractor) splitLines(s string) []string {
	// Split on newlines and tabs
	fields := strings.FieldsFunc(s, func(r rune) bool {
		return r == '\n' || r == '\r' || r == '\t'
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
