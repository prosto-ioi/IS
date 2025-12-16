const loggedInUserId = localStorage.getItem('loggedInUserId');

if (!loggedInUserId) {
  // Если пользователь не авторизован — возвращаем на страницу входа
  window.location.href = "index.html";
}

const storageKey = 'mybiz_crm_v2_corp';
const defaultData = {
  clients:[
    {id:1,name:'Аружан Б.',company:'Tarlan Co',contact:'aruzhan@tarlan.kz',last:'2025-10-08',status:'Активный',notes:'Крупный клиент в г. Алматы'},
    {id:2,name:'Нургали С.',company:'Sultan Logistics',contact:'nurgali@sultan.kz',last:'2025-09-30',status:'Лид',notes:'Интересовался интеграцией бухгалтерии'},
    {id:3,name:'Айшат Т.',company:'KazFarm',contact:'aishat@kazfarm.kz',last:'2025-10-01',status:'Активный',notes:'Нужна поддержка 24/7'}
  ],
  tasks:[{id:1,title:'Позвонить Аружан',due:'2025-10-15',assignee:'Нургали',status:'В прогрессе'}],
  deals:{leads:[],negotiation:[],closed:[]},
  activities:[],
  settings:{theme:'light',role:'Admin',emailNotif:false}
};

function logoutUser() {
    localStorage.setItem('loggedIn', 'false');
    alert('Вы вышли из системы.');
    window.location.href = "index.html";
}
  

function load(){const s = localStorage.getItem(storageKey); return s? JSON.parse(s): defaultData}
function save(data){localStorage.setItem(storageKey,JSON.stringify(data));}
let store = load();

// --- Navigation ---
document.querySelectorAll('.menu button').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.menu button').forEach(x=>x.classList.remove('active'));
  btn.classList.add('active');
  const page = btn.getAttribute('data-page');
  document.querySelectorAll('main section').forEach(s=>s.style.display='none');
  document.getElementById('page-'+page).style.display='block';
  refreshAll();
}));

// --- KPIs and activity ---
function refreshKPIs(){
  document.getElementById('kpiClients').textContent = store.clients.length;
  document.getElementById('kpiTasks').textContent = store.tasks.filter(t=>t.status!=='Завершено').length;
  const revenue = store.deals.closed.reduce((s,d)=>s + Number(d.value||0),0);
  document.getElementById('kpiRevenue').textContent = '$' + revenue.toLocaleString();
}
function refreshActivity(){const node=document.getElementById('activityList');node.innerHTML=''; store.activities.slice(-10).reverse().forEach(a=>{const div=document.createElement('div');div.style.padding='10px 0';div.textContent=a;node.appendChild(div);});}

// --- Charts ---
let salesChart=null, reportChart=null;
function renderCharts(){
  const ctx = document.getElementById('salesChart').getContext('2d');
  const months=['Май','Июн','Июл','Авг','Сен','Окт'];
  const data = months.map((m,i)=> store.deals.closed.filter((d,idx)=> (idx%6)===i).reduce((s,x)=>s+Number(x.value||0),0) );
  if(salesChart) salesChart.destroy();
  salesChart = new Chart(ctx,{type:'line',data:{labels:months,datasets:[{label:'Доход',data,fill:true}]},options:{responsive:true,plugins:{legend:{display:false}}}});

  const ctx2 = document.getElementById('reportChart').getContext('2d');
  const counts = [store.clients.length, store.tasks.length, store.deals.closed.length];
  if(reportChart) reportChart.destroy();
  reportChart = new Chart(ctx2,{type:'bar',data:{labels:['Клиенты','Задачи','Закрытые сделки'],datasets:[{label:'Сводка',data:counts}]},options:{responsive:true,plugins:{legend:{display:false}}}});
}

// --- Clients renderers ---
function renderClientsTable(filter=''){
  const tbody=document.getElementById('clientsTableBody');tbody.innerHTML='';
  store.clients.filter(c=> (c.name+c.company+c.status).toLowerCase().includes(filter.toLowerCase())).forEach(c=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `<td><strong>${c.name}</strong></td><td>${c.company}</td><td>${c.contact}</td><td>${c.last}</td><td><span style="font-weight:600;color:${c.status.toLowerCase().includes('лид')? '#a16207' : '#105f20'}">${c.status}</span></td><td>
  <button data-id="${c.id}" class="btn ghost editClient">Редакт</button>
  <button data-id="${c.id}" class="btn ghost viewClient">Открыть</button>
  <button data-id="${c.id}" class="btn ghost deleteClient" style="color:#dc2626;">Удалить</button>
</td>
`;
    tbody.appendChild(tr);
  });
  attachClientButtons();
}

