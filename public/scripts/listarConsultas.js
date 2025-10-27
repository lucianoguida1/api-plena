
const API_KEY = "hjoj92wz71s3gnzwdtyjj0op19u4p5";

// Headers padrão com a API Key.
// 👉 Se for Bearer, troque por: { Authorization: `Bearer ${API_KEY}` }
const DEFAULT_HEADERS = {
  "x-api-key": API_KEY,
};

/** Helper fetch com headers + tratamento de erro + JSON automático */
async function apiFetch(url, options = {}) {
  const finalOptions = {
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
  try { return await res.json(); } catch { return await res.text(); }
}

document.addEventListener('DOMContentLoaded', carregarConsultas);

async function carregarConsultas() {
  try {
    const consultas = await apiFetch('/api/consulta');
    const consultasList = document.getElementById('consultasList');
    consultasList.innerHTML = '';
    (consultas?.result ?? []).forEach(consulta => {
      const li = document.createElement('li');
      li.textContent = consulta.chave;
      li.onclick = () => exibirConsulta(consulta.chave);
      consultasList.appendChild(li);
    });
  } catch (e) {
    console.error(e);
    alert('Falha ao carregar consultas: ' + e.message);
  }
}

async function exibirConsulta(chave) {
  try {
    // consulta selecionada
    const resp = await apiFetch(`/api/consulta/${chave}`);
    let consulta = resp.result;

    document.getElementById('consultaTitulo').textContent = `Chave: ${consulta.chave}`;
    document.getElementById('consultaLink').href = `/api/${consulta.chave}`;
    document.getElementById('consultaLink').innerHTML = `/api/${consulta.chave}`;

    const parametrosList = document.getElementById('parametrosList');
    parametrosList.innerHTML = '';

    // normaliza parâmetros
    if (typeof consulta.parametros === 'string') {
      try {
        consulta.parametros = JSON.parse(consulta.parametros);
      } catch (e) {
        console.error('Erro ao analisar os parâmetros:', e);
        consulta.parametros = [];
      }
    }
    if (!Array.isArray(consulta.parametros)) consulta.parametros = [];

    consulta.parametros.forEach(param => {
      const paramDiv = document.createElement('div');
      paramDiv.className = 'parametro';
      paramDiv.innerHTML = `<strong>Variável:</strong> ${param.variavel}, <strong>Valor Default:</strong> ${param.valor}`;
      parametrosList.appendChild(paramDiv);
    });

    // resultado da rota pública da chave
    const resultadoJson = await apiFetch(`/api/${chave}`);
    const resultadoDiv = document.getElementById('resultadoJson');
    resultadoDiv.innerHTML = syntaxHighlight(JSON.stringify(resultadoJson, null, 2));
  } catch (e) {
    console.error(e);
    alert('Falha ao exibir consulta: ' + e.message);
  }
}

function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:\s*)?|\b(true|false|null)\b|\b\d+\b)/g, function (match) {
    var cls = 'json-value';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}