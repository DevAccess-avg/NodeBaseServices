function generateUniqueCode() {
  let code = '';
  for (let i = 0; i < 16; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

function generateUniqueCodeWithCheck(db) {
  let code;
  let attempts = 0;
  const maxAttempts = 50;
  
  do {
    code = generateUniqueCode();
    if (!db.codeExists(code)) return code;
    attempts++;
  } while (attempts < maxAttempts);
  
  return Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

module.exports = { generateUniqueCode, generateUniqueCodeWithCheck };