function renderClientsCards(filter=''){
  const node=document.getElementById('clientsCards');node.innerHTML='';
  store.clients.filter(c=> (c.name+c.company+c.status).toLowerCase().includes(filter.toLowerCase())).forEach(c=>{
    const d=document.createElement('div');d.className='client-card';
    d.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:700">${c.name}</div><div style="font-size:13px;color:var(--muted)">${c.company}</div></div><div style="text-align:right"><div style="font-weight:700;color:var(--accent)">$</div></div></div><div style="margin-top:8px;font-size:13px;color:${c.status.toLowerCase().includes('лид')? '#a16207':'#105f20'}">${c.status}</div>`;
    node.appendChild(d);
  });
}

function renderSplitList(){const list=document.getElementById('splitList');list.innerHTML=''; store.clients.forEach(c=>{const it=document.createElement('div');it.className='client-item';it.textContent=`${c.name} — ${c.company}`;it.onclick=()=>{document.querySelectorAll('.client-item').forEach(x=>x.classList.remove('active'));it.classList.add('active');showClientDetail(c);};list.appendChild(it);});}

function showClientDetail(c){const d=document.getElementById('splitDetail');d.innerHTML = `<h3>${c.name}</h3><p><strong>Компания:</strong> ${c.company}</p><p><strong>Контакт:</strong> ${c.contact}</p><p><strong>Статус:</strong> ${c.status}</p><p><strong>Последнее взаимодействие:</strong> ${c.last}</p><hr><p><strong>Заметки:</strong></p><textarea id="notes-${c.id}" style="width:100%;height:120px;border-radius:8px;padding:8px;border:1px solid #eef2f6">${c.notes||''}</textarea><div style="margin-top:12px;display:flex;gap:8px"><button class="btn" onclick="saveNotes(${c.id})">Сохранить заметки</button><button class="btn ghost" onclick="createTaskForClient(${c.id})">Создать задачу</button></div>`;}

window.saveNotes = function(id){const el=document.getElementById('notes-'+id);const client=store.clients.find(c=>c.id===id);client.notes=el.value;store.activities.push(`Заметки обновлены для ${client.name} — ${new Date().toISOString().slice(0,10)}`);save(store);refreshAll();alert('Заметки сохранены');}
window.createTaskForClient = function(id){const client=store.clients.find(c=>c.id===id);const title=prompt('Краткое название задачи для '+client.name);if(!title) return;const t={id:Date.now(),title,due:new Date().toISOString().slice(0,10),assignee:store.tasks[0]?store.tasks[0].assignee:'Нургали',status:'Запланировано'};store.tasks.push(t);store.activities.push(`Новая задача для ${client.name}: ${title}`);save(store);refreshAll();}

