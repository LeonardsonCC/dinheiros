package pdfextractors

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/ledongthuc/pdf"

	"github.com/LeonardsonCC/dinheiros/internal/models"
)

type nubankCCFaturaExtractor struct{}

func NewNubankCCFaturaExtractor() *nubankCCFaturaExtractor {
	return &nubankCCFaturaExtractor{}
}

func (s *nubankCCFaturaExtractor) Name() string {
	return "Nubank - Cartão de Crédito Fatura"
}

func (s *nubankCCFaturaExtractor) ExtractText(filePath string) (string, error) {
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

func (e *nubankCCFaturaExtractor) Extract(filePath string, accountID uint) ([]models.Transaction, error) {
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

func (e *nubankCCFaturaExtractor) ExtractTransactions(text string, accountID uint) ([]models.Transaction, error) {
	// 1. Extract year
	yearRe := regexp.MustCompile(`Data de vencimento: \d{2} [A-Z]{3} (\d{4})`)
	matches := yearRe.FindStringSubmatch(text)
	if len(matches) < 2 {
		yearRe = regexp.MustCompile(`FATURA \d{2} [A-Z]{3} (\d{4})`)
		matches = yearRe.FindStringSubmatch(text)
		if len(matches) < 2 {
			return nil, fmt.Errorf("could not find year in text")
		}
	}
	year := matches[1]

	monthMap := map[string]string{
		"JAN": "01", "FEV": "02", "MAR": "03", "ABR": "04", "MAI": "05", "JUN": "06",
		"JUL": "07", "AGO": "08", "SET": "09", "OUT": "10", "NOV": "11", "DEZ": "12",
	}

	lines := e.splitLines(text)
	var transactions []models.Transaction

	transacoesIndex := -1
	pagamentosIndex := -1
	for i, line := range lines {
		if line == "TRANSAÇÕES" {
			transacoesIndex = i
		}
		if line == "Pagamentos" {
			pagamentosIndex = i
		}
	}

	if transacoesIndex == -1 {
		return nil, fmt.Errorf("could not find 'TRANSAÇÕES' section")
	}

	dateRe := regexp.MustCompile(`^(\d{2}) (JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)$`)
	cardRe := regexp.MustCompile(`^•••• \d{4}$`)
	amountRe := regexp.MustCompile(`^R\$ ([\d.,]+)`)

	var currentDate time.Time

	endIndex := len(lines)
	if pagamentosIndex != -1 {
		endIndex = pagamentosIndex
	}

	for i := transacoesIndex + 1; i < endIndex; i++ {
		line := lines[i]

		if dateMatch := dateRe.FindStringSubmatch(line); len(dateMatch) == 3 {
			day := dateMatch[1]
			monthStr := dateMatch[2]
			month := monthMap[monthStr]
			dateStr := fmt.Sprintf("%s/%s/%s", day, month, year)
			d, err := time.Parse("02/01/2006", dateStr)
			if err == nil {
				currentDate = d
			}
			continue
		}

		if currentDate.IsZero() {
			continue
		}

		if cardRe.MatchString(line) {
			continue
		}

		if amountMatch := amountRe.FindStringSubmatch(line); len(amountMatch) == 2 {
			if i > 0 {
				description := lines[i-1]
				amount, err := e.parseAmount(amountMatch[1])
				if err == nil {
					transactions = append(transactions, models.Transaction{
						Date:        currentDate,
						Amount:      amount,
						Type:        models.TransactionTypeExpense,
						Description: description,
						AccountID:   accountID,
					})
				}
			}
		}
	}

	if pagamentosIndex != -1 {
		paymentAmountRe := regexp.MustCompile(`^−R\$ ([\d.,]+)`)
		currentDate = time.Time{}

		for i := pagamentosIndex + 1; i < len(lines); i++ {
			line := lines[i]

			if dateMatch := dateRe.FindStringSubmatch(line); len(dateMatch) == 3 {
				day := dateMatch[1]
				monthStr := dateMatch[2]
				month := monthMap[monthStr]
				dateStr := fmt.Sprintf("%s/%s/%s", day, month, year)
				d, err := time.Parse("02/01/2006", dateStr)
				if err == nil {
					currentDate = d
				}
				continue
			}

			if currentDate.IsZero() {
				continue
			}

			if amountMatch := paymentAmountRe.FindStringSubmatch(line); len(amountMatch) == 2 {
				if i > 0 {
					description := lines[i-1]
					amount, err := e.parseAmount(amountMatch[1])
					if err == nil {
						transactions = append(transactions, models.Transaction{
							Date:        currentDate,
							Amount:      amount,
							Type:        models.TransactionTypeIncome,
							Description: description,
							AccountID:   accountID,
						})
					}
				}
			}
		}
	}

	return transactions, nil
}

func (e *nubankCCFaturaExtractor) parseAmount(amountStr string) (float64, error) {
	amountStr = strings.TrimSpace(amountStr)
	amountStr = strings.ReplaceAll(amountStr, ".", "")
	amountStr = strings.ReplaceAll(amountStr, ",", ".")
	return strconv.ParseFloat(amountStr, 64)
}

func (e *nubankCCFaturaExtractor) splitLines(s string) []string {
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
