document.getElementById('year').textContent = new Date().getFullYear();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

const modal = document.getElementById('proposal-modal');
const form = document.getElementById('proposal-form');
const formStatus = document.getElementById('form-status');
const success = document.getElementById('form-success');
const endpoint = 'https://uajdfknjuqhntopkbral.supabase.co/functions/v1/localup-lead';
let lastFocused = null;

function openProposal(trigger) {
  if (!modal) return;
  lastFocused = trigger || document.activeElement;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  form.hidden = false;
  success.hidden = true;
  formStatus.textContent = '';
  formStatus.classList.remove('error');

  if (form.elements.plano_interesse) {
    form.elements.plano_interesse.value = trigger?.dataset?.plan || 'Quero entender as opções';
  }

  window.setTimeout(() => form.elements.nome?.focus(), 20);
}

function closeProposal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
  lastFocused?.focus?.();
}

document.querySelectorAll('[data-open-proposal]').forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    openProposal(trigger);
  });
});

document.querySelectorAll('[data-close-proposal]').forEach((trigger) => {
  trigger.addEventListener('click', closeProposal);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal && !modal.hidden) closeProposal();
});

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || '',
  };
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submit = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const telefone = String(data.get('telefone') || '').trim();
  const email = String(data.get('email') || '').trim();

  formStatus.classList.remove('error');
  if (!telefone && !email) {
    formStatus.textContent = 'Informe um WhatsApp ou e-mail para retorno.';
    formStatus.classList.add('error');
    return;
  }

  const payload = Object.fromEntries(data.entries());
  Object.assign(payload, getUtmParams(), {
    pagina_origem: window.location.href,
  });

  submit.disabled = true;
  submit.textContent = 'Enviando...';
  formStatus.textContent = '';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || 'request_failed');

    form.reset();
    form.hidden = true;
    success.hidden = false;
  } catch (error) {
    console.error('Falha ao enviar lead LocalUp:', error);
    formStatus.textContent = 'Não foi possível enviar agora. Tente novamente ou escreva para contato@localup.net.br.';
    formStatus.classList.add('error');
  } finally {
    submit.disabled = false;
    submit.textContent = 'Enviar solicitação';
  }
});
