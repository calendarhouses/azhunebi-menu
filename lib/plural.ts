export function formatPositionLabel(count: number) {
  if (count <= 0) {
    return "Порожній";
  }

  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;

  let word = "позицій";
  if (mod10 === 1 && mod100 !== 11) {
    word = "позиція";
  } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    word = "позиції";
  }

  return `${n} ${word}`;
}
