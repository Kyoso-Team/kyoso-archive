import type { CreateStaffRoleValue, CreateStaffRoleCtx, CreateStaffRoleForm } from '$forms';
import type { FormCreate } from '$types';

export type FormRegistry = {
  createStaffRole: FormCreate<
    typeof CreateStaffRoleForm,
    CreateStaffRoleValue,
    CreateStaffRoleValue,
    CreateStaffRoleCtx
  >;
};