function attachClientButtons(){document.querySelectorAll('.viewClient').forEach(b=>b.addEventListener('click',e=>{const id=Number(b.getAttribute('data-id'));const c=store.clients.find(x=>x.id===id);showClientDetail(c);document.getElementById('view-split').style.display='block';document.getElementById('view-table').style.display='none';document.getElementById('view-cards').style.display='none';}));
  document.querySelectorAll('.editClient').forEach(b=>b.addEventListener('click',e=>{const id=Number(b.getAttribute('data-id'));editClient(id);})); attachDeleteButtons();}
  function editClient(id){
    const client = store.clients.find(c=>c.id===id);
    const name = prompt("Имя клиента:", client.name);
    if(!name) return;
    const company = prompt("Компания:", client.company);
    const contact = prompt("Контакт:", client.contact);
    const status = prompt("Статус:", client.status);
    client.name=name; client.company=company; client.contact=contact; client.status=status;
    store.activities.push(`Клиент обновлён: ${client.name}`);
    save(store);
    refreshAll();
  }

  function attachDeleteButtons(){
    document.querySelectorAll('.deleteClient').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id = Number(btn.getAttribute('data-id'));
        if(confirm("Удалить этого клиента?")){
          store.clients = store.clients.filter(c=>c.id!==id);
          store.activities.push(`Клиент удалён (ID: ${id})`);
          save(store);
          refreshAll();
          addNotif("Клиент был удалён");
        }
      });
    });
  }

  // --- Добавление клиента ---
  document.getElementById('addClient').addEventListener('click',()=>{
    const name = prompt("Имя клиента:");
    if(!name) return;
    const company = prompt("Компания:");
    const contact = prompt("Контакт:");
    const status = prompt("Статус (например: Лид, Активный):","Лид");
    const newClient = {id:Date.now(),name,company,contact,status,last:new Date().toISOString().slice(0,10),notes:''};
    store.clients.push(newClient);
    store.activities.push(`Добавлен новый клиент: ${name}`);
    save(store);
    addNotif(`Добавлен новый клиент: ${name}`);
    refreshAll();
  });

  // --- Фильтрация клиентов ---
  document.getElementById('clientFilter').addEventListener('input',e=>{
    const filter = e.target.value;
    renderClientsTable(filter);
    renderClientsCards(filter);
  });

  // --- Переключение видов клиентов ---
  document.querySelectorAll('.view-toggle button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const view = btn.dataset.view;
      document.querySelectorAll('#view-table,#view-cards,#view-split').forEach(v=>v.style.display='none');
      document.getElementById('view-'+view).style.display='block';
      if(view==='split') renderSplitList();
    });
  });

  // --- Экспорт и импорт CSV ---
  document.getElementById('exportCsv').addEventListener('click',()=>{
    const header="Имя,Компания,Контакт,Статус\n";
    const rows=store.clients.map(c=>`${c.name},${c.company},${c.contact},${c.status}`).join("\n");
    const blob=new Blob([header+rows],{type:"text/csv;charset=utf-8;"});
    const link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download="clients.csv";
    link.click();
  });

  document.getElementById('csvImport').addEventListener('change',e=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=function(evt){
      const lines=evt.target.result.split("\n").slice(1);
      lines.forEach(l=>{
        const [name,company,contact,status]=l.split(",");
        if(name){
          store.clients.push({id:Date.now()+Math.random(),name,company,contact,status,last:new Date().toISOString().slice(0,10),notes:''});
        }
      });
      store.activities.push("Импорт клиентов из CSV");
      save(store);
      refreshAll();
    };
    reader.readAsText(file);
  });

  // --- Задачи ---
  function renderTasks(){
    const tbody=document.getElementById('tasksBody');tbody.innerHTML='';
    store.tasks.forEach(t=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`
  <td>${t.title}</td>
  <td>${t.due}</td>
  <td>${t.assignee}</td>
  <td>${t.status}</td>
  <td><button data-id="${t.id}" class="btn ghost deleteTask" style="color:#dc2626;">Удалить</button></td>
`;
      tbody.appendChild(tr);
    });
    attachTaskDeleteButtons();
  }

  function attachTaskDeleteButtons(){
    document.querySelectorAll('.deleteTask').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id = Number(btn.getAttribute('data-id'));
        if(confirm("Удалить задачу?")){
          store.tasks = store.tasks.filter(t=>t.id!==id);
          store.activities.push(`Удалена задача (ID: ${id})`);
          save(store);
          refreshAll();
          addNotif("Задача удалена");
        }
      });
    });
  }
  

  document.getElementById('addTask').addEventListener('click',()=>{
    const title=prompt("Название задачи:");
    if(!title) return;
    const due=prompt("Срок (YYYY-MM-DD):",new Date().toISOString().slice(0,10));
    const assignee=prompt("Исполнитель:","Нургали");
    store.tasks.push({id:Date.now(),title,due,assignee,status:"Запланировано"});
    store.activities.push(`Добавлена задача: ${title}`);
    save(store);
    refreshAll();
  });

  // --- Воронка сделок ---
  function renderDeals(){
    ['leads','negotiation','closed'].forEach(stage=>{
      const cont=document.getElementById('stage-'+stage);
      cont.innerHTML='';
      store.deals[stage].forEach(d=>{
        const div=document.createElement('div');
        div.className='deal';
        div.textContent=`${d.name} ($${d.value})`;
        cont.appendChild(div);
      });
      new Sortable(cont,{
        group:'pipeline',
        animation:150,
        onAdd:e=>{
          const itemName=e.item.textContent.split(" ($")[0];
          Object.keys(store.deals).forEach(s=>{
            store.deals[s]=store.deals[s].filter(x=>x.name!==itemName);
          });
          store.deals[stage].push({name:itemName,value:e.item.textContent.match(/\$(\d+)/)?RegExp.$1:0});
          store.activities.push(`Сделка "${itemName}" перемещена в этап ${stage}`);
          save(store);
          refreshAll();
        }
      });
    });
  }

  document.getElementById('addDeal').addEventListener('click',()=>{
    const name=document.getElementById('dealName').value.trim();
    const value=document.getElementById('dealValue').value.trim();
    if(!name||!value) return alert("Введите название и сумму!");
    store.deals.leads.push({name,value});
    store.activities.push(`Добавлена новая сделка: ${name} ($${value})`);
    document.getElementById('dealName').value='';
    document.getElementById('dealValue').value='';
    save(store);
    refreshAll();
  });

  // --- Настройки ---
  document.getElementById('emailNotif').checked=store.settings.emailNotif;
  document.getElementById('roleSelect').value=store.settings.role;
  document.getElementById('apiKey').value=store.settings.apiKey||'';
  document.getElementById('emailNotif').addEventListener('change',e=>{
    store.settings.emailNotif=e.target.checked;
    save(store);
  });
  document.getElementById('roleSelect').addEventListener('change',e=>{
    store.settings.role=e.target.value;
    save(store);
  });
  document.getElementById('apiKey').addEventListener('input',e=>{
    store.settings.apiKey=e.target.value;
    save(store);
  });

  // --- Обновление интерфейса ---
  function refreshAll(){
    refreshKPIs();
    refreshActivity();
    renderCharts();
    renderClientsTable();
    renderClientsCards();
    renderSplitList();
    renderTasks();
    renderDeals();
  }

  document.getElementById('globalSearch').addEventListener('input',e=>{
    const q=e.target.value.toLowerCase();
    if(q.length<2) return;
    const match=store.clients.find(c=>(c.name+c.company).toLowerCase().includes(q));
    if(match){
      alert(`Найден клиент: ${match.name} (${match.company})`);
    }
  });

  // === УВЕДОМЛЕНИЯ ===
