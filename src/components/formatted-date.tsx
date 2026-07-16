const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = { dateStyle: "long" };

/**
 * Formata uma data UTC no fuso do navegador. Servidor e cliente podem estar em
 * fusos diferentes, então o texto renderizado no servidor é só um placeholder
 * inicial — `suppressHydrationWarning` evita o warning de mismatch esperado.
 */
export function FormattedDate({
  value,
  options = DEFAULT_OPTIONS,
}: {
  value: string | Date;
  options?: Intl.DateTimeFormatOptions;
}) {
  const text = new Intl.DateTimeFormat("pt-BR", options).format(new Date(value));
  return <span suppressHydrationWarning>{text}</span>;
}
