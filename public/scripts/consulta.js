
const API_KEY = "hjoj92wz71s3gnzwdtyjj0op19u4p5";

// Cabeçalhos padrão com API Key.
// 👉 Se sua API usa Bearer, descomente a linha de Authorization e remova o x-api-key.
const DEFAULT_HEADERS = {
  "x-api-key": API_KEY,
  // "Authorization": `Bearer ${API_KEY}`,
  // "Authorization": `Api-Key ${API_KEY}`,
};

/** Helper para padronizar fetch com headers e parse de JSON */
async function apiFetch(url, options = {}) {
  const finalOptions = {
    // método/headers/body passados chamador têm prioridade, mas garantimos o x-api-key
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...(options.headers || {}),
    },
  };
  const res = await fetch(url, finalOptions);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Erro HTTP ${res.status} em ${url}${text ? `: ${text}` : ""}`);
  }
  // tenta JSON, se falhar retorna texto
  try { return await res.json(); } catch { return await res.text(); }
}

document.addEventListener('DOMContentLoaded', carregarConsultas);

async function carregarConsultas() {
  const consultas = await apiFetch('/api/consulta');
  const consultasList = document.getElementById('consultasList');
  consultasList.innerHTML = '';
  consultas.result.forEach(consulta => {
    const li = document.createElement('li');
    li.textContent = consulta.chave;
    li.onclick = () => carregarConsultaDetalhes(consulta.chave);
    consultasList.appendChild(li);
  });
}

async function carregarConsultaDetalhes(chave) {
  const resp = await apiFetch(`/api/consulta/${chave}`);
  let consulta = resp.result;

  // Verificação para garantir que parametros é um array
  if (typeof consulta.parametros === 'string') {
    try {
      consulta.parametros = JSON.parse(consulta.parametros);
    } catch (e) {
      console.error('Erro ao analisar os parâmetros:', e);
      consulta.parametros = [];
    }
  }
  if (!Array.isArray(consulta.parametros)) consulta.parametros = [];

  editarConsulta(consulta);
}

function adicionarParametro() {
  const parametrosDiv = document.getElementById('parametros');
  const novoParametroDiv = document.createElement('div');
  novoParametroDiv.className = 'parametro';
  novoParametroDiv.innerHTML = `
    <input type="text" placeholder="Variável" class="parametro-variavel">
    <input type="text" placeholder="Valor Default" class="parametro-valor">
    <button type="button" onclick="removerParametro(this)">Remover</button>
  `;
  parametrosDiv.appendChild(novoParametroDiv);
}

function removerParametro(button) {
  button.parentElement.remove();
}

async function executarRota() {
  const chave = document.getElementById('chave').value;
  const consultas = await apiFetch('/api/' + chave);
  const transformado = syntaxHighlight(JSON.stringify(consultas, null, 2));
  const consultasList = document.getElementById('resultadoJson');
  consultasList.innerHTML = transformado;
}

function novaConsulta() {
  document.getElementById('chave').value = '';
  document.getElementById('chave').disabled = false;
  document.getElementById('consultaSQL').value = '';
  document.getElementById('codigoJS').value = 'result = data';
  document.getElementById('baseDeDados').selectedIndex = -1;
  document.getElementById('resultadoJson').innerHTML = '';
  document.getElementById('excluirBtn').style.display = 'none';
  document.getElementById('executarBtn').style.display = 'none';
  document.getElementById('parametros').innerHTML = '';
}

async function editarConsulta(consulta) {
  document.getElementById('chave').value = consulta.chave;
  document.getElementById('chave').disabled = true;
  document.getElementById('consultaSQL').value = consulta.consulta;
  document.getElementById('codigoJS').value = consulta.tratamento;
  const baseDeDadosElement = document.getElementById('baseDeDados');
  Array.from(baseDeDadosElement.options).forEach(option => {
    option.selected = consulta.baseDeDados.includes(option.value);
  });

  const parametrosDiv = document.getElementById('parametros');
  parametrosDiv.innerHTML = '';

  if (Array.isArray(consulta.parametros)) {
    consulta.parametros.forEach(param => {
      const novoParametroDiv = document.createElement('div');
      novoParametroDiv.className = 'parametro';
      novoParametroDiv.innerHTML = `
        <input type="text" placeholder="Variável" class="parametro-variavel" value="${param.variavel}">
        <input type="text" placeholder="Valor Default" class="parametro-valor" value="${param.valor}">
        <button type="button" onclick="removerParametro(this)">Remover</button>
      `;
      parametrosDiv.appendChild(novoParametroDiv);
    });
  }

  document.getElementById('excluirBtn').style.display = 'inline';
  document.getElementById('executarBtn').style.display = 'inline';
}

async function salvarConsulta(event) {
  event.preventDefault();
  const chave = document.getElementById('chave').value;
  const consulta = document.getElementById('consultaSQL').value;
  const tratamento = document.getElementById('codigoJS').value;
  const baseDeDados = Array.from(document.getElementById('baseDeDados').selectedOptions).map(option => option.value);

  const parametrosDivs = document.getElementsByClassName('parametro');
  const parametros = Array.from(parametrosDivs).map(div => ({
    variavel: div.querySelector('.parametro-variavel').value,
    valor: div.querySelector('.parametro-valor').value
  }));

  if (!/^[A-Za-z0-9]+$/.test(chave)) {
    alert('A chave deve conter apenas letras e números.');
    return;
  }
  if (baseDeDados.length === 0) {
    alert('Selecione pelo menos uma base de dados.');
    return;
  }

  const dados = { chave, consulta, tratamento, baseDeDados, parametros };

  try {
    if (document.getElementById('chave').disabled) {
      await apiFetch(`/api/consulta/${chave}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
    } else {
      await apiFetch('/api/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
    }
    carregarConsultas();
    editarConsulta({ chave, consulta, tratamento, baseDeDados, parametros });
    executarRota();
  } catch (e) {
    alert('Erro ao salvar consulta: ' + e.message);
  }
}

async function deletarConsulta() {
  const chave = document.getElementById('chave').value;
  if (!chave) return alert('Selecione uma consulta para excluir');
  try {
    await apiFetch(`/api/consulta/${chave}`, { method: 'DELETE' });
    carregarConsultas();
    novaConsulta();
  } catch (e) {
    alert('Erro ao excluir consulta: ' + e.message);
  }
}

function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:\s*)?|\b(true|false|null)\b|\b\d+\b)/g, function (match) {
    var cls = 'json-value';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) { cls = 'json-key'; }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}
