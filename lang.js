const translations = {
    ru: {
     
      // auth
      login: "Авторизация",
      register: "Регистрация",
      next: "Далее",
      finish_register: "Завершить регистрацию",
      back_to_login: "Назад к авторизации",
  
      no_account: "Нет аккаунта?",
      have_account: "Уже есть аккаунт?",
  
      email: "Email",
      password: "Пароль",
  
      enter_email: "Введите email",
      enter_password: "Введите пароль",
      create_password: "Создайте пароль",
  
      // business
      business_name: "Название бизнеса",
      business_placeholder: "Например: moi magaz",
  
      // step 2
      register_step2: "Регистрация — Шаг 2",
      iin: "ИИН",
      enter_iin: "Введите ИИН",
  
      business_format: "Формат бизнеса",
      ip: "ИП",
      too: "ТОО",
      freelancer: "Фрилансер",
      other: "Другое",
  
      address: "Физический адрес",
      enter_address: "Введите адрес",
  
      phone: "Номер телефона",
      site: "Сайт / Instagram",
      site_placeholder: "Например: @moi.magaz"
    },
  
    en: {
      login: "Login",
      register: "Registration",
      next: "Next",
      finish_register: "Finish registration",
      back_to_login: "Back to login",
  
      no_account: "No account?",
      have_account: "Already have an account?",
  
      email: "Email",
      password: "Password",
  
      enter_email: "Enter email",
      enter_password: "Enter password",
      create_password: "Create password",
  
      business_name: "Business name",
      business_placeholder: "For example: my store",
  
      register_step2: "Registration — Step 2",
      iin: "IIN",
      enter_iin: "Enter IIN",
  
      business_format: "Business type",
      ip: "Individual Entrepreneur",
      too: "LLP",
      freelancer: "Freelancer",
      other: "Other",
  
      address: "Physical address",
      enter_address: "Enter address",
  
      phone: "Phone number",
      site: "Website / Instagram",
      site_placeholder: "For example: @my.store"
    },
  
    kz: {
      login: "Кіру",
      register: "Тіркелу",
      next: "Келесі",
      finish_register: "Тіркеуді аяқтау",
      back_to_login: "Кіруге оралу",
  
      no_account: "Аккаунт жоқ па?",
      have_account: "Аккаунтыңыз бар ма?",
  
      email: "Email",
      password: "Құпиясөз",
  
      enter_email: "Email енгізіңіз",
      enter_password: "Құпиясөз енгізіңіз",
      create_password: "Құпиясөз жасаңыз",
  
      business_name: "Бизнес атауы",
      business_placeholder: "Мысалы: менің дүкенім",
  
      register_step2: "Тіркелу — 2-қадам",
      iin: "ЖСН",
      enter_iin: "ЖСН енгізіңіз",
  
      business_format: "Бизнес форматы",
      ip: "ЖК",
      too: "ЖШС",
      freelancer: "Фрилансер",
      other: "Басқа",
  
      address: "Нақты мекенжай",
      enter_address: "Мекенжайды енгізіңіз",
  
      phone: "Телефон нөмірі",
      site: "Сайт / Instagram",
      site_placeholder: "Мысалы: @mening_dukenim"
    }
  };
  
  
  let currentLang = localStorage.getItem("lang") || "ru";
  
  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("lang", lang);
  
    document.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = translations[lang][el.dataset.i18n];
    });
  
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = translations[lang][el.dataset.i18nPlaceholder];
    });
  }
  
  function toggleLang() {
    const next = currentLang === "ru" ? "en" : currentLang === "en" ? "kz" : "ru";
    applyLanguage(next);
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    applyLanguage(currentLang);
  });

  
  