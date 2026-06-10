import { list, get, create, update, del } from '../api.js';

window.init_products = async function () {
  const isAdmin = window.isAdmin();
  const content = document.getElementById('page-products');
  content.innerHTML = `
    <div class="toolbar"><h3>${__('Manage Products')}</h3>${isAdmin ? '<button class="btn btn-primary" onclick="openProductForm()">+ ' + __('Add Product') + '</button>' : ''}</div>
    <div class="card"><div class="table-wrap"><table><thead><tr><th>${__('ID')}</th><th>${__('Name (EN)')}</th><th>${__('Name (AR)')}</th><th>${__('Pcs')}</th><th>${__('Ice')}</th><th>${__('Sauce')}</th><th>${__('Biscuit')}</th><th>${__('Min')}</th><th>${__('Max')}</th>${isAdmin ? '<th>' + __('Actions') + '</th>' : ''}</tr></thead><tbody id="products-tbody"></tbody></table></div></div>
    ${isAdmin ? `<div class="modal-overlay" id="product-modal"><div class="modal">
      <div class="modal-header"><span id="product-modal-title">${__('Add Product')}</span><button class="close" onclick="closeProductForm()">&times;</button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group"><label>${__('Name (English)')}</label><input class="form-control" id="product-name"></div>
          <div class="form-group"><label>${__('Name (Arabic)')}</label><input class="form-control" id="product-name-ar"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Default Pieces')}${info('Expected pieces per production batch')}</label><input class="form-control" id="product-pieces" type="number"></div>
          <div class="form-group"><label>${__('Ice Weight')}${info('Standard weight of the ice/cream component')}</label><input class="form-control" id="product-ice" type="number" step="0.1"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Sauce Weight')}${info('Standard weight of the sauce component')}</label><input class="form-control" id="product-sauce" type="number" step="0.1"></div>
          <div class="form-group"><label>${__('Biscuit Weight')}${info('Standard weight of the biscuit/crunch component')}</label><input class="form-control" id="product-biscuit" type="number" step="0.1"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>${__('Min Weight')}${info('Standard minimum acceptable weight')}</label><input class="form-control" id="product-min" type="number" step="0.1"></div>
          <div class="form-group"><label>${__('Max Weight')}${info('Standard maximum acceptable weight')}</label><input class="form-control" id="product-max" type="number" step="0.1"></div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn" onclick="closeProductForm()">${__('Cancel')}</button><button class="btn btn-primary" onclick="saveProduct()">${__('Save')}</button></div>
    </div></div>` : ''}
  `;
  await loadProducts();
};

let editingProductId = null;

async function loadProducts() {
  const isAdmin = window.isAdmin();
  const data = await list('/products');
  document.getElementById('products-tbody').innerHTML = data.map(p => `
    <tr><td>${p.id}</td><td>${p.product_name}</td><td>${p.product_name_ar || '-'}</td>
    <td>${p.default_pieces || '-'}</td><td>${p.default_ice_weight || '-'}</td>
    <td>${p.default_sauce_weight || '-'}</td><td>${p.default_biscuit_weight || '-'}</td>
    <td>${p.default_min_weight || '-'}</td><td>${p.default_max_weight || '-'}</td>
    ${isAdmin ? `<td><div class="btn-group"><button class="btn btn-sm btn-primary" onclick="editProduct(${p.id})">${__('Edit')}</button><button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">${__('Delete')}</button></div></td>` : ''}</tr>
  `).join('');
}

window.openProductForm = (data) => {
  editingProductId = data?.id || null;
  document.getElementById('product-modal-title').textContent = editingProductId ? __('Edit Product') : __('Add Product');
  document.getElementById('product-name').value = data?.product_name || '';
  document.getElementById('product-name-ar').value = data?.product_name_ar || '';
  document.getElementById('product-pieces').value = data?.default_pieces || '';
  document.getElementById('product-ice').value = data?.default_ice_weight || '';
  document.getElementById('product-sauce').value = data?.default_sauce_weight || '';
  document.getElementById('product-biscuit').value = data?.default_biscuit_weight || '';
  document.getElementById('product-min').value = data?.default_min_weight || '';
  document.getElementById('product-max').value = data?.default_max_weight || '';
  document.getElementById('product-modal').classList.add('active');
};

window.closeProductForm = () => document.getElementById('product-modal').classList.remove('active');

window.saveProduct = async () => {
  const body = {
    product_name: document.getElementById('product-name').value.trim(),
    product_name_ar: document.getElementById('product-name-ar').value.trim() || null,
    default_pieces: parseInt(document.getElementById('product-pieces').value) || null,
    default_ice_weight: parseFloat(document.getElementById('product-ice').value) || null,
    default_sauce_weight: parseFloat(document.getElementById('product-sauce').value) || null,
    default_biscuit_weight: parseFloat(document.getElementById('product-biscuit').value) || null,
    default_min_weight: parseFloat(document.getElementById('product-min').value) || null,
    default_max_weight: parseFloat(document.getElementById('product-max').value) || null,
  };
  if (!body.product_name) return showToast(__('English name is required'), 'error');
  try {
    if (editingProductId) {
      await update(`/products/${editingProductId}`, body);
      showToast(__('Product updated'));
    } else {
      await create('/products', body);
      showToast(__('Product created'));
    }
    closeProductForm();
    await loadProducts();
  } catch (e) { showToast(e.message, 'error'); }
};

window.editProduct = async (id) => {
  const item = await get(`/products/${id}`);
  if (item) window.openProductForm(item);
};

window.deleteProduct = async (id) => {
  if (!confirm(__('Delete this product?'))) return;
  try { await del(`/products/${id}`); showToast(__('Product deleted')); await loadProducts(); }
  catch (e) { showToast(e.message, 'error'); }
};
