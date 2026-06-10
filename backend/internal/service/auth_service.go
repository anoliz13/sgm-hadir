package service

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/model"
	"github.com/sgm/hadir-backend/pkg/hash"
	jwt_utils "github.com/sgm/hadir-backend/pkg/jwt"
	redis_client "github.com/sgm/hadir-backend/pkg/redis"
	"gorm.io/gorm"
)

type AuthService struct {
	db *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

func (s *AuthService) Login(req *dto.LoginRequest) (*dto.LoginResponse, error) {
	var user model.User

	// Find by NIK or Email
	err := s.db.Where("nik = ? OR email = ?", req.Identifier, req.Identifier).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	if !user.IsActive {
		return nil, errors.New("account is disabled")
	}

	// Verify password
	if !hash.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid credentials")
	}

	// Generate Tokens (include branch_id for RBAC filtering)
	accessToken, refreshToken, err := jwt_utils.GenerateTokens(user.ID, string(user.Role), user.BranchID)
	if err != nil {
		return nil, err
	}

	// Store refresh token in Redis (valid for 7 days)
	err = redis_client.Client.Set(redis_client.Ctx, "refresh_token:"+user.ID.String(), refreshToken, 7*24*time.Hour).Err()
	if err != nil {
		return nil, errors.New("failed to save session")
	}

	return &dto.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: dto.UserResponse{
			ID:       user.ID,
			NIK:      user.NIK,
			Name:     user.Name,
			Role:     string(user.Role),
			PhotoURL: user.PhotoURL,
		},
	}, nil
}

func (s *AuthService) Logout(userID uuid.UUID) error {
	// Delete refresh token from Redis
	err := redis_client.Client.Del(redis_client.Ctx, "refresh_token:"+userID.String()).Err()
	if err != nil {
		return err
	}
	return nil
}

func (s *AuthService) GetProfile(userID uuid.UUID) (*model.User, error) {
	var user model.User
	err := s.db.Preload("Branch").First(&user, "id = ?", userID).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthService) UpdateFCMToken(userID uuid.UUID, token string) error {
	return s.db.Model(&model.User{}).Where("id = ?", userID).Update("fcm_token", token).Error
}

func (s *AuthService) UpdateProfile(userID uuid.UUID, name, phone, photoURL string) error {
	updates := map[string]interface{}{}
	if name != "" {
		updates["name"] = name
	}
	if phone != "" {
		updates["phone"] = phone
	}
	if photoURL != "" {
		updates["photo_url"] = photoURL
	}
	if len(updates) == 0 {
		return errors.New("tidak ada data yang diubah")
	}
	return s.db.Model(&model.User{}).Where("id = ?", userID).Updates(updates).Error
}

func (s *AuthService) ChangePassword(userID uuid.UUID, currentPassword, newPassword string) error {
	var user model.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return errors.New("user tidak ditemukan")
	}
	if !hash.CheckPasswordHash(currentPassword, user.PasswordHash) {
		return errors.New("password lama tidak sesuai")
	}
	hashed, err := hash.HashPassword(newPassword)
	if err != nil {
		return errors.New("gagal memproses password baru")
	}
	return s.db.Model(&user).Update("password_hash", hashed).Error
}
