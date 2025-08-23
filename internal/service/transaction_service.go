package service

import (
	"context"
	stdErrors "errors"
	"regexp"
	"sort"
	"strconv"
	"time"

	"github.com/LeonardsonCC/dinheiros/internal/errors"
	"github.com/LeonardsonCC/dinheiros/internal/models"
	"github.com/LeonardsonCC/dinheiros/internal/pdfextractors"
	repo "github.com/LeonardsonCC/dinheiros/internal/repository"
)

type TransactionService interface {
	CreateTransaction(userID uint, accountID uint, amount float64, transactionType models.TransactionType,
		description string, toAccountID *uint, categoryIDs []uint, date time.Time) (*models.Transaction, error)
	CreateTransactionWithAttachment(userID uint, accountID uint, amount float64, transactionType models.TransactionType,
		description string, date time.Time, categoryIDs []uint, attachedTransactionID uint) (*models.Transaction, error)
	GetTransactionByID(userID uint, transactionID uint) (*models.Transaction, error)
	GetTransactionsByAccountID(userID uint, accountID uint) ([]models.Transaction, error)
	ListTransactions(
		userID uint,
		transactionTypes []models.TransactionType,
		accountIDs []uint,
		categoryIDs []uint,
		description string,
		minAmount *float64,
		maxAmount *float64,
		startDate *time.Time,
		endDate *time.Time,
		page int,
		pageSize int,
	) ([]models.Transaction, int64, error)
	UpdateTransaction(userID uint, transaction *models.Transaction) error
	UpdateTransactionWithAttachment(userID uint, transaction *models.Transaction, attachedTransactionID *uint) error
	DeleteTransaction(userID uint, transactionID uint) error
	GetDashboardSummary(userID uint) (float64, float64, float64, []models.Transaction, error)
	ExtractTransactionsFromPDF(filePath string, accountID uint) ([]models.Transaction, error)
	ExtractTransactionsFromPDFWithExtractor(filePath string, accountID uint, extractor string) ([]models.Transaction, error)
	ExtractTransactionsFromPDFWithExtractorAndRules(filePath string, accountID uint, userID uint, extractor string, categorizationRuleService CategorizationRuleService) ([]models.Transaction, error)
	AssociateCategories(transactionID uint, categoryIDs []uint) error
	GetTransactionsPerDay(userID uint) (*TransactionsPerDayData, error)
	GetAmountByMonth(userID uint, startDate, endDate *time.Time) (*AmountByMonthData, error)
	GetAmountByAccount(userID uint, startDate, endDate *time.Time) (*AmountByAccountData, error)
	GetAmountByCategory(userID uint, startDate, endDate *time.Time) (*AmountByCategoryData, error)
	GetAmountSpentByDay(userID uint) (*AmountByMonthData, error)
	GetAmountSpentAndGainedByDay(userID uint) (map[string][]float64, []string)
	GetTransactionsPerDayWithRange(userID uint, startDate, endDate *time.Time) (*TransactionsPerDayData, error)
	GetAmountSpentAndGainedByDayWithRange(userID uint, startDate, endDate *time.Time) (map[string][]float64, []string)
	ApplyCategorizationRules(transactions []models.Transaction, userID uint, categorizationRuleService CategorizationRuleService) ([]models.Transaction, error)
}

type transactionService struct {
	transactionRepo repo.TransactionRepository
	accountRepo     repo.AccountRepository
	categoryService CategoryService
}

func NewTransactionService(
	transactionRepo repo.TransactionRepository,
	accountRepo repo.AccountRepository,
	categoryService CategoryService,
) TransactionService {
	return &transactionService{
		transactionRepo: transactionRepo,
		accountRepo:     accountRepo,
		categoryService: categoryService,
	}
}

