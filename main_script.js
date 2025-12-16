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
  employees:[
    {id:1,name:'Нургали С.',position:'Менеджер',email:'nurgali@company.kz',phone:'+7 777 123 4567'},
    {id:2,name:'Айдос К.',position:'Разработчик',email:'aidos@company.kz',phone:'+7 777 234 5678'}
  ],
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
    document.getElementById('clientEditId').value = id;
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientCompany').value = client.company;
    document.getElementById('clientContact').value = client.contact;
    document.getElementById('clientStatus').value = client.status;
    document.getElementById('clientModalTitle').textContent = 'Редактировать клиента';
    document.getElementById('clientModal').style.display = 'flex';
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
    document.getElementById('clientEditId').value = '';
    document.getElementById('clientName').value = '';
    document.getElementById('clientCompany').value = '';
    document.getElementById('clientContact').value = '';
    document.getElementById('clientStatus').value = 'Лид';
    document.getElementById('clientModalTitle').textContent = 'Добавить клиента';
    document.getElementById('clientModal').style.display = 'flex';
  });

  document.getElementById('clientModalSave').addEventListener('click',()=>{
    const id = document.getElementById('clientEditId').value;
    const name = document.getElementById('clientName').value.trim();
    const company = document.getElementById('clientCompany').value.trim();
    const contact = document.getElementById('clientContact').value.trim();
    const status = document.getElementById('clientStatus').value.trim();
    if(!name) return alert('Введите имя клиента');
    if(id) {
      const client = store.clients.find(c=>c.id===Number(id));
      client.name = name; client.company = company; client.contact = contact; client.status = status;
      store.activities.push(`Клиент обновлён: ${name}`);
    } else {
      const newClient = {id:Date.now(),name,company,contact,status,last:new Date().toISOString().slice(0,10),notes:''};
      store.clients.push(newClient);
      store.activities.push(`Добавлен новый клиент: ${name}`);
      addNotif(`Добавлен новый клиент: ${name}`);
    }
    save(store);
    refreshAll();
    document.getElementById('clientModal').style.display = 'none';
  });

  document.getElementById('clientModalCancel').addEventListener('click',()=>{
    document.getElementById('clientModal').style.display = 'none';
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
  <td>
    <button data-id="${t.id}" class="btn ghost editTask">Редакт</button>
    <button data-id="${t.id}" class="btn ghost deleteTask" style="color:#dc2626;">Удалить</button>
  </td>
`;
      tbody.appendChild(tr);
    });
    attachTaskButtons();
    renderAssigneeSelect();
  }

  function renderAssigneeSelect(){
    const select = document.getElementById('taskAssignee');
    if(!select) return;
    const assignees = [...new Set(store.tasks.map(t=>t.assignee).filter(Boolean))];
    select.innerHTML = '<option value="">Все исполнители</option>';
    assignees.forEach(a=>{
      const opt = document.createElement('option');
      opt.value = a;
      opt.textContent = a;
      select.appendChild(opt);
    });
  }

  function attachTaskButtons(){
    document.querySelectorAll('.editTask').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id = Number(btn.getAttribute('data-id'));
        const task = store.tasks.find(t=>t.id===id);
        document.getElementById('taskEditId').value = id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDue').value = task.due;
        populateAssigneeSelect(task.assignee);
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskModalTitle').textContent = 'Редактировать задачу';
        document.getElementById('taskModal').style.display = 'flex';
      });
    });
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
  

  function populateAssigneeSelect(selectedValue = '') {
    const select = document.getElementById('taskAssigneeInput');
    select.innerHTML = '<option value="">-- Выберите --</option>';
    (store.employees || []).forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.name;
      opt.textContent = e.name;
      if (e.name === selectedValue) opt.selected = true;
      select.appendChild(opt);
    });
  }

  document.getElementById('addTask').addEventListener('click',()=>{
    document.getElementById('taskEditId').value = '';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDue').value = new Date().toISOString().slice(0,10);
    populateAssigneeSelect();
    document.getElementById('taskStatus').value = 'Запланировано';
    document.getElementById('taskModalTitle').textContent = 'Добавить задачу';
    document.getElementById('taskModal').style.display = 'flex';
  });

  document.getElementById('taskModalSave').addEventListener('click',()=>{
    const id = document.getElementById('taskEditId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const due = document.getElementById('taskDue').value;
    const assignee = document.getElementById('taskAssigneeInput').value.trim();
    const status = document.getElementById('taskStatus').value;
    if(!title) return alert('Введите название задачи');
    if(id) {
      const task = store.tasks.find(t=>t.id===Number(id));
      task.title = title; task.due = due; task.assignee = assignee; task.status = status;
      store.activities.push(`Задача обновлена: ${title}`);
    } else {
      store.tasks.push({id:Date.now(),title,due,assignee,status});
      store.activities.push(`Добавлена задача: ${title}`);
    }
    save(store);
    refreshAll();
    document.getElementById('taskModal').style.display = 'none';
  });

  document.getElementById('taskModalCancel').addEventListener('click',()=>{
    document.getElementById('taskModal').style.display = 'none';
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

  // --- Работники ---
  function renderEmployees(){
    const tbody = document.getElementById('employeesBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    store.employees = store.employees || [];
    store.employees.forEach(e=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${e.name}</td>
        <td>${e.position}</td>
        <td>${e.email}</td>
        <td>${e.phone}</td>
        <td>
          <button data-id="${e.id}" class="btn ghost editEmployee">Редакт</button>
          <button data-id="${e.id}" class="btn ghost deleteEmployee" style="color:#dc2626;">Удалить</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    attachEmployeeButtons();
  }

  function attachEmployeeButtons(){
    document.querySelectorAll('.editEmployee').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id = Number(btn.getAttribute('data-id'));
        const emp = store.employees.find(e=>e.id===id);
        document.getElementById('employeeEditId').value = id;
        document.getElementById('employeeName').value = emp.name;
        document.getElementById('employeePosition').value = emp.position;
        document.getElementById('employeeEmail').value = emp.email;
        document.getElementById('employeePhone').value = emp.phone;
        document.getElementById('employeeModalTitle').textContent = 'Редактировать работника';
        document.getElementById('employeeModal').style.display = 'flex';
      });
    });
    document.querySelectorAll('.deleteEmployee').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id = Number(btn.getAttribute('data-id'));
        if(confirm("Удалить работника?")){
          store.employees = store.employees.filter(e=>e.id!==id);
          store.activities.push(`Работник удалён (ID: ${id})`);
          save(store);
          refreshAll();
        }
      });
    });
  }

  document.getElementById('addEmployee').addEventListener('click',()=>{
    document.getElementById('employeeEditId').value = '';
    document.getElementById('employeeName').value = '';
    document.getElementById('employeePosition').value = '';
    document.getElementById('employeeEmail').value = '';
    document.getElementById('employeePhone').value = '';
    document.getElementById('employeeModalTitle').textContent = 'Добавить работника';
    document.getElementById('employeeModal').style.display = 'flex';
  });

  document.getElementById('employeeModalSave').addEventListener('click',()=>{
    const id = document.getElementById('employeeEditId').value;
    const name = document.getElementById('employeeName').value.trim();
    const position = document.getElementById('employeePosition').value.trim();
    const email = document.getElementById('employeeEmail').value.trim();
    const phone = document.getElementById('employeePhone').value.trim();
    if(!name) return alert('Введите имя работника');
    store.employees = store.employees || [];
    if(id) {
      const emp = store.employees.find(e=>e.id===Number(id));
      emp.name = name; emp.position = position; emp.email = email; emp.phone = phone;
      store.activities.push(`Работник обновлён: ${name}`);
    } else {
      store.employees.push({id:Date.now(), name, position, email, phone});
      store.activities.push(`Добавлен работник: ${name}`);
    }
    save(store);
    refreshAll();
    document.getElementById('employeeModal').style.display = 'none';
  });

  document.getElementById('employeeModalCancel').addEventListener('click',()=>{
    document.getElementById('employeeModal').style.display = 'none';
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
    renderEmployees();
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
    // Modal translations
    clientName: "Имя клиента",
    clientNamePh: "Имя",
    company: "Компания",
    companyPh: "Компания",
    contact: "Контакт",
    contactPh: "Email или телефон",
    status: "Статус",
    status_lead: "Лид",
    status_active: "Активный",
    status_inactive: "Неактивный",
    save: "Сохранить",
    cancel: "Отмена",
    taskName: "Название задачи",
    taskNamePh: "Название",
    deadline: "Срок",
    assignee: "Исполнитель",
    taskStatus: "Статус",
    status_planned: "Запланировано",
    status_progress: "В прогрессе",
    status_done: "Завершено",
    addEmployee: "Добавить работника",
    employeeName: "Имя",
    namePh: "Имя",
    position: "Должность",
    positionPh: "Должность",
    phone: "Телефон",
    phonePh: "Телефон",
    editClient: "Редактировать клиента",
    editTask: "Редактировать задачу",
    editEmployee: "Редактировать работника",
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
    // Modal translations
    clientName: "Client Name",
    clientNamePh: "Name",
    company: "Company",
    companyPh: "Company",
    contact: "Contact",
    contactPh: "Email or phone",
    status: "Status",
    status_lead: "Lead",
    status_active: "Active",
    status_inactive: "Inactive",
    save: "Save",
    cancel: "Cancel",
    taskName: "Task Name",
    taskNamePh: "Name",
    deadline: "Deadline",
    assignee: "Assignee",
    taskStatus: "Status",
    status_planned: "Planned",
    status_progress: "In Progress",
    status_done: "Done",
    addEmployee: "Add Employee",
    employeeName: "Name",
    namePh: "Name",
    position: "Position",
    positionPh: "Position",
    phone: "Phone",
    phonePh: "Phone",
    editClient: "Edit Client",
    editTask: "Edit Task",
    editEmployee: "Edit Employee",
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
    // Modal translations
    clientName: "Клиент аты",
    clientNamePh: "Аты",
    company: "Компания",
    companyPh: "Компания",
    contact: "Байланыс",
    contactPh: "Email немесе телефон",
    status: "Статус",
    status_lead: "Лид",
    status_active: "Белсенді",
    status_inactive: "Белсенді емес",
    save: "Сақтау",
    cancel: "Болдырмау",
    taskName: "Тапсырма атауы",
    taskNamePh: "Атауы",
    deadline: "Мерзімі",
    assignee: "Орындаушы",
    taskStatus: "Статус",
    status_planned: "Жоспарланған",
    status_progress: "Орындалуда",
    status_done: "Аяқталды",
    addEmployee: "Қызметкер қосу",
    employeeName: "Аты",
    namePh: "Аты",
    position: "Лауазымы",
    positionPh: "Лауазымы",
    phone: "Телефон",
    phonePh: "Телефон",
    editClient: "Клиентті өңдеу",
    editTask: "Тапсырманы өңдеу",
    editEmployee: "Қызметкерді өңдеу",
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

  // Modal translations
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });
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

  