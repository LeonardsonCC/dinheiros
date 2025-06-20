package pdfextractors

import "github.com/LeonardsonCC/dinheiros/internal/models"

type PDFExtractor interface {
	ExtractTransactions(filePath string, accountID uint) ([]models.Transaction, error)
}

func GetExtractorByName(name string) PDFExtractor {
	switch name {
	case "caixa":
		return NewCaixaExtractor()
	default:
		return nil
	}
}