func (s *transactionService) CreateTransaction(
	userID uint,
	accountID uint,
	amount float64,
	transactionType models.TransactionType,
	description string,
	toAccountID *uint,
	categoryIDs []uint,
	date time.Time,
) (*models.Transaction, error) {
	// Verify account exists and user has access (owner or shared)
	_, err := s.accountRepo.FindByID(accountID, userID)
	if err != nil {
		return nil, err
	}

	// Create the transaction
	transaction := &models.Transaction{
		Date:        date,
		Amount:      amount,
		Type:        transactionType,
		Description: description,
		AccountID:   accountID,
	}

	// Save the transaction
	if err := s.transactionRepo.Create(transaction); err != nil {
		return nil, err
	}

	// Associate categories if provided
	if len(categoryIDs) > 0 {
		if err := s.transactionRepo.AssociateCategories(transaction.ID, categoryIDs); err != nil {
			return nil, err
		}
	}

	// Update account balances
	switch transactionType {
	case models.TransactionTypeIncome:
		if err := s.accountRepo.UpdateBalance(accountID, amount); err != nil {
			return nil, err
		}

	case models.TransactionTypeExpense:
		if err := s.accountRepo.UpdateBalance(accountID, -amount); err != nil {
			return nil, err
		}
	}

	return transaction, nil
}

func (s *transactionService) CreateTransactionWithAttachment(userID uint, accountID uint, amount float64, transactionType models.TransactionType, description string, date time.Time, categoryIDs []uint, attachedTransactionID uint) (*models.Transaction, error) {
	// Verify account exists and user has access
	if _, err := s.accountRepo.FindByID(accountID, userID); err != nil {
		return nil, err
	}

	// Verify attached transaction exists and user has access
	attachedTransaction, err := s.transactionRepo.FindByID(attachedTransactionID, userID)
	if err != nil {
		return nil, stdErrors.New("attached transaction not found or access denied")
	}

	// Determine attachment type based on transaction type
	var attachmentType models.AttachmentType
	if transactionType == models.TransactionTypeExpense {
		attachmentType = models.AttachmentTypeOutboundTransfer
	} else {
		attachmentType = models.AttachmentTypeInboundTransfer
	}

	// Create the transaction with attachment
	transaction := &models.Transaction{
		Date:                  date,
		Amount:                amount,
		Type:                  transactionType,
		Description:           description,
		AccountID:             accountID,
		AttachedTransactionID: &attachedTransactionID,
		AttachmentType:        &attachmentType,
	}

	// Save the transaction
	if err := s.transactionRepo.Create(transaction); err != nil {
		return nil, err
	}

	// Associate categories if provided
	if len(categoryIDs) > 0 {
		if err := s.transactionRepo.AssociateCategories(transaction.ID, categoryIDs); err != nil {
			return nil, err
		}
	}

	// Update account balance based on transaction type
	switch transactionType {
	case models.TransactionTypeIncome:
		if err := s.accountRepo.UpdateBalance(accountID, amount); err != nil {
			return nil, err
		}
	case models.TransactionTypeExpense:
		if err := s.accountRepo.UpdateBalance(accountID, -amount); err != nil {
			return nil, err
		}
	}

	// Update the attached transaction with reciprocal attachment if it doesn't have one
	if attachedTransaction.AttachedTransactionID == nil {
		var reciprocalAttachmentType models.AttachmentType
		if attachmentType == models.AttachmentTypeOutboundTransfer {
			reciprocalAttachmentType = models.AttachmentTypeInboundTransfer
		} else {
			reciprocalAttachmentType = models.AttachmentTypeOutboundTransfer
		}

		attachedTransaction.AttachedTransactionID = &transaction.ID
		attachedTransaction.AttachmentType = &reciprocalAttachmentType
		if err := s.transactionRepo.Update(attachedTransaction); err != nil {
			return nil, err
		}
	}

	return transaction, nil
}

func (s *transactionService) GetTransactionByID(userID uint, transactionID uint) (*models.Transaction, error) {
	return s.transactionRepo.FindByID(transactionID, userID)
}

func (s *transactionService) GetTransactionsByAccountID(userID uint, accountID uint) ([]models.Transaction, error) {
	// Verify account exists and user has access (owner or shared)
	if _, err := s.accountRepo.FindByID(accountID, userID); err != nil {
		return nil, err
	}

	transactions, _, err := s.transactionRepo.FindByUserID(
		userID,
		nil,               // transactionTypes
		[]uint{accountID}, // accountIDs
		nil,               // categoryIDs
		"",                // description
		nil,               // minAmount
		nil,               // maxAmount
		nil,               // startDate
		nil,               // endDate
		0,                 // page (0 means no pagination)
		0,                 // pageSize (0 means no pagination)
	)
	return transactions, err
}

