(() => {
  'use strict';
  const plans = window.SITE_PRICING;
  if (!plans || !Array.isArray(plans)) return;
  const $ = id => document.getElementById(id);
  const money = number => `${number.toLocaleString('ru-RU')} ₽`;
  const form = $('calculator-form');
  let activeId = null;
  let scope = null;
  let extras = new Set();
  const completed = new Set();
  let notesSkipped = false;
  const plan = () => plans.find(p => p.id === activeId) || null;
  const checkedValue = name => form.querySelector(`input[name="${name}"]:checked`)?.value || 'Не\u00a0указано';
  function total(){const p=plan();return p ? p.base + p.extras.filter(e=>extras.has(e[0])).reduce((sum,e)=>sum+e[2],0) : null}
  function renderTypes(){
    $('site-types').replaceChildren(...plans.map(p => {
      const label=document.createElement('label');label.className='site-option';
      const radio=document.createElement('input');radio.type='radio';radio.name='site-type';radio.value=p.id;radio.checked=p.id===activeId;
      radio.addEventListener('change',()=>{activeId=p.id;scope=null;extras=new Set();completed.add(1);completed.delete(2);completed.delete(4);render()});
      const content=document.createElement('span');content.className='site-option-inner';
      const header=document.createElement('span');header.className='option-top';
      const name=document.createElement('span');name.className='option-name';name.textContent=p.name;
      const mark=document.createElement('span');mark.className='radio-mark';mark.setAttribute('aria-hidden','true');header.append(name,mark);
      const desc=document.createElement('span');desc.className='option-description';desc.textContent=p.description;
      const price=document.createElement('span');price.className='option-price';price.textContent=`от\u00a0${money(p.base)}`;
      content.append(header,desc,price);label.append(radio,content);return label;
    }));
  }
  function renderScope(){
    $('scale-options').replaceChildren(...(plan()?.scales || []).map((name,index)=>{
      const label=document.createElement('label');label.className='choice-option';
      const input=document.createElement('input');input.type='radio';input.name='scope';input.value=String(index);input.checked=index===scope;
      input.addEventListener('change',()=>{scope=index;completed.add(2);updateSummary()});
      const text=document.createElement('span');text.textContent=name;label.append(input,text);return label;
    }));
    $('scale-help').textContent=!activeId?'Сначала выберите тип сайта в\u00a0первом разделе.':activeId==='multi'?'Сколько страниц предполагается?':activeId==='showcase'||activeId==='shop'?'Сколько товаров планируется разместить?':'Какой объём информации нужно разместить?';
  }
  function renderExtras(){
    $('extra-options').replaceChildren(...(plan()?.extras || []).map(([id,name,cost])=>{
      const label=document.createElement('label');label.className='extra-option';
      const input=document.createElement('input');input.type='checkbox';input.value=id;input.checked=extras.has(id);
      input.addEventListener('change',()=>{input.checked?extras.add(id):extras.delete(id);completed.add(4);updateSummary()});
      const inner=document.createElement('span');inner.className='extra-option-inner';
      const left=document.createElement('span');left.className='extra-option-left';
      const mark=document.createElement('span');mark.className='check-mark';mark.setAttribute('aria-hidden','true');
      const title=document.createElement('span');title.textContent=name;left.append(mark,title);
      const amount=document.createElement('span');amount.className='extra-cost';amount.textContent=`+${money(cost)}`;
      inner.append(left,amount);label.append(input,inner);return label;
    }));
  }
  function updateSummary(){
    const p=plan();
    $('summary-type').textContent=p?.name || 'Не\u00a0выбран';$('base-price').textContent=p ? money(p.base) : '—';
    $('total-price').textContent=p ? `от\u00a0${money(total())}` : 'Выберите тип сайта';$('mobile-total').textContent=p ? `от\u00a0${money(total())}` : 'Выберите тип сайта';
    const extraRows=(p?.extras || []).filter(e=>extras.has(e[0])).map(e=>{
      const row=document.createElement('div');row.className='summary-row';
      const label=document.createElement('span');label.textContent=e[1];
      const amount=document.createElement('strong');amount.textContent=`+${money(e[2])}`;
      row.append(label,amount);return row;
    });
    $('summary-extras').replaceChildren(...extraRows);
    updateProgress();
    $('included-title').textContent=p?.name || 'Выберите тип сайта';
    $('included-list').replaceChildren(...(p?.included || []).map(text=>{const li=document.createElement('li');li.textContent=text;return li}));
  }
  function updateProgress(){
    const amount=completed.size*20;
    $('progress-fill').style.width=`${amount}%`;
    $('progress-percent').textContent=`${amount}%`;
    $('progress-track').setAttribute('aria-valuenow',String(amount));
    $('progress-caption').textContent=amount===100?'Все пять шагов завершены':`${completed.size} из\u00a05 шагов завершено`;
  }
  function render(){renderTypes();renderScope();renderExtras();$('no-extras').disabled=!plan();updateSummary()}
  form.addEventListener('change', event=>{
    if(event.target.matches('input[name="texts"], input[name="photos"]')){
      if(form.dataset.textsTouched==='true' && form.dataset.photosTouched==='true')completed.add(3);
      if(event.target.name==='texts')form.dataset.textsTouched='true';
      if(event.target.name==='photos')form.dataset.photosTouched='true';
      if(form.dataset.textsTouched==='true' && form.dataset.photosTouched==='true')completed.add(3);
      updateProgress();
    }
  });
  $('no-extras').addEventListener('click',()=>{if(!plan())return;extras.clear();completed.add(4);renderExtras();updateSummary();$('no-extras').textContent='Без\u00a0дополнительных услуг ✓'});
  $('project-notes').addEventListener('input',()=>{
    notesSkipped=false;
    $('skip-status').textContent='';
    if($('project-notes').value.trim())completed.add(5);else completed.delete(5);
    updateProgress();
  });
  $('skip-notes').addEventListener('click',()=>{
    notesSkipped=true;completed.add(5);$('skip-status').textContent='Шаг отмечен как завершённый без\u00a0комментария.';updateProgress();
  });
  function briefText(){
    const p=plan();const chosen=(p?.extras || []).filter(e=>extras.has(e[0]));
    const notes=$('project-notes').value.trim();
    return ['ПРЕДВАРИТЕЛЬНЫЙ БРИФ ПРОЕКТА','',`Тип сайта: ${p?.name || 'Не\u00a0выбран'}`,`Масштаб: ${scope === null ? 'Не\u00a0указан' : p?.scales[scope] || 'Не\u00a0указан'}`,`Тексты: ${checkedValue('texts')}`,`Изображения: ${checkedValue('photos')}`,'','Дополнительные услуги:',...(chosen.length?chosen.map(e=>`• ${e[1]}: +${money(e[2])}`):['• Не\u00a0выбраны']),'',`Базовая стоимость: ${p ? money(p.base) : 'Не\u00a0определена'}`,`Предварительная стоимость: ${p ? 'от\u00a0'+money(total()) : 'Не\u00a0определена'}`,`Особенности проекта: ${notes || 'Не\u00a0указаны'}`,'','ВНИМАНИЕ: расчёт демонстрационный, доплаты условные. Итоговая стоимость уточняется после обсуждения задачи.'].join('\n');
  }
  const dialog=$('brief-dialog');
  function openBrief(){ $('brief-text').textContent=briefText();$('copy-status').textContent='';if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','') }
  $('show-brief').addEventListener('click',openBrief);$('mobile-brief').addEventListener('click',openBrief);
  $('close-brief').addEventListener('click',()=>dialog.close());$('back-brief').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
  $('copy-brief').addEventListener('click',async()=>{
    const text=briefText();
    try{
      if(navigator.clipboard?.writeText && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw Error('Clipboard unavailable')}
      $('copy-status').textContent='Сводка скопирована.';
    }catch{ $('copy-status').textContent='Не\u00a0удалось скопировать автоматически. Выделите текст сводки и\u00a0скопируйте вручную.' }
  });
  form.addEventListener('reset',event=>{event.preventDefault();form.querySelectorAll('input[type=radio],input[type=checkbox]').forEach(input=>input.checked=false);completed.clear();notesSkipped=false;form.dataset.textsTouched='';form.dataset.photosTouched='';$('skip-status').textContent='';$('no-extras').textContent='Дополнительные услуги не\u00a0нужны';activeId=null;scope=null;extras=new Set();$('project-notes').value='';render()});
  const storageKey='site-calculator-theme';
  function getSavedTheme(){try{return localStorage.getItem(storageKey)}catch{return null}}
  function saveTheme(theme){try{localStorage.setItem(storageKey,theme)}catch{}}
  const preferred=getSavedTheme()|| (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  function setTheme(theme){document.documentElement.dataset.theme=theme;$('theme-icon').textContent=theme==='dark'?'☀':'☾';$('theme-name').textContent=theme==='dark'?'Светлая тема':'Тёмная тема';$('theme-toggle').setAttribute('aria-label',`Включить ${theme==='dark'?'светлую':'тёмную'} тему`)}
  setTheme(preferred);$('theme-toggle').addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';setTheme(next);saveTheme(next)});
  render();
})();
