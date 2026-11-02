"use strict";

const METRIKA_ID = 113810497;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// ==========================================
// СОСТОЯНИЕ
// ==========================================
const state = {
  q: "",
  city: "",
  prof: "",
  exp: "",
  format: "",
  schedule: "",
  salary: 0,
  sort: "relevant",
  tag: "",
  shown: 12,
  favsOnly: false,
  favs: loadFavs()
};

// ==========================================
// ДАННЫЕ
// ==========================================
let JOBS = [];
let CITIES = [];
let REGIONS = [];
let dataLoaded = false;
let firstRender = true;

// ==========================================
// ТРАНСЛИТ (латиница → кириллица)
// ==========================================
const TRANSLIT_MAP = {
  "shch": "щ", "sch": "щ",
  "zh": "ж", "kh": "х", "ts": "ц", "ch": "ч", "sh": "ш",
  "yu": "ю", "ya": "я", "yo": "ё", "ye": "е",
  "a": "а", "b": "б", "v": "в", "g": "г", "d": "д", "e": "е", "z": "з",
  "i": "и", "y": "й", "k": "к", "l": "л", "m": "м", "n": "н", "o": "о",
  "p": "п", "r": "р", "s": "с", "t": "т", "u": "у", "f": "ф", "h": "х",
  "c": "ц", "j": "й", "x": "кс", "q": "к", "w": "в",
  "а": "а", "б": "б", "в": "в", "г": "г", "д": "д", "е": "е", "ё": "ё",
  "ж": "ж", "з": "з", "и": "и", "й": "й", "к": "к", "л": "л", "м": "м",
  "н": "н", "о": "о", "п": "п", "р": "р", "с": "с", "т": "т", "у": "у",
  "ф": "ф", "х": "х", "ц": "ц", "ч": "ч", "ш": "ш", "щ": "щ", "ъ": "ъ",
  "ы": "ы", "ь": "ь", "э": "э", "ю": "ю", "я": "я"
};

const TRANSLIT_THREE = ["shch", "sch"];
const TRANSLIT_TWO = ["zh", "kh", "ts", "ch", "sh", "yu", "ya", "yo", "ye"];

