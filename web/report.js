(function(){
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  var el=document.getElementById('postsdata');
  if(!el) return;
  var raw=(el.textContent||'').trim();
  var lines=raw?raw.split('\n'):[];
  var topics={},chans={},total=0;
  lines.forEach(function(ln){
    if(!ln.trim())return;
    var parts=ln.split('§');
    var t=(parts[0]||'').trim()||'Khác';
    var c=(parts[1]||'').trim();
    topics[t]=(topics[t]||0)+1; total++;
    if(c){chans[c]=(chans[c]||0)+1;}
  });
  function sortE(o){return Object.keys(o).map(function(k){return [k,o[k]];}).sort(function(a,b){return b[1]-a[1];});}
  // ---- Chủ đề ----
  var ct=document.getElementById('chude');
  if(ct){
    var te=sortE(topics);
    if(!te.length){ct.innerHTML='<div class="muted">Chưa có dữ liệu sản xuất trong kỳ.</div>';}
    else{
      ct.innerHTML=te.map(function(e){
        var pct=total?Math.round(e[1]/total*100):0;
        return '<div class="kpi-row"><div class="kpi-name">'+esc(e[0])+'</div>'
          +'<div class="kpi-track"><div class="kpi-fill" style="width:'+pct+'%;background:#0ea5e9"></div></div>'
          +'<div class="kpi-val">'+e[1]+' bài <span class="pp" style="background:#0ea5e9">'+pct+'%</span></div></div>';
      }).join('');
    }
  }
  // ---- Kênh đăng ----
  var ck=document.getElementById('kenh');
  if(ck){
    var ce=sortE(chans);
    if(!ce.length){ck.innerHTML='<div class="muted">Chưa ghi nhận kênh đăng trong kỳ.</div>';}
    else{
      var totC=ce.reduce(function(s,e){return s+e[1];},0);
      ck.innerHTML='<table><thead><tr><th>Kênh đăng</th><th style="text-align:right">Số bài</th></tr></thead><tbody>'
        +ce.map(function(e){return '<tr><td>'+esc(e[0])+'</td><td style="text-align:right"><b style="color:#0f2c54">'+e[1]+'</b></td></tr>';}).join('')
        +'<tr><td style="font-weight:700">Tổng đã đăng</td><td style="text-align:right;font-weight:700">'+totC+'</td></tr></tbody></table>';
    }
  }
})();
