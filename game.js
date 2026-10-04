
const CAKES=[{"id":"su-kem","name":"Bánh su kem","cost":8,"price":18,"profit":10,"file":"assets/su-kem.png","unlockDay":1},{"id":"donut","name":"Bánh donut","cost":10,"price":24,"profit":14,"file":"assets/donut.png","unlockDay":3},{"id":"cupcake","name":"Cupcake","cost":9,"price":25,"profit":16,"file":"assets/cupcake.png","unlockDay":5},{"id":"tart-trung","name":"Bánh tart trứng","cost":12,"price":29,"profit":17,"file":"assets/tart-trung.png","unlockDay":7},{"id":"croissant","name":"Croissant","cost":10,"price":27,"profit":17,"file":"assets/croissant.png","unlockDay":9},{"id":"panna-cotta","name":"Panna Cotta","cost":14,"price":35,"profit":21,"file":"assets/panna-cotta.png","unlockDay":11},{"id":"macaron","name":"Macaron","cost":11,"price":31,"profit":20,"file":"assets/macaron.png","unlockDay":13},{"id":"tiramisu","name":"Tiramisu","cost":16,"price":39,"profit":23,"file":"assets/tiramisu.png","unlockDay":15},{"id":"red-velvet","name":"Red Velvet","cost":18,"price":45,"profit":27,"file":"assets/red-velvet.png","unlockDay":12}];
const SKINS=[{"id":"classic","name":"Basic","file":"assets/cabinet_skins/classic.png","cost":0,"attract":0,"durability":35},{"id":"kitten","name":"Kitten","file":"assets/cabinet_skins/kitten.png","cost":1000,"attract":5,"durability":45},{"id":"puppy","name":"Puppy","file":"assets/cabinet_skins/puppy.png","cost":1000,"attract":5,"durability":60},{"id":"cow","name":"Cow","file":"assets/cabinet_skins/cow.png","cost":1500,"attract":8,"durability":70},{"id":"ocean","name":"Ocean","file":"assets/cabinet_skins/ocean.png","cost":2000,"attract":12,"durability":80},{"id":"luxury","name":"Luxury","file":"assets/cabinet_skins/luxury.png","cost":3000,"attract":15,"durability":99}];
let shopName='Tiệm Bánh Mộng Mơ',money=300,level=1,combo=0,served=0,missed=0,sold=0,day=1;
let rating=3.5;
// Mỗi lô bánh có ngày nhập riêng, hạn dùng 3 ngày kể từ ngày nhập.
let batches=Object.fromEntries(CAKES.map(c=>[c.id,[]]));
let stock=Object.fromEntries(CAKES.map(c=>[c.id,0]));
let expiredHandledDay=0;
let order=[],orderSeconds=30,maxOrderSeconds=30,gameMinutes=8*60,lastT=0,running=false,shopOpen=false,currentSkin=SKINS[0],orderExpired=false;
let queue=[],arrivalWait=3,goodSinceReview=0,dayServed=0,reviewCount=0,loopToken=0,earlyClosedDay=false;
let revenueHistory=[], salesHistory=[], customerForecastTomorrow=40, pendingBeggarReward=false, beggarAccepted=false, eventShownToday=false;
let cabinetEventTimer=30,cabinetEventBusy=false,repairTimer=20,repairInterval=null,repairSelected=null,repairPairsDone=0,repairWires=[],lastBillingDay=0;
const CUSTOMER_TYPES={easy:{name:'Khách dễ tính',icon:'🙂',chance:55},hard:{name:'Khách khó tính',icon:'😤',chance:40},vip:{name:'Khách VIP',icon:'👑',chance:5}};
const typeMessages={easy:'Không sao, ai cũng mắc sai lầm mà.',hard:'Thế mà cũng làm sai hừ!',vip:'Tôi là khách VIP — làm nhanh giúp tôi nhé!'};
function pickCustomerType(){const r=Math.random()*100;return r<55?'easy':r<95?'hard':'vip'}
function forecastCustomers(dayNum){return 38+Math.floor(Math.random()*6)}
function recordSale(c,qty,amount){let row=salesHistory.find(x=>x.day===dayNumSafe()&&x.id===c.id);if(!row){row={day:dayNumSafe(),id:c.id,name:c.name,qty:0,revenue:0};salesHistory.push(row)}row.qty+=qty;row.revenue+=amount;revenueHistory.push({day:dayNumSafe(),id:c.id,name:c.name,amount,qty,time:Date.now()})}
function dayNumSafe(){return day}
function periodSales(period){const start=period==='day'?day:period==='week'?Math.max(1,day-6):Math.max(1,day-29);const rows={};for(const r of salesHistory)if(r.day>=start&&r.day<=day){rows[r.id]??={name:r.name,qty:0,revenue:0};rows[r.id].qty+=r.qty;rows[r.id].revenue+=r.revenue}return Object.values(rows).sort((a,b)=>b.qty-a.qty)}
function revenueSummary(){return {day:periodSales('day'),week:periodSales('week'),month:periodSales('month')}}
function customerLabel(c){return CUSTOMER_TYPES[c.type]?.icon+' '+CUSTOMER_TYPES[c.type]?.name||'Khách'}

