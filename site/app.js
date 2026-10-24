/* Accessible vanilla JS app: no build step, no paid API, no tracking. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = {items:[], filtered:[], view:'all', chip:'all', sort:'popular', q:'', period:null, imagesOnly:false, shown:9, saved:new Set(), generatedAt:null, demo:false, lastActive:null,research:null,editorial:{items:{}},health:null,days:'all',region:'all',language:'all',reviewedOnly:false};
  const categoryMap = {'ذكاء اصطناعي':'ذكاء اصطناعي','برمجة':'برمجة','تقنيات':'تقنيات','أبحاث':'أبحاث','فرص':'فرص','السعودية':'السعودية','مفتوح المصدر':'مفتوح المصدر'};
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = (u) => {if(typeof u!=='string'||!u.trim())return '';try{const x=new URL(u, location.href);return x.protocol==='https:'||x.origin===location.origin&&x.protocol==='http:'? x.href:''}catch{return ''}};
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
  const getMetric = item=>item.kind==='project'?`★ ${compact(item.stars)} نجمة`:item.kind==='idea'?'مقترح تنفيذ':item.points?`▲ ${compact(item.points)} · ${compact(item.comments)} تعليق`:'مؤشر تقديري للشيوع';

  const normalizeSearch = value => String(value||'').normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').toLocaleLowerCase('ar');
  const evidenceLabels = {metadata:'بيانات المصدر فقط',article:'قراءة المصدر',readme:'مراجعة التوثيق',code:'فحص شيفرة',tested:'تجربة تشغيل موثقة'};
  const studyCache=new Map();
  function editorialFor(item){const entry=state.editorial?.items?.[item.id];return entry&&entry.url===item.url?entry:null}
  function resetFilters(){state.chip='all';state.q='';state.period=null;state.imagesOnly=false;state.days='all';state.region='all';state.language='all';state.reviewedOnly=false;state.shown=9;$('searchInput').value='';$('dateFilter').value='all';$('regionFilter').value='all';$('languageFilter').value='all';$('reviewedFilter').checked=false;render()}
  function researchCount(){return state.items.filter(x=>x.kind==='project').reduce((sum,x)=>{const report=studyFor(x);return sum+(report.reviewed?['improvements','spinoffs','religious'].reduce((n,k)=>n+(report[k]?.length||0),0):0)},0)}
  function renderHealth(){
    const age=state.generatedAt?(Date.now()-Date.parse(state.generatedAt))/3600000:Infinity;
    const status=state.health;
    const message=state.demo?'هذه بيانات تعريفية أولية.':!Number.isFinite(age)?'وقت جمع المحتوى غير متاح.':`آخر جمع ناجح: ${dateTime(state.generatedAt,true)}. ${age>8?'المحتوى يحتاج تحديثًا؛ قد تتعطل بعض المصادر.':'التحديث المجدول كل 3 ساعات، وقد يتأخر.'}`;
    $('freshnessMessage').textContent=message;
    $('freshnessMessage').classList.toggle('stale',age>8||state.demo||status?.state==='error');
    const states={ok:'متاح',empty:'لا نتائج جديدة',error:'تعذر الجمع'};
    $('sourceHealth').innerHTML=status?.sources?.length?`<p>آخر محاولة: ${esc(dateTime(status.lastAttemptAt,true))} · النتائج تشمل المحتوى المحتفظ به من تشغيلات سابقة.</p><div class="source-health-grid">${status.sources.map(x=>`<div class="source-status ${x.state==='error'?'source-error':''}"><b>${esc(x.name)}</b><span>${esc(states[x.state]||'غير معروف')} · ${arNumber(x.items)}</span>${x.error?`<small>${esc(x.error)}</small>`:''}</div>`).join('')}</div>`:'ستظهر نتائج فحص المصادر بعد تشغيل المجمع المطوّر.';
    document.querySelector('.live-pill').textContent=state.demo?'بيانات أولية':age>8||status?.state==='error'?'المحتوى يحتاج تحديثًا':status?.state==='partial'?'بعض المصادر متعطلة':'آخر البيانات المنشورة';
  }
  function renderBrief(){
    $('dailyBrief').hidden=state.view!=='all';if(state.view!=='all')return;
    const news=state.items.filter(x=>x.kind==='news'&&Date.now()-Date.parse(x.publishedAt)<7*86400000).sort((a,b)=>(b.score||0)-(a.score||0));
    const selected=[],categories=new Set();
    for(const item of news){if(!categories.has(item.category)){selected.push(item);categories.add(item.category)}if(selected.length===5)break}
    for(const item of news){if(selected.length===5)break;if(!selected.includes(item))selected.push(item)}
    $('briefItems').innerHTML=selected.length?selected.map((x,i)=>`<button type="button" class="brief-item" data-open="${esc(x.id)}"><span class="brief-number">0${i+1}</span><span><small>${esc(x.category)} · ${esc(x.source)}</small><b>${esc(x.title)}</b><p>${esc(trimmed(x.editorial?.whyItMatters||x.description,160))}</p></span><span aria-hidden="true">↗</span></button>`).join(''):'<p>لا توجد أخبار حديثة كافية؛ يمكنك تصفح المحتوى السابق أدناه.</p>';
  }
  function renderEditorial(item){
    const e=editorialFor(item);if(!e)return '<p class="detail-note">هذا وصف من المصدر؛ لم يُضف شرح عربي خاص بهذا العنصر بعد.</p>';
    return `<section class="editorial-context"><span class="quality-label">شرح عربي خاص · ${esc(evidenceLabels[e.basis]||'مراجعة مصدر')}</span><p>تاريخ المراجعة: ${esc(dateTime(e.reviewedAt,true))}</p>${[['whyItMatters','لماذا يهمك؟'],['audience','لمن يفيد؟'],['overview','كيف يعمل المشروع؟'],['requirements','متطلبات التشغيل'],['quickStart','كيف تبدأ؟'],['limitations','القيود وما لم يُتحقق منه']].filter(([key])=>e[key]).map(([key,title])=>`<h3>${title}</h3><p>${esc(e[key])}</p>`).join('')}${e.nextSteps?.length?`<h3>خطوتك التالية</h3><ol>${e.nextSteps.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>`:''}<h3>مصادر الشرح</h3><div class="editorial-sources">${(e.sources||[]).filter(x=>safeUrl(x.url)).map(x=>`<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer">${esc(x.title)} ↗</a>`).join('')}</div>${e.testEvidence?`<h3>دليل تجربة التشغيل</h3><p>${esc(e.testEvidence)}</p>`:''}</section>`;
  }
  function loadSaved(){try{state.saved=new Set(JSON.parse(localStorage.getItem('nabdh-saved')||'[]'))}catch{state.saved=new Set()}}
  function persistSaved(){try{localStorage.setItem('nabdh-saved',JSON.stringify([...state.saved].slice(0,700)))}catch{}}
  const religiousLabels = {improvements:'تطوير المشروع الأصلي',spinoffs:'مشروع مستقل جديد',religious:'خدمة دينية باستخدام المشروع'};
  function projectById(id){ return state.items.find(x=>x.kind==='project'&&x.id===id) }
  function studyFor(project){
    if(studyCache.has(project.id))return studyCache.get(project.id);
    const editorial=editorialFor(project);
    if(editorial&&['improvements','spinoffs','religious'].some(k=>Array.isArray(editorial[k]))){
      const report={reviewed:true,summary:editorial.overview||editorial.summaryAr,verified:`أساس المراجعة: ${evidenceLabels[editorial.basis]} · ${dateTime(editorial.reviewedAt,true)}`,sources:editorial.sources,...Object.fromEntries(['improvements','spinoffs','religious'].map(k=>[k,editorial[k]||[]]))};
      studyCache.set(project.id,report);return report;
    }
    const audited=state.research?.reviewed?.[String(project.repo||'').toLowerCase()];
    if(audited){const report={...audited,reviewed:true};studyCache.set(project.id,report);return report;}
    const base=window.TechPulseIdeas.forItem(project);
    const generic=state.research?.genericReligious||{};
    const names=generic[project.ideaDomain]||generic.general||[];
    const family=window.TechPulseIdeas.domainNames[project.ideaDomain]||'البرمجيات';
    const make=(name,type,index)=>({
      title:name,
      problem:type==='improvements'?`يلزم التأكد من الحاجة إلى «${name}» داخل ${project.title} قبل تنفيذ تعديل في المستودع.`:`توجد فرصة محتملة لتوظيف مجال ${family} في «${name}»، لكنها لم تُختبر بعد على هذا المستودع.`,
      approach:type==='religious'?'تجربة أولى باستخدام بيانات عامة موثقة وترخيص واضح، مع إحالات للمصدر ومراجعة بشرية لأي محتوى ديني.':type==='improvements'?'راجع README وIssues ثم أنشئ إثبات مفهوم محدودًا على فرع منفصل مع اختبارات قبل اقتراح الدمج.':'أنشئ منتجًا أوليًا يعالج وظيفة واحدة، ثم اختبر استخدامه على مجموعة صغيرة من البيانات المسموح بها.',
      steps:state.research?.genericSteps?.[type]||['افحص وثائق المشروع ثم ابنِ اختبارًا أوليًا.'],
      stack:`أدوات ${family} ولغة ${project.language||'مناسبة'} بعد التحقق من توافق API`,
      difficulty:'غير محددة حتى فحص المتطلبات',
      metric:'عرّف مجموعة اختبار حقيقية ومقياسًا قابلًا للقياس قبل اعتماد الفكرة.',
      risks:type==='religious'?'يجب مراجعة المحتوى من مصدر شرعي موثوق وعدم توليد آيات أو أحكام أو تخريج حديث آليًا.':'قد تكون الوظيفة موجودة فعلًا أو تتعارض مع الترخيص؛ هذا مقترح بحثي يحتاج تحققًا.',
      confidence:'استكشاف مبدئي مبني على مجال المشروع فقط؛ لم تتم مراجعة كوده أو اختبار جدوى هذا المقترح.',
      sources:[{title:'صفحة المستودع: افحص README والترخيص',url:project.url},...(type==='religious'?[{title:'توثيق بيانات Quran Foundation',url:'https://api-docs.quran.com/'},{title:'Sunnah.com للمطورين',url:'https://sunnah.com/developers'}]:[])]
    });
    const report={reviewed:false,summary:'المقترحات التالية مستوحاة من تصنيف المشروع فقط، ولم نتحقق من احتياج المستودع لكل واحدة.',verified:'غير مدقق على مستوى المستودع. اقرأ README وIssues وتراخيص البيانات قبل التنفيذ.',sources:[{title:'المستودع الأصلي',url:project.url}],
      improvements:base.improvements.slice(0,10).map((x,i)=>make(x,'improvements',i)),
      spinoffs:base.spinoffs.slice(0,10).map((x,i)=>make(x,'spinoffs',i)),
      religious:names.slice(0,10).map((x,i)=>make(x,'religious',i))};studyCache.set(project.id,report);return report;
  }
  function availableIdeas(project,type){return studyFor(project)[type]||[]}
  function makeReligionIdeas(projects){const out=[];for(const project of projects){
    availableIdeas(project,'religious').forEach((idea,i)=>out.push({id:`religious:${project.id}:${i}`,kind:'idea',title:idea.title,description:idea.problem,
      impact:idea.approach,source:'استخدامات دينية',category:'تطبيقات دينية',publishedAt:project.publishedAt,score:(project.score||0)-.3-i*.01,
      parentName:project.title,parentId:project.id,parentUrl:project.url,proposalIndex:i,proposalType:'religious',url:project.url,ideaDomain:project.ideaDomain}));}
    return out;
  }
  function proposalButtonText(){return 'فتح الدراسة والمواصفات ←'}
  function toast(text){document.querySelector('.toast')?.remove();const el=document.createElement('div');el.className='toast';el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),2700)}

  function makeIdeas(projects){
    const ideas=[];
    for(const project of projects){
      availableIdeas(project,'spinoffs').forEach((idea,i)=>ideas.push({
        id:`idea:${project.id}:${i}`,kind:'idea',title:idea.title,description:idea.problem,
        impact:idea.approach,url:project.url,parentUrl:project.url,parentName:project.title,parentId:project.id,
        proposalType:'spinoffs',proposalIndex:i,source:'مساحة الابتكار',category:'أفكار',region:'عالمي',
        publishedAt:project.publishedAt,score:(project.score||0)-.5-i*.01,ideaDomain:project.ideaDomain,image:''}));
    }
    return ideas;
  }
  function allItems(){const projects=state.items.filter(x=>x.kind==='project');const items=[...state.items,...makeIdeas(projects),...makeReligionIdeas(projects)];
    for(const id of state.saved){if(!id.startsWith('proposal:'))continue;const [,parentId,type,index]=id.split(':');const parent=projectById(parentId),idea=parent&&studyFor(parent)[type]?.[+index];if(idea)items.push({id,kind:'idea',title:idea.title,description:idea.problem,parentId,proposalType:type,proposalIndex:+index,url:parent.url,parentName:parent.title,publishedAt:parent.publishedAt,score:parent.score,source:'فكرة محفوظة'});}
    return items;
  }
  function favoriteExists(id){return state.saved.has(id)}
  function getCover(item, full=false){
    // A GitHub owner avatar is labelled as such; it is not a project screenshot.
    const original=safeUrl(item.image);
    const avatar=item.kind==='project'?safeUrl(item.avatar):'';
    const link=original||avatar;
    const image=link?`<img src="${esc(link)}" alt="${esc(original?'صورة من المصدر الأصلي': 'صورة حساب المشروع على GitHub')}" loading="lazy" decoding="async"><span class="card-glyph" hidden>${glyph(item)}</span>`:`<span class="card-glyph">${glyph(item)}</span>`;
    const photoLabel=original?'صورة المصدر':avatar?'صورة الحساب':'لا توجد صورة موثقة';
    return full?`<div class="detail-picture ${original?'has-photo':avatar?'has-avatar':'no-photo'}">${image}<span class="picture-caption">${photoLabel}</span></div>`:`<div class="card-image ${visualClass(item)} ${link?'has-photo':'no-photo'}" data-open="${esc(item.id)}">${image}<span class="picture-origin">${esc(photoLabel)}</span><div class="card-visual-overlay"></div><span class="card-badge">${esc(label(item))}</span><span class="card-rank">${item.kind==='project'?'★':'↗'} ${Math.round(item.score||0)}</span></div>`;
  }
  function renderCard(item){
    const project=item.kind==='project';
    return `<article class="article-card">
      ${getCover(item)}
      <div class="card-content">
        <div class="card-meta"><i class="source-dot ${item.kind}"></i><span>${esc(trimmed(item.source,34))}</span><span class="meta-sep">•</span><span>${esc(dateTime(item.publishedAt))}</span></div>
        <div class="quality-label">${item.kind==='idea'?(studyFor(projectById(item.parentId))?.reviewed?'مقترح خاص بالمشروع':'قالب استكشافي'):editorialFor(item)?'شرح عربي خاص':'وصف المصدر'}</div><h3 dir="auto">${esc(trimmed(item.title,135))}</h3>
        <p>${esc(trimmed(item.description,200))}</p>
        <div class="card-bottom"><div class="card-metric" title="${esc(getMetric(item))}">${esc(getMetric(item))}</div><div class="card-actions"><button type="button" class="bookmark ${favoriteExists(item.id)?'saved':''}" data-save="${esc(item.id)}" aria-label="${favoriteExists(item.id)?'إزالة من المحفوظات':'حفظ'}" aria-pressed="${favoriteExists(item.id)}">${favoriteExists(item.id)?'♥':'♡'}</button><button class="card-open" type="button" data-open="${esc(item.id)}">${project||item.kind==='idea'?'استكشف المشروع':'اقرأ التفاصيل'} ←</button></div></div>
      </div>
    </article>`;
  }
  function applyFilters(){
    const q=normalizeSearch(state.q).trim();
    let items=allItems();
    if(state.view==='all') items=items.filter(x=>x.kind!=='idea');
    if(state.view==='saved') items=items.filter(x=>favoriteExists(x.id));
    else if(state.view==='ideas') items=items.filter(x=>x.kind==='idea' && x.proposalType==='spinoffs');
    else if(state.view==='religious') items=items.filter(x=>x.kind==='idea' && x.proposalType==='religious');
    else if(state.view in categoryMap) items=items.filter(x=>{
      if(state.view==='مفتوح المصدر')return x.kind==='project';
      if(state.view==='السعودية')return x.region==='السعودية';
      return x.category===state.view || x.kind==='project' && (x.topics||[]).some(t=>state.view==='ذكاء اصطناعي'&&['ai','artificial-intelligence','llm','machine-learning'].some(z=>t.includes(z)) || state.view==='برمجة'&&t.includes('python'));
    });
    if(state.chip!=='all') items=items.filter(x=>x.kind===state.chip);
    if(state.imagesOnly) items=items.filter(x=>Boolean(safeUrl(x.image)));
    if(state.period!==null){const today=dayKey(new Date().toISOString());items=items.filter(x=>dayKey(x.publishedAt)===today&&detectSlot(x.publishedAt)===state.period)}
    if(state.days!=='all')items=items.filter(x=>Date.parse(x.publishedAt)>=Date.now()-Number(state.days)*86400000);
    if(state.region!=='all')items=items.filter(x=>(x.region||projectById(x.parentId)?.region)===state.region);
    if(state.language!=='all')items=items.filter(x=>(x.language||projectById(x.parentId)?.language)===state.language);
    if(state.reviewedOnly)items=items.filter(x=>x.kind==='idea'?studyFor(projectById(x.parentId)).reviewed:!!editorialFor(x)||(x.kind==='project'&&studyFor(x).reviewed));
    if(q) items=items.filter(x=>[x.title,x.description,x.source,x.repo,x.language,x.parentName,x.originalTitle,x.originalDescription,...(x.topics||[])].some(t=>normalizeSearch(t).includes(q)));
    items.sort((a,b)=>state.sort==='popular'?(b.score||0)-(a.score||0)||Date.parse(b.publishedAt)-Date.parse(a.publishedAt):Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||(b.score||0)-(a.score||0));
    // On the overview, reserve room for news instead of letting cumulative stars dominate.
    if(state.view==='all'&&state.chip==='all'&&state.sort==='popular'){
      const news=items.filter(x=>x.kind==='news'),projects=items.filter(x=>x.kind==='project'),mixed=[];
      let n=0,p=0;while(n<news.length||p<projects.length){for(let i=0;i<2&&n<news.length;i++)mixed.push(news[n++]);if(p<projects.length)mixed.push(projects[p++]);}items=mixed;
    }
    state.filtered=items;
  }
  function render(){
    applyFilters();
    const names={'all':['إشارات تستحق المتابعة',state.sort==='latest'?'آخر المستجدات':'أخبار ومشاريع تستحق المتابعة','ترتيب تقديري يوازن الأخبار والمشاريع؛ النجوم والتفاعل لا يقيسان جودة المحتوى.'],'saved':['قائمتك الخاصة','العناصر المحفوظة','كل ما حفظته لتعود إليه لاحقًا على هذا الجهاز.'],'ideas':['مساحة الابتكار','أفكار تبدأ منها','مقترحات خاصة بالمشاريع وقوالب استكشافية؛ فعّل تصفية الشرح الخاص لعرض المقترحات المخصصة فقط.'], 'religious':['التقنية في خدمة العلم','استخدامات دينية','مقترحات مع إحالات للمصادر الأصلية ومراجعة بشرية؛ لا فتاوى آلية ولا نصوص دينية مُنشأة.']};
    const n=names[state.view] || ['متابعة مخصصة',state.view,'اكتشف أبرز الأخبار والمشاريع ضمن هذا التصنيف.'];
    $('sectionKicker').textContent=n[0]; $('sectionTitle').textContent=n[1];$('sectionDescription').textContent=n[2];
    $('currentPage').textContent=state.view==='all'?'نظرة عامة':n[1];
    document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.nav===state.view));
    document.querySelectorAll('[data-slot]').forEach(b=>b.classList.toggle('selected',+b.dataset.slot===state.period));
    document.querySelectorAll('[data-chip]').forEach(b=>b.classList.toggle('active',b.dataset.chip===state.chip));
    document.querySelectorAll('[data-sort]').forEach(b=>b.classList.toggle('selected',b.dataset.sort===state.sort));
    $('imageOnly')?.classList.toggle('active',state.imagesOnly);
    $('imageOnly')?.setAttribute('aria-pressed',String(state.imagesOnly));
    const list=state.filtered.slice(0,state.shown);
    if(list.length){$('feedGrid').innerHTML=list.map(renderCard).join('')}
    else{
      const msg=state.period!==null?'لم تُرصد عناصر منشورة في هذه الفترة اليوم. يمكنك عرض جميع الفترات أو مراجعة الأيام السابقة.':state.view==='saved'?'لم تحفظ أي خبر أو مشروع بعد. اضغط رمز القلب على أي بطاقة لتجده هنا.':'لا توجد عناصر تطابق هذا البحث أو التصنيف حاليًا.';
      $('feedGrid').innerHTML=`<div class="empty"><b>لا توجد نتائج حاليًا</b><p>${esc(msg)}</p><button type="button" id="clearFilters">عرض جميع الأخبار</button></div>`;
    }
    $('loadMore').hidden=state.filtered.length<=state.shown;
    const news=state.items.filter(x=>x.kind==='news').length,projects=state.items.filter(x=>x.kind==='project').length;
    $('statNews').textContent=arNumber(news);$('statProjects').textContent=arNumber(projects);$('statIdeas').textContent=arNumber(researchCount());
    $('statUpdate').textContent=state.generatedAt?new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(state.generatedAt)):'—';
    $('resultSummary').textContent=`${arNumber(state.filtered.length)} نتيجة · يعرض ${arNumber(list.length)} عنصرًا` ;
    renderHealth();renderBrief();
    renderSpotlight();
    bindFeedActions();
  }
  function renderSpotlight(){
    const section=$('spotlightSection'),target=$('spotlightGrid');
    if(!section||!target)return;
    section.hidden=state.view!=='all';
    if(section.hidden)return;
    // Latest source-backed news with publisher images first, then recent news with honest placeholders.
    const news=state.items.filter(x=>x.kind==='news').sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
    const pictured=news.filter(x=>safeUrl(x.image));
    const featured=[...pictured.slice(0,3),...news.filter(x=>!pictured.slice(0,3).some(y=>y.id===x.id)).slice(0,3)].slice(0,3);
    target.innerHTML=featured.map(item=>`<article class="spotlight-card">${getCover(item)}<div class="spotlight-copy"><span>${esc(item.source)} · ${esc(dateTime(item.publishedAt))}</span><h3>${esc(trimmed(item.title,108))}</h3><button type="button" data-open="${esc(item.id)}">عرض الخبر وتفاصيله ←</button></div></article>`).join('');
    section.querySelector('.spotlight-note').textContent=pictured.length?`صور موثقة من مصادر الأخبار: ${pictured.length} خبرًا. بعض المصادر لا تتيح صورًا.`:'بعض المصادر لا توفر صورًا قابلة للعرض؛ نعرض بديلًا بصريًا دون اختلاق صور للأخبار.';
  }
  function bindFeedActions(){
    document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.open)));
    document.querySelectorAll('.card-image img,.detail-picture img,.gallery-strip img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;const glyph=img.nextElementSibling;if(glyph?.classList.contains('card-glyph'))glyph.hidden=false;const label=img.closest('.card-image,.detail-picture')?.querySelector('.picture-origin,.picture-caption');if(label)label.textContent='تعذّر تحميل صورة المصدر';}));
    document.querySelectorAll('[data-save]').forEach(b=>b.addEventListener('click',()=>toggleSaved(b.dataset.save)));
    $('clearFilters')?.addEventListener('click',()=>{state.view='all';resetFilters()});
  }
  function toggleSaved(id){if(state.saved.has(id)){state.saved.delete(id);toast('أُزيل من المحفوظات')}else{state.saved.add(id);toast('تمت الإضافة إلى المحفوظات')}persistSaved();render()}
  function openDetail(id){
    let item=allItems().find(x=>x.id===id);
    if(!item&&id.startsWith('proposal:')){const [,parentId,type,index]=id.split(':');const parent=projectById(parentId);if(parent&&['improvements','spinoffs','religious'].includes(type)&&studyFor(parent)[type]?.[+index]){state.lastActive=document.activeElement;showProposal(parent,type,+index);return;}}
    if(!item)return;
    state.lastActive=document.activeElement;
    history.replaceState(null,'','#item='+encodeURIComponent(id));
    if(item.kind==='idea' && item.parentId){const parent=projectById(item.parentId);if(parent){showProposal(parent,item.proposalType,item.proposalIndex);return;}}
    const isIdea=item.kind==='idea',isProj=item.kind==='project',url=safeUrl(item.url);
    const ideas=isProj?studyFor(item):null;
    const spec=isProj?`<div class="project-specs"><div><span>النجوم</span><b>★ ${arNumber(item.stars)}</b></div><div><span>لغة البرمجة</span><b>${esc(item.language||'غير محدد')}</b></div><div><span>الرخصة</span><b>${esc(item.license||'غير محدد')}</b></div></div>`:'';
    const gallery=(item.gallery||[]).map((url,i)=>safeUrl(url)?`<button type="button" data-gallery="${i}" aria-label="عرض صورة المشروع ${i+1}"><img src="${esc(safeUrl(url))}" loading="lazy" alt="معاينة ${i+1}"></button>`:'').join('');
    const translation=!isProj&&!isIdea&&url?`<a class="translate-link" href="https://translate.google.com/translate?sl=auto&tl=ar&u=${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">اقرأ المصدر بترجمة عربية آلية ↗</a>`:'';
    const lists=ideas?`<section class="research-context"><strong>${ideas.reviewed?'◉ مقترحات خاصة بالمشروع':'◌ مقترحات تحتاج تدقيق المستودع'}</strong><p>${esc(ideas.summary)}</p><small>${esc(ideas.verified)}</small></section>
    ${[['improvements','تطويرات للمشروع نفسه'],['spinoffs','مشاريع جديدة مستقلة'],['religious','استخدامات دينية نافعة']].map(([type,heading])=>`<section class="detail-section" id="study-${type}"><h3>${heading} <span class="count">${ideas[type]?.length||0}</span></h3><p class="detail-note">${type==='religious'?'أي نقل ديني يحتاج مصدرًا معتمدًا ومراجعة بشرية، ولا يُولد النص الشرعي آليًا.':'افتح المقترح لقراءة الخطوات والمصادر وحدود المراجعة.'}</p><div class="study-grid">${(ideas[type]||[]).map((idea,i)=>`<button type="button" class="study-entry" data-proposal-type="${type}" data-proposal-index="${i}"><span class="study-serial">${i+1}</span><span class="study-entry-copy"><b>${esc(idea.title)}</b><small>${esc(trimmed(idea.problem,125))}</small></span><span class="study-arrow">↗</span></button>`).join('')}</div></section>`).join('')}`:'';
    $('detailContent').innerHTML=`<div class="detail-heading"><span class="detail-kind">${esc(label(item))}</span><h2 id="detailTitle">${esc(item.title)}</h2><div class="detail-submeta"><span>${esc(item.source)}</span><span>•</span><span>${esc(dateTime(item.publishedAt,true))}</span>${isProj?`<span>•</span><span>آخر نشاط للمستودع</span>`:''}</div><p>${esc(item.description)}</p></div>${getCover(item,true)}${gallery?`<div class="gallery-strip">${gallery}</div>`:''}${spec}${renderEditorial(item)}<section class="detail-section"><h3>${isIdea?'لماذا يمكن بناء هذه الفكرة؟':'الأهمية والتأثير'}</h3><p>${esc(item.impact||'اقرأ المصدر الأصلي للتفاصيل الكاملة.')}</p></section><div class="detail-links">${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${isIdea?'افتح المشروع الملهم':isProj?'افتح المستودع على GitHub':'اقرأ الخبر من المصدر'} ↗</a>`:''}${translation}<button type="button" id="shareItem">نسخ رابط التفاصيل ↗</button><button type="button" id="saveInside">${favoriteExists(item.id)?'♥ محفوظ':'♡ احفظ للقراءة لاحقًا'}</button></div>${lists}<p class="detail-disclaimer">${isIdea?'هذه فكرة مقترحة وليست منتجًا منشورًا.':'العناوين والأوصاف مأخوذة من مصادر عامة. '}المؤشر الرائج تقريبي، والصور تظهر فقط عند توفرها في المصادر، وليست ضمانًا لصورة المنتج أو المشروع.</p>`;
    $('overlay').hidden=false;$('detailWrap').hidden=false;document.body.classList.add('body-locked');document.querySelector('.detail-panel')?.focus();
    $('detailContent').querySelectorAll('[data-gallery]').forEach(b=>b.addEventListener('click',()=>{const img=$('detailContent').querySelector('.detail-picture img');if(img){img.hidden=false;img.src=safeUrl(item.gallery[+b.dataset.gallery]);const caption=$('detailContent').querySelector('.picture-caption');if(caption)caption.textContent='صورة '+(+b.dataset.gallery+1)+' من README المشروع';}}));
    $('detailContent').querySelectorAll('.detail-picture img,.gallery-strip img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;const glyph=img.nextElementSibling;if(glyph?.classList.contains('card-glyph'))glyph.hidden=false;}));
    $('shareItem').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);toast('نُسخ رابط التفاصيل')}catch{toast('يمكنك نسخ الرابط من شريط العنوان')}});
    $('saveInside').addEventListener('click',()=>{toggleSaved(item.id);$('saveInside').textContent=favoriteExists(item.id)?'♥ محفوظ':'♡ احفظ للقراءة لاحقًا'});
    $('detailContent').querySelectorAll('[data-proposal-type]').forEach(b=>b.addEventListener('click',()=>showProposal(item,b.dataset.proposalType,+b.dataset.proposalIndex)));

  }
  function showProposal(project,type,index){
    const report=studyFor(project);const idea=(report[type]||[])[index];if(!idea)return;
    const links=(idea.sources||[]).filter(x=>safeUrl(x.url)).map(x=>`<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer">${esc(x.title)} ↗</a>`).join('');
    const steps=(idea.steps||[]).map((x,i)=>`<li><span>${i+1}</span><p>${esc(x)}</p></li>`).join('');
    const proposalId=`proposal:${project.id}:${type}:${index}`;
    history.replaceState(null,'','#item='+encodeURIComponent(proposalId));
    $('detailContent').innerHTML=`<div class="proposal-detail">
      <button type="button" class="proposal-back" id="backToProject">← العودة إلى مشروع ${esc(project.title)}</button>
      <div class="proposal-header"><span>${esc(religiousLabels[type])} · ${index+1}/${report[type].length}</span><h2 id="detailTitle">${esc(idea.title)}</h2><p>${esc(idea.problem)}</p></div>
      <div class="proposal-status ${report.reviewed?'verified':'exploratory'}">${report.reviewed?'مقترح خاص بالمشروع؛ راجع نطاق المراجعة أدناه':'دراسة استكشافية غير مدققة على مستوى الكود'}</div>
      <div class="proposal-columns"><section class="proposal-box"><h3>المشكلة والمستخدم المستفيد</h3><p>${esc(idea.problem)}</p></section><section class="proposal-box"><h3>الحل والنسخة الأولية MVP</h3><p>${esc(idea.approach)}</p></section>
      <section class="proposal-box"><h3>التقنيات والاعتماديات</h3><p>${esc(idea.stack)}</p></section><section class="proposal-box"><h3>مؤشر نجاح قابل للتحقق</h3><p>${esc(idea.metric)}</p></section>
      <section class="proposal-box"><h3>الصعوبة وتقدير الجهد</h3><p>${esc(idea.difficulty)}</p></section><section class="proposal-box"><h3>المخاطر والقيود</h3><p>${esc(idea.risks)}</p></section></div>
      <section class="proposal-steps"><h3>خطة بدء التنفيذ والاختبار</h3><ol>${steps}</ol></section>
      <section class="proposal-evidence"><h3>ما الذي تحققنا منه؟</h3><p>${esc(idea.confidence||report.verified)}</p><div class="proposal-links">${links}</div></section>
      ${type==='religious'?'<p class="religious-note">تنبيه: لا يُعد هذا المقترح فتوى، ولا يجوز اعتبار استنتاج نموذج ذكاء اصطناعي توثيقًا شرعيًا. اعرض النص الأصلي ومصدره وتحقق من حقوق استخدامه واستعن بمختص عند الحاجة.</p>':''}
      <div class="proposal-bottom"><button type="button" id="saveProposal">${favoriteExists(proposalId)?'♥ الفكرة محفوظة':'♡ حفظ هذه الفكرة'}</button><a href="${esc(safeUrl(project.url))}" target="_blank" rel="noopener noreferrer">مستودع المشروع الملهم ↗</a></div></div>`;
    $('overlay').hidden=false;$('detailWrap').hidden=false;document.body.classList.add('body-locked');
    document.querySelector('.detail-panel').scrollTop=0;document.querySelector('.detail-panel').focus();
    $('backToProject').addEventListener('click',()=>{openDetail(project.id);const el=$(`study-${type}`);el?.scrollIntoView({block:'nearest'});});
    $('saveProposal').addEventListener('click',()=>{if(state.saved.has(proposalId))state.saved.delete(proposalId);else state.saved.add(proposalId);persistSaved();$('saveProposal').textContent=favoriteExists(proposalId)?'♥ الفكرة محفوظة':'♡ حفظ هذه الفكرة';toast('تم تحديث المحفوظات')});
  }
  function closeDetail(restore=true){history.replaceState(null,'',location.pathname+location.search); $('overlay').hidden=true;$('detailWrap').hidden=true;document.body.classList.remove('body-locked');$('detailContent').innerHTML='';if(restore)state.lastActive?.focus?.()}
  function setView(view){state.view=view;state.chip='all';state.period=null;state.shown=9;render();$('newsSection').scrollIntoView({behavior:'smooth',block:'start'});$('sidebar').classList.remove('mobile-open');$('mobileMenu').setAttribute('aria-expanded','false');$('overlay').hidden=true}
  let fetching=false;
  async function fetchFeed(notify=false){
    if(fetching)return;fetching=true;$('refreshButton').disabled=true;
    try{
      async function optionalJson(file,fallback){const inline=document.getElementById({editorial:'bootstrapEditorial',status:'bootstrapStatus'}[file]);if(inline){try{return JSON.parse(inline.textContent)}catch{return fallback}}try{const r=await fetch('./data/'+file+'.json?fresh='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)return fallback;return await r.json()}catch{return fallback}}
      const [editorial,health]=await Promise.all([optionalJson('editorial',state.editorial),optionalJson('status',state.health)]);
      state.editorial=editorial;state.health=health;studyCache.clear();

      if(!state.research){
        const inlineResearch=document.getElementById('bootstrapResearch');
        if(inlineResearch)state.research=JSON.parse(inlineResearch.textContent);
      }
      if(!state.research){
        try{const rr=await fetch('./data/research.json?rev=3',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!rr.ok)throw Error('Research data');state.research=await rr.json()}catch(error){console.warn('Research catalog unavailable, using draft concepts',error);state.research={}}
      }

      const inline=document.getElementById('bootstrapData');
      let data;
      if(inline){data=JSON.parse(inline.textContent)}
      else{const r=await fetch('./data/feed.json?fresh='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);data=await r.json()}
      if(!Array.isArray(data.items))throw Error('bad feed');
      state.items=data.items.filter(x=>['news','project'].includes(x.kind) && x.id && safeUrl(x.url)).map(x=>{const e=editorialFor(x);return e?{...x,originalTitle:x.title,originalDescription:x.description,title:e.titleAr||x.title,description:e.summaryAr||x.description,editorial:e}:x});
      const languages=[...new Set(state.items.filter(x=>x.kind==='project').map(x=>x.language).filter(Boolean))].sort();
      $('languageFilter').innerHTML='<option value="all">كل اللغات</option>'+languages.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');$('languageFilter').value=state.language;
      state.generatedAt=data.generatedAt;state.demo=!!data.seedData;
      document.querySelector('.live-pill').innerHTML=state.demo?'<i></i> بيانات أولية — بانتظار أول مزامنة':'<i></i> تحديث تلقائي';
      render();
      const deepId=new URLSearchParams(location.hash.slice(1)).get('item');if(deepId&&$('detailWrap').hidden)openDetail(deepId);
      if(notify)toast(state.demo?'تم تحميل البيانات الأولية':'تم فحص آخر البيانات المنشورة');
    }catch(e){console.error('Feed load failed:',e);if(!state.items.length)$('feedGrid').innerHTML='<div class="empty"><b>تعذر تحميل المحتوى</b><p>راجع اتصالك أو أعد المحاولة.</p></div>';$('freshnessMessage').textContent='تعذر فحص التحديث؛ نحتفظ بآخر محتوى محمّل إن توفر.';toast('تعذّر تحديث الأخبار حاليًا')}finally{fetching=false;$('refreshButton').disabled=false;lastFetch=Date.now()}
  }
  function bind(){
    $('resetFilters').addEventListener('click',resetFilters);
    for(const [id,key] of [['dateFilter','days'],['regionFilter','region'],['languageFilter','language']])$(id).addEventListener('change',e=>{state[key]=e.target.value;state.shown=9;render()});
    $('reviewedFilter').addEventListener('change',e=>{state.reviewedOnly=e.target.checked;state.shown=9;render()});
    window.addEventListener('hashchange',()=>{const id=new URLSearchParams(location.hash.slice(1)).get('item');if(id)openDetail(id);else closeDetail()});
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
    $('imageOnly')?.addEventListener('click',()=>{state.imagesOnly=!state.imagesOnly;state.shown=9;render()});
    $('overlay').addEventListener('click',()=>{closeDetail();$('sidebar').classList.remove('mobile-open');$('mobileMenu').setAttribute('aria-expanded','false');$('overlay').hidden=true});
    $('closeDetail').addEventListener('click',()=>closeDetail());
    $('mobileMenu').addEventListener('click',()=>{$('sidebar').classList.toggle('mobile-open');$('overlay').hidden=!$('sidebar').classList.contains('mobile-open');$('mobileMenu').setAttribute('aria-expanded',String($('sidebar').classList.contains('mobile-open')))});
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){if(!$('detailWrap').hidden)closeDetail();else if($('sidebar').classList.contains('mobile-open')){$('sidebar').classList.remove('mobile-open');$('mobileMenu').setAttribute('aria-expanded','false');$('overlay').hidden=true}}
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
