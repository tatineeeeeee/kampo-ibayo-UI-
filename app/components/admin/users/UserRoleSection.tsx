"use client";

interface UserRoleSectionProps {
  role: string;
  canCreateAdmin: boolean;
  isSubmitting: boolean;
  onRoleChange: (value: string) => void;
}

export function UserRoleSection({
  role,
  canCreateAdmin,
  isSubmitting,
  onRoleChange,
}: UserRoleSectionProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        Role <span className="text-destructive">*</span>
      </label>
      <select
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground bg-card"
        disabled={isSubmitting}
      >
        <option value="staff">Staff — Admin panel access</option>
        {canCreateAdmin && (
          <option value="admin">Admin — Full system access</option>
        )}
      </select>
      <p className="text-xs text-muted-foreground mt-1">
        {role === "staff"
          ? "Staff can view the admin panel and manage bookings"
          : "Admins have full system access and all permissions"}
      </p>
    </div>
  );
}
