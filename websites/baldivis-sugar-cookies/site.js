(() => {
  const gate = document.getElementById('gate');
  const site = document.getElementById('site');
  const form = document.getElementById('gateForm');
  const input = document.getElementById('gatePassword');
  const error = document.getElementById('gateError');
  const unlock = () => {
    gate.classList.add('hidden');
    site.classList.remove('site-locked');
    document.body.style.overflow = '';
    setTimeout(() => gate.remove(), 400);
  };

  if (sessionStorage.getItem('sugarCookieAccess') === 'granted') {
    unlock();
  } else {
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 50);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (input.value === 'cookies') {
      sessionStorage.setItem('sugarCookieAccess', 'granted');
      unlock();
    } else {
      error.textContent = 'Incorrect password.';
      input.select();
    }
  });

  const toggle = document.getElementById('mobileToggle');
  const links = document.getElementById('navLinks');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  const dialog = document.getElementById('faqDialog');
  document.getElementById('faqLink').addEventListener('click', (event) => {
    event.preventDefault();
    dialog.showModal();
  });
  document.getElementById('faqClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
})();