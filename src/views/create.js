const form = document.getElementById('linkForm');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');
const smartUrlA = document.getElementById('smartUrl');
const qrImg = document.getElementById('qrImg');
const copyBtn = document.getElementById('copyBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = 'Gerando...';
  resultEl.classList.add('hidden');

  const payload = {
    iosUrl: document.getElementById('iosUrl').value.trim(),
    androidUrl: document.getElementById('androidUrl').value.trim(),
    slug: document.getElementById('slug').value.trim() || undefined,
    desktopUrl: document.getElementById('desktopUrl').value.trim() || undefined
  };

  try {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    const raw = await res.text(); // evita "Unexpected end of JSON input"
    let data;
    try { data = JSON.parse(raw); } catch { data = { error: raw }; }

    if (!res.ok) {
      statusEl.textContent = data?.error || `Erro ${res.status}`;
      return;
    }

    statusEl.textContent = '';
    smartUrlA.href = data.smartUrl;
    smartUrlA.textContent = data.smartUrl;
    qrImg.src = `/qr/${data.slug}.png?t=${Date.now()}`;
    resultEl.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Falha de rede';
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(smartUrlA.href);
  } catch {}
  const old = copyBtn.textContent;
  copyBtn.textContent = 'Copiado!';
  setTimeout(() => copyBtn.textContent = old, 1200);
});