function loadNotifs(){
  return JSON.parse(localStorage.getItem('notifications') || '[]');
}
function saveNotifs(list){
  localStorage.setItem('notifications', JSON.stringify(list));
}

// Показать / скрыть окно уведомлений
document.getElementById('btnNotify').addEventListener('click',()=>{
  const popup = document.getElementById('notifPopup');
  popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
  renderNotifs();
});

// Очистка уведомлений
document.getElementById('clearNotif').addEventListener('click',()=>{
  localStorage.removeItem('notifications');
  renderNotifs();
});

// Отрисовка списка уведомлений
function renderNotifs(){
  const notifList = document.getElementById('notifList');
  const notifs = loadNotifs();
  notifList.innerHTML = '';

  if (notifs.length === 0) {
    notifList.innerHTML = '<div style="font-size:14px;opacity:0.7;">Нет уведомлений</div>';
    return;
  }

  notifs.slice().reverse().forEach(n=>{
    const div = document.createElement('div');
    div.className = 'notif-item' + (n.read ? '' : ' unread');
    div.textContent = `${n.text} (${new Date(n.date).toLocaleString()})`;
    div.addEventListener('click',()=>{
      n.read = true;
      saveNotifs(notifs);
      renderNotifs();
    });
    notifList.appendChild(div);
  });
}

// Функция для добавления уведомления (можно вызывать из любого места)
function addNotif(text){
  const list = loadNotifs();
  list.push({id:Date.now(), text, date:new Date().toISOString(), read:false});
  saveNotifs(list);
}

