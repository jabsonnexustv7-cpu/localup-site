document.getElementById('year').textContent = new Date().getFullYear();

const mobileModalStyles = document.createElement('style');
mobileModalStyles.textContent = `
@media (max-width: 720px) {
  body.modal-open {
    overflow: hidden;
  }

  .proposal-modal {
    display: block;
    padding: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    background: rgba(7, 27, 45, .72);
  }

  .proposal-backdrop {
    position: fixed;
    inset: 0;
  }

  .proposal-dialog {
    width: 100%;
    min-height: 100dvh;
    max-height: none;
    overflow: visible;
    border-radius: 0;
    padding: 20px 16px calc(28px + env(safe-area-inset-bottom));
    border-top-width: 4px;
    box-shadow: none;
  }

  .proposal-close {
    position: sticky;
    top: 10px;
    z-index: 20;
    display: block;
    margin-left: auto;
    margin-bottom: -36px;
    background: #fff;
    box-shadow: 0 2px 10px rgba(11, 49, 88, .12);
  }

  .proposal-intro {
    padding-right: 48px;
    margin-bottom: 18px;
  }

  .proposal-intro h2 {
    font-size: 34px;
  }

  .proposal-intro p {
    font-size: 13px;
  }

  .form-grid {
    gap: 12px;
  }

  .form-grid input,
  .form-grid select,
  .form-grid textarea {
    padding: 11px 12px;
  }

  .form-grid textarea {
    min-height: 88px;
  }

  .form-privacy {
    margin: 12px 0;
  }

  .form-actions {
    position: sticky;
    bottom: 0;
    z-index: 15;
    display: grid;
    gap: 8px;
    margin: 14px -16px calc(-28px - env(safe-area-inset-bottom));
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    background: rgba(255, 255, 255, .98);
    border-top: 1px solid var(--line);
  }

  .form-actions .btn {
    width: 100%;
  }

  .form-status {
    width: 100%;
    text-align: center;
  }

  .form-success {
    padding-top: 64px;
  }
}
`;
document.head.appendChild(mobileModalStyles);

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
  modal.scrollTop = 0;
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
  modal.scrollTop = 0;
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
    modal.scrollTop = 0;
  } catch (error) {
    console.error('Falha ao enviar lead LocalUp:', error);
    formStatus.textContent = 'Não foi possível enviar agora. Tente novamente ou escreva para contato@localup.net.br.';
    formStatus.classList.add('error');
  } finally {
    submit.disabled = false;
    submit.textContent = 'Enviar solicitação';
  }
});
