// scripts.js

// URL da sua API Flask
const API_BASE = 'http://127.0.0.1:5002';

// Lista de itens na “cesta”
let items = [];

// ---------- Helpers de UI ----------

function showError(msg) {
  const box = document.getElementById('errorBox');
  if (!box) return;
  box.textContent = msg || '';
  box.style.display = msg ? 'block' : 'none';
}

function showTotal(msg) {
  const box = document.getElementById('totalBox');
  if (!box) return;
  box.textContent = msg || '';
}

// ---------- Carregar municípios da API ----------

async function loadMunicipalities() {
  const select = document.getElementById('treeMunicipality');
  if (!select) return;

  try {
    const resp = await fetch(`${API_BASE}/api/municipios`);
    const data = await resp.json();
    console.log('Municipios recebidos:', data);

    if (Array.isArray(data.municipios)) {
      data.municipios.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        select.appendChild(opt);
      });
    } else {
      console.warn('Resposta /api/municipios sem lista "municipios".');
      showError('Erro ao carregar municípios (formato inesperado).');
    }
  } catch (e) {
    console.error('Erro ao carregar municípios:', e);
    showError('Erro ao carregar municípios da API.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMunicipalities();
});

// ---------- Tabela ----------

function renderTable(itemsToRender, withCompensation = false) {
  const table = document.getElementById('myTable');
  if (!table) return;

  // limpa todas as linhas menos o header
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  itemsToRender.forEach((item, index) => {
    const row = table.insertRow();

    const nameCell = row.insertCell(0);
    const quantityCell = row.insertCell(1);
    const groupCell = row.insertCell(2);
    const municipalityCell = row.insertCell(3);
    const compPerTreeCell = row.insertCell(4);
    const compTotalCell = row.insertCell(5);
    const actionCell = row.insertCell(6);

    nameCell.textContent = item.name;
    quantityCell.textContent = item.quantidade;
    groupCell.textContent = item.group || '';
    municipalityCell.textContent = item.municipality || '';

    if (withCompensation) {
      compPerTreeCell.textContent =
        item.compensacao_por_arvore ?? '';
      compTotalCell.textContent =
        item.compensacao_total_item ?? '';
    } else {
      compPerTreeCell.textContent = '';
      compTotalCell.textContent = '';
    }

    const span = document.createElement('span');
    span.className = 'close';
    span.textContent = '\u00D7';
    span.onclick = () => {
      items.splice(index, 1);
      renderTable(items, false);
      showTotal('');
      showError('');
    };
    actionCell.appendChild(span);
  });
}

// ---------- Adicionar item ----------

function addItem() {
  const name = document.getElementById('treeName').value.trim();
  const quantityStr = document.getElementById('treeQuantity').value;
  const group = document.getElementById('treeGroup').value;
  const municipality = document.getElementById('treeMunicipality').value;

  showError('');
  showTotal('');

  if (!name) {
    alert('Informe o nome da espécie.');
    return;
  }

  if (!quantityStr || isNaN(quantityStr) || Number(quantityStr) <= 0) {
    alert('Quantidade precisa ser um número maior que zero.');
    return;
  }

  if (!municipality) {
    alert('Selecione o município.');
    return;
  }

  const quantidade = Number(quantityStr);

  // 👇 ESSENCIAL: usar municipality, não origin
  const item = { name, quantidade, group, municipality };

  items.push(item);
  renderTable(items, false);

  document.getElementById('treeName').value = '';
  document.getElementById('treeQuantity').value = '';
  document.getElementById('treeMunicipality').value = '';
  document.getElementById('treeName').focus();
}

// ---------- Calcular total chamando API ----------

async function calculateTotal() {
  showError('');
  showTotal('');

  if (!items.length) {
    showError('Adicione pelo menos uma árvore antes de calcular.');
    return;
  }

  console.log('Items que vou enviar para API:', items);

  try {
    const response = await fetch(`${API_BASE}/api/compensacao/lote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items })
    });

    const text = await response.text();
    console.log('Resposta bruta da API:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      showError('Resposta da API não é JSON. Veja o console.');
      return;
    }

    if (!response.ok) {
      showError(data.erro || `Erro HTTP ${response.status}`);
      return;
    }

    if (Array.isArray(data.itens_processados)) {
      renderTable(data.itens_processados, true);
    }

    showTotal(`Compensação total do lote: ${data.total_compensacao_geral}`);

    if (Array.isArray(data.itens_sem_regra) && data.itens_sem_regra.length > 0) {
      const detalhes = data.itens_sem_regra
        .map((x) => `• Item #${x.index + 1}: ${x.motivo}`)
        .join('  ');
      showError(`Alguns itens não foram compensados: ${detalhes}`);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    showError('Erro de conexão com a API.');
  }
}

// deixa as funções globais para os botões onclick do HTML
window.addItem = addItem;
window.calculateTotal = calculateTotal;