function slugToRuName(slug) {
  if (!slug) return "";
  const s = String(slug).toLowerCase();
  let out = "";
  let i = 0;

  while (i < s.length) {
    const ch3 = s.slice(i, i + 3);
    if (TRANSLIT_THREE.includes(ch3)) {
      out += TRANSLIT_MAP[ch3];
      i += 3;
      continue;
    }
    const ch2 = s.slice(i, i + 2);
    if (TRANSLIT_TWO.includes(ch2)) {
      out += TRANSLIT_MAP[ch2];
      i += 2;
      continue;
    }
    const ch1 = s[i];
    if (ch1 === "-") {
      out += " ";
      i += 1;
      continue;
    }
    if (TRANSLIT_MAP[ch1] !== undefined) {
      out += TRANSLIT_MAP[ch1];
      i += 1;
      continue;
    }
    out += ch1;
    i += 1;
  }

  out = out.trim();
  if (!out) return "";
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// ==========================================
// ТЕГИ
// ==========================================
const TAG_LABELS = {
  noExperience: "Без опыта",
  remote: "Удалённо",
  partTime: "Подработка",
  vahta: "Вахта",
  it: "IT",
  warehouse: "Склад",
  driver: "Водитель",
  courier: "Курьер",
  retail: "Розница",
  food: "Общепит",
  office: "Офис",
  bike: "Вело",
  walk: "Пеший",
  car: "Авто",
  picker: "Сборщик",
  shift: "Смены",
  transport: "Транспорт"
};

function tagHTML(tag) {
  const label = TAG_LABELS[tag];
  if (!label) return "";
  return `<span class="tag">${escapeHTML(label)}</span>`;
}

// ==========================================
// ИЗБРАННОЕ
// ==========================================
function loadFavs() {
  try {
    const parsed = JSON.parse(localStorage.getItem("woojob-favs") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveFavs() {
  try { localStorage.setItem("woojob-favs", JSON.stringify(state.favs)); }
  catch (error) { console.warn("WooJob: не удалось сохранить избранное.", error); }
}

// ==========================================
// УТИЛИТЫ
// ==========================================
function normalize(value) {
  return String(value ?? "")
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

// ==========================================
// ВАЛИДАЦИЯ / НОРМАЛИЗАЦИЯ
// ==========================================
function validateVacancy(v) {
  if (!v || typeof v !== "object") return false;
  if (!v.id || typeof v.id !== "string") return false;
  if (!v.position || typeof v.position !== "string") return false;
  if (!v.company || typeof v.company !== "string") return false;
  return true;
}

function normalizeVacancy(v) {
  const arr = (x) => (Array.isArray(x) ? x.filter(Boolean) : []);
  return {
    id: String(v.id),
    source: v.source || "",
    company: v.company || "",
    position: v.position || "",
    details: v.details || "",
    fullDescription: v.fullDescription || null,
    prof: v.prof || "",
    salaryFrom: Number.isFinite(v.salaryFrom) ? v.salaryFrom : null,
    salaryTo: Number.isFinite(v.salaryTo) ? v.salaryTo : null,
    salaryHour: Number.isFinite(v.salaryHour) ? v.salaryHour : null,
    salaryDay: Number.isFinite(v.salaryDay) ? v.salaryDay : null,
    salaryNote: v.salaryNote || null,
    salaryGross: !!v.salaryGross,
    salaryCurrency: v.salaryCurrency || "RUB",
    cities: arr(v.cities),
    regions: arr(v.regions),
    transportCities: arr(v.transportCities),
    addressCities: arr(v.addressCities),
    isRemote: !!v.isRemote,
    vahta: !!v.vahta,
    vahtaRegions: arr(v.vahtaRegions),
    vahtaOkrugs: arr(v.vahtaOkrugs),
    exp: v.exp || "",
    format: v.format || "",
    schedule: v.schedule || "",
    scheduleNote: v.scheduleNote || null,
    tags: arr(v.tags),
    citizenship: v.citizenship || "rf",
    gender: v.gender || "any",
    ageFrom: Number.isFinite(v.ageFrom) ? v.ageFrom : null,
    ageTo: Number.isFinite(v.ageTo) ? v.ageTo : null,
    requirements: arr(v.requirements),
    vehicleRequirements: v.vehicleRequirements || null,
    referralBonus: v.referralBonus || null,
    performanceBonus: v.performanceBonus || null,
    travelCompensation: v.travelCompensation || null,
    addresses: (v.addresses && typeof v.addresses === "object") ? v.addresses : {},
    warehouseCity: v.warehouseCity || null,
    warehouseAddress: v.warehouseAddress || null,
    rcName: v.rcName || null,
    bonuses: arr(v.bonuses),
    priorityCities: arr(v.priorityCities),
    pop: Number.isFinite(v.pop) ? v.pop : 0,
    logo: v.logo || "",
    partnerUrl: v.partnerUrl || null,
    partnerType: v.partnerType || "click",
    partnerReward: v.partnerReward || null,
    active: v.active !== false
  };
}

// ==========================================
// ЗАГРУЗКА
// ==========================================
async function loadData() {
  const grid = $("#grid");
  if (!grid) return;
  showSkeletons(6);

  try {
    const res = await fetch("./vacancies.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.vacancies)) throw new Error("vacancies не массив");

    JOBS = data.vacancies
      .filter(validateVacancy)
      .map(normalizeVacancy);

    CITIES = Array.isArray(data.cities) ? data.cities : [];
    REGIONS = Array.isArray(data.regions) ? data.regions : [];
    dataLoaded = true;

    populateFilters();
    render();
  } catch (err) {
    console.error("WooJob: не удалось загрузить вакансии.", err);
    JOBS = [];
    dataLoaded = false;
    showDataError();
  }
}

function showSkeletons(n = 6) {
  const grid = $("#grid");
  if (!grid) return;
  grid.innerHTML = Array.from({ length: n }, () => `
    <div class="skeleton">
      <div style="display:flex;gap:16px;align-items:center">
        <div class="sk-line avatar"></div>
        <div style="flex:1"><div class="sk-line short"></div><div class="sk-line" style="width:40%;margin-top:8px"></div></div>
      </div>
      <div class="sk-line"></div>
      <div class="sk-line big"></div>
      <div class="sk-line short"></div>
    </div>
  `).join("");
}

function showDataError() {
  const grid = $("#grid");
  const empty = $("#empty");
  if (grid) grid.innerHTML = "";
  if (empty) {
    empty.hidden = false;
    empty.textContent = "Не удалось загрузить вакансии. Обновите страницу.";
  }
}

// ==========================================
// СПРАВОЧНИКИ
// ==========================================
function getCity(slug) { return CITIES.find(c => c.slug === slug); }

function getCityNames(slug) {
  const city = getCity(slug);
  if (city) return [city.name, ...(city.aliases || [])];
  const ruName = slugToRuName(slug);
  return ruName ? [ruName, slug] : [slug];
}

function normalizeCity(value) {
  return normalize(value)
    .replace(/\bспб\b/g, "санкт-петербург")
    .replace(/\bмск\b/g, "москва")
    .replace(/\bпитер\b/g, "санкт-петербург")
    .replace(/\bекб\b/g, "екатеринбург")
    .replace(/\bнн\b/g, "нижний новгород");
}

// ==========================================
// ПОИСК ПО ГОРОДУ
// ==========================================
function jobMatchesCity(job, value) {
  if (!value) return true;
  const query = normalizeCity(value);
  if (!query) return true;
  if (job.isRemote) return true;

  if (job.cities && job.cities.includes(value)) return true;
  if (job.addressCities && job.addressCities.includes(value)) return true;
  if (job.transportCities && job.transportCities.includes(value)) return true;
  if (job.regions && job.regions.includes(value)) return true;
  if (job.vahta && job.vahtaRegions && job.vahtaRegions.includes(value)) return true;

  const matches = (names) => names.some(n => {
    const nn = normalizeCity(n);
    return nn.includes(query) || query.includes(nn);
  });

  if (job.cities && job.cities.length) {
    if (job.cities.some(slug => matches(getCityNames(slug)))) return true;
  }
  if (job.transportCities && job.transportCities.length) {
    if (job.transportCities.some(n => matches([n, slugToRuName(n)]))) return true;
  }
  if (job.addressCities && job.addressCities.length) {
    if (job.addressCities.some(slug => matches(getCityNames(slug)))) return true;
  }
  if (job.regions && job.regions.length) {
    const region = REGIONS.find(r => matches([r.name]));
    if (region && job.regions.includes(region.slug)) return true;
  }
  if (job.vahta && job.vahtaRegions && job.vahtaRegions.length) {
    const region = REGIONS.find(r => matches([r.name]));
    if (region && job.vahtaRegions.includes(region.slug)) return true;
  }

  return false;
}

// ==========================================
// ЛЕЙБЛ ГОРОДА
// ==========================================
function cityLabelFor(job) {
  if (job.isRemote) return "Удалённо";
  if (job.vahta) return "Вахта";

  const active = state.city;
  if (active) {
    const hit = (job.cities || []).find(slug => {
      return getCityNames(slug).some(n => normalizeCity(n) === normalizeCity(active));
    });
    if (hit) {
      const city = getCity(hit);
      return city ? city.name : slugToRuName(hit) || hit;
    }
  }

  if (job.cities && job.cities.length) {
    const first = getCity(job.cities[0]);
    const extra = job.cities.length - 1;
    const name = first ? first.name : (slugToRuName(job.cities[0]) || job.cities[0]);
    return extra > 0 ? `${name} +${extra}` : name;
  }
  if (job.addressCities && job.addressCities.length) {
    const first = getCity(job.addressCities[0]);
    const extra = job.addressCities.length - 1;
    const name = first ? first.name : (slugToRuName(job.addressCities[0]) || job.addressCities[0]);
    return extra > 0 ? `${name} +${extra}` : name;
  }

  return "Город уточняется";
}

// ==========================================
// ЗАРПЛАТА
// ==========================================
function parseSalaryNote(note) {
  if (!note) return null;
  const m = String(note).match(/(\d[\d\s]*)/);
  if (!m) return null;
  const num = Number(m[1].replace(/\s/g, ""));
  if (!Number.isFinite(num) || num <= 0) return null;
  const n = String(note).toLowerCase();

  if (/мес/.test(n)) return num;
  if (/день|дн\.|дн\b/.test(n)) return num * 22;
  if (/час/.test(n)) return num * 160;
  return num;
}

/**
 * Всегда «до X ₽», где X — МАКСИМАЛЬНАЯ месячная сумма.
 * Приоритет:
 *   1. salaryTo
 *   2. salaryFrom
 *   3. salaryNote с «мес»
 *   4. salaryDay × 22
 *   5. salaryHour × 160
 *   6. salaryNote (парсим по единице)
 *   7. «Зарплата по договорённости»
 */
function salaryLabel(job) {
  let monthly = null;

  if (Number.isFinite(job.salaryTo) && job.salaryTo > 0) {
    monthly = job.salaryTo;
  } else if (Number.isFinite(job.salaryFrom) && job.salaryFrom > 0) {
    monthly = job.salaryFrom;
  }

  if (!monthly && job.salaryNote) {
    const n = String(job.salaryNote).toLowerCase();
    if (/мес/.test(n)) {
      const parsed = parseSalaryNote(job.salaryNote);
      if (parsed) monthly = parsed;
    }
  }

  if (!monthly && Number.isFinite(job.salaryDay) && job.salaryDay > 0) {
    monthly = job.salaryDay * 22;
  }

  if (!monthly && Number.isFinite(job.salaryHour) && job.salaryHour > 0) {
    monthly = job.salaryHour * 160;
  }

  if (!monthly && job.salaryNote) {
    const parsed = parseSalaryNote(job.salaryNote);
    if (parsed) monthly = parsed;
  }

  if (!monthly) return "Зарплата по договорённости";

  const formatted = formatMoney(Math.round(monthly));

  if (job.salaryCurrency === "BYN") return `до ${formatted} BYN`;
  return `до ${formatted} ₽`;
}

function monthlyEquivalent(job) {
  if (Number.isFinite(job.salaryTo) && job.salaryTo > 0) return job.salaryTo;
  if (Number.isFinite(job.salaryFrom) && job.salaryFrom > 0) return job.salaryFrom;
  if (job.salaryNote) {
    const n = String(job.salaryNote).toLowerCase();
    if (/мес/.test(n)) {
      const parsed = parseSalaryNote(job.salaryNote);
      if (parsed) return parsed;
    }
  }
  if (Number.isFinite(job.salaryDay) && job.salaryDay > 0) return job.salaryDay * 22;
  if (Number.isFinite(job.salaryHour) && job.salaryHour > 0) return job.salaryHour * 160;
  if (job.salaryNote) {
    const parsed = parseSalaryNote(job.salaryNote);
    if (parsed) return parsed;
  }
  return Infinity;
}

function salarySortValue(job) { return monthlyEquivalent(job); }

// ==========================================
// ЧИПЫ
// ==========================================
function matchesQuickTag(job, tag) {
  const t = normalize(tag);
  const tags = (job.tags || []).map(normalize);

  if (t === "удалённо" || t === "удаленно" || t === "remote") return job.isRemote === true || tags.includes("remote");
  if (t === "без опыта" || t === "for-you" || t === "noexp") return normalize(job.exp || "").includes("без опыта") || tags.includes("noexperience");
  if (t === "подработка" || t === "part-time") return normalize(job.format || "").includes("подработ") || tags.includes("parttime");
  if (t === "вахта" || t === "shift") return job.vahta === true || normalize(job.schedule || "").includes("вахт") || tags.includes("vahta");
  if (t === "it" || t === "ит") return tags.includes("it") || normalize(job.prof || "").includes("it");
  return true;
}

// ==========================================
// ФИЛЬТРАЦИЯ
// ==========================================
function filtered() {
  let result = JOBS.filter((job) => {
    if (job.active === false) return false;

    if (state.q) {
      const cityNames = (job.cities || []).map(slug => getCityNames(slug).join(" ")).join(" ");
      const addressNames = (job.addressCities || []).map(slug => getCityNames(slug).join(" ")).join(" ");
      const transportNames = (job.transportCities || []).map(n => `${n} ${slugToRuName(n)}`).join(" ");
      const searchable = normalize([
        job.position, job.company, job.details, job.prof,
        cityNames, addressNames, transportNames,
        job.rcName || ""
      ].join(" "));
      if (!searchable.includes(normalize(state.q))) return false;
    }

    if (state.city && !jobMatchesCity(job, state.city)) return false;
    if (state.prof && job.prof !== state.prof) return false;
    if (state.exp && job.exp !== state.exp) return false;
    if (state.format && job.format !== state.format) return false;
    if (state.schedule && job.schedule !== state.schedule) return false;
    if (state.salary && monthlyEquivalent(job) < state.salary) return false;
    if (state.tag && !matchesQuickTag(job, state.tag)) return false;
    if (state.favsOnly && !state.favs.includes(job.id)) return false;

    return true;
  });

  if (state.sort === "salary-desc") {
    result.sort((a, b) => {
      const va = salarySortValue(a), vb = salarySortValue(b);
      if (va === vb) return (b.pop ?? 0) - (a.pop ?? 0);
      return vb - va;
    });
  } else if (state.sort === "salary-asc") {
    result.sort((a, b) => {
      const va = salarySortValue(a), vb = salarySortValue(b);
      if (va === vb) return (b.pop ?? 0) - (a.pop ?? 0);
      return va - vb;
    });
  } else {
    result.sort((a, b) => (b.pop ?? 0) - (a.pop ?? 0));
  }

  return result;
}

// ==========================================
// КАРТОЧКА
// ==========================================
function cardHTML(job) {
  const isFav = state.favs.includes(job.id);
  const placeholder = !job.partnerUrl;
  const cityLabel = cityLabelFor(job);
  const letter = escapeHTML((job.company || "?").charAt(0).toUpperCase());

  const logoImg = job.logo
    ? `<img src="${escapeHTML(job.logo)}" alt="" loading="lazy" data-fallback="1">`
    : "";

  const applyButton = placeholder
    ? `<button class="btn btn-primary" type="button" disabled>Откликнуться — скоро</button>`
    : `<a class="btn btn-primary" href="${escapeHTML(job.partnerUrl)}" target="_blank" rel="noopener noreferrer sponsored" data-outbound="${escapeHTML(job.id)}" data-source="${escapeHTML(job.source || "unknown")}">Откликнуться</a>`;

  const hint = placeholder
    ? "Ссылка работодателя пока не подключена"
    : (job.partnerType === "interview" ? "Запишитесь на собеседование" :
       job.partnerType === "registration" ? "Запишитесь на оформление" :
       job.partnerType === "lead" ? "Заполните анкету на стороне работодателя" :
       job.partnerType === "hired" ? "Заполните анкету на стороне работодателя" :
       job.partnerType === "hired_plus_activity" ? "Трудоустройство + активность" :
       job.partnerType === "registration_plus_activity" ? "Регистрация + активность" :
       "Перейти на сайт работодателя");

  const rcLine = job.rcName
    ? `<div class="rc-name">${escapeHTML(job.rcName)}</div>`
    : "";

  const addrLine = job.warehouseAddress
    ? `<div class="warehouse-address">${escapeHTML(job.warehouseAddress)}</div>`
    : "";

  const bonusesLine = (job.bonuses && job.bonuses.length)
    ? `<div class="card-bonuses">${job.bonuses.map(b => {
        const label = typeof b === "string" ? b : (b && b.label) || "";
        return label ? `<span class="tag tag-bonus">${escapeHTML(label)}</span>` : "";
      }).filter(Boolean).join("")}</div>`
    : "";

  const travelLine = job.travelCompensation
    ? `<div class="card-travel">${escapeHTML(job.travelCompensation)}</div>`
    : "";

  const tagsHTML = job.tags.slice(0, 4).map(tagHTML).filter(Boolean).join("");

  return `
    <article class="card" data-job-id="${escapeHTML(job.id)}">
      <div class="card-top">
        <div class="logo-comp" data-letter="${letter}">
          ${logoImg}
        </div>
        <div>
          <div class="company">${escapeHTML(job.company || "Работодатель")}</div>
          <div class="position">${escapeHTML(job.position)}</div>
          ${rcLine}
        </div>
        <button class="fav-btn ${isFav ? "active" : ""}"
                type="button"
                data-fav="${escapeHTML(job.id)}"
                aria-label="${isFav ? "Убрать из избранного" : "Добавить в избранное"}"
                aria-pressed="${String(isFav)}">
          ${isFav ? "♥" : "♡"}
        </button>
      </div>

      <div class="details">${escapeHTML(job.details || "")}</div>
      ${addrLine}
      <div class="salary">${escapeHTML(salaryLabel(job))}</div>

      <div class="tags">
        <span class="tag">${escapeHTML(job.format || "Условия уточняются")}</span>
        <span class="tag">${escapeHTML(job.exp || "Опыт уточняется")}</span>
        <span class="tag tag-city">${escapeHTML(cityLabel)}</span>
        ${tagsHTML}
      </div>

      ${bonusesLine}
      ${travelLine}

      <div class="card-foot">
        ${applyButton}
        <span class="card-hint">${escapeHTML(hint)}</span>
      </div>
    </article>
  `;
}

// ==========================================
// МЕТРИКА
// ==========================================
function trackApplyClick(link) {
  if (typeof window.ym !== "function") return;
  try {
    window.ym(METRIKA_ID, "reachGoal", "vacancy_apply_click", {
      vacancy_id: link.dataset.outbound || "",
      source: link.dataset.source || "unknown"
    });
  } catch (error) { console.warn("WooJob: не удалось отправить цель в Метрику.", error); }
}

// ==========================================
// РЕНДЕР
// ==========================================
function render() {
  const grid = $("#grid");
  const empty = $("#empty");
  const countLabel = $("#countLabel");
  const loadMore = $("#loadMore");

  if (!grid || !empty || !countLabel || !loadMore) return;

  const list = filtered();
  const visibleJobs = list.slice(0, state.shown);

  grid.classList.toggle("no-anim", !firstRender);
  grid.innerHTML = visibleJobs.map(cardHTML).join("");
  grid.hidden = list.length === 0;

  empty.hidden = list.length !== 0;
  if (list.length === 0) {
    empty.textContent = state.favsOnly
      ? "В избранном пока пусто. Нажмите ♡ на карточке, чтобы сохранить."
      : "Ничего не найдено. Попробуйте изменить фильтры или написать город иначе.";
  }

  countLabel.textContent = `Найдено: ${list.length} ${plural(list.length, "вакансия", "вакансии", "вакансий")}`;
  loadMore.style.display = list.length > state.shown ? "inline-flex" : "none";

  firstRender = false;
}

// ==========================================
// ДЕЛЕГИРОВАНИЕ
// ==========================================
function bindGridDelegation() {
  const grid = $("#grid");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const favBtn = e.target.closest("[data-fav]");
    if (favBtn) {
      e.preventDefault();
      toggleFav(favBtn.dataset.fav, favBtn);
      if (state.favsOnly) render();
      return;
    }
    const outbound = e.target.closest("[data-outbound]");
    if (outbound) trackApplyClick(outbound);
  });

  grid.addEventListener("error", (e) => {
    const img = e.target;
    if (img && img.tagName === "IMG" && img.closest(".logo-comp")) {
      img.style.display = "none";
    }
  }, true);
}

function toggleFav(id, button) {
  if (state.favs.includes(id)) {
    state.favs = state.favs.filter(item => item !== id);
  } else {
    state.favs.push(id);
  }
  saveFavs();

  if (button) {
    const active = state.favs.includes(id);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", active ? "Убрать из избранного" : "Добавить в избранное");
    button.textContent = active ? "♥" : "♡";
  }
}

// ==========================================
// ПОИСК
// ==========================================
function bindSearch() {
  const queryInput = $("#qInput");
  const cityInput = $("#cityInput");
  const citySelect = $("#fCity");
  const searchForm = $("#searchForm");

  if (!queryInput || !cityInput || !searchForm) return;

  const applySearch = () => {
    state.q = queryInput.value.trim();
    state.city = cityInput.value.trim();
    if (state.city && citySelect) citySelect.value = "";
    state.shown = 12;
    render();
  };

  const applySearchDebounced = debounce(applySearch, 180);

  searchForm.addEventListener("submit", (e) => { e.preventDefault(); applySearch(); });
  queryInput.addEventListener("input", applySearchDebounced);
  cityInput.addEventListener("input", applySearchDebounced);
}

// ==========================================
// ЧИПЫ
// ==========================================
function bindQuickChips() {
  $$("#quickChips [data-tag]").forEach(chip => {
    chip.addEventListener("click", () => {
      const tag = chip.dataset.tag || "";
      state.tag = state.tag === tag ? "" : tag;
      $$("#quickChips [data-tag]").forEach(item => {
        item.classList.toggle("active", item.dataset.tag === state.tag);
      });
      state.shown = 12;
      render();
    });
  });
}

// ==========================================
// ФИЛЬТРЫ
// ==========================================
function populateFilters() {
  const profSelect = $("#fProf");
  const citySelect = $("#fCity");

  if (profSelect) {
    profSelect.length = 1;
    const professions = [...new Set(JOBS.map(job => job.prof).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "ru"));
    professions.forEach(prof => profSelect.add(new Option(prof, prof)));
  }

  if (citySelect) {
    citySelect.length = 1;
    const activeSlugs = new Set();

    JOBS.forEach(job => {
      if (job.active === false) return;
      (job.cities || []).forEach(slug => activeSlugs.add(slug));
      (job.addressCities || []).forEach(slug => activeSlugs.add(slug));
    });

    const cities = [...activeSlugs]
      .map(slug => {
        const city = getCity(slug);
        return { slug, name: city ? city.name : (slugToRuName(slug) || slug) };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));

    cities.forEach(city => citySelect.add(new Option(city.name, city.slug)));
  }
}

function bindFilters() {
  const mapping = { fProf: "prof", fExp: "exp", fFormat: "format", fSchedule: "schedule" };

  Object.entries(mapping).forEach(([id, key]) => {
    const el = $("#" + id);
    if (!el) return;
    el.addEventListener("change", () => {
      state[key] = el.value;
      state.shown = 12;
      render();
    });
  });

  const citySelect = $("#fCity");
  const cityInput = $("#cityInput");
  if (citySelect) {
    citySelect.addEventListener("change", () => {
      const slug = citySelect.value;
      if (slug) {
        const text = citySelect.options[citySelect.selectedIndex].text;
        state.city = text;
        if (cityInput) cityInput.value = text;
      } else {
        state.city = "";
        if (cityInput) cityInput.value = "";
      }
      state.shown = 12;
      render();
    });
  }

  const sortSelect = $("#fSort");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      state.sort = sortSelect.value;
      render();
    });
  }

  const salaryInput = $("#fSalary");
  const salaryOutput = $("#salaryOut");
  if (salaryInput) {
    const updateSalary = debounce(() => {
      state.salary = Number(salaryInput.value) || 0;
      if (salaryOutput) salaryOutput.textContent = `${formatMoney(state.salary)} ₽`;
      state.shown = 12;
      render();
    }, 100);
    salaryInput.addEventListener("input", updateSalary);
    salaryInput.addEventListener("change", updateSalary);
  }
}

// ==========================================
// СБРОС
// ==========================================
function resetFilters() {
  Object.assign(state, {
    q: "", city: "", prof: "", exp: "", format: "",
    schedule: "", salary: 0, sort: "relevant", tag: "", shown: 12, favsOnly: false
  });

  const values = {
    qInput: "", cityInput: "", fProf: "", fCity: "", fExp: "", fFormat: "",
    fSchedule: "", fSort: "relevant", fSalary: "0"
  };

  Object.entries(values).forEach(([id, value]) => {
    const el = $("#" + id);
    if (el) el.value = value;
  });

  const salaryOutput = $("#salaryOut");
  if (salaryOutput) salaryOutput.textContent = "0 ₽";

  $$("#quickChips [data-tag]").forEach(chip => chip.classList.remove("active"));

  const favToggle = $("#favToggle");
  if (favToggle) {
    favToggle.setAttribute("aria-pressed", "false");
    favToggle.classList.remove("active");
  }

  render();
}

// ==========================================
// КОНТРОЛЫ
// ==========================================
function bindControls() {
  $("#resetBtn")?.addEventListener("click", resetFilters);

  const loadMore = $("#loadMore");
  if (loadMore) {
    loadMore.addEventListener("click", () => {
      loadMore.disabled = true;
      state.shown += 12;
      render();
      loadMore.disabled = false;
    });
  }

  const mobileFilterToggle = $("#mobileFilterToggle");
  const filtersRow = $("#filtersRow");
  if (mobileFilterToggle && filtersRow) {
    mobileFilterToggle.addEventListener("click", () => {
      const open = filtersRow.classList.toggle("open");
      mobileFilterToggle.setAttribute("aria-expanded", String(open));
    });
  }

  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");
  if (burger && mobileMenu) {
    burger.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    $$(".mobile-menu a", mobileMenu).forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  const favToggle = $("#favToggle");
  if (favToggle) {
    favToggle.addEventListener("click", () => {
      state.favsOnly = !state.favsOnly;
      favToggle.setAttribute("aria-pressed", String(state.favsOnly));
      favToggle.classList.toggle("active", state.favsOnly);
      state.shown = 12;
      render();
    });
  }
}

// ==========================================
// ДОПОЛНИТЕЛЬНО
// ==========================================
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 2000);
}

