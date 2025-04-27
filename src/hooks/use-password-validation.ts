
import { useState } from "react";

export const usePasswordValidation = () => {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validatePassword = (password: string, confirmPwd: string) => {
    if (password !== confirmPwd) {
      setPasswordError("Passwords do not match");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  return {
    confirmPassword,
    setConfirmPassword,
    passwordError,
    setPasswordError,
    validatePassword
  };
};
