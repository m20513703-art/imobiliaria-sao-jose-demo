(async () => {
  const CONFIG = {
    url: 'https://racuiutwxcxuncnedkmm.supabase.co',
    anonKey: 'sb_publishable_eIFD4ik-NFQyM_uyZqlz9Q_hR5OKNPq'
  };
  const TOKEN_KEY = 'sj_imobiliaria_admin_session_v1';
  const page = document.body.dataset.page;
  const seeds = [
    {id:'sj-001',title:'Casa fictícia no Centro',kind:'Casa',deal:'Venda',price:'R$ 420.000',rooms:3,area:120,neighborhood:'Centro',city:'Divinolândia, SP',photo:'casa-ficticia.webp',active:true},
    {id:'sj-002',title:'Apartamento fictício',kind:'Apartamento',deal:'Aluguel',price:'R$ 1.600/mês',rooms:2,area:78,neighborhood:'Jardim',city:'Divinolândia, SP',photo:'apartamento-ficticio.webp',active:true},
    {id:'sj-003',title:'Casa fictícia com varanda',kind:'Casa',deal:'Venda',price:'R$ 510.000',rooms:3,area:145,neighborhood:'Vila Nova',city:'Divinolândia, SP',photo:'casa-ficticia.webp',active:true}
  ];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const state = {properties:[],leads:[],token:null,session:null,refreshTimer:null};
  const dbFetch = async (table, {method='GET',token=null,body=null,query=''}={}) => {
    const response = await fetch(`${CONFIG.url}/rest/v1/${table}${query}`, {
      method, headers:{apikey:CONFIG.anonKey, Authorization:`Bearer ${token || CONFIG.anonKey}`, 'Content-Type':'application/json', Prefer:method==='POST'?'return=minimal':method==='PATCH'?'return=minimal':''},
      ...(body===null?{}:{body:JSON.stringify(body)})
    });
    if (!response.ok) { let message=`Falha de conexão (${response.status}).`; try {const err=await response.json();message=err.message||message;}catch(_){} throw new Error(message); }
    return response.status===204||response.status===201 ? null : response.json();
  };
  const authFetch = async (path, body, method='POST', token=null) => {
    const response=await fetch(`${CONFIG.url}/auth/v1/${path}`,{method,headers:{apikey:CONFIG.anonKey,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.msg||result.message||result.error_description||'Não foi possível entrar. Confira o e-mail e a senha.');
    return result;
  };
  const normalizeSession = session => ({...session,expires_at:Number(session.expires_at||Math.floor(Date.now()/1000)+Number(session.expires_in||3600))});
  async function refreshSessionIfNeeded(){
    if(!state.session?.refresh_token)return;
    if(Number(state.session.expires_at||0)*1000>Date.now()+120000)return;
    const refreshed=normalizeSession(await authFetch('token?grant_type=refresh_token',{refresh_token:state.session.refresh_token}));
    state.session=refreshed;state.token=refreshed.access_token;localStorage.setItem(TOKEN_KEY,JSON.stringify(refreshed));
  }
  const mapProperty = p => ({id:p.id,title:p.title,kind:p.kind,deal:p.deal,price:p.price,rooms:p.rooms,area:Number(p.area),neighborhood:p.neighborhood,city:p.city,photo:p.photo,active:p.active});
  const mapLead = l => ({id:l.id,name:l.name,phone:l.phone,message:l.message,propertyId:l.property_id,propertyTitle:l.property_title,status:l.status,createdAt:new Date(l.created_at).toLocaleString('pt-BR')});
  const showError = (elementId, message) => {const el=document.getElementById(elementId);if(el){el.hidden=false;el.textContent=message;}};
  const showSuccess = (elementId, message) => {const el=document.getElementById(elementId);if(el){el.hidden=false;el.textContent=message;}};
  const escapeMoney = value => escapeHtml(value);
  const badge = active => `<span class="status-pill ${active?'':'paused'}">${active?'Ativo':'Pausado'}</span>`;

  async function loadPublicProperties() {
    try { state.properties=(await dbFetch('properties',{query:'?select=*&active=eq.true&order=created_at.desc'})).map(mapProperty); renderPublic(); }
    catch(error) { state.properties=seeds.map(p=>({...p}));renderPublic();showError('connection-message','Exibindo apenas os imóveis de exemplo; a sincronização online está indisponível no momento.');console.error(error); }
  }
  async function loadPanelData() {
    if(!state.token)return;
    try {
      await refreshSessionIfNeeded();
      const [properties,leads]=await Promise.all([
        dbFetch('properties',{token:state.token,query:'?select=*&order=created_at.desc'}),
        dbFetch('leads',{token:state.token,query:'?select=*&order=created_at.desc'})
      ]);
      state.properties=properties.map(mapProperty);state.leads=leads.map(mapLead);renderPanel();
      const status=document.getElementById('connection-status');if(status)status.textContent='Banco online sincronizado';
    } catch(error) { showError('panel-error','Falha ao sincronizar o painel. Verifique sua sessão e tente novamente.');console.error(error); }
  }
  function renderPublic() {
    const grid=document.getElementById('property-grid');if(!grid)return;
    const deal=document.getElementById('filter-deal')?.value||'',kind=document.getElementById('filter-kind')?.value||'',city=(document.getElementById('filter-city')?.value||'').trim().toLowerCase();
    const list=state.properties.filter(p=>p.active&&(!deal||p.deal===deal)&&(!kind||p.kind===kind)&&(!city||p.city.toLowerCase().includes(city.replace(', sp',''))||p.city.toLowerCase().includes(city)));
    grid.innerHTML=list.map(p=>`<article class="property-card"><div class="property-image-wrap"><img class="property-image" src="${escapeHtml(p.photo)}" alt="Foto ilustrativa de ${escapeHtml(p.kind.toLowerCase())} fictício" loading="lazy"><span class="listing-tag">ANÚNCIO FICTÍCIO</span></div><div class="property-body"><div class="property-meta">${escapeHtml(p.deal)} · ${escapeHtml(p.kind)}</div><h3>${escapeHtml(p.title)}</h3><p class="property-location">${escapeHtml(p.neighborhood||'Divinolândia')} · ${escapeHtml(p.city)}</p><div class="property-features"><span>⌂ ${escapeHtml(p.rooms)} quartos</span><span>▱ ${escapeHtml(p.area)} m²</span></div><div class="property-bottom"><div class="property-price">${escapeMoney(p.price)}${p.deal==='Aluguel'?'<small> / mês</small>':''}</div><button class="button button-orange property-contact" data-contact="${escapeHtml(p.id)}" type="button">Tenho interesse</button></div></div></article>`).join('');
    document.getElementById('empty-properties').hidden=list.length>0;
  }
  function renderPanel() {
    if(page!=='panel')return;
    const active=state.properties.filter(p=>p.active),sale=active.filter(p=>p.deal==='Venda').length,rent=active.filter(p=>p.deal==='Aluguel').length;
    document.getElementById('stat-active').textContent=active.length;document.getElementById('stat-leads').textContent=state.leads.length;document.getElementById('stat-deals').textContent=`${sale} / ${rent}`;document.getElementById('sidebar-property-count').textContent=state.properties.length;document.getElementById('sidebar-lead-count').textContent=state.leads.length;
    const row=p=>`<tr><td><strong>${escapeHtml(p.title)}</strong><br><small>${escapeHtml(p.neighborhood||'')}, ${escapeHtml(p.city)}</small></td><td>${escapeHtml(p.kind)}</td><td>${escapeHtml(p.deal)}</td><td><strong>${escapeMoney(p.price)}</strong></td><td>${badge(p.active)}</td><td><div class="row-actions"><button data-edit="${escapeHtml(p.id)}">Editar</button><button data-toggle="${escapeHtml(p.id)}">${p.active?'Pausar':'Reativar'}</button><button data-delete="${escapeHtml(p.id)}">Excluir</button></div></td></tr>`;
    document.getElementById('properties-table').innerHTML=state.properties.length?state.properties.map(row).join(''):'<tr><td colspan="6">Nenhum imóvel cadastrado nesta demonstração.</td></tr>';
    document.getElementById('overview-properties').innerHTML=state.properties.slice(0,4).map(p=>`<tr><td><strong>${escapeHtml(p.title)}</strong></td><td>${escapeHtml(p.deal)}</td><td>${escapeMoney(p.price)}</td><td>${badge(p.active)}</td></tr>`).join('')||'<tr><td colspan="4">Nenhum anúncio.</td></tr>';
    const leads=[...state.leads];document.getElementById('overview-leads').innerHTML=leads.length?leads.slice(0,3).map(l=>`<div class="lead-item"><strong>${escapeHtml(l.name)} · ${escapeHtml(l.status)}</strong><small>${escapeHtml(l.propertyTitle)} · ${escapeHtml(l.phone)}</small></div>`).join(''):'<div class="lead-empty">Os pedidos de informação demonstrativos aparecerão aqui.</div>';
    document.getElementById('leads-table').innerHTML=leads.length?leads.map(l=>`<article class="lead-card"><div><strong>${escapeHtml(l.name)}</strong><small>${escapeHtml(l.createdAt)}</small></div><div><strong>${escapeHtml(l.phone)}</strong><small>${escapeHtml(l.propertyTitle)}</small></div><p>${escapeHtml(l.message||'Sem mensagem adicional.')}</p><label class="sr-only" for="lead-status-${escapeHtml(l.id)}">Status do contato</label><select id="lead-status-${escapeHtml(l.id)}" data-lead-status="${escapeHtml(l.id)}"><option ${l.status==='Novo'?'selected':''}>Novo</option><option ${l.status==='Em atendimento'?'selected':''}>Em atendimento</option><option ${l.status==='Concluído'?'selected':''}>Concluído</option></select></article>`).join(''):'<div class="lead-empty">Nenhum contato demonstrativo ainda. Envie um interesse pelo site público para testar.</div>';
  }
  function panelMessage(error){showError('panel-error',error.message||'Não foi possível salvar a alteração.');}

  if(page==='public'){
    loadPublicProperties();
    document.getElementById('search-form').addEventListener('submit',event=>{event.preventDefault();renderPublic();document.getElementById('imoveis').scrollIntoView({behavior:'smooth'});});
    document.getElementById('property-grid').addEventListener('click',event=>{const button=event.target.closest('[data-contact]');if(!button)return;const p=state.properties.find(x=>x.id===button.dataset.contact);if(!p)return;document.getElementById('lead-property-id').value=p.id;document.getElementById('lead-property-name').textContent=`Interesse demonstrativo em: ${p.title}`;document.getElementById('lead-dialog').showModal();});
    document.getElementById('lead-form').addEventListener('submit',async event=>{
      event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type=submit]'),values=new FormData(form),p=state.properties.find(x=>x.id===document.getElementById('lead-property-id').value);button.disabled=true;showError('lead-error','');
      try {await dbFetch('leads',{method:'POST',body:{property_id:p?.id||null,property_title:p?.title||'Imóvel',name:String(values.get('name')).trim(),phone:String(values.get('phone')).trim(),message:String(values.get('message')||'').trim(),status:'Novo'}});form.reset();document.getElementById('lead-dialog').close();showSuccess('lead-success','Interesse demonstrativo registrado com segurança no banco online.');}
      catch(error){showError('lead-error','Não foi possível enviar agora. Tente novamente mais tarde.');console.error(error);}finally{button.disabled=false;}
    });
    document.querySelectorAll('[data-demo-social]').forEach(button=>button.addEventListener('click',()=>{const channel=button.dataset.demoSocial,messages={instagram:'@imobiliariasaojose.demo é um perfil fictício; nenhum Instagram real é aberto.',whatsapp:'Canal de WhatsApp apenas demonstrativo; não existe número ativo nem mensagem enviada.',email:'contato@imobiliariasaojose.invalid é um endereço fictício e não recebe e-mails.'};const notice=document.getElementById('demo-social-message');notice.textContent=messages[channel]||'Canal fictício de demonstração.';notice.hidden=false;}));
  }

  if(page==='panel'){
    const gate=document.getElementById('login-gate'),layout=document.querySelector('.panel-layout'),loginForm=document.getElementById('login-form'),passwordSetupForm=document.getElementById('password-setup-form');
    const views={overview:['Visão geral','Anúncios e interessados em um só lugar.'],properties:['Imóveis','Gerencie os anúncios fictícios da demonstração.'],leads:['Interessados','Acompanhe os contatos demonstrativos recebidos pelo site.']};
    function showPanel(){gate.hidden=true;layout.hidden=false;loginForm.hidden=true;passwordSetupForm.hidden=true;document.getElementById('header-login-status').textContent='Sessão protegida';document.getElementById('logout-button').hidden=false;loadPanelData();clearInterval(state.refreshTimer);state.refreshTimer=setInterval(loadPanelData,30000);}
    function showLogin(){layout.hidden=true;gate.hidden=false;loginForm.hidden=false;passwordSetupForm.hidden=true;document.getElementById('logout-button').hidden=true;}
    function showPasswordSetup(){layout.hidden=true;gate.hidden=false;loginForm.hidden=true;passwordSetupForm.hidden=false;document.getElementById('password-setup-error').hidden=true;}
    async function establishSession(rawSession){const session=normalizeSession(rawSession);state.session=session;state.token=session.access_token;localStorage.setItem(TOKEN_KEY,JSON.stringify(session));const gateError=document.getElementById('login-error');if(gateError)gateError.hidden=true;showPanel();}
    function openView(name){document.querySelectorAll('.panel-view').forEach(el=>{el.hidden=el.id!==`view-${name}`;});document.querySelectorAll('.sidebar-link').forEach(el=>el.classList.toggle('active',el.dataset.view===name));document.getElementById('panel-title').textContent=views[name][0];document.getElementById('panel-subtitle').textContent=views[name][1];document.getElementById('add-property-button').hidden=name!=='properties';}
    document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>openView(button.dataset.view)));document.querySelectorAll('[data-open-view]').forEach(button=>button.addEventListener('click',()=>openView(button.dataset.openView)));
    loginForm.addEventListener('submit',async event=>{event.preventDefault();const submit=loginForm.querySelector('[type=submit]');submit.disabled=true;const error=document.getElementById('login-error');error.hidden=true;try{const values=new FormData(loginForm);const s=await authFetch('token?grant_type=password',{email:String(values.get('email')).trim(),password:String(values.get('password'))});await establishSession(s);loginForm.reset();}catch(err){error.textContent='Não foi possível entrar. Confira suas credenciais ou peça ao administrador que habilite seu acesso.';error.hidden=false;}finally{submit.disabled=false;}});
    passwordSetupForm.addEventListener('submit',async event=>{event.preventDefault();const submit=passwordSetupForm.querySelector('[type=submit]'),error=document.getElementById('password-setup-error'),values=new FormData(passwordSetupForm),password=String(values.get('new_password')),confirmation=String(values.get('confirm_password'));if(password.length<12){error.textContent='Use uma senha com pelo menos 12 caracteres.';error.hidden=false;return;}if(password!==confirmation){error.textContent='As senhas não são iguais.';error.hidden=false;return;}submit.disabled=true;error.hidden=true;try{await authFetch('user',{password},'PUT',state.token);passwordSetupForm.reset();history.replaceState(null,'',location.pathname+location.search);showPanel();}catch(err){error.textContent='Não foi possível salvar a senha. Reabra o convite e tente novamente.';error.hidden=false;}finally{submit.disabled=false;}});
    document.getElementById('logout-button').addEventListener('click',async()=>{try{if(state.token)await authFetch('logout',null,'POST',state.token);}catch(_){}state.token=null;state.session=null;localStorage.removeItem(TOKEN_KEY);clearInterval(state.refreshTimer);showLogin();document.getElementById('header-login-status').textContent='Acesso protegido';});
    document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
    const dialog=document.getElementById('property-dialog'),form=document.getElementById('property-form');
    function openPropertyForm(p=null){form.reset();form.elements.id.value=p?.id||'';document.getElementById('property-dialog-title').textContent=p?'Editar imóvel':'Novo imóvel';if(p)for(const key of ['title','kind','deal','price','rooms','area','neighborhood','photo'])if(form.elements[key])form.elements[key].value=p[key]??'';dialog.showModal();}
    document.getElementById('add-property-button').addEventListener('click',()=>openPropertyForm());document.getElementById('add-property-button-2').addEventListener('click',()=>openPropertyForm());
    form.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('[type=submit]'),v=new FormData(form),id=String(v.get('id')||'');button.disabled=true;try{const item={id:id||`sj-${crypto.randomUUID()}`,title:String(v.get('title')).trim(),kind:String(v.get('kind')),deal:String(v.get('deal')),price:String(v.get('price')).trim(),rooms:Number(v.get('rooms')||0),area:Number(v.get('area')||0),neighborhood:String(v.get('neighborhood')||'').trim(),city:'Divinolândia, SP',photo:String(v.get('photo')),active:id?(state.properties.find(p=>p.id===id)?.active??true):true};await dbFetch(`properties${id?'?id=eq.'+encodeURIComponent(id):''}`,{method:id?'PATCH':'POST',token:state.token,body:id?Object.fromEntries(Object.entries(item).filter(([k])=>k!=='id')):item});dialog.close();await loadPanelData();}catch(error){panelMessage(error);}finally{button.disabled=false;}});
    document.getElementById('properties-table').addEventListener('click',async event=>{const edit=event.target.closest('[data-edit]'),toggle=event.target.closest('[data-toggle]'),remove=event.target.closest('[data-delete]');if(edit){const p=state.properties.find(x=>x.id===edit.dataset.edit);if(p)openPropertyForm(p);}try{if(toggle){const p=state.properties.find(x=>x.id===toggle.dataset.toggle);await dbFetch(`properties?id=eq.${encodeURIComponent(p.id)}`,{method:'PATCH',token:state.token,body:{active:!p.active}});await loadPanelData();}if(remove){const p=state.properties.find(x=>x.id===remove.dataset.delete);if(p&&confirm(`Excluir “${p.title}” desta demonstração?`)){await dbFetch(`properties?id=eq.${encodeURIComponent(p.id)}`,{method:'DELETE',token:state.token});await loadPanelData();}}}catch(error){panelMessage(error);}});
    document.getElementById('leads-table').addEventListener('change',async event=>{const select=event.target.closest('[data-lead-status]');if(!select)return;try{await dbFetch(`leads?id=eq.${encodeURIComponent(select.dataset.leadStatus)}`,{method:'PATCH',token:state.token,body:{status:select.value}});await loadPanelData();}catch(error){panelMessage(error);}});
    window.addEventListener('focus',()=>{if(state.token)loadPanelData();});openView('overview');
    const authHash=new URLSearchParams(location.hash.replace(/^#/, ''));
    const inviteAccess=authHash.get('access_token');
    if(inviteAccess){
      const session=normalizeSession({access_token:inviteAccess,refresh_token:authHash.get('refresh_token'),expires_at:authHash.get('expires_at'),expires_in:authHash.get('expires_in')||3600});
      state.session=session;state.token=session.access_token;localStorage.setItem(TOKEN_KEY,JSON.stringify(session));
      const authType=authHash.get('type');history.replaceState(null,'',location.pathname+location.search);
      if(authType==='invite'||authType==='recovery')showPasswordSetup();else showPanel();
    }else{
      try{const raw=localStorage.getItem(TOKEN_KEY);if(raw){const session=normalizeSession(JSON.parse(raw));if(session.access_token){state.session=session;state.token=session.access_token;await refreshSessionIfNeeded();const user=await authFetch('user',null,'GET',state.token);if(user?.id)showPanel();else showLogin();}else showLogin();}else showLogin();}
      catch(_){state.token=null;state.session=null;localStorage.removeItem(TOKEN_KEY);showLogin();}
    }
  }
})();