const $=id=>document.getElementById(id),cakeById=id=>CAKES.find(c=>c.id===id);
const people=['👩 Mai','👨 Nam','👩 Linh','🧑 An','👵 Bà Lan','👨 Minh','👩 Vy','🧑 Khách VIP','🧒 Bông','👩 Cô Hạnh'];
const commentsGood=['Bánh ngon, tủ trưng bày xinh quá!','Phục vụ nhanh và đúng món, 5 sao nhé!','Vị bánh tuyệt vời, lần sau mình quay lại.','Tiệm dễ thương, mình rất hài lòng!','Đóng gói cẩn thận, bánh còn tươi.'];
const commentsBad=['Mình phải chờ hơi lâu…','Tiệm cần chú ý đơn hàng hơn nhé.','Hôm nay chưa được hài lòng lắm.','Mình gọi món khác mà tiệm lại đưa nhầm bánh.','Hết bánh đúng lúc mình gọi, hơi thất vọng.','Bánh không còn tươi nên mình không hài lòng.'];

let audioCtx=null,musicMaster=null,musicTimer=null,musicOn=true,musicStep=0;
function ensureAudio(){
 if(audioCtx)return;
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 audioCtx=new AC();musicMaster=audioCtx.createGain();musicMaster.gain.value=.045;musicMaster.connect(audioCtx.destination);
}
function playTone(freq,duration,type='sine',gain=.04,when=0){
 if(!audioCtx||!musicOn)return;
 const now=audioCtx.currentTime+when,osc=audioCtx.createOscillator(),g=audioCtx.createGain();
 osc.type=type;osc.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);
 g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),now+.035);
 g.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(g);g.connect(musicMaster);osc.start(now);osc.stop(now+duration+.05);
}
function doorChime(){if(!audioCtx||!musicOn)return;playTone(659.25,.28,'sine',.11,0);playTone(783.99,.38,'triangle',.08,.10)}
function playMusicBar(){
 if(!audioCtx||!musicOn)return;
 const chords=[[261.63,329.63,392,493.88],[220,261.63,329.63,392],[174.61,220,261.63,329.63],[196,246.94,293.66,392]];
 const chord=chords[musicStep++%chords.length];
 chord.forEach((f,i)=>playTone(f,.95,'triangle',.025,i*.07));
 playTone(chord[0]/2,1.6,'sine',.035,0);
 [0,1,2,1].forEach((idx,i)=>playTone(chord[idx],.42,'sine',.018,i));
}
function startMusic(){ensureAudio();if(!audioCtx)return;if(audioCtx.state==='suspended')audioCtx.resume();musicOn=true;if(!musicTimer){playMusicBar();musicTimer=setInterval(playMusicBar,4000)}const b=$('musicBtn');if(b)b.textContent='🎵 Nhạc: Bật'}
function stopMusic(){musicOn=false;if(musicTimer){clearInterval(musicTimer);musicTimer=null}const b=$('musicBtn');if(b)b.textContent='🔇 Nhạc: Tắt'}
function toggleMusic(){ensureAudio();if(musicOn)stopMusic();else startMusic()}
function isCakeUnlocked(c){return day>=c.unlockDay}
function moneyText(){$('money').textContent=Math.floor(money);$('level').textContent=level;$('combo').textContent=combo;$('dayNumber').textContent=day;$('durability').textContent=currentSkin.durability}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),1400)}
function log(t){const d=document.createElement('div');d.textContent=t;$('log').prepend(d)}
function setRating(delta,why){rating=Math.max(0,Math.min(5,Math.round((rating+delta)*10)/10));$('rating').textContent=rating.toFixed(1);$('stars').textContent='★'.repeat(Math.floor(rating))+(rating%1>=.5?'½':'')+'☆'.repeat(5-Math.ceil(rating));$('ratingBar').style.width=(rating/5*100)+'%';if(why)log((delta>0?'⭐ ':'⚠️ ')+why+' ('+(delta>0?'+':'')+delta.toFixed(1)+'★)');if(rating<2.5)lose('💥 Tiệm bị phốt')}
function syncStock(){for(const c of CAKES)stock[c.id]=(batches[c.id]||[]).reduce((n,b)=>n+b.qty,0)}
function renderCakes(){
 syncStock();
 $('cakes').innerHTML=CAKES.map(c=>{
  const unlocked=isCakeUnlocked(c);
  const soon=(batches[c.id]||[]).filter(b=>b.bornDay+3===day+1).reduce((n,b)=>n+b.qty,0);
  const expired=(batches[c.id]||[]).filter(b=>day>=b.bornDay+3).reduce((n,b)=>n+b.qty,0);
  const status=!unlocked?`🔒 Mở từ ngày ${c.unlockDay}`:(expired?`⚠️ Quá hạn: ${expired}`:soon?`⏳ Mai hết hạn: ${soon}`:'🥐 Còn hạn');
  return `<button class="cake ${unlocked?'':'cake-locked'}" onclick="serve('${c.id}')" ${!shopOpen||!unlocked?'disabled':''}><span class="stock">${unlocked?'x'+stock[c.id]:'🔒'}</span><img src="${c.file}" alt="${c.name}"><b>${c.name}</b><span class="price">${c.price} xu · lãi ${c.profit}</span><span class="muted">${status}</span></button>`;
 }).join('');
}
function renderTable(){$('priceTable').innerHTML=CAKES.map(c=>`<tr><td>${c.name}</td><td>${c.cost}</td><td>${c.price}</td><td class="profit">+${c.profit}</td><td>${isCakeUnlocked(c)?'Đã mở':'Ngày '+c.unlockDay}</td></tr>`).join('')}
function renderSkins(){$('skinList').innerHTML=SKINS.map(s=>{const owned=s.id==='classic'||localStorage.getItem('owned_'+s.id)==='1',equipped=currentSkin.id===s.id;return `<div class="skin ${equipped?'equipped':''} ${owned?'':'locked'}"><img src="${s.file}" alt="${s.name}"><strong>${s.name}</strong><small>🧲 +${s.attract}% khách · 🛡️ Độ bền ${s.durability}%</small><small>${s.cost===0?'Miễn phí':s.cost+' xu'}</small><button onclick="buySkin('${s.id}')">${equipped?'✓ Đang dùng':owned?'Trang bị':s.cost+' xu'}</button></div>`}).join('')}
function buySkin(id){const s=SKINS.find(x=>x.id===id),owned=id==='classic'||localStorage.getItem('owned_'+id)==='1';if(!owned){if(money<s.cost){toast('Chưa đủ tiền mua skin.');return}money-=s.cost;localStorage.setItem('owned_'+id,'1');log('🪟 Mua tủ '+s.name+' với '+s.cost+' xu.')}currentSkin=s;$('cabinet').src=s.file;$('cabinetName').textContent='Tủ bánh • '+s.name;$('attract').textContent=s.attract;$('durability').textContent=s.durability;renderSkins();moneyText();toast('Tủ bánh đã đổi skin ✨')}
function startGame(){const n=$('shopInput').value.trim();if(n)shopName=n;ensureAudio();startMusic();doorChime();$('shopTitle').textContent=shopName;$('start').style.display='none';$('setup').style.display='flex';updateStarterCost();$('starterQty').focus()}
function updateStarterCost(){const qty=Math.max(1,Math.min(30,Math.floor(Number($('starterQty').value)||1)));$('starterQty').value=qty;const total=qty*8;$('starterCost').textContent='Chi phí: '+total+' xu · Còn lại: '+(300-total)+' xu'}
function confirmStarterStock(){const qty=Math.max(1,Math.min(30,Math.floor(Number($('starterQty').value)||0)));const total=qty*8;if(total>300){toast('Số lượng bánh su kem vượt quá 300 xu.');return}money=300-total;batches=Object.fromEntries(CAKES.map(c=>[c.id,[]]));batches['su-kem']=[{qty,bornDay:1}];syncStock();$('setup').style.display='none';moneyText();renderCakes();log('📦 Nhập lô khởi đầu: '+qty+' Bánh su kem, vốn '+total+' xu.');openShop()}
function openShop(){syncStock();shopOpen=true;running=true;customerForecastTomorrow=forecastCustomers(day+1);$('end').style.display='none';$('loseActions').style.display='none';$('dayActions').style.display='block';$('endTitle').textContent='Hết ngày!';gameMinutes=8*60;arrivalWait=2+Math.random()*5;cabinetEventTimer=30;cabinetEventBusy=false;order=[];queue=[];orderSeconds=30;$('customer').textContent='Đang chờ khách...';$('bubble').textContent='Khách sẽ ghé tiệm theo từng khung giờ. Chuẩn bị bánh nhé!';$('order').innerHTML='';$('orderTime').textContent='30';renderQueue();renderCakes();lastT=performance.now();loopToken++;requestAnimationFrame(t=>loop(t,loopToken));log('🚪 Ngày '+day+': '+shopName+' mở cửa lúc 08:00.')}
$('starterQty')?.addEventListener('input',updateStarterCost)
function closeShop(){if(!shopOpen)return;shopOpen=false;running=false;loopToken++;order=[];queue=[];renderQueue();renderCakes();showDayEnd()}
function showDayEnd(){ if(!chargeFixedCosts())return; $('endIcon').textContent=earlyClosedDay?'⚠️':'🌙';$('endTitle').textContent=earlyClosedDay?'Tiệm đóng cửa sớm':'Tiệm đã đóng cửa';$('summary').innerHTML=(earlyClosedDay?'⚠️ <b>Tiệm đã bán hết toàn bộ bánh nên phải đóng cửa sớm.</b><br>Danh tiếng bị trừ <b>0,3 sao</b> vì khách không thể tiếp tục mua hàng.<br><br>':'Ngày '+day+' kết thúc!<br><br>')+'<b>'+shopName+'</b> đã phục vụ <b>'+dayServed+'</b> khách, bán <b>'+sold+'</b> chiếc bánh và hiện có <b>'+Math.floor(money)+' xu</b>.<br>Danh tiếng: <b>'+rating.toFixed(1)+' sao ⭐</b>.<br>📅 Dự kiến ngày mai có khoảng <b>~'+customerForecastTomorrow+' khách</b>.<br><br>Kiểm tra bánh sắp hết hạn và dùng bảng doanh thu để tham khảo lượng nhập.';$('eventActions').style.display='none';$('dayActions').style.display='block';renderAnalytics();renderExpiryManagement();renderRestockChoices();$('end').style.display='flex';if(money<=0)lose('💸 Phá sản!')}
function nextDay(){if(shopOpen)return;day++;dayServed=0;earlyClosedDay=false;eventShownToday=false;customerForecastTomorrow=forecastCustomers(day+1);moneyText();syncStock();if(money<=0){lose('💸 Phá sản!');return}openShop();triggerDayEvents();toast('🌅 Ngày '+day+' bắt đầu!')}
function renderExpiryManagement(){const rows=[];for(const c of CAKES){const qty=(batches[c.id]||[]).filter(b=>b.bornDay+3===day+1).reduce((n,b)=>n+b.qty,0);if(qty)rows.push(`<div class="expiry-row"><span><b>${c.name}</b><br><small>⏳ ${qty} chiếc hết hạn ngày mai</small></span><span><button class="secondary" onclick="discardSoon('${c.id}')">🗑️ Bỏ bánh</button><button onclick="keepSoon('${c.id}')">📦 Giữ bán</button></span></div>`)}$('expiryManagement').innerHTML=rows.length?`<h3>⏳ Bánh sắp hết hạn</h3><p class="muted">Bánh quá 3 ngày sẽ hết hạn. Giữ lại thì vẫn có thể bán, nhưng mỗi chiếc hết hạn bán ra sẽ bị -0,5 sao và nhận bình luận tiêu cực.</p><div class="expiry-list">${rows.join('')}</div>`:'<p class="muted">✨ Không có bánh nào hết hạn vào ngày mai.</p>'}
function discardSoon(id){const arr=batches[id]||[];let removed=0;batches[id]=arr.filter(b=>{if(b.bornDay+3===day+1){removed+=b.qty;return false}return true});syncStock();renderCakes();renderExpiryManagement();renderRestockChoices();log(`🗑️ Đã bỏ ${removed} ${cakeById(id).name} sắp hết hạn.`);toast(`Đã bỏ ${removed} bánh sắp hết hạn.`)}
function keepSoon(id){toast(`Đã giữ ${cakeById(id).name}. Nhớ bán trước khi hết hạn nhé!`);log(`📦 Giữ lại ${cakeById(id).name} sắp hết hạn để bán tiếp.`);const rows=document.querySelectorAll('#expiryManagement .expiry-row');rows.forEach(r=>{if(r.textContent.includes(cakeById(id).name)){const btns=r.querySelectorAll('button');btns.forEach(b=>b.disabled=true);r.style.opacity='.6'}})}
function renderAnalytics(){
 const box=$('analyticsBox');if(!box)return;const sums=revenueSummary();
 const render=(label,rows)=>{const total=rows.reduce((n,r)=>n+r.revenue,0);const top=rows[0];return `<div style="margin-top:8px"><b>${label}</b> · ${total} xu</div>`+(top?`<div class="muted">🏆 Best seller: <b>${top.name}</b> · ${top.qty} chiếc · ${top.revenue} xu</div>`:'<div class="muted">Chưa có dữ liệu bán hàng.</div>')+rows.slice(0,5).map(r=>`<div style="display:flex;justify-content:space-between;font-size:12px"><span>${r.name}</span><span>${r.qty} chiếc · ${r.revenue} xu</span></div>`).join('')};
 box.innerHTML='<b>📈 Doanh thu & Best Seller</b>'+render('Hôm nay',sums.day)+render('7 ngày gần nhất',sums.week)+render('30 ngày gần nhất',sums.month);
}
function renderRestockChoices(){
 if(shopOpen)return;
 const rows=CAKES.map(c=>!isCakeUnlocked(c)
  ?`<div class="restock-row locked-row"><span><b>${c.name}</b><br><small>🔒 Mở khóa vào <b>ngày ${c.unlockDay}</b> · Chưa thể nhập hàng</small></span><label class="locked-input">🔒</label></div>`
  :`<div class="restock-row"><span><b>${c.name}</b><br><small>Vốn ${c.cost} xu/chiếc · còn ${stock[c.id]} · bán ${c.price} xu</small></span><label>Nhập <input type="number" min="0" max="99" value="0" id="buy-${c.id}"></label></div>`).join('');
 $('restockChoices').innerHTML=`<h3>📦 Nhập hàng theo nhu cầu</h3><p class="muted">📅 Dự kiến ngày mai: <b>~${customerForecastTomorrow} khách</b>. Mỗi loại bánh mở khóa theo <b>ngày cố định</b>. Chỉ bánh đã mở khóa mới có thể nhập và bán. Số tiền dự kiến: <b id="restockTotal">0 xu</b>.</p><div class="unlock-roadmap">${CAKES.map(c=>`<span class="${isCakeUnlocked(c)?'unlocked':''}">${isCakeUnlocked(c)?'✓':'🔒'} ${c.name}: ngày ${c.unlockDay}</span>`).join('')}</div><div class="restock-list">${rows}</div><button class="secondary" onclick="restockSelected()">📦 Nhập các loại đã chọn</button>`;
 CAKES.filter(isCakeUnlocked).forEach(c=>{const el=$('buy-'+c.id);if(el)el.addEventListener('input',updateRestockTotal)});
 updateRestockTotal();
}
function updateRestockTotal(){let total=0;for(const c of CAKES)if(isCakeUnlocked(c))total+=c.cost*Math.max(0,Math.min(99,Math.floor(Number($('buy-'+c.id)?.value||0))));const el=$('restockTotal');if(el)el.textContent=total+' xu'}
function restockSelected(){
 if(shopOpen){toast('🔒 Hãy đóng cửa tiệm trước khi nhập hàng!');return}
 let total=0,plan={};
 for(const c of CAKES){const qty=isCakeUnlocked(c)?Math.max(0,Math.min(99,Math.floor(Number($('buy-'+c.id)?.value||0)))):0;plan[c.id]=qty;total+=qty*c.cost}
 if(!Object.values(plan).some(q=>q>0)){toast('Hãy chọn một loại bánh đã mở khóa để nhập.');return}
 if(money<total){toast(`Không đủ vốn! Cần ${total} xu, bạn có ${Math.floor(money)} xu.`);return}
 money-=total;for(const c of CAKES)if(plan[c.id]>0)batches[c.id].push({qty:plan[c.id],bornDay:day});
 syncStock();renderCakes();moneyText();log(`📦 Nhập hàng chọn lọc, tổng vốn ${total} xu.`);renderRestockChoices();toast(`Đã nhập hàng với ${total} xu.`);if(money<=0)lose('💸 Phá sản!')}
