import type { CreateStaffRole, CreateStaffRoleCtx, CreateStaffRoleForm } from '$forms';
import type { FormCreate } from '$types';

export type FormRegistry = {
  createStaffRole: FormCreate<typeof CreateStaffRoleForm, CreateStaffRole, CreateStaffRole, CreateStaffRoleCtx>;
};