function bindExtras() {
  const scrollTopButton = $("#scrollTopBtn");
  if (scrollTopButton) {
    const update = () => scrollTopButton.classList.toggle("show", window.scrollY > 300);
    window.addEventListener("scroll", update, { passive: true });
    update();
    scrollTopButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  const copyEmail = $("#copyEmail");
  if (copyEmail) {
    copyEmail.addEventListener("click", async (event) => {
      event.preventDefault();
      const email = copyEmail.dataset.email || copyEmail.textContent.trim();
      try {
        await navigator.clipboard.writeText(email);
        showToast("Почта скопирована");
      } catch {
        window.location.href = `mailto:${email}`;
      }
    });
  }
}

function bindReveal() {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("in"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach(el => observer.observe(el));

  setTimeout(() => {
    document.querySelectorAll(".reveal:not(.in)").forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) el.classList.add("in");
    });
  }, 1000);
}

// ==========================================
// СТАРТ
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  try {
    bindReveal();
    bindSearch();
    bindQuickChips();
    bindFilters();
    bindControls();
    bindExtras();
    bindGridDelegation();
    loadData();
    document.documentElement.classList.add("js-loaded");
  } catch (e) {
    console.error("WooJob: ошибка инициализации.", e);
    document.documentElement.classList.remove("js-loaded");
  }
});