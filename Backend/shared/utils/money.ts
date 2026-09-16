export const toNum = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0;
  return Math.round(Number(value) * 100) / 100;
};

export const toMoney = (value: string | number | null | undefined): string => {
  return toNum(value).toFixed(2);
};

export const sum = (values: (string | number | null | undefined)[]): number => {
  return Math.round(values.reduce<number>((acc, v) => acc + toNum(v), 0) * 100) / 100;
};