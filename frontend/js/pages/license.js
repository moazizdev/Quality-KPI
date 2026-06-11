const LicensePage = {
  async render() {
    const el = document.getElementById('page-license');
    if (!el) return;

    let status;
    try {
      const res = await fetch('/license/status');
      status = await res.json();
    } catch {
      el.innerHTML = `<div class="loading">${__('Loading...')}</div>`;
      return;
    }

    if (status.activated) {
      window.location.hash = '#/';
      return;
    }

    if (!status.secret_configured) {
      el.innerHTML = `
        <div id="license-container">
          <div id="license-box">
            <div class="license-icon">🔐</div>
            <h1>${__('Quality KPI System')}</h1>
            <p class="license-sub">${__('License not configured')}</p>
            <p>${__('The license secret is not set in config.ini. Please add a [license] section with your secret key.')}</p>
            <div class="license-fingerprint">
              <label>${__('Machine Fingerprint')}:</label>
              <code>${status.fingerprint}</code>
            </div>
          </div>
        </div>
      `;
      return;
    }

    el.innerHTML = `
      <div id="license-container">
        <div id="license-box">
          <div class="license-icon">🔑</div>
          <h1>${__('Quality KPI System')}</h1>
          <p class="license-sub">${__('This system is not activated')}</p>
          <p>${__('Enter your license key to activate:')}</p>
          <div class="license-fingerprint">
            <label>${__('Machine Fingerprint')}:</label>
            <code>${status.fingerprint}</code>
          </div>
          <input class="form-control license-input" id="license-key" type="text" placeholder="${__('License key')}" autocomplete="off">
          <button class="btn btn-primary license-btn" id="btn-activate">${__('Activate')}</button>
          <div id="license-msg" style="margin-top:12px"></div>
        </div>
      </div>
    `;

    document.getElementById('btn-activate').onclick = async () => {
      const key = document.getElementById('license-key').value.trim();
      const msgEl = document.getElementById('license-msg');
      if (!key) {
        msgEl.innerHTML = `<div class="alert alert-error">${__('Please enter a license key')}</div>`;
        return;
      }
      try {
        const res = await fetch('/license/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });
        const data = await res.json();
        if (res.ok) {
          msgEl.innerHTML = `<div class="alert alert-success">✅ ${__('Activated successfully')}</div>`;
          setTimeout(() => { window.location.hash = '#/'; location.reload(); }, 1000);
        } else {
          msgEl.innerHTML = `<div class="alert alert-error">❌ ${data.detail || __('Activation failed')}</div>`;
        }
      } catch {
        msgEl.innerHTML = `<div class="alert alert-error">❌ ${__('Network error')}</div>`;
      }
    };
  },
};

window.init_license = async function () {
  LicensePage.render();
};
