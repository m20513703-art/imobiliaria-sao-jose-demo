(() => {
  const STORAGE_KEY = 'mm_saojose_imobiliaria_demo_v1';
  const page = document.body.dataset.page;
  const seeds = [
    {id:'sj-001',title:'Casa fictícia no Centro',kind:'Casa',deal:'Venda',price:'R$ 420.000',rooms:3,area:120,neighborhood:'Centro',city:'Divinolândia, SP',photo:'casa-ficticia.webp',active:true},
    {id:'sj-002',title:'Apartamento fictício',kind:'Apartamento',deal:'Aluguel',price:'R$ 1.600/mês',rooms:2,area:78,neighborhood:'Jardim',city:'Divinolândia, SP',photo:'apartamento-ficticio.webp',active:true},
    {id:'sj-003',title:'Casa fictícia com varanda',kind:'Casa',deal:'Venda',price:'R$ 510.000',rooms:3,area:145,neighborhood:'Vila Nova',city:'Divinolândia, SP',photo:'casa-ficticia.webp',active:true}
  ];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const load = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && Array.isArray(saved.properties) && Array.isArray(saved.leads)) return saved;
    } catch (_) {}
    const initial = {properties: seeds.map(x => ({...x})), leads: []};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  };
  let data = load();
  const save = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); render(); };
  const moneySafe = text => escapeHtml(text);
  const badge = active => `<span class="status-pill ${active?'':'paused'}">${active?'Ativo':'Pausado'}</span>`;

  function renderPublic() {
    const grid = document.getElementById('property-grid');
    if (!grid) return;
    const deal = document.getElementById('filter-deal')?.value || '';
    const kind = document.getElementById('filter-kind')?.value || '';
    const city = (document.getElementById('filter-city')?.value || '').trim().toLowerCase();
    const list = data.properties.filter(p => p.active && (!deal || p.deal === deal) && (!kind || p.kind === kind) && (!city || p.city.toLowerCase().includes(city.replace(', sp','')) || p.city.toLowerCase().includes(city)));
    grid.innerHTML = list.map(p => `
      <article class="property-card">
        <div class="property-image-wrap"><img class="property-image" src="${escapeHtml(p.photo)}" alt="Foto ilustrativa de ${escapeHtml(p.kind.toLowerCase())} fictício" loading="lazy"><span class="listing-tag">ANÚNCIO FICTÍCIO</span></div>
        <div class="property-body"><div class="property-meta">${escapeHtml(p.deal)} · ${escapeHtml(p.kind)}</div><h3>${escapeHtml(p.title)}</h3><p class="property-location">${escapeHtml(p.neighborhood || 'Divinolândia')} · ${escapeHtml(p.city)}</p>
          <div class="property-features"><span>⌂ ${escapeHtml(p.rooms)} quartos</span><span>▱ ${escapeHtml(p.area)} m²</span></div>
          <div class="property-bottom"><div class="property-price">${moneySafe(p.price)}${p.deal==='Aluguel'?'<small> / mês</small>':''}</div><button class="button button-orange property-contact" data-contact="${escapeHtml(p.id)}" type="button">Tenho interesse</button></div>
        </div>
      </article>`).join('');
    document.getElementById('empty-properties').hidden = list.length > 0;
  }

  function renderPanel() {
    if (page !== 'panel') return;
    const active = data.properties.filter(p => p.active);
    const sale = active.filter(p => p.deal === 'Venda').length;
    const rent = active.filter(p => p.deal === 'Aluguel').length;
    document.getElementById('stat-active').textContent = active.length;
    document.getElementById('stat-leads').textContent = data.leads.length;
    document.getElementById('stat-deals').textContent = `${sale} / ${rent}`;
    document.getElementById('sidebar-property-count').textContent = data.properties.length;
    document.getElementById('sidebar-lead-count').textContent = data.leads.length;
    const row = p => `<tr><td><strong>${escapeHtml(p.title)}</strong><br><small>${escapeHtml(p.neighborhood||'')}, ${escapeHtml(p.city)}</small></td><td>${escapeHtml(p.kind)}</td><td>${escapeHtml(p.deal)}</td><td><strong>${moneySafe(p.price)}</strong></td><td>${badge(p.active)}</td><td><div class="row-actions"><button data-edit="${escapeHtml(p.id)}">Editar</button><button data-toggle="${escapeHtml(p.id)}">${p.active?'Pausar':'Reativar'}</button><button data-delete="${escapeHtml(p.id)}">Excluir</button></div></td></tr>`;
    document.getElementById('properties-table').innerHTML = data.properties.length ? data.properties.map(row).join('') : '<tr><td colspan="6">Nenhum imóvel cadastrado nesta demonstração.</td></tr>';
    document.getElementById('overview-properties').innerHTML = data.properties.slice(0,4).map(p => `<tr><td><strong>${escapeHtml(p.title)}</strong></td><td>${escapeHtml(p.deal)}</td><td>${moneySafe(p.price)}</td><td>${badge(p.active)}</td></tr>`).join('') || '<tr><td colspan="4">Nenhum anúncio.</td></tr>';
    const leads = [...data.leads].reverse();
    document.getElementById('overview-leads').innerHTML = leads.length ? leads.slice(0,3).map(l => `<div class="lead-item"><strong>${escapeHtml(l.name)} · ${escapeHtml(l.status)}</strong><small>${escapeHtml(l.propertyTitle)} · ${escapeHtml(l.phone)}</small></div>`).join('') : '<div class="lead-empty">Os pedidos de informação demonstrativos aparecerão aqui.</div>';
    document.getElementById('leads-table').innerHTML = leads.length ? leads.map(l => `<article class="lead-card"><div><strong>${escapeHtml(l.name)}</strong><small>${escapeHtml(l.createdAt)}</small></div><div><strong>${escapeHtml(l.phone)}</strong><small>${escapeHtml(l.propertyTitle)}</small></div><p>${escapeHtml(l.message || 'Sem mensagem adicional.')}</p><label class="sr-only" for="lead-status-${escapeHtml(l.id)}">Status do contato</label><select id="lead-status-${escapeHtml(l.id)}" data-lead-status="${escapeHtml(l.id)}"><option ${l.status==='Novo'?'selected':''}>Novo</option><option ${l.status==='Em atendimento'?'selected':''}>Em atendimento</option><option ${l.status==='Concluído'?'selected':''}>Concluído</option></select></article>`).join('') : '<div class="lead-empty">Nenhum contato demonstrativo ainda. Envie um interesse pelo site público para testar.</div>';
  }

  function render() { if (page === 'public') renderPublic(); else renderPanel(); }

  if (page === 'public') {
    renderPublic();
    document.getElementById('search-form').addEventListener('submit', event => { event.preventDefault(); renderPublic(); document.getElementById('imoveis').scrollIntoView({behavior:'smooth'}); });
    document.getElementById('property-grid').addEventListener('click', event => {
      const button = event.target.closest('[data-contact]'); if (!button) return;
      const property = data.properties.find(p => p.id === button.dataset.contact); if (!property) return;
      document.getElementById('lead-property-id').value = property.id;
      document.getElementById('lead-property-name').textContent = `Interesse demonstrativo em: ${property.title}`;
      document.getElementById('lead-dialog').showModal();
    });
    document.getElementById('lead-form').addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget; const values = new FormData(form); const property = data.properties.find(p => p.id === document.getElementById('lead-property-id').value);
      data.leads.push({id:`lead-${Date.now()}`,name:String(values.get('name')).trim(),phone:String(values.get('phone')).trim(),message:String(values.get('message')||'').trim(),propertyId:property?.id||'',propertyTitle:property?.title||'Imóvel',status:'Novo',createdAt:new Date().toLocaleString('pt-BR')});
      save(); form.reset(); document.getElementById('lead-dialog').close();
      const existing=document.querySelector('.success-message'); if(existing) existing.remove();
      const notice=document.createElement('p'); notice.className='success-message'; notice.textContent='Interesse demonstrativo registrado neste navegador. Abra o painel demonstrativo para conferir.';
      document.querySelector('.properties-section').prepend(notice);
    });
  }

  if (page === 'panel') {
    const views = {overview:['Visão geral','Anúncios e interessados em um só lugar.'],properties:['Imóveis','Gerencie os anúncios fictícios da demonstração.'],leads:['Interessados','Acompanhe os contatos de demonstração recebidos pelo site.']};
    function openView(name) {
      document.querySelectorAll('.panel-view').forEach(el => { el.hidden = el.id !== `view-${name}`; });
      document.querySelectorAll('.sidebar-link').forEach(el => el.classList.toggle('active', el.dataset.view === name));
      document.getElementById('panel-title').textContent = views[name][0];
      document.getElementById('panel-subtitle').textContent = views[name][1];
      document.getElementById('add-property-button').hidden = name !== 'properties';
    }
    document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => openView(button.dataset.view)));
    document.querySelectorAll('[data-open-view]').forEach(button => button.addEventListener('click', () => openView(button.dataset.openView)));
    const dialog = document.getElementById('property-dialog'); const form = document.getElementById('property-form');
    function openPropertyForm(property=null) {
      form.reset(); form.elements.id.value = property?.id || '';
      document.getElementById('property-dialog-title').textContent = property ? 'Editar imóvel' : 'Novo imóvel';
      if (property) for (const key of ['title','kind','deal','price','rooms','area','neighborhood','photo']) if (form.elements[key]) form.elements[key].value = property[key] ?? '';
      dialog.showModal();
    }
    document.getElementById('add-property-button').addEventListener('click', () => openPropertyForm());
    document.getElementById('add-property-button-2').addEventListener('click', () => openPropertyForm());
    form.addEventListener('submit', event => {
      event.preventDefault(); const values = new FormData(form); const id = String(values.get('id')||'');
      const property = {id:id||`sj-${Date.now()}`,title:String(values.get('title')).trim(),kind:String(values.get('kind')),deal:String(values.get('deal')),price:String(values.get('price')).trim(),rooms:Number(values.get('rooms')||0),area:Number(values.get('area')||0),neighborhood:String(values.get('neighborhood')||'').trim(),city:'Divinolândia, SP',photo:String(values.get('photo')),active:true};
      const index = data.properties.findIndex(p => p.id === id); if(index >= 0) data.properties[index] = {...data.properties[index],...property}; else data.properties.unshift(property);
      save(); dialog.close(); openView('properties');
    });
    document.getElementById('properties-table').addEventListener('click', event => {
      const edit = event.target.closest('[data-edit]'); const toggle = event.target.closest('[data-toggle]'); const remove = event.target.closest('[data-delete]');
      if(edit){const p=data.properties.find(x=>x.id===edit.dataset.edit);if(p)openPropertyForm(p);}
      if(toggle){const p=data.properties.find(x=>x.id===toggle.dataset.toggle);if(p){p.active=!p.active;save();}}
      if(remove){const p=data.properties.find(x=>x.id===remove.dataset.delete);if(p&&confirm(`Excluir “${p.title}” desta demonstração?`)){data.properties=data.properties.filter(x=>x.id!==p.id);save();}}
    });
    document.getElementById('leads-table').addEventListener('change', event => {
      const select=event.target.closest('[data-lead-status]');if(!select)return;const lead=data.leads.find(x=>x.id===select.dataset.leadStatus);if(lead){lead.status=select.value;save();}
    });
    document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
    openView('overview'); renderPanel();
  }

  window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) { data=load(); render(); } });
})();