func (s *transactionService) ListTransactions(
	userID uint,
	transactionTypes []models.TransactionType,
	accountIDs []uint,
	categoryIDs []uint,
	description string,
	minAmount *float64,
	maxAmount *float64,
	startDate *time.Time,
	endDate *time.Time,
	page int,
	pageSize int,
) ([]models.Transaction, int64, error) {
	// Verify accounts belong to user if accountIDs are provided
	if len(accountIDs) > 0 {
		userAccounts, err := s.accountRepo.FindByUserID(userID)
		if err != nil {
			return nil, 0, err
		}

		// Create a map of valid account IDs for this user
		validAccountIDs := make(map[uint]bool)
		for _, account := range userAccounts {
			validAccountIDs[account.ID] = true
		}

		// Verify all requested account IDs are valid
		for _, id := range accountIDs {
			if !validAccountIDs[id] {
				return nil, 0, errors.ErrNotFound
			}
		}
	}

	// Call the repository method with all filters
	return s.transactionRepo.FindByUserID(
		userID,
		transactionTypes,
		accountIDs,
		categoryIDs,
		description,
		minAmount,
		maxAmount,
		startDate,
		endDate,
		page,
		pageSize,
	)
}

func (s *transactionService) UpdateTransaction(userID uint, transaction *models.Transaction) error {
	// Verify transaction exists and user has access to the account
	existingTx, err := s.transactionRepo.FindByID(transaction.ID, userID)
	if err != nil {
		return err
	}

	// Verify user has access to the account (owner or shared)
	_, err = s.accountRepo.FindByID(existingTx.AccountID, userID)
	if err != nil {
		return err
	}

	// Update the categories
	tx := s.transactionRepo.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update transaction fields
	err = tx.Model(&existingTx).Updates(transaction).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	// Update categories association
	if len(transaction.Categories) > 0 {
		err = tx.Model(&existingTx).Association("Categories").Replace(transaction.Categories)
		if err != nil {
			tx.Rollback()
			return err
		}
	} else {
		// If no categories provided, clear existing ones
		err = tx.Model(&existingTx).Association("Categories").Clear()
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func (s *transactionService) UpdateTransactionWithAttachment(userID uint, transaction *models.Transaction, attachedTransactionID *uint) error {
	// Start a transaction for atomic updates
	tx := s.transactionRepo.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Verify transaction exists and user has access to the account
	existingTx, err := s.transactionRepo.FindByID(transaction.ID, userID)
	if err != nil {
		tx.Rollback()
		return err
	}

	// Verify user has access to the account (owner or shared)
	_, err = s.accountRepo.FindByID(existingTx.AccountID, userID)
	if err != nil {
		tx.Rollback()
		return err
	}

	// Handle attachment relationship cleanup and setup
	if attachedTransactionID != nil {
		// Verify the attached transaction exists and user has access
		attachedTx, err := s.transactionRepo.FindByID(*attachedTransactionID, userID)
		if err != nil {
			tx.Rollback()
			return err
		}

		// Ensure 1:1 relationship - verify types are opposite (income/expense)
		if existingTx.Type == attachedTx.Type {
			tx.Rollback()
			return errors.NewValidationError("Attached transactions must have opposite types (one income, one expense)")
		}

		// Clean up any existing attachments for both transactions
		// Remove existing attachment for current transaction
		if existingTx.AttachedTransactionID != nil {
			err = tx.Model(&models.Transaction{}).
				Where("id = ?", *existingTx.AttachedTransactionID).
				Updates(map[string]interface{}{
					"attached_transaction_id": nil,
					"attachment_type":         nil,
				}).Error
			if err != nil {
				tx.Rollback()
				return err
			}
		}

		// Remove existing attachment for target transaction
		if attachedTx.AttachedTransactionID != nil {
			err = tx.Model(&models.Transaction{}).
				Where("id = ?", *attachedTx.AttachedTransactionID).
				Updates(map[string]interface{}{
					"attached_transaction_id": nil,
					"attachment_type":         nil,
				}).Error
			if err != nil {
				tx.Rollback()
				return err
			}
		}

		// Set up new 1:1 relationship
		var currentAttachmentType, attachedAttachmentType models.AttachmentType
		if existingTx.Type == models.TransactionTypeExpense {
			currentAttachmentType = models.AttachmentTypeOutboundTransfer
			attachedAttachmentType = models.AttachmentTypeInboundTransfer
		} else {
			currentAttachmentType = models.AttachmentTypeInboundTransfer
			attachedAttachmentType = models.AttachmentTypeOutboundTransfer
		}

		// Update current transaction
		transaction.AttachedTransactionID = attachedTransactionID
		transaction.AttachmentType = &currentAttachmentType

		// Update attached transaction to point back
		err = tx.Model(&models.Transaction{}).
			Where("id = ?", *attachedTransactionID).
			Updates(map[string]interface{}{
				"attached_transaction_id": transaction.ID,
				"attachment_type":         attachedAttachmentType,
			}).Error
		if err != nil {
			tx.Rollback()
			return err
		}
	} else {
		// Removing attachment - clean up the relationship
		if existingTx.AttachedTransactionID != nil {
			// Remove the reverse relationship
			err = tx.Model(&models.Transaction{}).
				Where("id = ?", *existingTx.AttachedTransactionID).
				Updates(map[string]interface{}{
					"attached_transaction_id": nil,
					"attachment_type":         nil,
				}).Error
			if err != nil {
				tx.Rollback()
				return err
			}
		}

		// Clear attachment for current transaction
		transaction.AttachedTransactionID = nil
		transaction.AttachmentType = nil

		// Explicitly update the current transaction's attachment fields
		err = tx.Model(&models.Transaction{}).
			Where("id = ?", transaction.ID).
			Updates(map[string]interface{}{
				"attached_transaction_id": nil,
				"attachment_type":         nil,
			}).Error
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	// Update transaction fields
	err = tx.Model(&existingTx).Updates(transaction).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	// Update categories association
	if len(transaction.Categories) > 0 {
		err = tx.Model(&existingTx).Association("Categories").Replace(transaction.Categories)
		if err != nil {
			tx.Rollback()
			return err
		}
	} else {
		// If no categories provided, clear existing ones
		err = tx.Model(&existingTx).Association("Categories").Clear()
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func (s *transactionService) DeleteTransaction(userID uint, transactionID uint) error {
	// Verify transaction exists and user has access to the account
	transaction, err := s.transactionRepo.FindByID(transactionID, userID)
	if err != nil {
		return err
	}

	// Verify user has access to the account (owner or shared)
	_, err = s.accountRepo.FindByID(transaction.AccountID, userID)
	if err != nil {
		return err
	}

	// Update account balance based on transaction type
	switch transaction.Type {
	case models.TransactionTypeIncome:
		// Deduct the amount from the account
		if err := s.accountRepo.UpdateBalance(transaction.AccountID, -transaction.Amount); err != nil {
			return err
		}

	case models.TransactionTypeExpense:
		// Add the amount back to the account
		if err := s.accountRepo.UpdateBalance(transaction.AccountID, transaction.Amount); err != nil {
			return err
		}

	}

	// Delete the transaction
	return s.transactionRepo.Delete(transactionID, userID)
}

func (s *transactionService) GetDashboardSummary(userID uint) (float64, float64, float64, []models.Transaction, error) {
	return s.transactionRepo.GetDashboardSummary(userID)
}

func (s *transactionService) ExtractTransactionsFromPDF(filePath string, accountID uint) ([]models.Transaction, error) {
	return s.ExtractTransactionsFromPDFWithExtractor(filePath, accountID, "")
}

func (s *transactionService) ExtractTransactionsFromPDFWithExtractor(filePath string, accountID uint, extractor string) ([]models.Transaction, error) {
	var ext pdfextractors.PDFExtractor
	if extractor != "" {
		ext = pdfextractors.GetExtractorByName(extractor)
	} else {
		ext = pdfextractors.NewCaixaExtratoExtractor() // fallback default
	}
	if ext == nil {
		return nil, stdErrors.New("invalid extractor")
	}
	textContent, err := ext.ExtractText(filePath)
	if err != nil {
		return nil, err
	}
	return ext.ExtractTransactions(textContent, accountID)
}

// Implement AssociateCategories method in transactionService
func (s *transactionService) AssociateCategories(transactionID uint, categoryIDs []uint) error {
	return s.transactionRepo.AssociateCategories(transactionID, categoryIDs)
}

// Statistics data structures
type TransactionsPerDayData struct {
	Labels []string `json:"labels"`
	Data   []int    `json:"data"`
}

type AmountByMonthData struct {
	Labels []string  `json:"labels"`
	Data   []float64 `json:"data"`
}

type AmountByAccountData struct {
	Labels []string  `json:"labels"`
	Data   []float64 `json:"data"`
}

type AmountByCategoryData struct {
	Labels []string  `json:"labels"`
	Data   []float64 `json:"data"`
}

func (s *transactionService) GetTransactionsPerDay(userID uint) (*TransactionsPerDayData, error) {
	transactions, _, err := s.transactionRepo.FindByUserID(userID, nil, nil, nil, "", nil, nil, nil, nil, 0, 0)
	if err != nil {
		return nil, err
	}
	perDay := make(map[string]int)
	for _, tx := range transactions {
		date := tx.Date.Format("2006-01-02")
		perDay[date]++
	}
	labels := make([]string, 0, len(perDay))
	for date := range perDay {
		labels = append(labels, date)
	}
	// Sort labels
	sort.Strings(labels)
	data := make([]int, len(labels))
	for i, date := range labels {
		data[i] = perDay[date]
	}
	return &TransactionsPerDayData{Labels: labels, Data: data}, nil
}

func (s *transactionService) GetAmountByMonth(userID uint, startDate, endDate *time.Time) (*AmountByMonthData, error) {
	transactions, _, err := s.transactionRepo.FindByUserID(userID, nil, nil, nil, "", nil, nil, startDate, endDate, 0, 0)
	if err != nil {
		return nil, err
	}
	byMonth := make(map[string]float64)
	for _, tx := range transactions {
		month := tx.Date.Format("2006-01")
		byMonth[month] += tx.Amount
	}
	labels := make([]string, 0, len(byMonth))
	for month := range byMonth {
		labels = append(labels, month)
	}
	sort.Strings(labels)
	data := make([]float64, len(labels))
	for i, month := range labels {
		data[i] = byMonth[month]
	}
	return &AmountByMonthData{Labels: labels, Data: data}, nil
}

func (s *transactionService) GetAmountByAccount(userID uint, startDate, endDate *time.Time) (*AmountByAccountData, error) {
	transactions, _, err := s.transactionRepo.FindByUserID(userID, nil, nil, nil, "", nil, nil, startDate, endDate, 0, 0)
	if err != nil {
		return nil, err
	}
	byAccount := make(map[string]float64)
	for _, tx := range transactions {
		byAccount[tx.Account.Name] += tx.Amount
	}
	labels := make([]string, 0, len(byAccount))
	for acc := range byAccount {
		labels = append(labels, acc)
	}
	sort.Strings(labels)
	data := make([]float64, len(labels))
	for i, acc := range labels {
		data[i] = byAccount[acc]
	}
	return &AmountByAccountData{Labels: labels, Data: data}, nil
}

func (s *transactionService) GetAmountByCategory(userID uint, startDate, endDate *time.Time) (*AmountByCategoryData, error) {
	transactions, _, err := s.transactionRepo.FindByUserID(userID, nil, nil, nil, "", nil, nil, startDate, endDate, 0, 0)
	if err != nil {
		return nil, err
	}
	byCategory := make(map[string]float64)
	for _, tx := range transactions {
		for _, cat := range tx.Categories {
			byCategory[cat.Name] += tx.Amount
		}
	}
	labels := make([]string, 0, len(byCategory))
	for cat := range byCategory {
		labels = append(labels, cat)
	}
	sort.Strings(labels)
	data := make([]float64, len(labels))
	for i, cat := range labels {
		data[i] = byCategory[cat]
	}
	return &AmountByCategoryData{Labels: labels, Data: data}, nil
}

// AmountSpentByDayData for chartjs
func (s *transactionService) GetAmountSpentByDay(userID uint) (*AmountByMonthData, error) {
	transactions, _, err := s.transactionRepo.FindByUserID(userID, nil, nil, nil, "", nil, nil, nil, nil, 0, 0)
	if err != nil {
		return nil, err
	}
	byDay := make(map[string]float64)
	for _, tx := range transactions {
		if tx.Type == models.TransactionTypeExpense {
			date := tx.Date.Format("2006-01-02")
			byDay[date] += tx.Amount
		}
	}
	labels := make([]string, 0, len(byDay))
	for day := range byDay {
		labels = append(labels, day)
	}
	sort.Strings(labels)
	data := make([]float64, len(labels))
	for i, day := range labels {
		data[i] = byDay[day]
	}
	return &AmountByMonthData{Labels: labels, Data: data}, nil
}

// AmountSpentAndGainedByDayData for chartjs
func (s *transactionService) GetAmountSpentAndGainedByDay(userID uint) (map[string][]float64, []string) {
	transactions, _, err := s.transactionRepo.FindByUserID(userID, nil, nil, nil, "", nil, nil, nil, nil, 0, 0)
	if err != nil {
		return map[string][]float64{"spent": {}, "gained": {}}, []string{}
	}
	spentByDay := make(map[string]float64)
	gainedByDay := make(map[string]float64)
	for _, tx := range transactions {
		date := tx.Date.Format("2006-01-02")
		switch tx.Type {
		case models.TransactionTypeExpense:
			spentByDay[date] += tx.Amount
		case models.TransactionTypeIncome:
			gainedByDay[date] += tx.Amount
		}
	}
	labelSet := make(map[string]struct{})
	for d := range spentByDay {
		labelSet[d] = struct{}{}
	}
	for d := range gainedByDay {
		labelSet[d] = struct{}{}
	}
	labels := make([]string, 0, len(labelSet))
	for d := range labelSet {
		labels = append(labels, d)
	}
	sort.Strings(labels)
	spent := make([]float64, len(labels))
	gained := make([]float64, len(labels))
	for i, d := range labels {
		spent[i] = spentByDay[d]
		gained[i] = gainedByDay[d]
	}
	return map[string][]float64{"spent": spent, "gained": gained}, labels
}

func (s *transactionService) GetTransactionsPerDayWithRange(userID uint, startDate, endDate *time.Time) (*TransactionsPerDayData, error) {
	transactions, _, err := s.transactionRepo.FindByUserID(userID, nil, nil, nil, "", nil, nil, startDate, endDate, 0, 0)
	if err != nil {
		return nil, err
	}
	perDay := make(map[string]int)
	for _, tx := range transactions {
		date := tx.Date.Format("2006-01-02")
		perDay[date]++
	}
	labels := make([]string, 0, len(perDay))
	for date := range perDay {
		labels = append(labels, date)
	}
	sort.Strings(labels)
	data := make([]int, len(labels))
	for i, date := range labels {
		data[i] = perDay[date]
	}
	return &TransactionsPerDayData{Labels: labels, Data: data}, nil
}

func (s *transactionService) GetAmountSpentAndGainedByDayWithRange(userID uint, startDate, endDate *time.Time) (map[string][]float64, []string) {
	transactions, _, err := s.transactionRepo.FindByUserID(userID, nil, nil, nil, "", nil, nil, startDate, endDate, 0, 0)
	if err != nil {
		return map[string][]float64{"spent": {}, "gained": {}}, []string{}
	}
	spentByDay := make(map[string]float64)
	gainedByDay := make(map[string]float64)
	for _, tx := range transactions {
		date := tx.Date.Format("2006-01-02")
		switch tx.Type {
		case models.TransactionTypeExpense:
			spentByDay[date] += tx.Amount
		case models.TransactionTypeIncome:
			gainedByDay[date] += tx.Amount
		}
	}
	labelSet := make(map[string]struct{})
	for d := range spentByDay {
		labelSet[d] = struct{}{}
	}
	for d := range gainedByDay {
		labelSet[d] = struct{}{}
	}
	labels := make([]string, 0, len(labelSet))
	for d := range labelSet {
		labels = append(labels, d)
	}
	sort.Strings(labels)
	spent := make([]float64, len(labels))
	gained := make([]float64, len(labels))
	for i, d := range labels {
		spent[i] = spentByDay[d]
		gained[i] = gainedByDay[d]
	}
	return map[string][]float64{"spent": spent, "gained": gained}, labels
}

func (s *transactionService) ExtractTransactionsFromPDFWithExtractorAndRules(filePath string, accountID uint, userID uint, extractor string, categorizationRuleService CategorizationRuleService) ([]models.Transaction, error) {
	// Verify user has access to the account (owner or shared)
	_, err := s.accountRepo.FindByID(accountID, userID)
	if err != nil {
		return nil, err
	}

	var ext pdfextractors.PDFExtractor
	if extractor != "" {
		ext = pdfextractors.GetExtractorByName(extractor)
	} else {
		ext = pdfextractors.NewCaixaExtratoExtractor() // fallback default
	}
	if ext == nil {
		return nil, stdErrors.New("invalid extractor")
	}
	textContent, err := ext.ExtractText(filePath)
	if err != nil {
		return nil, err
	}
	transactions, err := ext.ExtractTransactions(textContent, accountID)
	if err != nil {
		return nil, err
	}

	// Apply categorization rules
	transactions, err = s.ApplyCategorizationRules(transactions, userID, categorizationRuleService)
	if err != nil {
		return nil, err
	}

	return transactions, nil
}

func (s *transactionService) ApplyCategorizationRules(transactions []models.Transaction, userID uint, categorizationRuleService CategorizationRuleService) ([]models.Transaction, error) {
	// Get active categorization rules for the user
	rules, err := categorizationRuleService.ListRules(context.Background(), userID)
	if err != nil {
		return transactions, err
	}

	// Filter only active rules
	var activeRules []models.CategorizationRule
	for _, rule := range rules {
		if rule.Active {
			activeRules = append(activeRules, rule)
		}
	}

	// Create a map to cache categories by ID to avoid multiple database queries
	categoryCache := make(map[uint]*models.Category)

	// Apply rules to each transaction
	for i := range transactions {
		transaction := &transactions[i]

		// Try to match each rule against the transaction description
		for _, rule := range activeRules {
			var matches bool

			// Apply different matching logic based on rule type
			switch rule.Type {
			case "exact":
				// Exact string match (case-sensitive)
				matches = rule.Value == transaction.Description
			case "regex":
				fallthrough
			default:
				// Compile the regex pattern
				pattern, err := regexp.Compile(rule.Value)
				if err != nil {
					// Skip invalid regex patterns
					continue
				}
				// Check if the description matches the regex pattern
				matches = pattern.MatchString(transaction.Description)
			}

			// If we have a match, apply the categorization
			if matches {
				// Get the full category information
				category, exists := categoryCache[rule.CategoryDst]
				if !exists {
					// Fetch category from database
					category, err = s.categoryService.GetCategoryByID(context.Background(), strconv.FormatUint(uint64(rule.CategoryDst), 10), userID)
					if err != nil {
						// Skip if category not found
						continue
					}
					categoryCache[rule.CategoryDst] = category
				}

				// Apply the category to the transaction
				// First, clear existing categories if this is a new categorization
				if len(transaction.Categories) == 0 {
					transaction.Categories = []*models.Category{category}
				} else {
					// Add the new category if it's not already present
					categoryExists := false
					for _, existingCat := range transaction.Categories {
						if existingCat.ID == rule.CategoryDst {
							categoryExists = true
							break
						}
					}
					if !categoryExists {
						transaction.Categories = append(transaction.Categories, category)
					}
				}

				// Break after first match to avoid multiple categorizations
				break
			}
		}
	}

	return transactions, nil
}
