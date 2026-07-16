function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function checkDigit(digits: string, weightStart: number): number {
  const sum = digits
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * (weightStart - index), 0);
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

/**
 * Valida formato (11 dígitos) e dígitos verificadores segundo o algoritmo
 * padrão de CPF. Rejeita sequências de dígito repetido (ex: "00000000000"),
 * que passam no checksum mas nunca são CPFs reais emitidos.
 */
export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const firstCheckDigit = checkDigit(digits.slice(0, 9), 10);
  const secondCheckDigit = checkDigit(digits.slice(0, 10), 11);

  return firstCheckDigit === Number(digits[9]) && secondCheckDigit === Number(digits[10]);
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).padEnd(11, " ");
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`.trim();
}

export function maskCpf(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length !== 11) {
    return "***.***.***-**";
  }
  return `***.***.**${digits[8]}-${digits.slice(9, 11)}`;
}
