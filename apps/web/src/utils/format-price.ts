/** Backend prices are integers in cents (e.g. 4999 === R$ 49,99). */
export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
