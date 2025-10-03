import { useMemo } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

export interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isStrong: boolean;
}

interface PasswordValidatorProps {
  strength: PasswordStrength;
}

export function usePasswordStrength(password: string, minLength: number = 8): PasswordStrength {
  return useMemo(() => {
    const hasMinLength = password.length >= minLength;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const isStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
    
    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      isStrong
    };
  }, [password, minLength]);
}

interface PasswordValidatorProps {
  strength: PasswordStrength;
  minLength?: number;
}

function PasswordValidator({ strength, minLength = 8 }: PasswordValidatorProps) {
  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs font-medium text-gray-700 mb-1">Password must contain:</p>
      <PasswordRequirement met={strength.hasMinLength} text={`At least ${minLength} characters`} />
      <PasswordRequirement met={strength.hasUppercase} text="One uppercase letter" />
      <PasswordRequirement met={strength.hasLowercase} text="One lowercase letter" />
      <PasswordRequirement met={strength.hasNumber} text="One number" />
      <PasswordRequirement met={strength.hasSpecialChar} text="One special character (!@#$%^&*...)" />
    </div>
  );
}
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-500'}`}>
      {met ? <FaCheck className="text-green-600" /> : <FaTimes className="text-gray-400" />}
      <span>{text}</span>
    </div>
  );
}

export default PasswordValidator;
