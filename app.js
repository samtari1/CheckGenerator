const form = document.getElementById('check-form');
const todayBtn = document.getElementById('today-btn');
const printBtn = document.getElementById('print-btn');
const batchPreview = document.getElementById('batch-preview');

const fields = {
  payee: document.getElementById('payee'),
  date: document.getElementById('date'),
  amount: document.getElementById('amount'),
  memo: document.getElementById('memo'),
  bankName: document.getElementById('bankName'),
  accountHolder: document.getElementById('accountHolder'),
  routing: document.getElementById('routing'),
  account: document.getElementById('account'),
  checkNumber: document.getElementById('checkNumber'),
  batchSize: document.getElementById('batchSize'),
  checksPerPage: document.getElementById('checksPerPage'),
  duplexBackMode: document.getElementById('duplexBackMode'),
  phone: document.getElementById('phone'),
  address: document.getElementById('address'),
  checkBg: document.getElementById('checkBg'),
  contentScale: document.getElementById('contentScale'),
  bgOpacity: document.getElementById('bgOpacity')
};

function onlyDigits(value) {
  return value.replace(/\D/g, '');
}

function formatAmount(value) {
  if (!value || value.trim() === "") return "";
  const number = Number(value);
  if (Number.isNaN(number) || number < 0) {
    return "";
  }
  return number.toFixed(2);
}

function formatDateISOToUS(isoDate) {
  if (!isoDate) return 'MM/DD/YYYY';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return 'MM/DD/YYYY';
  return `${month}/${day}/${year}`;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function numberToWordsUnderThousand(number) {
  const ones = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen'
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (number < 20) return ones[number];
  if (number < 100) {
    const tensPart = tens[Math.floor(number / 10)];
    const onesPart = number % 10;
    return onesPart ? `${tensPart}-${onesPart === 0 ? '' : ones[onesPart]}` : tensPart;
  }

  const hundredsPart = `${ones[Math.floor(number / 100)]} hundred`;
  const remainder = number % 100;
  if (!remainder) return hundredsPart;
  return `${hundredsPart} ${numberToWordsUnderThousand(remainder)}`;
}

function numberToWords(number) {
  if (number === 0) return 'zero';

  const scales = [
    { value: 1_000_000_000, label: 'billion' },
    { value: 1_000_000, label: 'million' },
    { value: 1_000, label: 'thousand' }
  ];

  let remainder = Math.floor(number);
  let words = [];

  for (const scale of scales) {
    if (remainder >= scale.value) {
      const count = Math.floor(remainder / scale.value);
      words.push(`${numberToWordsUnderThousand(count)} ${scale.label}`);
      remainder %= scale.value;
    }
  }

  if (remainder > 0) {
    words.push(numberToWordsUnderThousand(remainder));
  }

  return words.join(' ');
}

function amountToCheckWords(amountValue) {
  const amount = Number(amountValue);
  if (Number.isNaN(amount) || amount < 0) return 'Zero dollars and 00/100';

  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100)
    .toString()
    .padStart(2, '0');

  const words = numberToWords(whole);
  const capped = words.charAt(0).toUpperCase() + words.slice(1);
  const dollarLabel = whole === 1 ? 'dollar' : 'dollars';

  return `${capped} ${dollarLabel} and ${cents}/100`;
}

