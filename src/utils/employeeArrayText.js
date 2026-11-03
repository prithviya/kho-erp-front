export const parseArrayFromTextarea = (value, fieldName) => {
  const lines = String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    if (!line.includes(': ')) return line;

    return Object.fromEntries(
      line.split(' | ').map((entry) => {
        const separatorIndex = entry.indexOf(':');
        if (separatorIndex === -1) {
          throw new Error(`${fieldName} contains an invalid entry.`);
        }

        const key = entry.slice(0, separatorIndex).trim();
        const entryValue = entry.slice(separatorIndex + 1).trim();
        if (!key) throw new Error(`${fieldName} contains an invalid entry.`);
        const keyParts = key.split(/\s+/).filter(Boolean);
        const normalizedKey = keyParts
          .map((part, index) => index === 0
            ? part.toLowerCase()
            : `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
          .join('');
        return [normalizedKey, entryValue];
      })
    );
  });
};