function newCustomer(){
 const available=CAKES.filter(c=>isCakeUnlocked(c)&&(stock[c.id]||0)>0);
 const pool=available.length?available:CAKES.filter(isCakeUnlocked);
 const type=pickCustomerType();
 const count=type==='vip'?Math.min(pool.length,2+Math.floor(Math.random()*2)):Math.min(pool.length,Math.random()<.7?1:2);
 const chosen=[];while(chosen.length<count){const id=pool[Math.floor(Math.random()*pool.length)].id;if(!chosen.includes(id))chosen.push(id)}
 const person=people[Math.floor(Math.random()*people.length)];
 const items=chosen.map(id=>({id,qty:type==='vip'?2+Math.floor(Math.random()*3):1+(Math.random()<.2?1:0),done:0}));
 return {person, type, items, patience:type==='vip'?35:30,maxPatience:type==='vip'?35:30};
}
function spawnCustomer(){if(!shopOpen)return;if(!CAKES.some(c=>isCakeUnlocked(c)&&(stock[c.id]||0)>0))return;queue.push(newCustomer());ensureAudio();doorChime();if(!order.length)takeNextCustomer();renderQueue()}
function takeNextCustomer(){if(!shopOpen||order.length||!queue.length)return;const customer=queue.shift();order=customer.items;orderExpired=false;orderSeconds=customer.patience;maxOrderSeconds=customer.maxPatience;window.currentCustomerType=customer.type;$('customer').textContent=customer.person+' '+CUSTOMER_TYPES[customer.type].icon+' đang gọi món';$('bubble').textContent=(customer.type==='vip'?'👑 VIP: Tôi lấy ':'Cho tôi ')+order.map(o=>o.qty+' '+cakeById(o.id).name).join(' và ')+' nhé!';renderOrder();renderQueue()}
function renderQueue(){$('queue').innerHTML=`<span>🧍 Hàng chờ: ${queue.length} khách</span>`+queue.slice(0,4).map((c,i)=>`<span>${i+1}. ${c.person} · ⏳ ${Math.ceil(c.patience)}s</span>`).join('')}
function renderOrder(){$('order').innerHTML=order.map(o=>`<div class="mini ${o.done>=o.qty?'ok':''}">${o.done>=o.qty?'✓':'○'} ${cakeById(o.id).name} ${o.done}/${o.qty}</div>`).join('')}
function addReview(good,person,customMsg){const msg=customMsg||((good?commentsGood:commentsBad)[Math.floor(Math.random()*(good?commentsGood:commentsBad).length)]);const d=document.createElement('div');d.innerHTML=`<b>${good?'⭐️⭐️⭐️⭐️⭐️':'⭐️⭐️⭐️'} ${person}</b><br>${msg}`;const box=$('reviews');if(reviewCount===0)box.innerHTML='';box.prepend(d);reviewCount++;while(box.children.length>12)box.removeChild(box.lastChild)}
function serve(id){
 if(!shopOpen||!running)return;
 const cake=cakeById(id);if(!cake||!isCakeUnlocked(cake)){toast('🔒 '+(cake?cake.name:'Loại bánh này')+' chưa mở khóa.');return;}
 if(!order.length){toast('Chưa có khách gọi món, chờ một chút nhé!');return;}
 const currentType=window.currentCustomerType||'easy';
 const customerName=$('customer').textContent.replace(/ đang gọi món.*/,''), type=CUSTOMER_TYPES[currentType];
 const item=order.find(o=>o.id===id&&o.done<o.qty);
 if(!item){
   combo=0;goodSinceReview=0;orderSeconds=Math.max(0,orderSeconds-5);$('orderTime').textContent=Math.ceil(orderSeconds);
   toast('Lấy sai bánh! -5 giây kiên nhẫn ⏱️');
   if(currentType==='easy'){addReview(true,customerName,typeMessages.easy);toast('🙂 Không sao, ai cũng mắc sai lầm mà.');}
   else if(currentType==='hard'){addReview(false,customerName,typeMessages.hard);setRating(-.25,'Khách khó tính không hài lòng vì lấy sai bánh');order=[];missed++;toast('😤 Thế mà cũng làm sai hừ! Khách bỏ về.');}
   else {addReview(true,customerName,'Khách VIP thông cảm vì nhầm bánh, nhưng mong tiệm chú ý hơn nhé.');setRating(-.05,'Khách VIP thông cảm vì nhầm bánh');}
   moneyText();return;
 }
 if(stock[id]<=0){
   orderSeconds=Math.max(0,orderSeconds-5);$('orderTime').textContent=Math.ceil(orderSeconds);
   toast('⚠️ Hết bánh! Hãy xin lỗi khách hàng. -5 giây kiên nhẫn');
   if(currentType==='easy'){addReview(true,customerName,typeMessages.easy);$('bubble').textContent='🙏 Xin lỗi bạn, món này vừa hết. Cảm ơn bạn đã thông cảm!';}
   else if(currentType==='hard'){addReview(false,customerName,'Hết bánh mà cũng không báo trước, thế mà cũng làm sai hừ!');setRating(-.25,'Khách khó tính thất vọng vì hết bánh');order=[];missed++;toast('😤 Khách khó tính bỏ về vì hết bánh.');}
   else {addReview(true,customerName,'Khách VIP chấp nhận lời xin lỗi nhưng mong tiệm chuẩn bị đủ hàng.');setRating(.05,'Khách VIP thông cảm khi hết bánh');}
   moneyText();return;
 }
 const lots=batches[id]||[];lots.sort((a,b)=>a.bornDay-b.bornDay);const lot=lots.find(b=>b.qty>0);if(!lot){toast('⚠️ Hết bánh! Xin lỗi khách hàng nhé.');return;}
 const isExpired=day>=lot.bornDay+3;lot.qty--;batches[id]=lots.filter(b=>b.qty>0);syncStock();item.done++;sold++;combo++;money+=cake.profit;
 recordSale(cake,1,cake.price);renderAnalytics();
 if(isExpired){orderExpired=true;setRating(-.5,'Bán '+cake.name+' đã hết hạn');log('⚠️ Bán bánh hết hạn: '+cake.name+' (-0,5 sao).')}
 renderCakes();renderOrder();moneyText();
 if(money<=0){lose('💸 Phá sản!');return}
 if(order.every(o=>o.done>=o.qty)){
   const customerName2=$('customer').textContent.replace(/ đang gọi món.*/,''), ct=CUSTOMER_TYPES[currentType];
   let bonus=6+Math.min(combo,10);
   if(currentType==='vip'){const vipBonus=20+Math.floor(Math.random()*21);bonus+=vipBonus;money+=vipBonus;setRating(.2,'Khách VIP thưởng thêm '+vipBonus+' xu');log('👑 Khách VIP mua nhiều và thưởng thêm '+vipBonus+' xu!');}
   money+=bonus;served++;dayServed++;
   if(orderExpired){addReview(false,customerName2,'Bánh đã hết hạn, mình không hài lòng!');goodSinceReview=0}
   else if(currentType==='hard'){addReview(true,customerName2,'Đơn hàng đúng món nhưng mình vẫn hơi khó tính nhé.');setRating(.05,'Khách khó tính mua hàng đúng món');}
   else {goodSinceReview++;addReview(true,customerName2,currentType==='vip'?'Dịch vụ ổn, tôi sẽ quay lại!':undefined);setRating(currentType==='vip'?.2:.1,currentType==='vip'?'Khách VIP hài lòng':'Khách hài lòng với đơn hàng');if(goodSinceReview>=3){goodSinceReview=0;setRating(.1,'3 khách liên tiếp được phục vụ tốt')}}
   if(served%5===0){level++;log('🌟 Lên cấp '+level+'.')}
   order=[];window.currentCustomerType=null;renderOrder();moneyText();renderQueue();setTimeout(()=>{if(shopOpen)takeNextCustomer()},350);toast(orderExpired?'Đơn xong nhưng khách không hài lòng 😕':currentType==='vip'?'👑 VIP đã mua nhiều và thưởng thêm!':'Đơn xong! Khách hài lòng 🎉');
   if(!CAKES.some(c=>(stock[c.id]||0)>0)){closeEarlyBecauseSoldOut();return}
 }
}
function cabinetFailureChance(){return 0.35*Math.max(0.01,1-(currentSkin.durability/100));}
function spoilCabinetCakes(){syncStock();let total=0,spoiled=0;for(const c of CAKES){const qty=stock[c.id]||0;if(!qty)continue;const bad=Math.min(qty,Math.ceil(qty*0.6));let left=bad;const lots=(batches[c.id]||[]).sort((a,b)=>a.bornDay-b.bornDay);for(const lot of lots){if(left<=0)break;const take=Math.min(lot.qty,left);lot.qty-=take;left-=take;spoiled+=take;}batches[c.id]=lots.filter(b=>b.qty>0);total+=qty}syncStock();if(spoiled){log('⚡ Tủ mất điện quá lâu: '+spoiled+' chiếc bánh bị hỏng.');addReview(false,'Khách bị ảnh hưởng bởi sự cố','Tủ mất điện làm bánh không còn tươi, mình hơi thất vọng.');setRating(-.2,'Bánh bị hỏng do tủ mất điện');toast('⚡ Tủ mất điện! '+spoiled+' bánh đã bị hỏng.');}renderCakes();}
function startCabinetFailure(){if(!shopOpen||cabinetEventBusy||!CAKES.some(c=>(stock[c.id]||0)>0))return;cabinetEventBusy=true;running=false;loopToken++;repairTimer=20;repairSelected=null;repairPairsDone=0;const colors=['🔴 Đỏ','🔵 Xanh dương','🟢 Xanh lá'];repairWires=[...colors,...colors].sort(()=>Math.random()-.5).map((color,i)=>({color,id:i,done:false}));$('repairOverlay').style.display='flex';renderRepairWires();clearInterval(repairInterval);repairInterval=setInterval(()=>{repairTimer--;if($('repairTimer'))$('repairTimer').textContent=repairTimer;if(repairTimer<=0){clearInterval(repairInterval);repairInterval=null;$('repairOverlay').style.display='none';cabinetEventBusy=false;spoilCabinetCakes();if(shopOpen){running=true;lastT=performance.now();loopToken++;requestAnimationFrame(t=>loop(t,loopToken));}}},1000);log('⚡ Tủ bánh bị mất điện! Cần sửa trong 20 giây.');toast('⚡ Tủ mất điện! Nhanh tay nối dây!');}
function renderRepairWires(){const grid=$('repairGrid');grid.innerHTML=repairWires.map((w,i)=>`<button class="wire ${w.done?'done':''}" onclick="selectRepairWire(${i})">${w.color}<br><small>Đầu dây ${i+1}</small></button>`).join('');}
function selectRepairWire(i){const w=repairWires[i];if(!w||w.done)return;if(repairSelected===null){repairSelected=i;document.querySelectorAll('#repairGrid .wire')[i]?.classList.add('selected');return}if(repairSelected===i)return;const a=repairWires[repairSelected];if(a.color===w.color){a.done=true;w.done=true;repairPairsDone++;repairSelected=null;renderRepairWires();if(repairPairsDone===3)finishCabinetRepair();}else{toast('❌ Sai màu! Hãy nối hai đầu cùng màu.');repairSelected=null;renderRepairWires();}}
function finishCabinetRepair(){clearInterval(repairInterval);repairInterval=null;$('repairOverlay').style.display='none';cabinetEventBusy=false;log('🔧 Đã sửa tủ thành công trước khi bánh bị hỏng.');toast('🔧 Sửa tủ thành công! Bánh vẫn được bảo quản.');if(shopOpen){running=true;lastT=performance.now();loopToken++;requestAnimationFrame(t=>loop(t,loopToken));}}
function processCabinetEvent(dt){if(!shopOpen||cabinetEventBusy)return;cabinetEventTimer-=dt;if(cabinetEventTimer<=0){cabinetEventTimer=30;if(Math.random()<cabinetFailureChance())startCabinetFailure();}}
function chargeFixedCosts(){if(day%30!==0||lastBillingDay===day)return true;lastBillingDay=day;const rent=4000,electric=1000,total=5000;if(money<total){log('🏠 Đến kỳ thanh toán: cần 5.000 xu nhưng chỉ có '+Math.floor(money)+' xu.');lose('💸 Không đủ tiền mặt bằng & điện');return false}money-=total;moneyText();log('🏠 Đã trả mặt bằng 4.000 xu + tiền điện 1.000 xu = 5.000 xu.');toast('🏠 Đã thanh toán 5.000 xu chi phí cố định.');return true;}
function showEvent(title,html,buttons){running=false;$('endIcon').textContent='🎲';$('endTitle').textContent=title;$('summary').innerHTML=html;$('dayActions').style.display='none';$('eventActions').innerHTML=buttons;$('eventActions').style.display='block';$('loseActions').style.display='none';$('end').style.display='flex';}
function triggerDayEvents(){
 if(day>=7 && day===7 && !eventShownToday){eventShownToday=true;showEvent('🥺 Một người ăn xin ghé tiệm','Một người ăn xin đứng trước cửa tiệm. Bạn có muốn cho họ một ít tiền không?','<button onclick="helpBeggar()">💰 Cho 50 xu</button><button class="secondary" onclick="skipBeggar()">🚪 Không cho</button>');return;}
 if(day===12 && pendingBeggarReward){pendingBeggarReward=false;showEvent('🎁 Lời báo đáp','Người ăn xin ngày trước quay lại và gửi bạn <b>500 xu</b> để báo đáp lòng tốt!','<button onclick="claimBeggarReward()">✨ Nhận 500 xu</button>');return;}
 if(Math.random()<0.18 && day!==12){showEvent('📣 Food Reviewer ghé tiệm','Một food reviewer nổi tiếng vừa ghé và đăng một bài review không tốt về quán. Bạn bị trừ <b>100 xu</b>.','<button onclick="acceptReviewerEvent()">😔 Đành chịu</button>');}
}
function helpBeggar(){if(money<50){toast('Bạn không đủ 50 xu để giúp.');return}money-=50;pendingBeggarReward=true;beggarAccepted=true;moneyText();log('🤲 Bạn đã giúp người ăn xin 50 xu.');closeEvent();toast('🤲 Bạn đã giúp một người.');}
function skipBeggar(){log('🚪 Bạn không cho tiền người ăn xin. Không có ảnh hưởng xấu.');closeEvent();}
function claimBeggarReward(){money+=500;moneyText();log('🎁 Người ăn xin báo đáp: +500 xu.');toast('🎁 +500 xu! Lòng tốt được đền đáp.');closeEvent();}
function acceptReviewerEvent(){money=Math.max(0,money-100);moneyText();log('📣 Food Reviewer review xấu: -100 xu.');toast('📣 Review xấu! -100 xu');if(money<=0){lose('💸 Phá sản!');return}closeEvent();}
function closeEvent(){ $('end').style.display='none';$('eventActions').style.display='none';$('eventActions').innerHTML='';$('dayActions').style.display='block';if(shopOpen){running=true;lastT=performance.now();loopToken++;requestAnimationFrame(t=>loop(t,loopToken));renderCakes();renderQueue();}}
function gameClockText(){const h=Math.floor(gameMinutes/60),m=Math.floor(gameMinutes%60);return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
function lose(title){running=false;shopOpen=false;loopToken++;$('eventActions').style.display='none';$('dayActions').style.display='none';$('endIcon').textContent='💥';$('endTitle').textContent=title;$('summary').innerHTML='Đánh giá tiệm còn <b>'+rating.toFixed(1)+' sao</b>. Dưới 2,5 sao là bị phốt!<br><br><b>'+shopName+'</b> đã bán '+sold+' chiếc bánh và có '+Math.floor(money)+' xu.<br><br>Đừng nản — bạn có thể nhập lại lô bánh khởi đầu và thử mở tiệm lại.';$('dayActions').style.display='none';$('loseActions').style.display='block';$('end').style.display='flex'}
function restartGame(){stopMusic();musicStep=0;revenueHistory=[];salesHistory=[];pendingBeggarReward=false;beggarAccepted=false;lastBillingDay=0;money=300;earlyClosedDay=false;level=1;combo=0;served=0;missed=0;sold=0;day=1;rating=3.5;batches=Object.fromEntries(CAKES.map(c=>[c.id,[]]));stock=Object.fromEntries(CAKES.map(c=>[c.id,0]));order=[];queue=[];goodSinceReview=0;dayServed=0;reviewCount=0;expiredHandledDay=0;orderExpired=false;$('reviews').innerHTML='<small>Chưa có đánh giá nào.</small>';$('log').innerHTML='';moneyText();setRating(0,'');$('end').style.display='none';$('loseActions').style.display='none';$('setup').style.display='flex';updateStarterCost();toast('🔄 Tiệm đã sẵn sàng để bắt đầu lại!')}
function closeEarlyBecauseSoldOut(){if(!shopOpen||earlyClosedDay)return;earlyClosedDay=true;shopOpen=false;running=false;loopToken++;order=[];queue=[];goodSinceReview=0;setRating(-.3,'Bán hết toàn bộ bánh và phải đóng cửa sớm');addReview(false,'Khách cuối ngày','Tiệm bán hết bánh sớm nên mình không mua được nữa.');renderQueue();renderOrder();renderCakes();toast('⚠️ Đã bán hết bánh! Tiệm đóng cửa sớm (-0,3 sao).');showDayEnd()}
function finishDay(){if(!shopOpen)return;shopOpen=false;running=false;loopToken++;order=[];queue=[];renderQueue();renderCakes();showDayEnd()}
function arrivalDelay(){const h=Math.floor(gameMinutes/60);let min=7,max=16;if(h>=7&&h<10){min=4;max=9}else if(h>=11&&h<14){min=3;max=7}else if(h>=16&&h<19){min=3;max=6}else if(h>=19&&h<21){min=5;max=10}const attraction=1+currentSkin.attract/100;return (min+Math.random()*(max-min))/attraction}
function loop(t,token){if(!running||token!==loopToken)return;const dt=Math.min((t-lastT)/1000,.25);lastT=t;gameMinutes+=dt*(14*60/240);if(gameMinutes>=22*60){gameMinutes=22*60;$('gameClock').textContent=gameClockText();finishDay();return}$('gameClock').textContent=gameClockText();processCabinetEvent(dt);if(cabinetEventBusy)return;arrivalWait-=dt;if(arrivalWait<=0){if(queue.length<5)spawnCustomer();arrivalWait=arrivalDelay()}if(order.length){orderSeconds-=dt;$('orderTime').textContent=Math.ceil(Math.max(0,orderSeconds));$('bar').style.width=(Math.max(0,orderSeconds)/maxOrderSeconds*100)+'%';if(orderSeconds<=0){const name=$('customer').textContent.replace(/ [🙂😤👑] đang gọi món.*/,'');missed++;combo=0;goodSinceReview=0;addReview(false,name,CUSTOMER_TYPES[window.currentCustomerType]?.name+' bỏ đi vì hết kiên nhẫn.');setRating(window.currentCustomerType==='hard'?-0.3:-.2,'Khách bỏ đi vì hết kiên nhẫn');toast('Khách bỏ đi vì chờ lâu! 😬');order=[];window.currentCustomerType=null;$('customer').textContent='Khách tiếp theo';$('bubble').textContent='Phục vụ nhanh và chính xác để giữ danh tiếng nhé!';renderOrder();takeNextCustomer()}}if(!CAKES.some(c=>(stock[c.id]||0)>0)){closeEarlyBecauseSoldOut();return}queue.forEach(c=>c.patience=Math.max(0,c.patience-dt));const left=queue.filter(c=>c.patience>0);if(left.length<queue.length){const gone=queue.length-left.length;for(let i=0;i<gone;i++){addReview(false,'Khách rời hàng');setRating(-.1,'Khách trong hàng chờ bỏ đi')}queue=left}renderQueue();requestAnimationFrame(tt=>loop(tt,token))}
$('attract').textContent='0';renderCakes();renderTable();renderSkins();moneyText();renderAnalytics();setRating(0,'');$('dayActions').style.display='block';
