package pdfextractors

// ListExtractors returns a list of available extractors with their internal name and display name
func ListExtractors() []map[string]string {
	return []map[string]string{
		{"name": "caixa_extrato", "displayName": NewCaixaExtratoExtractor().Name()},
		{"name": "caixa_cc_fatura", "displayName": NewCaixaCCFaturaExtractor().Name()},
	}
}
