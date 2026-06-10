package repository

import (
	"github.com/sgm/hadir-backend/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SettingRepository struct {
	db *gorm.DB
}

func NewSettingRepository(db *gorm.DB) *SettingRepository {
	return &SettingRepository{db: db}
}

func (r *SettingRepository) FindAll() ([]model.AppSetting, error) {
	var list []model.AppSetting
	err := r.db.Order("\"group\", key").Find(&list).Error
	return list, err
}

func (r *SettingRepository) FindByGroup(group string) ([]model.AppSetting, error) {
	var list []model.AppSetting
	err := r.db.Where("\"group\" = ?", group).Order("key").Find(&list).Error
	return list, err
}

func (r *SettingRepository) Get(key string) (string, error) {
	var s model.AppSetting
	err := r.db.Where("key = ?", key).First(&s).Error
	return s.Value, err
}

func (r *SettingRepository) Set(key, value string) error {
	return r.db.Model(&model.AppSetting{}).Where("key = ?", key).Update("value", value).Error
}

func (r *SettingRepository) BulkSet(settings map[string]string) error {
	for key, value := range settings {
		if err := r.Set(key, value); err != nil {
			return err
		}
	}
	return nil
}

func (r *SettingRepository) SeedDefaults() error {
	defaults := []model.AppSetting{
		// General
		{Key: "company_name", Value: "PT Salut Gajah Mada", Label: "Nama Perusahaan", Group: "general"},
		{Key: "company_address", Value: "Jl. Metro Pekalongan", Label: "Alamat Perusahaan", Group: "general"},
		{Key: "company_phone", Value: "", Label: "Nomor Telepon", Group: "general"},
		{Key: "company_email", Value: "", Label: "Email Perusahaan", Group: "general"},
		// Attendance
		{Key: "work_start_default", Value: "08:00", Label: "Jam Masuk Default", Group: "attendance"},
		{Key: "work_end_default", Value: "17:00", Label: "Jam Pulang Default", Group: "attendance"},
		{Key: "late_tolerance_minutes", Value: "15", Label: "Toleransi Keterlambatan (menit)", Group: "attendance"},
		{Key: "geofence_strict_mode", Value: "false", Label: "Mode Geofence Ketat", Group: "attendance"},
		{Key: "require_selfie", Value: "false", Label: "Wajib Selfie saat Absen", Group: "attendance"},
		// Notification
		{Key: "checkin_reminder_enabled", Value: "true", Label: "Aktifkan Reminder Check-In", Group: "notification"},
		{Key: "checkin_reminder_time", Value: "07:30", Label: "Jam Pengiriman Reminder Check-In", Group: "notification"},
		{Key: "checkout_reminder_enabled", Value: "true", Label: "Aktifkan Reminder Check-Out", Group: "notification"},
		{Key: "checkout_reminder_time", Value: "17:00", Label: "Jam Pengiriman Reminder Check-Out", Group: "notification"},
		{Key: "admin_checkin_notif_enabled", Value: "true", Label: "Notifikasi Check-In ke Admin", Group: "notification"},
		{Key: "admin_request_notif_enabled", Value: "true", Label: "Notifikasi Pengajuan (Izin/Lembur) ke Admin", Group: "notification"},
		// Report
		{Key: "report_company_header", Value: "PT SALUT GAJAH MADA", Label: "Header Laporan", Group: "report"},
		{Key: "report_footer_note", Value: "Dokumen ini dicetak secara otomatis oleh SGM Hadir", Label: "Catatan Footer Laporan", Group: "report"},
	}

	for i := range defaults {
		r.db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "key"}},
			DoNothing: true,
		}).Create(&defaults[i])
	}
	return nil
}
