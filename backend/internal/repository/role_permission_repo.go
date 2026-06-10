package repository

import (
	"github.com/sgm/hadir-backend/internal/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type RolePermissionRepository struct {
	db *gorm.DB
}

func NewRolePermissionRepository(db *gorm.DB) *RolePermissionRepository {
	return &RolePermissionRepository{db: db}
}

func (r *RolePermissionRepository) FindAll() ([]model.RolePermission, error) {
	var list []model.RolePermission
	err := r.db.Order("role_name").Find(&list).Error
	return list, err
}

func (r *RolePermissionRepository) FindByRole(roleName string) (*model.RolePermission, error) {
	var rp model.RolePermission
	err := r.db.Where("role_name = ?", roleName).First(&rp).Error
	if err != nil {
		return nil, err
	}
	return &rp, nil
}

func (r *RolePermissionRepository) Upsert(rp *model.RolePermission) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "role_name"}},
		DoUpdates: clause.AssignmentColumns([]string{"display_name", "permissions", "updated_at"}),
	}).Create(rp).Error
}

func (r *RolePermissionRepository) SeedDefaults() error {
	defaults := []model.RolePermission{
		{
			RoleName:    "super_admin",
			DisplayName: "Super Administrator",
			Permissions: model.StringSlice{
				"dashboard.view", "attendance.view", "attendance.export",
				"reports.view", "reports.export",
				"leave.view", "leave.approve",
				"overtime.view", "overtime.approve",
				"employees.view", "employees.manage",
				"branches.view", "branches.manage",
				"shifts.manage", "holidays.import",
				"visits.view", "settings.manage", "roles.manage",
			},
		},
		{
			RoleName:    "supervisor",
			DisplayName: "Supervisor",
			Permissions: model.StringSlice{
				"dashboard.view", "attendance.view", "attendance.export",
				"reports.view", "reports.export",
				"leave.view", "leave.approve",
				"overtime.view", "overtime.approve",
				"employees.view", "employees.manage",
				"branches.view",
				"shifts.manage", "holidays.import",
				"visits.view",
			},
		},
		{
			RoleName:    "kepala_salut",
			DisplayName: "Kepala Salut",
			Permissions: model.StringSlice{
				"dashboard.view", "attendance.view",
				"reports.view", "reports.export",
				"leave.view", "leave.approve",
				"overtime.view", "overtime.approve",
				"employees.view",
			},
		},
		{
			RoleName:    "manajer_salut",
			DisplayName: "Manajer Salut",
			Permissions: model.StringSlice{
				"dashboard.view", "attendance.view",
				"reports.view", "reports.export",
				"leave.view", "leave.approve",
				"overtime.view", "overtime.approve",
				"employees.view",
			},
		},
		{
			RoleName:    "employee",
			DisplayName: "Karyawan",
			Permissions: model.StringSlice{},
		},
	}

	for i := range defaults {
		if err := r.Upsert(&defaults[i]); err != nil {
			return err
		}
	}
	return nil
}
