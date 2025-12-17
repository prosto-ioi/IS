// --- Элементы ---
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const registerStep2 = document.getElementById('registerStep2');

// --- Переход между экранами ---
function showRegister() {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
}

function nextStep() {
  registerForm.style.display = 'none';
  registerStep2.style.display = 'block';
}

function showLogin() {
  registerStep2.style.display = 'none';
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
}

function toggleDark() {
  document.body.classList.toggle('dark');
}

function toggleLang() {
  alert('Скоро здесь появится выбор языка (RU/KZ/EN)');
}

async function handleFinishRegister() {
  const formData = {
    businessName: document.querySelector('#registerForm input[type="text"]').value,
    email: document.querySelector('#registerForm input[type="email"]').value,
    password: document.querySelector('#registerForm input[type="password"]').value,
    iin: document.querySelector('#registerStep2 input[placeholder="Введите ИИН"]').value,
    businessFormat: document.querySelector('#registerStep2 select').value,
    address: document.querySelector('#registerStep2 input[placeholder="Введите адрес"]').value,
    phone: document.querySelector('#registerStep2 input[type="tel"]').value,
    site: document.querySelector('#registerStep2 input[placeholder="Например: @moi.magaz"]').value
  };

  const ok = await registerUser(formData);
  if (ok) {
    alert('Регистрация прошла успешно! Теперь войдите.');
    showLogin();
  }
}

async function handleLogin() {
  const email = document.querySelector('#loginForm input[type="email"]').value;
  const password = document.querySelector('#loginForm input[type="password"]').value;
  await loginUser(email, password);
}



// --- Авторизация ---
function loginUser() {
  const email = document.querySelector('#loginForm input[type="email"]').value;
  const password = document.querySelector('#loginForm input[type="password"]').value;

  const savedEmail = localStorage.getItem('userEmail');
  const savedPassword = localStorage.getItem('userPassword');

  if (email === savedEmail && password === savedPassword) {
    alert('Вход выполнен успешно!');
    window.location.href = "main.html"; // переход на пустую страницу
  } else {
    alert('Неверный Email или пароль!');
  }
  if (email === savedEmail && password === savedPassword) {
    localStorage.setItem('loggedIn', 'true'); // <== добавь это
    alert('Вход выполнен успешно!');
    window.location.href = "main.html";
  }  
}

// ---------- helpers ----------
function loadUsers(){
    const raw = localStorage.getItem('users');
    return raw ? JSON.parse(raw) : [];
  }
  function saveUsers(users){
    localStorage.setItem('users', JSON.stringify(users));
  }
  function genId(){
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
  }
  
  // Хеширование пароля (SHA-256)
  async function hashPassword(password){
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(password));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // ---------- регистрация (шаг 1 + шаг 2 собирают значения) ----------
  async function registerUser(formData){
    // formData — объект с полями, собранными из обоих шагов:
    // { businessName, email, password, iin, businessFormat, address, phone, site }
    const users = loadUsers();
  
    // валидация базовая
    if(!formData.email || !formData.password){
      alert('Заполните Email и пароль');
      return false;
    }
  
    // проверка дубликата по email
    if(users.some(u => u.email.toLowerCase() === formData.email.toLowerCase())){
      alert('Пользователь с таким Email уже существует');
      return false;
    }
  
    // хеш пароля
    const passwordHash = await hashPassword(formData.password);
  
    // Первый пользователь становится админом, остальные — user
    const isFirstUser = users.length === 0;
    
    const user = {
      id: genId(),
      name: formData.businessName || formData.email.split('@')[0],
      businessName: formData.businessName || '',
      email: formData.email.toLowerCase(),
      passwordHash,
      iin: formData.iin || '',
      businessFormat: formData.businessFormat || '',
      address: formData.address || '',
      phone: formData.phone || '',
      site: formData.site || '',
      role: isFirstUser ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };
  
    users.push(user);
    saveUsers(users);
    alert('Регистрация завершена');
    return true;
  }
  
  // ---------- вход ----------
  async function loginUser(email, password){
    const users = loadUsers();
    const user = users.find(u => u.email === (email || '').toLowerCase());
    if(!user){
      alert('Пользователь не найден');
      return false;
    }
  
    const passwordHash = await hashPassword(password);
    if(passwordHash !== user.passwordHash){
      alert('Неверный пароль');
      return false;
    }
  
    // Успешный вход — сохраняем текущего юзера
    localStorage.setItem('loggedInUserId', user.id);
    // или: localStorage.setItem('loggedIn', 'true');
    // Перейти на main.html
    window.location.href = 'main.html';
    return true;
  }
  
  // ---------- выход ----------
  function logout(){
    localStorage.removeItem('loggedInUserId');
    // и редирект
    window.location.href = 'index.html';
  }  
  
  