function getBatchSize() {
  const parsed = Number.parseInt(fields.batchSize.value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 3;
  return Math.min(parsed, 100);
}

function getChecksPerPage() {
  const parsed = Number.parseInt(fields.checksPerPage.value, 10);
  if (parsed === 3 || parsed === 4) return parsed;
  return 1;
}

function getBaseCheckNumber() {
  const raw = onlyDigits(fields.checkNumber.value);
  if (!raw) return 0;
  return Number.parseInt(raw, 10);
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function buildFrontMarkup({ bankName, accountHolder, checkNumber, dateText, amount, payee, amountWords, memo, routing, account, address, phone, checkBg, contentScale, bgOpacity }) {
  const bgStyle = checkBg ? `position: relative; z-index: 0;` : '';
  const overlayStyle = checkBg ? `position: absolute; inset: 0; z-index: 1; pointer-events: none; background: url('${checkBg}') center/cover no-repeat; opacity: ${bgOpacity || 0.18};` : '';
  const scale = contentScale || 0.93;
  return `
    <article class="check front" aria-label="Check front" style="${bgStyle}">
      ${checkBg ? `<div class="check-bg-overlay" style="${overlayStyle}"></div>` : ''}
      <div class="check-content" style="position: relative; z-index: 2; transform: scale(${scale}); transform-origin: center;">
        <header class="check-header">
          <div>
            <h2>${escapeHtml(bankName)}</h2>
            <div class="payer-contact">
              <span class="payer-address">${escapeHtml(accountHolder)}</span><br>
              <span class="payer-address">${escapeHtml(address)}</span><br>
              <span class="payer-phone">${escapeHtml(phone)}</span>
            </div>
          </div>
          <div class="check-no-date">
            <div class="check-no">${escapeHtml(checkNumber)}</div>
            <div class="check-date">Date ${dateText && dateText !== 'MM/DD/YYYY' ? escapeHtml(dateText) : '____/____/__________'}</div>
          </div>
        </header>


        <div class="pay-amount-row">
          <span class="pay-label">Pay to the Order of</span>
          <span class="pay-line">${escapeHtml(payee)}</span>
          <span class="amount-box-square">$${escapeHtml(amount)}</span>
        </div>

        <p class="amount-words" style="display: flex; align-items: center;">
          <span style="flex:1;">${escapeHtml(amountWords) || '&nbsp;'}</span>
          <span style="margin-left:8px;">Dollars</span>
        </p>
        
        <div class="memo-signature-row" style="margin-top: 18px;">
          <div class="memo-field">
            <span class="field-label">Memo</span>
            <span class="field-line">${escapeHtml(memo)}</span>
          </div>
          <div class="signature-field">
            <span class="field-label">Signature</span>
            <span class="field-line"></span>
          </div>
        </div>

        <footer class="micr" aria-label="MICR line">
          <span>⑆${escapeHtml(routing)}⑆</span>
          <span>${escapeHtml(account)}⑈</span>
          <span>${escapeHtml(checkNumber)}</span>
        </footer>
      </div>
    </article>
  `;
}

function buildBackMarkup(checkNumber, duplexBackMode) {
  const backClass = duplexBackMode === 'rotate180' ? 'check back duplex-rotate' : 'check back';
  return `
    <article class="${backClass}" aria-label="Check back">
      <div class="back-portrait-layout">
        <section class="endorsement-box" aria-label="Endorsement area">
          <p>Endorse here:</p>
          <div class="endorsement-line">X</div>
          <div class="endorsement-line"></div>
          <div class="endorsement-line"></div>
          <p class="back-note">DO NOT WRITE BELOW THIS LINE</p>
        </section>
      </div>
    </article>
  `;
}

function updatePreview() {
  const payee = fields.payee.value.trim();
  const memo = fields.memo.value.trim();
  const bankName = fields.bankName.value.trim();
  const accountHolder = fields.accountHolder.value.trim();
  const routing = onlyDigits(fields.routing.value);
  const account = onlyDigits(fields.account.value);
  const baseCheckNumber = getBaseCheckNumber();
  const batchSize = getBatchSize();
  const checksPerPage = getChecksPerPage();
  const duplexBackMode = fields.duplexBackMode.value;
  const amount = formatAmount(fields.amount.value);
  const address = fields.address.value.trim();
  const phone = fields.phone.value.trim();
  const dateText = formatDateISOToUS(fields.date.value);
  const amountWords = amount ? amountToCheckWords(amount) : "";

  const safePayee = payee || `:`;
  const safeMemo = memo || ``;
  const safeBank = bankName || 'Bank Name';
  const safeHolder = accountHolder || 'Account Holder';
  const safeRouting = routing || '000000000';
  const safeAccount = account || '000000000000';

  const checks = [];
  for (let index = 0; index < batchSize; index += 1) {
    checks.push(String(baseCheckNumber + index || 0).padStart(4, '0'));
  }

  const pages = [];

  if (checksPerPage === 1) {
    checks.forEach((checkNumber) => {
      pages.push(`
        <section class="print-page" data-side="front" data-check="${checkNumber}">
          <p class="page-tag">Check ${checkNumber} — Front</p>
          <div class="check-sheet">
            <div class="check-slot">
              ${buildFrontMarkup({
                bankName: safeBank,
                accountHolder: safeHolder,
                checkNumber,
                dateText,
                amount,
                payee: safePayee,
                amountWords,
                memo: safeMemo,
                routing: safeRouting,
                account: safeAccount,
                address,
                phone,
                checkBg: fields.checkBg.value,
                contentScale: fields.contentScale.value,
                bgOpacity: fields.bgOpacity.value
              })}
            </div>
          </div>
        </section>
      `);

      pages.push(`
        <section class="print-page" data-side="back" data-check="${checkNumber}">
          <p class="page-tag">Check ${checkNumber} — Back</p>
          <div class="check-sheet">
            <div class="check-slot">
              ${buildBackMarkup(checkNumber, duplexBackMode)}
            </div>
          </div>
        </section>
      `);
    });
  } else {
    const chunks = chunkArray(checks, checksPerPage);

    chunks.forEach((chunk, chunkIndex) => {
      const frontCells = chunk.map((checkNumber) => `
        <div class="sheet-cell">
          ${buildFrontMarkup({
            bankName: safeBank,
            accountHolder: safeHolder,
            checkNumber,
            dateText,
            amount,
            payee: safePayee,
            amountWords,
            memo: safeMemo,
            routing: safeRouting,
            account: safeAccount,
            address,
            phone,
            checkBg: fields.checkBg.value,
            contentScale: fields.contentScale.value,
            bgOpacity: fields.bgOpacity.value
          })}
        </div>
      `);

      const backCells = chunk.map((checkNumber) => `
        <div class="sheet-cell">
          ${buildBackMarkup(checkNumber, duplexBackMode)}
        </div>
      `);

      const emptyCount = checksPerPage - chunk.length;
      for (let index = 0; index < emptyCount; index += 1) {
        frontCells.push('<div class="sheet-cell sheet-cell-empty" aria-hidden="true"></div>');
        backCells.push('<div class="sheet-cell sheet-cell-empty" aria-hidden="true"></div>');
      }

      pages.push(`
        <section class="print-page nup-page" data-side="front" data-page-index="${chunkIndex + 1}">
          <p class="page-tag">Front Page ${chunkIndex + 1}</p>
          <div class="sheet-grid sheet-grid-${checksPerPage}">
            ${frontCells.join('')}
          </div>
        </section>
      `);

      pages.push(`
        <section class="print-page nup-page" data-side="back" data-page-index="${chunkIndex + 1}">
          <p class="page-tag">Back Page ${chunkIndex + 1}</p>
          <div class="sheet-grid sheet-grid-${checksPerPage}">
            ${backCells.join('')}
          </div>
        </section>
      `);
    });
  }

  batchPreview.innerHTML = pages.join('');
}

function setTodayDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  fields.date.value = `${yyyy}-${mm}-${dd}`;
  updatePreview();
}

Object.values(fields).forEach((input) => {
  input.addEventListener('input', updatePreview);
  if (input.tagName === 'SELECT') {
    input.addEventListener('change', updatePreview);
  }
});

form.addEventListener('reset', () => {
  requestAnimationFrame(updatePreview);
});

todayBtn.addEventListener('click', setTodayDate);
printBtn.addEventListener('click', () => {
  updatePreview();
  window.print();
});

setTodayDate();
fields.bankName.value = 'CHASE';
fields.payee.value = 'Quanpeng Yang';
fields.accountHolder.value = 'Quanpeng Yang';
fields.routing.value = '072000326';
fields.account.value = '991986305';
fields.checkNumber.value = '0001';
fields.batchSize.value = '1';
fields.checksPerPage.value = '3';
fields.duplexBackMode.value = 'normal';
updatePreview();
fields.memo.value = 'Deposit';
