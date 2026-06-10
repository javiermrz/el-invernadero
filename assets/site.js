/* ============================================================
   EL INVERNADERO · site.js
   Nav móvil · scroll reveal · acordeón · flujo de reserva · Ajustes
   Sin dependencias. localStorage protegido con try/catch.
   ============================================================ */
(function(){
  'use strict';

  /* ---------- almacenamiento seguro ---------- */
  var mem = {};
  var store = {
    get:function(k){ try{ return localStorage.getItem(k); }catch(e){ return (k in mem)?mem[k]:null; } },
    set:function(k,v){ try{ localStorage.setItem(k,v); }catch(e){ mem[k]=v; } }
  };

  /* ---------- nav móvil ---------- */
  function initNav(){
    var btn = document.querySelector('.hamburguesa');
    if(!btn) return;
    btn.addEventListener('click', function(){
      document.body.classList.toggle('menu-abierto');
      var open = document.body.classList.contains('menu-abierto');
      btn.setAttribute('aria-expanded', open ? 'true':'false');
    });
    document.querySelectorAll('.nav-movil a').forEach(function(a){
      a.addEventListener('click', function(){ document.body.classList.remove('menu-abierto'); });
    });
    // sombra al hacer scroll
    var barra = document.querySelector('.barra');
    if(barra){
      var onScroll = function(){
        if(window.scrollY > 12){ barra.style.boxShadow = '0 8px 24px -18px rgba(21,41,29,.5)'; }
        else { barra.style.boxShadow = 'none'; }
      };
      window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
    }
  }

  /* ---------- scroll reveal (estado base visible; oculta lo que está fuera de vista) ---------- */
  function initReveal(){
    var els = [].slice.call(document.querySelectorAll('.reveal'));
    if(!els.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce) return; // se quedan visibles
    var h = window.innerHeight || document.documentElement.clientHeight;
    // ocultar solo lo que está por debajo del pliegue
    var pendientes = [];
    els.forEach(function(el){
      if(el.getBoundingClientRect().top > h){ el.classList.add('oculto'); pendientes.push(el); }
    });
    var ticking = false;
    function check(){
      ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for(var i=pendientes.length-1;i>=0;i--){
        if(pendientes[i].getBoundingClientRect().top < vh*0.88){
          pendientes[i].classList.remove('oculto'); pendientes.splice(i,1);
        }
      }
    }
    function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(check); } }
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll, {passive:true});
    // red de seguridad
    setTimeout(function(){ pendientes.forEach(function(e){ e.classList.remove('oculto'); }); pendientes.length=0; }, 2600);
  }

  /* ---------- acordeón ---------- */
  function initAcordeon(){
    document.querySelectorAll('.acordeon__cab').forEach(function(cab){
      cab.addEventListener('click', function(){
        var item = cab.closest('.acordeon__item');
        var cuerpo = item.querySelector('.acordeon__cuerpo');
        var abierto = item.classList.toggle('abierto');
        cab.setAttribute('aria-expanded', abierto?'true':'false');
        cuerpo.style.maxHeight = abierto ? (cuerpo.scrollHeight + 'px') : '0px';
      });
    });
  }

  /* ---------- idioma (placeholder EN) ---------- */
  function initIdioma(){
    document.querySelectorAll('[data-idioma]').forEach(function(b){
      b.addEventListener('click', function(){
        if(b.dataset.idioma === 'en'){
          var prev = b.textContent;
          b.textContent = 'Soon';
          setTimeout(function(){ b.textContent = prev; }, 1300);
        }
      });
    });
  }

  /* ---------- flujo de reserva (paso 1: elegir menú → página interna con iframe) ---------- */
  var COVER = 'https://www.covermanager.com/reservation/module_restaurant/el-invernadero/spanish';
  var MENU_LABELS = {
    'Vegetalia':'Vegetalia · 158 €',
    'VegetaliaExperience':'Vegetalia Experience · 218 €',
    'Gastrobotanica':'Gastrobotánica · 168 €',
    'GastrobotanicaExperience':'Gastrobotánica Experience · 228 €'
  };
  function initReserva(){
    var root = document.querySelector('[data-reserva]');
    if(!root) return;
    var estado = { source:'' };
    var cta = root.querySelector('[data-r="cta"]');

    root.querySelectorAll('[data-grupo="menu"] .opcion').forEach(function(o){
      o.addEventListener('click', function(){
        root.querySelectorAll('[data-grupo="menu"] .opcion').forEach(function(x){ x.classList.remove('sel'); });
        o.classList.add('sel');
        estado.source = o.dataset.source || '';
        if(cta){ cta.removeAttribute('disabled'); cta.dataset.source = estado.source; }
      });
    });
    if(cta){
      cta.addEventListener('click', function(){
        var s = estado.source;
        window.location.href = 'reserva.html' + (s ? ('?source='+encodeURIComponent(s)) : '');
      });
    }
    // preselección desde URL (?menu=Vegetalia)
    try{
      var qs = new URLSearchParams(window.location.search);
      var pm = qs.get('menu');
      if(pm){
        var match = root.querySelector('[data-grupo="menu"] .opcion[data-source="'+pm+'"]');
        if(match) match.click();
      }
    }catch(e){}
  }

  /* ---------- página interna del iframe de CoverManager ---------- */
  function initCoverIframe(){
    var f = document.querySelector('[data-cover]');
    if(!f) return;
    var source = '';
    try{ source = new URLSearchParams(window.location.search).get('source') || ''; }catch(e){}
    f.src = COVER + (source ? ('?source='+encodeURIComponent(source)) : '');
    var lbl = document.querySelector('[data-cover-label]');
    if(lbl){
      if(source && MENU_LABELS[source]){ lbl.textContent = MENU_LABELS[source]; }
      else { lbl.textContent = 'Reserva general'; }
    }
    window.addEventListener('message', function(e){
      if(!e.data) return;
      var h = null;
      if(typeof e.data === 'number'){ h = e.data; }
      else if(typeof e.data === 'object'){
        h = e.data.height || e.data.frameHeight || e.data.iframeHeight || null;
      }
      if(h && h > 100){ f.style.height = h + 'px'; f.style.minHeight = '0'; }
    }, false);
  }

  /* ---------- AJUSTES (panel propio) ---------- */
  var DEFAULTS = { verde:'#2f8b4e', acento:'#c25e3a', serif:'Newsreader', azulejo:'1', botanica:'1' };
  var SERIFS = {
    'Newsreader':"'Newsreader',Georgia,serif",
    'Cormorant':"'Cormorant Garamond',Georgia,serif",
    'Spectral':"'Spectral',Georgia,serif"
  };
  function aplicar(cfg){
    var r = document.documentElement.style;
    r.setProperty('--verde-azulejo', cfg.verde);
    // derivar verde oscuro
    r.setProperty('--terracota', cfg.acento);
    r.setProperty('--serif', SERIFS[cfg.serif] || SERIFS.Newsreader);
    r.setProperty('--azulejo-intensidad', cfg.azulejo);
    document.body.classList.toggle('sin-botanica', cfg.botanica === '0');
  }
  function leerCfg(){
    var c = {};
    Object.keys(DEFAULTS).forEach(function(k){ c[k] = store.get('inv_'+k) || DEFAULTS[k]; });
    return c;
  }
  function guardar(k,v){ store.set('inv_'+k, v); }

  function initAjustes(){
    var cfg = leerCfg();
    aplicar(cfg);
    var btn = document.querySelector('.ajustes-btn');
    var panel = document.querySelector('.ajustes');
    if(!btn || !panel) return;

    btn.addEventListener('click', function(){
      var open = panel.classList.toggle('abierto');
      btn.setAttribute('aria-expanded', open?'true':'false');
    });
    document.addEventListener('click', function(e){
      if(panel.classList.contains('abierto') && !panel.contains(e.target) && !btn.contains(e.target)){
        panel.classList.remove('abierto');
      }
    });

    // swatches verde / acento
    panel.querySelectorAll('[data-swatch]').forEach(function(sw){
      var key = sw.dataset.swatch;
      sw.querySelectorAll('button').forEach(function(b){
        if(b.dataset.val === cfg[key]) b.classList.add('on');
        b.addEventListener('click', function(){
          sw.querySelectorAll('button').forEach(function(x){x.classList.remove('on');});
          b.classList.add('on');
          cfg[key]=b.dataset.val; guardar(key,b.dataset.val); aplicar(cfg);
        });
      });
    });
    // segmentos (serif / botánica)
    panel.querySelectorAll('[data-seg]').forEach(function(seg){
      var key = seg.dataset.seg;
      seg.querySelectorAll('button').forEach(function(b){
        if(b.dataset.val === cfg[key]) b.classList.add('on');
        b.addEventListener('click', function(){
          seg.querySelectorAll('button').forEach(function(x){x.classList.remove('on');});
          b.classList.add('on');
          cfg[key]=b.dataset.val; guardar(key,b.dataset.val); aplicar(cfg);
        });
      });
    });
    // slider azulejo
    var slider = panel.querySelector('[data-slider="azulejo"]');
    if(slider){
      slider.value = Math.round(parseFloat(cfg.azulejo)*10);
      slider.addEventListener('input', function(){
        var v = (slider.value/10).toString();
        cfg.azulejo=v; guardar('azulejo',v); aplicar(cfg);
      });
    }
    // reset
    var reset = panel.querySelector('.ajustes__reset');
    if(reset){
      reset.addEventListener('click', function(){
        cfg = Object.assign({}, DEFAULTS);
        Object.keys(DEFAULTS).forEach(function(k){ guardar(k, DEFAULTS[k]); });
        aplicar(cfg);
        // refrescar UI del panel
        panel.querySelectorAll('[data-swatch] button,[data-seg] button').forEach(function(b){
          var key = b.parentElement.dataset.swatch || b.parentElement.dataset.seg;
          b.classList.toggle('on', b.dataset.val === DEFAULTS[key]);
        });
        if(slider) slider.value = Math.round(parseFloat(DEFAULTS.azulejo)*10);
      });
    }
  }

  /* ---------- arranque ---------- */
  function init(){
    initNav(); initReveal(); initAcordeon(); initIdioma(); initReserva(); initCoverIframe(); initAjustes();
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
