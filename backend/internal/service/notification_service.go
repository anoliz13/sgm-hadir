package service

import (
	"log"
	"time"

	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/pkg/fcm"
	"gorm.io/gorm"
)

type NotificationService struct {
	db *gorm.DB
}

func NewNotificationService(db *gorm.DB) *NotificationService {
	return &NotificationService{db: db}
}

// SendToUser sends FCM notification to a single user by their stored token.
func (s *NotificationService) SendToUser(userID string, title, body string, data map[string]string) {
	var user model.User
	if err := s.db.Select("fcm_token").Where("id = ?", userID).First(&user).Error; err != nil {
		return
	}
	if user.FCMToken == nil || *user.FCMToken == "" {
		return
	}
	if err := fcm.SendToToken(*user.FCMToken, title, body, data); err != nil {
		log.Printf("[FCM] SendToUser %s error: %v", userID, err)
	}
}

// SendBulk sends FCM notification to a list of users.
func (s *NotificationService) SendBulk(userIDs []string, title, body string, data map[string]string) {
	if len(userIDs) == 0 {
		return
	}

	var users []model.User
	s.db.Select("fcm_token").Where("id IN ? AND fcm_token IS NOT NULL AND fcm_token != ''", userIDs).Find(&users)

	tokens := make([]string, 0, len(users))
	for _, u := range users {
		if u.FCMToken != nil && *u.FCMToken != "" {
			tokens = append(tokens, *u.FCMToken)
		}
	}

	if len(tokens) == 0 {
		return
	}

	// FCM multicast limit is 500 tokens per call
	for i := 0; i < len(tokens); i += 500 {
		end := i + 500
		if end > len(tokens) {
			end = len(tokens)
		}
		if err := fcm.SendMulticast(tokens[i:end], title, body, data); err != nil {
			log.Printf("[FCM] SendBulk batch error: %v", err)
		}
	}
}

// SendCheckInReminder sends reminder to employees who haven't checked in today.
func (s *NotificationService) SendCheckInReminder() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PANIC] SendCheckInReminder recovered: %v", r)
		}
	}()
	now := time.Now()
	if !s.isWorkingDay(now) {
		log.Println("[FCM] Today is not a working day, skipping check-in reminder")
		return
	}

	// Get all active employees
	var employees []model.User
	s.db.Where("is_active = true AND role = 'employee'").Find(&employees)

	// Get all users who already checked in today
	checkedInIDs := s.getCheckedInUserIDs(now)
	checkedInMap := make(map[string]bool)
	for _, id := range checkedInIDs {
		checkedInMap[id] = true
	}

	// Collect tokens for users who haven't checked in
	tokens := make([]string, 0)
	for _, emp := range employees {
		if !checkedInMap[emp.ID.String()] && emp.FCMToken != nil && *emp.FCMToken != "" {
			tokens = append(tokens, *emp.FCMToken)
		}
	}

	log.Printf("[FCM] Sending check-in reminder to %d employees", len(tokens))
	if err := fcm.SendMulticast(tokens, "Pengingat Absen Masuk", "Jangan lupa absen masuk hari ini! Tepat waktu ya 😊", map[string]string{"type": "check_in_reminder"}); err != nil {
		log.Printf("[FCM] Check-in reminder error: %v", err)
	}
}

// SendCheckOutReminder sends reminder to employees who checked in but haven't checked out.
func (s *NotificationService) SendCheckOutReminder() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PANIC] SendCheckOutReminder recovered: %v", r)
		}
	}()
	now := time.Now()
	if !s.isWorkingDay(now) {
		return
	}

	checkedInIDs := s.getCheckedInUserIDs(now)
	checkedOutIDs := s.getCheckedOutUserIDs(now)

	checkedOutMap := make(map[string]bool)
	for _, id := range checkedOutIDs {
		checkedOutMap[id] = true
	}

	// Users who checked in but NOT checked out
	pendingIDs := make([]string, 0)
	for _, id := range checkedInIDs {
		if !checkedOutMap[id] {
			pendingIDs = append(pendingIDs, id)
		}
	}

	if len(pendingIDs) == 0 {
		return
	}

	var users []model.User
	s.db.Where("id IN ? AND fcm_token IS NOT NULL AND fcm_token != ''", pendingIDs).Find(&users)

	tokens := make([]string, 0, len(users))
	for _, u := range users {
		if u.FCMToken != nil {
			tokens = append(tokens, *u.FCMToken)
		}
	}

	log.Printf("[FCM] Sending check-out reminder to %d employees", len(tokens))
	if err := fcm.SendMulticast(tokens, "Pengingat Absen Pulang", "Jangan lupa absen pulang sebelum meninggalkan kantor!", map[string]string{"type": "check_out_reminder"}); err != nil {
		log.Printf("[FCM] Check-out reminder error: %v", err)
	}
}

