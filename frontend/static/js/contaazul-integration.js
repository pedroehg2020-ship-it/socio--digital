(function () {
  const API = window.location.origin + '/api';
  const token = () => localStorage.getItem('sd_token');
  const headers = () => token() ? { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' } : {};

  async function getStatus() {
    const r = await fetch(API + '/integrations/contaazul/status', { headers: headers() });
    if (!r.ok) throw new Error('status');
    return r.json();
  }
  async function connect() {
    const r = await fetch(API + '/integrations/contaazul/connect', { headers: headers() });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Erro ao iniciar conexão');
    window.location.href = data.authorize_url;
  }
  async function disconnect() {
    const r = await fetch(API + '/integrations/contaazul/disconnect', { method: 'POST', headers: headers() });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.detail || 'Erro ao desconectar');
    render(true);
  }
  function cardMarkup(s) {
    const label = s.connected ? 'Conectado' : (s.configured ? 'Não conectado' : 'Integração ainda não configurada no servidor');
    const btn = !s.configured ? '' : s.connected
      ? '<button id="sd-ca-disconnect" style="border:1px solid #cbd5e1;border-radius:8px;padding:8px 12px;background:white;cursor:pointer">Desconectar</button>'
      : '<button id="sd-ca-connect" style="border:0;border-radius:8px;padding:8px 12px;background:#2563eb;color:white;cursor:pointer">Conectar Conta Azul</button>';
    return '<div id="sd-contaazul-card" class="sd-card" style="padding:18px;margin-top:18px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:16px">' +
      '<div><div style="font-weight:600">Integrações</div><div style="margin-top:10px;font-size:14px"><strong>Conta Azul</strong><div style="font-size:12px;color:#64748b;margin-top:3px">' + label + '</div></div></div>' + btn + '</div></div>';
  }
  async function render(force) {
    if (!location.pathname.includes('/app/configuracoes')) return;
    if (!token()) return;
    const old = document.getElementById('sd-contaazul-card');
    if (old && !force) return;
    try {
      const s = await getStatus();
      const root = document.querySelector('[data-testid="settings-page"]') || document.querySelector('main') || document.body;
      if (old) old.remove();
      root.insertAdjacentHTML('beforeend', cardMarkup(s));
      const c = document.getElementById('sd-ca-connect');
      const d = document.getElementById('sd-ca-disconnect');
      if (c) c.onclick = async () => { c.disabled = true; c.textContent = 'Redirecionando...'; try { await connect(); } catch(e) { alert(e.message); c.disabled=false; c.textContent='Conectar Conta Azul'; } };
      if (d) d.onclick = async () => { try { await disconnect(); } catch(e) { alert(e.message); } };
    } catch (_) {}
  }
  const q = new URLSearchParams(location.search).get('contaazul');
  if (q === 'connected') setTimeout(() => alert('Conta Azul conectada com sucesso.'), 400);
  if (q === 'error') setTimeout(() => alert('Não foi possível conectar com a Conta Azul.'), 400);
  setInterval(render, 800);
  window.addEventListener('popstate', () => setTimeout(render, 100));
  setTimeout(render, 300);
})();
