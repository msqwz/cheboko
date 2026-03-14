/**
 * Валидатор пароля согласно ТЗ:
 * - Минимум 8 символов
 * - Минимум одна буква любого регистра
 * - Минимум один специальный символ (! @ # $ % ^ & * ( ) - _ = + \ | [ ] { } ; : / ? . > <)
 */
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: "Пароль должен содержать минимум 8 символов" };
  }

  const hasLetter = /[a-zA-Zа-яА-Я]/.test(password);
  if (!hasLetter) {
    return { isValid: false, message: "Пароль должен содержать минимум одну букву" };
  }

  const hasSpecialChar = /[!@#$%^&*()\-_=+\[\]{};:'"/?.><\\]/.test(password);
  if (!hasSpecialChar) {
    return { isValid: false, message: "Пароль должен содержать минимум один специальный символ" };
  }

  return { isValid: true, message: "Пароль корректен" };
}
