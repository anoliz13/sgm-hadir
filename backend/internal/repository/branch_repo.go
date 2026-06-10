package repository

import (
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/model"
	"gorm.io/gorm"
)

type BranchRepository struct {
	db *gorm.DB
}

func NewBranchRepository(db *gorm.DB) *BranchRepository {
	return &BranchRepository{db: db}
}

func (r *BranchRepository) Create(branch *model.Branch) error {
	return r.db.Create(branch).Error
}

func (r *BranchRepository) FindByID(id uuid.UUID) (*model.Branch, error) {
	var branch model.Branch
	err := r.db.First(&branch, id).Error
	if err != nil {
		return nil, err
	}
	return &branch, nil
}

func (r *BranchRepository) FindAll() ([]model.Branch, error) {
	var branches []model.Branch
	err := r.db.Order("name ASC").Find(&branches).Error
	return branches, err
}

func (r *BranchRepository) Update(branch *model.Branch) error {
	return r.db.Save(branch).Error
}

func (r *BranchRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Branch{}, id).Error
}
