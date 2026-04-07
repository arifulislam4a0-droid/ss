function normalizePhone(input) {
  if (typeof input !== 'string') {
    input = String(input || '');
  }
  const cleaned = input.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+880')) return '0' + cleaned.slice(4);
  if (cleaned.startsWith('880')) return '0' + cleaned.slice(3);
  if (cleaned.startsWith('0')) return cleaned;
  return cleaned;
}

function isValidBangladeshiPhone(phone) {
  return /^01[3-9][0-9]{8}$/.test(phone);
}

function normalizeAndValidatePhone(input) {
  const normalized = normalizePhone(input);
  return isValidBangladeshiPhone(normalized) ? normalized : null;
}

module.exports = { normalizePhone, isValidBangladeshiPhone, normalizeAndValidatePhone };