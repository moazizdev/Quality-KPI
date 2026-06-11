export function makeSearchable(selectId) {
  const select = document.getElementById(selectId);
  if (!select || select.dataset.searchable) return;
  select.dataset.searchable = '1';

  const wrapper = document.createElement('div');
  wrapper.className = 'searchable-select-wrapper';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'form-control searchable-select-input';
  input.placeholder = (typeof __ === 'function' ? __('Search') + '...' : 'Search...');
  input.autocomplete = 'off';
  input.spellcheck = false;

  const dropdown = document.createElement('div');
  dropdown.className = 'searchable-select-dropdown';

  select.parentNode.insertBefore(wrapper, select.nextSibling);
  wrapper.appendChild(input);
  wrapper.appendChild(dropdown);
  select.style.display = 'none';

  function buildOptions(filter) {
    dropdown.innerHTML = '';
    const q = (filter || '').toLowerCase().trim();
    let hasVisible = false;

    for (let i = 0; i < select.options.length; i++) {
      const opt = select.options[i];
      const text = opt.textContent;
      if (!q || text.toLowerCase().includes(q)) {
        hasVisible = true;
        const item = document.createElement('div');
        item.className = 'searchable-select-item';
        if (opt.selected) item.classList.add('active');
        item.textContent = text;
        item.dataset.index = i;
        item.onmousedown = (e) => {
          e.preventDefault();
          select.selectedIndex = i;
          input.value = text;
          hideDropdown();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        };
        dropdown.appendChild(item);
      }
    }

    if (!hasVisible) {
      const empty = document.createElement('div');
      empty.className = 'searchable-select-empty';
      empty.textContent = typeof __ === 'function' ? __('No results') : 'No results';
      dropdown.appendChild(empty);
    }
  }

  function showDropdown() { dropdown.classList.add('open'); }
  function hideDropdown() { dropdown.classList.remove('open'); }
  function toggleDropdown() {
    if (dropdown.classList.contains('open')) hideDropdown();
    else { buildOptions(input.value); showDropdown(); }
  }

  input.onfocus = () => { buildOptions(input.value); showDropdown(); };
  input.oninput = () => { buildOptions(input.value); showDropdown(); };
  input.onclick = toggleDropdown;

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) hideDropdown();
  });

  let activeIdx = -1;
  input.onkeydown = (e) => {
    const items = dropdown.querySelectorAll('.searchable-select-item:not(.searchable-select-empty)');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const active = dropdown.querySelector('.searchable-select-item.active');
      if (active) { active.onmousedown(new MouseEvent('mousedown')); }
      return;
    } else if (e.key === 'Escape') {
      hideDropdown();
      input.blur();
      return;
    } else { activeIdx = -1; return; }

    items.forEach((i, idx) => {
      i.classList.toggle('active', idx === activeIdx);
      if (idx === activeIdx) i.scrollIntoView({ block: 'nearest' });
    });
  };

  select.addEventListener('change', () => {
    const opt = select.options[select.selectedIndex];
    if (opt) input.value = opt.textContent;
  });

  const initOpt = select.options[select.selectedIndex];
  if (initOpt) input.value = initOpt.textContent;

  new MutationObserver(() => {
    const opt = select.options[select.selectedIndex];
    if (opt && opt.textContent !== input.value) input.value = opt.textContent;
  }).observe(select, { childList: true, subtree: true });
}
