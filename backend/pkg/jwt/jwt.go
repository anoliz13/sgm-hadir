package jwt_utils

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
)

type JWTClaim struct {
	UserID   uuid.UUID  `json:"user_id"`
	Role     string     `json:"role"`
	BranchID *uuid.UUID `json:"branch_id,omitempty"`
	Type     string     `json:"type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

func getSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "super-secret-jwt-key-change-this-in-production"
	}
	return []byte(secret)
}

// GenerateTokens generates both access and refresh tokens
func GenerateTokens(userID uuid.UUID, role string, branchID ...*uuid.UUID) (string, string, error) {
	var bid *uuid.UUID
	if len(branchID) > 0 {
		bid = branchID[0]
	}
	accessExpStr := os.Getenv("JWT_ACCESS_EXPIRATION_MINUTES")
	accessExp, err := strconv.Atoi(accessExpStr)
	if err != nil || accessExp == 0 {
		accessExp = 15
	}

	refreshExpStr := os.Getenv("JWT_REFRESH_EXPIRATION_DAYS")
	refreshExp, err := strconv.Atoi(refreshExpStr)
	if err != nil || refreshExp == 0 {
		refreshExp = 7
	}

	// Generate Access Token
	accessClaims := &JWTClaim{
		UserID:   userID,
		Role:     role,
		BranchID: bid,
		Type:     "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(accessExp) * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(getSecret())
	if err != nil {
		return "", "", err
	}

	// Generate Refresh Token
	refreshClaims := &JWTClaim{
		UserID:   userID,
		Role:     role,
		BranchID: bid,
		Type:     "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(refreshExp) * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(getSecret())
	if err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

// ValidateToken parses and validates a JWT token
func ValidateToken(signedToken string) (*JWTClaim, error) {
	token, err := jwt.ParseWithClaims(
		signedToken,
		&JWTClaim{},
		func(token *jwt.Token) (interface{}, error) {
			return getSecret(), nil
		},
	)

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*JWTClaim)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