const translations = {
  ru: { 
    dashboard: "🏢 Панель",
    clients: "👥 Клиенты",
    tasks: "🗂️ Задачи",
    deals: "💼 Сделки",
    reports: "📊 Отчёты",
    settings: "⚙️ Настройки",
    totalClients: "Всего клиентов",
    activeTasks: "Активных задач",
    monthlyRevenue: "Месячный доход",
    notifications: "Уведомления",
    addClient: "+ Добавить клиента",
    addTask: "+ Добавить задачу",
    dealsPipeline: "Сделки — Воронка",
    lastInteractions: "Последние взаимодействия",
    salesChart: "График продаж (6 мес.)",
    reportsDemo: "Графики и экспорт (демо)",
    settingsPanel: "Настройки",
    logout: "Выйти",
    searchPlaceholder: "Поиск клиента, компании или сделки",
    tableClient: "Клиент",
    tableCompany: "Компания",
    tableContact: "Контакт",
    tableLast: "Последнее",
    tableStatus: "Статус",
    tableActions: "Действия",
  },
  en: {
    dashboard: "🏢 Dashboard",
    clients: "👥 Clients",
    tasks: "🗂️ Tasks",
    deals: "💼 Deals",
    reports: "📊 Reports",
    settings: "⚙️ Settings",
    totalClients: "Total Clients",
    activeTasks: "Active Tasks",
    monthlyRevenue: "Monthly Revenue",
    notifications: "Notifications",
    addClient: "+ Add Client",
    addTask: "+ Add Task",
    dealsPipeline: "Deals — Pipeline",
    lastInteractions: "Recent Activity",
    salesChart: "Sales Chart (6 mo.)",
    reportsDemo: "Charts & Export (demo)",
    settingsPanel: "Settings",
    logout: "Logout",
    searchPlaceholder: "Search client, company or deal",
    tableClient: "Client",
    tableCompany: "Company",
    tableContact: "Contact",
    tableLast: "Last",
    tableStatus: "Status",
    tableActions: "Actions",
  },
  kz: {
    dashboard: "🏢 Панель",
    clients: "👥 Клиенттер",
    tasks: "🗂️ Тапсырмалар",
    deals: "💼 Келісімдер",
    reports: "📊 Есептер",
    settings: "⚙️ Баптаулар",
    totalClients: "Барлық клиенттер",
    activeTasks: "Белсенді тапсырмалар",
    monthlyRevenue: "Айлық табыс",
    notifications: "Хабарламалар",
    addClient: "+ Клиент қосу",
    addTask: "+ Тапсырма қосу",
    dealsPipeline: "Келісімдер — Воронка",
    lastInteractions: "Соңғы әрекеттер",
    salesChart: "Сату графигі (6 ай)",
    reportsDemo: "Графиктер және экспорт (демо)",
    settingsPanel: "Баптаулар",
    logout: "Шығу",
    searchPlaceholder: "Клиент, компания немесе мәмілені іздеу",
    tableClient: "Клиент",
    tableCompany: "Компания",
    tableContact: "Байланыс",
    tableLast: "Соңғы",
    tableStatus: "Статус",
    tableActions: "Әрекеттер",
  }
};

function updateLanguage(lang) {
  // Меню
  document.querySelector('.menu button[data-page="dashboard"]').textContent = translations[lang].dashboard;
  document.querySelector('.menu button[data-page="clients"]').textContent = translations[lang].clients;
  document.querySelector('.menu button[data-page="tasks"]').textContent = translations[lang].tasks;
  document.querySelector('.menu button[data-page="deals"]').textContent = translations[lang].deals;
  document.querySelector('.menu button[data-page="reports"]').textContent = translations[lang].reports;
  document.querySelector('.menu button[data-page="settings"]').textContent = translations[lang].settings;

  // KPI
  document.querySelector("#kpiClients + .kpi-label").textContent = translations[lang].totalClients;
  document.querySelector("#kpiTasks + .kpi-label").textContent = translations[lang].activeTasks;
  document.querySelector("#kpiRevenue + .kpi-label").textContent = translations[lang].monthlyRevenue;

  // Верхний бар
  document.getElementById("btnNotify").textContent = translations[lang].notifications;
  document.querySelector(".logout-btn").textContent = translations[lang].logout;
  document.getElementById("globalSearch").placeholder = translations[lang].searchPlaceholder;

  // Dashboard
  document.querySelector("#page-dashboard h3").textContent = translations[lang].lastInteractions;
  document.querySelector(".calendar-panel h3").textContent = translations[lang].salesChart;

  // Tasks
  document.querySelector("#page-tasks h3").textContent = translations[lang].tasks;
  document.getElementById("addTask").textContent = translations[lang].addTask;

  // Clients
  document.getElementById("addClient").textContent = translations[lang].addClient;

  // Таблица клиентов
  const tableHeader = document.querySelector("#view-table thead tr");
  if (tableHeader) {
    tableHeader.children[0].textContent = translations[lang].tableClient;
    tableHeader.children[1].textContent = translations[lang].tableCompany;
    tableHeader.children[2].textContent = translations[lang].tableContact;
    tableHeader.children[3].textContent = translations[lang].tableLast;
    tableHeader.children[4].textContent = translations[lang].tableStatus;
    tableHeader.children[5].textContent = translations[lang].tableActions;
  }

  // Deals
  document.querySelector("#page-deals h3").textContent = translations[lang].dealsPipeline;

  // Reports
  document.querySelector("#page-reports h3").textContent = translations[lang].reports;
  document.querySelector("#page-reports p").textContent = translations[lang].reportsDemo;

  // Settings
  document.querySelector("#page-settings h3").textContent = translations[lang].settingsPanel;
}

// Событие смены языка
document.getElementById("languageSelect").addEventListener("change", (e) => {
  const selectedLang = e.target.value;
  localStorage.setItem("crmLang", selectedLang);
  updateLanguage(selectedLang);
});

// Инициализация при загрузке
window.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("crmLang") || "ru";
  document.getElementById("languageSelect").value = savedLang;
  updateLanguage(savedLang);
});



  refreshAll();

  