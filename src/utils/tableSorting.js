const numericPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
const datePattern = /^\d{4}-\d{1,2}-\d{1,2}|^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|^\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}$|^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$/;
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

const getComparableValue = (value) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? value : value.getTime();
  if (typeof value === "number") return value;
  if (typeof value !== "string") return value;

  const text = value.trim();
  if (!text) return null;
  if (datePattern.test(text) || (text.includes("T") && !Number.isNaN(Date.parse(text)))) {
    const timestamp = Date.parse(text);
    if (!Number.isNaN(timestamp)) return timestamp;
  }

  const numericText = text.replace(/[,\s₹$€£¥%]/g, "");
  if (numericPattern.test(numericText)) return Number(numericText);
  return text;
};

const compareValues = (leftValue, rightValue) => {
  const left = getComparableValue(leftValue);
  const right = getComparableValue(rightValue);
  if (typeof left === "number" && typeof right === "number") return left - right;
  return collator.compare(String(left), String(right));
};

export const sortRows = (rows, key, direction = "asc", getValue = (row) => row?.[key]) => {
  const multiplier = direction === "desc" ? -1 : 1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftValue = getValue(left.row);
      const rightValue = getValue(right.row);
      const leftEmpty = leftValue == null || String(leftValue).trim() === "";
      const rightEmpty = rightValue == null || String(rightValue).trim() === "";
      if (leftEmpty !== rightEmpty) return leftEmpty ? 1 : -1;
      return compareValues(leftValue, rightValue) * multiplier || left.index - right.index;
    })
    .map(({ row }) => row);
};
