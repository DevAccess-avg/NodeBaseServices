// Loading screen
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 450);
    }, 700); // short, not long
  }
});

// Dashboard form logic
document.addEventListener('DOMContentLoaded', () => {
  const serviceSelect = document.getElementById('service_type');
  const botTypeSelect = document.getElementById('bot_type');
  const customGroup = document.getElementById('custom-group');
  const customDetails = document.getElementById('custom_details');
  const charCount = document.getElementById('char-count');
  const orderForm = document.getElementById('order-form');
  const resultBox = document.getElementById('result-box');
  const codeDisplay = document.getElementById('code-display');
  const copyBtn = document.getElementById('copy-btn');
  const submitBtn = document.getElementById('submit-btn');

  if (!serviceSelect) return; // not on dashboard

  const options = {
    basic: [
      'Moderation Bot',
      'Utility Bot',
      'Fun Bot',
      'Economy Bot',
      'Welcome Bot',
      'Ticket Bot'
    ],
    advanced: [
      'Moderation Bot',
      'Utility Bot',
      'Fun Bot',
      'Economy Bot',
      'Welcome Bot',
      'Ticket Bot',
      'Music Bot',
      'Leveling Bot',
      'Custom'
    ],
    fivem: [
      'Server Status Bot',
      'Whitelist Bot',
      'Player Lookup Bot',
      'Discord Sync Bot',
      'Queue Bot',
      'ERLC Status Bot',
      'ERLC Logging Bot',
      'Custom FiveM Integration'
    ]
  };

  function populateBotTypes() {
    const service = serviceSelect.value;
    botTypeSelect.innerHTML = '<option value="">Select bot type...</option>';
    if (options[service]) {
      options[service].forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        botTypeSelect.appendChild(o);
      });
    }
    toggleCustom();
  }

  function toggleCustom() {
    const isCustom = serviceSelect.value === 'advanced' && botTypeSelect.value === 'Custom';
    if (customGroup) {
      customGroup.classList.toggle('hidden', !isCustom);
      if (!isCustom && customDetails) customDetails.value = '';
      if (charCount) charCount.textContent = '0 / 2000';
    }
  }

  serviceSelect.addEventListener('change', populateBotTypes);
  botTypeSelect.addEventListener('change', toggleCustom);

  if (customDetails) {
    customDetails.addEventListener('input', () => {
      const len = customDetails.value.length;
      charCount.textContent = `${len} / 2000`;
      if (len > 2000) {
        charCount.style.color = 'var(--danger)';
      } else {
        charCount.style.color = 'var(--text-muted)';
      }
    });
  }

  // Initial
  populateBotTypes();

  // Form submit
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating...';

      const formData = new FormData(orderForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();

        if (json.success) {
          orderForm.classList.add('hidden');
          resultBox.classList.remove('hidden');
          codeDisplay.textContent = json.code;
        } else {
          alert(json.error || 'Something went wrong');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm & Generate Code';
        }
      } catch (err) {
        alert('Network error. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm & Generate Code';
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = codeDisplay.textContent;
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy Code'; }, 2000);
      });
    });
  }
});

// Admin tabs
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
}

// Admin actions
async function toggleSuspend(discordId, currentlySuspended) {
  if (!confirm(currentlySuspended ? 'Unsuspend this user?' : 'Suspend this user? They will lose access.')) return;
  
  try {
    const res = await fetch('/admin/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discord_id: discordId, suspend: !currentlySuspended })
    });
    const json = await res.json();
    if (json.success) location.reload();
    else alert(json.error || 'Failed');
  } catch {
    alert('Network error');
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch('/admin/order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, status })
    });
    const json = await res.json();
    if (json.success) location.reload();
    else alert(json.error || 'Failed');
  } catch {
    alert('Network error');
  }
}