// NotifyAdmins sends FCM to all admin/supervisor users, checking the given setting key first.
func NotifyAdmins(db *gorm.DB, settingKey, title, body string, data map[string]string) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PANIC] NotifyAdmins recovered: %v", r)
		}
	}()
	if settingKey != "" {
		var setting model.AppSetting
		if err := db.Where("key = ?", settingKey).First(&setting).Error; err != nil || setting.Value != "true" {
			return
		}
	}

	var users []model.User
	db.Where("role IN ? AND fcm_token IS NOT NULL AND fcm_token != ''",
		[]string{"super_admin", "supervisor", "kepala_salut", "manajer_salut"}).Find(&users)

	if len(users) == 0 {
		return
	}

	tokens := make([]string, 0, len(users))
	for _, u := range users {
		if u.FCMToken != nil && *u.FCMToken != "" {
			tokens = append(tokens, *u.FCMToken)
		}
	}

	if len(tokens) == 0 {
		return
	}

	if err := fcm.SendMulticast(tokens, title, body, data); err != nil {
		log.Printf("[FCM] NotifyAdmins error: %v", err)
	}
}

// AutoCheckOutAll performs automatic check-out for employees who checked in but
// haven't checked out by end of day. Skips GPS radius validation since they may be at home.
func (s *NotificationService) AutoCheckOutAll() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PANIC] AutoCheckOutAll recovered: %v", r)
		}
	}()
	now := time.Now()
	if !s.isWorkingDay(now) {
		log.Println("[FCM] Today is not a working day, skipping auto check-out")
		return
	}

	checkedInIDs := s.getCheckedInUserIDs(now)
	checkedOutIDs := s.getCheckedOutUserIDs(now)

	checkedOutMap := make(map[string]bool)
	for _, id := range checkedOutIDs {
		checkedOutMap[id] = true
	}

	pendingIDs := make([]string, 0)
	for _, id := range checkedInIDs {
		if !checkedOutMap[id] {
			pendingIDs = append(pendingIDs, id)
		}
	}

	if len(pendingIDs) == 0 {
		log.Println("[FCM] No employees pending check-out, skipping auto check-out")
		return
	}

	var users []model.User
	s.db.Preload("Branch").Where("id IN ?", pendingIDs).Find(&users)

	reason := "Auto check-out oleh sistem (tidak absen pulang)"
	createdCount := 0
	successTokens := make([]string, 0)

	for _, user := range users {
		if user.Branch == nil {
			log.Printf("[FCM] User %s has no branch, skipping auto check-out", user.ID)
			continue
		}

		status := model.StatusOnTime
		attendance := &model.Attendance{
			UserID:        user.ID,
			BranchID:      user.Branch.ID,
			Type:          model.TypeCheckOut,
			Status:        &status,
			Latitude:      user.Branch.Latitude,
			Longitude:     user.Branch.Longitude,
			IsManualEntry: true,
			ManualReason:  &reason,
		}

		if err := s.db.Create(attendance).Error; err != nil {
			log.Printf("[FCM] Auto check-out failed for user %s: %v", user.ID, err)
			continue
		}

		createdCount++
		if user.FCMToken != nil && *user.FCMToken != "" {
			successTokens = append(successTokens, *user.FCMToken)
		}
	}

	log.Printf("[FCM] Auto check-out completed for %d employees", createdCount)

	if len(successTokens) > 0 {
		_ = fcm.SendMulticast(successTokens, "Auto Absen Pulang",
			"Anda belum absen pulang, sistem telah melakukan auto check-out. Jangan lupa absen tepat waktu besok!",
			map[string]string{"type": "auto_check_out"})
	}
}

func (s *NotificationService) isWorkingDay(t time.Time) bool {
	// Skip weekends
	if t.Weekday() == time.Saturday || t.Weekday() == time.Sunday {
		return false
	}
	// Check holidays table
	var count int64
	dateStr := t.Format("2006-01-02")
	s.db.Model(&model.Holiday{}).Where("DATE(date) = ?", dateStr).Count(&count)
	return count == 0
}

func (s *NotificationService) getCheckedInUserIDs(t time.Time) []string {
	dateStr := t.Format("2006-01-02")
	var ids []string
	s.db.Model(&model.Attendance{}).
		Select("DISTINCT user_id::text").
		Where("type = 'check_in' AND DATE(created_at) = ?", dateStr).
		Pluck("user_id", &ids)
	return ids
}

func (s *NotificationService) getCheckedOutUserIDs(t time.Time) []string {
	dateStr := t.Format("2006-01-02")
	var ids []string
	s.db.Model(&model.Attendance{}).
		Select("DISTINCT user_id::text").
		Where("type = 'check_out' AND DATE(created_at) = ?", dateStr).
		Pluck("user_id", &ids)
	return ids
}
