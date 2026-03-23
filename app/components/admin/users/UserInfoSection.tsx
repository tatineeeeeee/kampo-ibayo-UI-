"use client";

import {
  formatPhoneForDisplay,
} from "../../../utils/phoneUtils";

interface UserInfoSectionProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  clearFieldError: (field: string) => void;
}

export function UserInfoSection({
  firstName,
  lastName,
  email,
  phone,
  errors,
  isSubmitting,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPhoneChange,
  clearFieldError,
}: UserInfoSectionProps) {
  return (
    <>
      {/* First Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          First Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => {
            onFirstNameChange(e.target.value);
            clearFieldError("firstName");
          }}
          placeholder="Enter first name"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground ${
            errors.firstName ? "border-destructive" : "border-border"
          }`}
          disabled={isSubmitting}
        />
        {errors.firstName && (
          <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Last Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => {
            onLastNameChange(e.target.value);
            clearFieldError("lastName");
          }}
          placeholder="Enter last name"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground ${
            errors.lastName ? "border-destructive" : "border-border"
          }`}
          disabled={isSubmitting}
        />
        {errors.lastName && (
          <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Email <span className="text-destructive">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            onEmailChange(e.target.value);
            clearFieldError("email");
          }}
          placeholder="user@example.com"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground ${
            errors.email ? "border-destructive" : "border-border"
          }`}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1">{errors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Phone <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            const formatted = formatPhoneForDisplay(e.target.value);
            onPhoneChange(formatted);
            clearFieldError("phone");
          }}
          placeholder="09XX-XXX-XXXX"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground ${
            errors.phone ? "border-destructive" : "border-border"
          }`}
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-xs text-destructive mt-1">{errors.phone}</p>
        )}
      </div>
    </>
  );
}
