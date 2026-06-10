package service

import (
	"time"

	"github.com/sgm/hadir-backend/internal/dto"
	"github.com/sgm/hadir-backend/internal/repository"
	"github.com/sgm/hadir-backend/pkg/excel"
	"github.com/xuri/excelize/v2"
)

type ReportService struct {
	repo *repository.ReportRepository
}

func NewReportService(repo *repository.ReportRepository) *ReportService {
	return &ReportService{repo: repo}
}

func (s *ReportService) GetAttendanceSummary(filter dto.ReportFilter) ([]dto.AttendanceSummary, error) {
	return s.repo.GetAttendanceSummary(filter)
}

func (s *ReportService) GenerateExcelReport(filter dto.ReportFilter) (*excelize.File, string, error) {
	data, err := s.repo.GetAttendanceSummary(filter)
	if err != nil {
		return nil, "", err
	}
	return excel.GenerateAttendanceReport(data, filter.StartDate, filter.EndDate)
}

func (s *ReportService) GetLeaveReport(start, end time.Time, branchID string) ([]dto.LeaveReportRow, error) {
	return s.repo.GetLeaveReport(start, end, branchID)
}

func (s *ReportService) GetOvertimeReport(start, end time.Time, branchID string) ([]dto.OvertimeReportRow, error) {
	return s.repo.GetOvertimeReport(start, end, branchID)
}
