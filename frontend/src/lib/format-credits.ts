export function formatCredits(balance: number | null | undefined) {
  if (balance === null || balance === undefined) {
    return '---';
  }

  return balance.toLocaleString();
}
