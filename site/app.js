/* Accessible vanilla JS app: no build step, no paid API, no tracking. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = {items:[], filtered:[], view:'all', chip:'all', sort:'popular', q:'', period:null, shown:9, saved:new Set(), generatedAt:null, demo:false, lastActive:null};
  const categoryMap = {'ذكاء اصطناعي':'ذكاء اصطناعي','برمجة':'برمجة','تقنيات':'تقنيات','أبحاث':'أبحاث','فرص':'فرص','السعودية':'السعودية','مفتوح المصدر':'مفتوح المصدر'};
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = (u) => {try{const x=new URL(u, location.href);return x.protocol==='https:'||x.origin===location.origin&&x.protocol==='http:'? x.href:''}catch{return ''}};
  const arNumber = (n) => new Intl.NumberFormat('en-US').format(n||0);
  const compact = (n) => new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(n||0);
  const dateTime = (iso, withTime=false) => {if(!iso)return 'تاريخ غير متاح';try{return new Intl.DateTimeFormat('ar-SA',{timeZone:'Asia/Riyadh',year:'numeric',month:'short',day:'numeric', ...(withTime?{hour:'2-digit',minute:'2-digit',hour12:true}:{})}).format(new Date(iso))}catch{return 'تاريخ غير محدد'}};
  const dayKey = (iso) => {if(!iso)return '';try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso))}catch{return ''}};
  const hourKSA = (iso) => {if(!iso)return -1;try{return +new Intl.DateTimeFormat('en-US',{hour:'numeric',hourCycle:'h23',timeZone:'Asia/Riyadh'}).format(new Date(iso))}catch{return -1}};
  const detectSlot = iso => Math.floor(hourKSA(iso)/6);
  const label = item => item.kind==='project'?'مفتوح المصدر': item.kind==='idea'?'فكرة مشروع':item.category||'تقنيات';
  const visualClass = item => item.kind==='project'?'visual-agent':item.kind==='idea'?'visual-idea':'visual-news';
  const glyph = item => item.kind==='project'?'⌘':item.kind==='idea'?'✦':item.category==='أبحاث'?'⌁':'✳';
  const trimmed=(text,size=160)=>String(text||'').length>size?String(text).slice(0,size).trim()+'…':String(text||'');
  const getMetric = item=>item.kind==='project'?`★ ${compact(item.stars)} نجمة`:item.kind==='idea'?'10 تحسينات + 10 أفكار':item.points?`▲ ${compact(item.points)} · ${compact(item.comments)} تعليق`:'مؤشر تقديري للشيوع';

  function loadSaved(){try{state.saved=new Set(JSON.parse(localStorage.getItem('nabdh-saved')||'[]'))}catch{state.saved=new Set()}}
  function persistSaved(){try{localStorage.setItem('nabdh-saved',JSON.stringify([...state.saved].slice(0,700)))}catch{}}
  function toast(text){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),2700)}

  function makeIdeas(projects){
    const ideas=[];
    for(const project of projects.slice(0,15)){
      const suggestions=window.TechPulseIdeas.forItem(project).spinoffs;
      for(let i=0;i<suggestions.length;i++) ideas.push({
        id:`idea:${project.id}:${i}`,kind:'idea',title:suggestions[i],
        description:`فكرة مشروع مقترحة مستوحاة من «${project.title}» في مجال ${window.TechPulseIdeas.domainNames[project.ideaDomain] || 'البرمجيات'}. افتح التفاصيل للحصول على 10 تطويرات و10 أفكار متفرعة.` ,
        impact:'مقترح ابتكاري قابل للتعديل، وليس منتجًا موجودًا أو مشروعًا منشورًا.',
        url:project.url,parentUrl:project.url,parentName:project.title,
        source:'مساحة الابتكار', category:'أفكار', region:'عالمي',
        publishedAt:project.publishedAt,score:(project.score||0)-.5-i*.01, ideaDomain:project.ideaDomain,image:'',
      });
    }
    return ideas;
  }
  function allItems(){const projects=state.items.filter(x=>x.kind==='project');return [...state.items,...makeIdeas(projects)]}
  function favoriteExists(id){return state.saved.has(id)}
  function getCover(item, full=false){
    const link=safeUrl(item.image);
    const image=link?`<img src="${esc(link)}" alt="صورة مرتبطة بـ ${esc(trimmed(item.title,65))}" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="card-glyph" hidden>${glyph(item)}</span>`:`<span class="card-glyph">${glyph(item)}</span>`;
    return full?`<div class="detail-picture">${image}</div>`:`<div class="card-image ${visualClass(item)}" data-open="${esc(item.id)}">${image}<div class="card-visual-overlay"></div><span class="card-badge">${esc(label(item))}</span><span class="card-rank">${item.kind==='project'?'★':'↗'} ${Math.round(item.score||0)}</span></div>`;
  }
  function renderCard(item){
    const project=item.kind==='project';
    return `<article class="article-card">
      ${getCover(item)}
      <div class="card-content">
        <div class="card-meta"><i class="source-dot ${item.kind}"></i><span>${esc(trimmed(item.source,34))}</span><span class="meta-sep">•</span><span>${esc(dateTime(item.publishedAt))}</span></div>
        <h3>${esc(trimmed(item.title,135))}</h3>
        <p>${esc(trimmed(item.description,200))}</p>
        <div class="card-bottom"><div class="card-metric" title="${esc(getMetric(item))}">${esc(getMetric(item))}</div><div class="card-actions"><button type="button" class="bookmark ${favoriteExists(item.id)?'saved':''}" data-save="${esc(item.id)}" aria-label="${favoriteExists(item.id)?'إزالة من المحفوظات':'حفظ'}" aria-pressed="${favoriteExists(item.id)}">${favoriteExists(item.id)?'♥':'♡'}</button><button class="card-open" type="button" data-open="${esc(item.id)}">${project||item.kind==='idea'?'استكشف المشروع':'اقرأ التفاصيل'} ←</button></div></div>
      </div>
    </article>`;
  }
  function applyFilters(){
    const q=state.q.toLocaleLowerCase('ar').trim();
    let items=allItems();
    if(state.view==='all') items=items.filter(x=>x.kind!=='idea');
    if(state.view==='saved') items=items.filter(x=>favoriteExists(x.id));
    else if(state.view==='ideas') items=items.filter(x=>x.kind==='idea');
    else if(state.view in categoryMap) items=items.filter(x=>{
      if(state.view==='مفتوح المصدر')return x.kind==='project';
      if(state.view==='السعودية')return x.region==='السعودية';
      return x.category===state.view || x.kind==='project' && (x.topics||[]).some(t=>state.view==='ذكاء اصطناعي'&&['ai','artificial-intelligence','llm','machine-learning'].some(z=>t.includes(z)) || state.view==='برمجة'&&t.includes('python'));
    });
    if(state.chip!=='all') items=items.filter(x=>x.kind===state.chip);
    if(state.period!==null){const today=dayKey(new Date().toISOString());items=items.filter(x=>dayKey(x.publishedAt)===today&&detectSlot(x.publishedAt)===state.period)}
    if(q) items=items.filter(x=>[x.title,x.description,x.source,x.repo,x.language,x.parentName].some(t=>String(t||'').toLocaleLowerCase('ar').includes(q)));
    items.sort((a,b)=>state.sort==='popular'?(b.score||0)-(a.score||0)||Date.parse(b.publishedAt)-Date.parse(a.publishedAt):Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||(b.score||0)-(a.score||0));
    state.filtered=items;
  }
  function render(){
    applyFilters();
    const names={'all':['إشارات تستحق المتابعة','الأكثر رواجًا','أبرز المستجدات مرتبة بمؤشر شيوع تقديري، مع ربط الأخبار بمصادرها الأصلية.'],'saved':['قائمتك الخاصة','العناصر المحفوظة','كل ما حفظته لتعود إليه لاحقًا على هذا الجهاز.'],'ideas':['مساحة الابتكار','أفكار لمشاريع جديدة','أفكار عملية مستوحاة من مستودعات مفتوحة المصدر؛ اضغط أي فكرة للحصول على 10 تحسينات و10 مشاريع أخرى.']};
    const n=names[state.view] || ['متابعة مخصصة',state.view,'اكتشف أبرز الأخبار والمشاريع ضمن هذا التصنيف.'];
    $('sectionKicker').textContent=n[0]; $('sectionTitle').textContent=n[1];$('sectionDescription').textContent=n[2];
    $('currentPage').textContent=state.view==='all'?'نظرة عامة':n[1];
    document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.nav===state.view));
    document.querySelectorAll('[data-slot]').forEach(b=>b.classList.toggle('selected',+b.dataset.slot===state.period));
    document.querySelectorAll('[data-chip]').forEach(b=>b.classList.toggle('active',b.dataset.chip===state.chip));
    document.querySelectorAll('[data-sort]').forEach(b=>b.classList.toggle('selected',b.dataset.sort===state.sort));
    const list=state.filtered.slice(0,state.shown);
    if(list.length){$('feedGrid').innerHTML=list.map(renderCard).join('')}
    else{
      const msg=state.period!==null?'لم تُرصد عناصر منشورة في هذه الفترة اليوم. يمكنك عرض جميع الفترات أو مراجعة الأيام السابقة.':state.view==='saved'?'لم تحفظ أي خبر أو مشروع بعد. اضغط رمز القلب على أي بطاقة لتجده هنا.':'لا توجد عناصر تطابق هذا البحث أو التصنيف حاليًا.';
      $('feedGrid').innerHTML=`<div class="empty"><b>لا توجد نتائج حاليًا</b><p>${esc(msg)}</p><button type="button" id="clearFilters">عرض جميع الأخبار</button></div>`;
    }
    $('loadMore').hidden=state.filtered.length<=state.shown;
    const news=state.items.filter(x=>x.kind==='news').length,projects=state.items.filter(x=>x.kind==='project').length;
    $('statNews').textContent=arNumber(news);$('statProjects').textContent=arNumber(projects);$('statIdeas').textContent=arNumber(projects*20);
    $('statUpdate').textContent=state.generatedAt?new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(state.generatedAt)):'—';
    bindFeedActions();
  }
  function bindFeedActions(){
    document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.open)));
    document.querySelectorAll('[data-save]').forEach(b=>b.addEventListener('click',()=>toggleSaved(b.dataset.save)));
    $('clearFilters')?.addEventListener('click',()=>{state.view='all';state.chip='all';state.q='';state.period=null;$('searchInput').value='';render()});
  }
  function toggleSaved(id){if(state.saved.has(id)){state.saved.delete(id);toast('أُزيل من المحفوظات')}else{state.saved.add(id);toast('تمت الإضافة إلى المحفوظات')}persistSaved();render()}
  function openDetail(id){
    const item=allItems().find(x=>x.id===id);
    if(!item)return;
    state.lastActive=document.activeElement;
    const isIdea=item.kind==='idea',isProj=item.kind==='project',url=safeUrl(item.url);
    const ideas=isProj||isIdea?window.TechPulseIdeas.forItem(item):null;
    const spec=isProj?`<div class="project-specs"><div><span>النجوم</span><b>★ ${arNumber(item.stars)}</b></div><div><span>لغة البرمجة</span><b>${esc(item.language||'غير محدد')}</b></div><div><span>الرخصة</span><b>${esc(item.license||'غير محدد')}</b></div></div>`:'';
    const gallery=(item.gallery||[]).map((url,i)=>safeUrl(url)?`<button type="button" data-gallery="${i}" aria-label="عرض صورة المشروع ${i+1}"><img src="${esc(safeUrl(url))}" loading="lazy" alt="معاينة ${i+1}"></button>`:'').join('');
    const lists=ideas?`<section class="detail-section"><h3>تطويرات للمشروع نفسه <span class="count">10</span></h3><p class="detail-note">هذه اقتراحات تنفيذية مبدئية مستندة إلى مجال المشروع، وليست ميزات مؤكدة أو تغييرات مضمونة في المستودع الأصلي.</p><ol class="idea-list">${ideas.improvements.map((s,i)=>`<li class="idea-line"><span class="idea-num">${i+1}</span><span>${esc(s)}</span></li>`).join('')}</ol></section>
    <section class="detail-section"><h3>مشاريع جديدة مستوحاة منه <span class="count purple">10</span></h3><p>عشر اتجاهات يمكن تحويل كل منها إلى مشروع مستقل، ويمكن فتح أي فكرة لاستعراض 20 اتجاهًا إضافيًا.</p><ol class="idea-list spin">${ideas.spinoffs.map((s,i)=>`<li class="idea-line"><span class="idea-num">${i+1}</span><span>${esc(s)}</span><button type="button" class="idea-open" data-idea-index="${i}">تفاصيل الفكرة ←</button></li>`).join('')}</ol></section>`:'';
    $('detailContent').innerHTML=`<div class="detail-heading"><span class="detail-kind">${esc(label(item))}</span><h2 id="detailTitle">${esc(item.title)}</h2><div class="detail-submeta"><span>${esc(item.source)}</span><span>•</span><span>${esc(dateTime(item.publishedAt,true))}</span>${isProj?`<span>•</span><span>آخر نشاط للمستودع</span>`:''}</div><p>${esc(item.description)}</p></div>${getCover(item,true)}${gallery?`<div class="gallery-strip">${gallery}</div>`:''}${spec}<section class="detail-section"><h3>${isIdea?'لماذا يمكن بناء هذه الفكرة؟':'الأهمية والتأثير'}</h3><p>${esc(item.impact||'اقرأ المصدر الأصلي للتفاصيل الكاملة.')}</p></section><div class="detail-links">${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${isIdea?'افتح المشروع الملهم':isProj?'افتح المستودع على GitHub':'اقرأ الخبر من المصدر'} ↗</a>`:''}<button type="button" id="saveInside">${favoriteExists(item.id)?'♥ محفوظ':'♡ احفظ للقراءة لاحقًا'}</button></div>${lists}<p class="detail-disclaimer">${isIdea?'هذه فكرة مقترحة وليست منتجًا منشورًا.':'العناوين والأوصاف مأخوذة من مصادر عامة. '}المؤشر الرائج تقريبي، والصور تظهر فقط عند توفرها في المصادر، وليست ضمانًا لصورة المنتج أو المشروع.</p>`;
    $('overlay').hidden=false;$('detailWrap').hidden=false;document.body.classList.add('body-locked');document.querySelector('.detail-panel')?.focus();
    $('detailContent').querySelectorAll('[data-gallery]').forEach(b=>b.addEventListener('click',()=>{const img=$('detailContent').querySelector('.detail-picture img');if(img)img.src=safeUrl(item.gallery[+b.dataset.gallery])}));
    $('saveInside').addEventListener('click',()=>{toggleSaved(item.id);$('saveInside').textContent=favoriteExists(item.id)?'♥ محفوظ':'♡ احفظ للقراءة لاحقًا'});
    $('detailContent').querySelectorAll('[data-idea-index]').forEach(b=>b.addEventListener('click',()=>{
      const idx=+b.dataset.ideaIndex;
      if(isIdea){const nestedId=`branch:${item.id}:${idx}`;const generated={...item,id:nestedId,title:ideas.spinoffs[idx],kind:'idea',parentName:item.title,description:`فكرة جديدة متفرعة من «${item.title}» قابلة للبناء كمشروع مستقل.`};state.items.push(generated);closeDetail(false);openDetail(nestedId)}
      else{const ideaId=`idea:${item.id}:${idx}`;closeDetail(false);openDetail(ideaId)}
    }));
  }
  function closeDetail(restore=true){$('overlay').hidden=true;$('detailWrap').hidden=true;document.body.classList.remove('body-locked');$('detailContent').innerHTML='';if(restore)state.lastActive?.focus?.()}
  function setView(view){state.view=view;state.chip='all';state.period=null;state.shown=9;render();$('newsSection').scrollIntoView({behavior:'smooth',block:'start'});$('sidebar').classList.remove('mobile-open')}
  async function fetchFeed(notify=false){
    try{
      const inline=document.getElementById('bootstrapData');
      let data;
      if(inline){data=JSON.parse(inline.textContent)}
      else{const r=await fetch('./data/feed.json?fresh='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);data=await r.json()}
      if(!Array.isArray(data.items))throw Error('bad feed');
      state.items=data.items.filter(x=>['news','project'].includes(x.kind) && x.id && safeUrl(x.url));
      state.generatedAt=data.generatedAt;state.demo=!!data.seedData;
      document.querySelector('.live-pill').innerHTML=state.demo?'<i></i> بيانات أولية — بانتظار أول مزامنة':'<i></i> تحديث تلقائي';
      render();
      if(notify)toast(state.demo?'تم تحميل البيانات الأولية':'تم فحص آخر البيانات المنشورة');
    }catch(e){console.error('Feed load failed:',e);$('feedGrid').innerHTML='<div class="empty"><b>تعذر تحميل المحتوى</b><p>راجع اتصالك أو أعد المحاولة. لا تُعرض أخبار مختلقة عند تعذّر الوصول للمصادر.</p></div>';toast('تعذّر تحديث الأخبار حاليًا')}
  }
  function bind(){
    document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.nav)));
    document.querySelectorAll('[data-chip]').forEach(b=>b.addEventListener('click',()=>{state.chip=b.dataset.chip;state.shown=9;render()}));
    document.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>{state.sort=b.dataset.sort;render()}));
    document.querySelectorAll('[data-slot]').forEach(b=>b.addEventListener('click',()=>{const n=+b.dataset.slot;state.period=state.period===n?null:n;state.shown=9;render();$('newsSection').scrollIntoView({behavior:'smooth'})}));
    $('searchInput').addEventListener('input',(e)=>{state.q=e.target.value;state.shown=9;render()});
    $('loadMore').addEventListener('click',()=>{state.shown+=9;render()});
    $('latestButton').addEventListener('click',()=>{setView('all');state.sort='latest';render()});
    for(const id of ['ideasButton','discoverIdeas']) $(id).addEventListener('click',()=>setView('ideas'));
    $('exploreProjects').addEventListener('click',()=>setView('مفتوح المصدر'));
    $('refreshButton').addEventListener('click',()=>fetchFeed(true));
    $('overlay').addEventListener('click',()=>{closeDetail();$('sidebar').classList.remove('mobile-open')});
    $('closeDetail').addEventListener('click',()=>closeDetail());
    $('mobileMenu').addEventListener('click',()=>{$('sidebar').classList.toggle('mobile-open');$('overlay').hidden=!$('sidebar').classList.contains('mobile-open')});
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){if(!$('detailWrap').hidden)closeDetail();else if($('sidebar').classList.contains('mobile-open')){$('sidebar').classList.remove('mobile-open');$('overlay').hidden=true}}
      if(e.key==='/'&&e.target.tagName!=='INPUT'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();$('searchInput').focus()}
      if(e.key==='Tab'&&!$('detailWrap').hidden){const focusable=[...document.querySelectorAll('.detail-panel button,.detail-panel a[href]')].filter(x=>!x.hidden);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
    });
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Date.now()-lastFetch>15*60*1000)wrappedFetch()});
  }
  let lastFetch=0;
  function wrappedFetch(){lastFetch=Date.now();fetchFeed()}
  function updateClock(){try{$('riyadhClock').textContent=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())+' KSA'}catch{}}
  loadSaved();bind();wrappedFetch();updateClock();$('currentYear').textContent=String(new Date().getFullYear());
  setInterval(updateClock,30000);setInterval(wrappedFetch,15*60*1000);
})();
