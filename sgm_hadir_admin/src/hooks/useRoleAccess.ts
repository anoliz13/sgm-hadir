import { useAuth } from "../contexts/AuthContext";

/**
 * Hook that provides role-based access control helpers.
 * Use this to conditionally render UI elements based on the logged-in user's role.
 */
export function useRoleAccess() {
  const { userData, isSuperAdmin, isSupervisor, isKepalaSalut, isManajerSalut, canApprove } = useAuth();

  const role = userData?.role;

  return {
    role,

    // Basic role flags
    isSuperAdmin,
    isSupervisor,
    isKepalaSalut,
    isManajerSalut,
    isEmployee: role === "employee",

    // Composite flags
    canApprove,
    canManageEmployees: isSuperAdmin || isSupervisor,
    canManageBranches: isSuperAdmin,
    canViewAllBranches: isSuperAdmin || isSupervisor,
    canExportReports: isSuperAdmin || isSupervisor || isKepalaSalut || isManajerSalut,
    canManageShifts: isSuperAdmin || isSupervisor,
    canImportHolidays: isSuperAdmin || isSupervisor,

    // Returns true if the user has access to data from the given branch
    canAccessBranch: (branchId: string): boolean => {
      if (isSuperAdmin || isSupervisor) return true;
      return userData?.branchId === branchId;
    },
  };
}

export type RoleAccess = ReturnType<typeof useRoleAccess>;
