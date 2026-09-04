(() => {
  const root = document.querySelector('.studio');
  if (!root) return;
  root.classList.add('js-ready');
  const menu = root.querySelector('.s-menu');
  const nav = document.getElementById('navigation');
  const closeMenu = () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
  root.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); } });
  const search = document.getElementById('template-search');
  if (search) {
    const category = document.getElementById('template-category');
    const cards = [...document.querySelectorAll('#catalog .template-card')];
    const filter = () => {
      const query = search.value.trim().toLowerCase();
      let count = 0;
      cards.forEach(card => {
        const match = (category.value === 'All' || card.dataset.category === category.value) && (card.dataset.name + ' ' + card.dataset.category.toLowerCase()).includes(query);
        card.hidden = !match;
        if (match) count++;
      });
      document.getElementById('catalog-count').textContent = `${count} design${count === 1 ? '' : 's'}`;
      document.getElementById('no-results').hidden = count !== 0;
    };
    search.addEventListener('input', filter);
    category.addEventListener('change', filter);
  }
  const form = document.getElementById('brief-form');
  if (form) {
    const params = new URLSearchParams(location.search);
    document.getElementById('interest').value = (params.get('template') || params.get('service') || '').slice(0, 200);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const subject = `KHAI enquiry: ${data.get('interest') || 'New project'}`;
      const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nInterested in: ${data.get('interest')}\n\n${data.get('message')}`;
      location.href = `mailto:hello@khai.love?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      document.getElementById('brief-status').textContent = 'Your email app should open with a draft. If it does not, email hello@khai.love using the details above. This form has not sent a message.';
    });
  }
})();
