export const format = {
  rank: (n: number) => `#${new Intl.NumberFormat('us-US').format(n)}`,
  price: (n: number) => {
    return new Intl.NumberFormat('us-US', {
      style: 'currency',
      currency: 'USD'
    }).format(n);
  }
};

export function removeDuplicates<T>(arr: T[]) {
  return [...new Set(arr)];
}
