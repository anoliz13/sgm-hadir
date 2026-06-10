package repository

import (
	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/model"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByID(id uuid.UUID) (*model.User, error) {
	var user model.User
	err := r.db.Preload("Branch").First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByNIK(nik string) (*model.User, error) {
	var user model.User
	err := r.db.Where("nik = ?", nik).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindAll() ([]model.User, error) {
	var users []model.User
	err := r.db.Preload("Branch").Order("name ASC").Find(&users).Error
	return users, err
}

func (r *UserRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}
