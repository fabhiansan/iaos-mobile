const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return idrFormatter.format(amount);
}
