package pdfextractors

import "github.com/LeonardsonCC/dinheiros/internal/models"

type PDFExtractor interface {
	Name() string
	Extract(filePath string, accountID uint) ([]models.Transaction, error)
	ExtractText(filePath string) (string, error)
	ExtractTransactions(text string, accountID uint) ([]models.Transaction, error)
}

func GetExtractorByName(name string) PDFExtractor {
	switch name {
	case "caixa_extrato":
		return NewCaixaExtratoExtractor()
	case "caixa_cc_fatura":
		return NewCaixaCCFaturaExtractor()
	case "nubank_extrato":
		return NewNubankExtratoExtractor()
	case "nubank_cc_fatura":
		return NewNubankCCFaturaExtractor()
	default:
		return nil
	}
}
