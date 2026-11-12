#!/usr/bin/env node
// WooJob — генератор vacancies.json
// Запуск: node build-vacancies.js
// Вакансии берутся из папки offers/<platform>/*.json
// Партнёрские ссылки — из папки links/<platform>.json

"use strict";

const fs = require("fs");
const path = require("path");

// ==========================================
// СПРАВОЧНИК ГОРОДОВ
// ==========================================
const CITIES_RAW = {
  "moskva": ["Москва", ["москва", "мск", "moscow"]],
  "sankt-peterburg": ["Санкт-Петербург", ["санкт-петербург", "спб", "питер", "saint petersburg"]],
  "arhangelsk": ["Архангельск", ["архангельск"]],
  "vladimir": ["Владимир", ["владимир"]],
  "voronezh": ["Воронеж", ["воронеж"]],
  "ekaterinburg": ["Екатеринбург", ["екатеринбург", "екб"]],
  "ivanovo": ["Иваново", ["иваново"]],
  "izhevsk": ["Ижевск", ["ижевск"]],
  "kazan": ["Казань", ["казань"]],
  "kaluga": ["Калуга", ["калуга"]],
  "krasnodar": ["Краснодар", ["краснодар"]],
  "lipetsk": ["Липецк", ["липецк"]],
  "nizhniy-novgorod": ["Нижний Новгород", ["нижний новгород", "нн"]],
  "novorossiysk": ["Новороссийск", ["новороссийск"]],
  "obninsk": ["Обнинск", ["обнинск"]],
  "orenburg": ["Оренбург", ["оренбург"]],
  "penza": ["Пенза", ["пенза"]],
  "perm": ["Пермь", ["пермь"]],
  "rostov-na-donu": ["Ростов-на-Дону", ["ростов-на-дону", "ростов"]],
  "ryazan": ["Рязань", ["рязань"]],
  "samara": ["Самара", ["самара"]],
  "saratov": ["Саратов", ["саратов"]],
  "tambov": ["Тамбов", ["тамбов"]],
  "tver": ["Тверь", ["тверь"]],
  "tula": ["Тула", ["тула"]],
  "ulyanovsk": ["Ульяновск", ["ульяновск"]],
  "ufa": ["Уфа", ["уфа"]],
  "chelyabinsk": ["Челябинск", ["челябинск"]],
  "yaroslavl": ["Ярославль", ["ярославль"]],
  "bryansk": ["Брянск", ["брянск"]],
  "vologda": ["Вологда", ["вологда"]],
  "kursk": ["Курск", ["курск"]],
  "murmansk": ["Мурманск", ["мурманск"]],
  "orel": ["Орёл", ["орёл", "орел"]],
  "petrozavodsk": ["Петрозаводск", ["петрозаводск"]],
  "smolensk": ["Смоленск", ["смоленск"]],
  "tolyatti": ["Тольятти", ["тольятти"]],
  "severodvinsk": ["Северодвинск", ["северодвинск"]],
  "astrakhan": ["Астрахань", ["астрахань"]],
  "belgorod": ["Белгород", ["белгород"]],
  "blagoveshchensk": ["Благовещенск", ["благовещенск"]],
  "birabidzhan": ["Биробиджан", ["биробиджан"]],
  "velikiy-novgorod": ["Великий Новгород", ["великий новгород"]],
  "kaliningrad": ["Калининград", ["калининград"]],
  "krasnoyarsk": ["Красноярск", ["красноярск"]],
  "nizhnekamsk": ["Нижнекамск", ["нижнекамск"]],
  "nizhnevartovsk": ["Нижневартовск", ["нижневартовск"]],
  "pskov": ["Псков", ["псков"]],
  "saransk": ["Саранск", ["саранск"]],
  "surgut": ["Сургут", ["сургут"]],
  "habarovsk": ["Хабаровск", ["хабаровск"]],
  "hanty-mansiysk": ["Ханты-Мансийск", ["ханты-мансийск"]],
  "cherepovets": ["Череповец", ["череповец"]],
  "volgograd": ["Волгоград", ["волгоград"]],
  "novosibirsk": ["Новосибирск", ["новосибирск", "нск"]],
  "omsk": ["Омск", ["омск"]],
  "elabuga": ["Елабуга", ["елабуга"]],
  "zelenodolsk": ["Зеленодольск", ["зеленодольск"]],
  "startsevo": ["Старцево", ["старцево"]],
  "ob": ["Обь", ["обь"]],
  "shushary": ["Шушары", ["шушары"]],
  "noginsk": ["Ногинск", ["ногинск"]],
  "chechulino": ["Чечулино", ["чечулино"]],
  "vidnoe": ["Видное", ["видное"]],
  "aydarovskoe": ["Айдаровское", ["айдаровское"]],
  "vorsino": ["Ворсино", ["ворсино"]],
  "kirovo-chepetsk": ["Кирово-Чепецк", ["кирово-чепецк"]],
  "dzerzhinsk": ["Дзержинск", ["дзержинск"]],
  "kemerovo": ["Кемерово", ["кемерово"]],
  "kstovo": ["Кстово", ["кстово"]],
  "kotovsk": ["Котовск", ["котовск"]],
  "kuzneck": ["Кузнецк", ["кузнецк"]],
  "yubileyniy": ["Юбилейный", ["юбилейный"]],
  "lobnya": ["Лобня", ["лобня"]],
  "solnechnogorsk": ["Солнечногорск", ["солнечногорск"]],
  "nevinnomyssk": ["Невинномысск", ["невинномысск"]],
  "krasnogorsk": ["Красногорск", ["красногорск"]],
  "kultaevo": ["Култаево", ["култаево"]],
  "scherbinka": ["Щербинка", ["щербинка"]],
  "hutor-lenina": ["Хутор Ленина", ["хутор ленина"]],
  "zeleninskie-dvoriki": ["Зеленинские Дворики", ["зеленинские дворики"]],
  "novosemeykino": ["Новосемейкино", ["новосемейкино"]],
  "storozhevka": ["Сторожевка", ["сторожевка"]],
  "utkina-zavod": ["Уткина Заводь", ["уткина заводь"]],
  "kochkin": ["Кочкин", ["кочкин"]],
  "mytischi": ["Мытищи", ["мытищи"]],
  "ramenskoe": ["Раменское", ["раменское"]],
  "gorodishche": ["Городище", ["городище"]],
  "caricyn": ["Царицын", ["царицын"]],
  "volzhskiy": ["Волжский", ["волжский"]],
  "mendeleevsk": ["Менделеевск", ["менделеевск"]],
  "mamadysh": ["Мамадыш", ["мамадыш"]],
  "osinovo": ["Осиново", ["осиново"]],
  "vasilevo": ["Васильево", ["васильево"]],
  "dubrovka": ["Дубровка", ["дубровка"]],
  "novochuvashskiy": ["Новочувашский", ["новочувашский"]],
  "oktyabrskiy": ["Октябрьский", ["октябрьский"]],
  "naberezhnye-morkvashi": ["Набережные Моркваши", ["набережные моркваши"]],
  "berezovka": ["Берёзовка", ["берёзовка", "березовка"]],
  "sosnovoborsk": ["Сосновоборск", ["сосновоборск"]],
  "emelyanovo": ["Емельяново", ["емельяново"]],
  "kochenevo": ["Коченёво", ["коченёво", "коченево"]],
  "tolmachevo": ["Толмачёво", ["толмачёво", "толмачево"]],
  "krasnoglinnoye": ["Красноглинное", ["красноглинное"]],
  "krasnomayskiy": ["Красномайский", ["красномайский"]],
  "prokudskoe": ["Прокудское", ["прокудское"]],
  "chik": ["Чик", ["чик"]],
  "krasnyy-vostok": ["Красный Восток", ["красный восток"]],
  "kolpino": ["Колпино", ["колпино"]],
  "metallostroy": ["Металлострой", ["металлострой"]],
  "orehovo-zuevo": ["Орехово-Зуево", ["орехово-зуево"]],
  "elektrostal": ["Электросталь", ["электросталь"]],
  "pavlovskiy-posad": ["Павловский Посад", ["павловский посад"]],
  "balashiha": ["Балашиха", ["балашиха"]],
  "chernogolovka": ["Черноголовка", ["черноголовка"]],
  "elektrogorsk": ["Электрогорск", ["электрогорск"]],
  "likino-dulevo": ["Ликино-Дулёво", ["ликино-дулёво", "ликино-дулево"]],
  "trubichino": ["Трубичино", ["трубичино"]],
  "podberezye": ["Подберезье", ["подберезье"]],
  "chudovo": ["Чудово", ["чудово"]],
  "proletariy": ["Пролетарий", ["пролетарий"]],
  "novoselicy": ["Новоселицы", ["новоселицы"]],
  "krestcy": ["Крестцы", ["крестцы"]],
  "semiluki": ["Семилуки", ["семилуки"]],
  "yamnoe": ["Ямное", ["ямное"]],
  "novaya-usman": ["Новая Усмань", ["новая усмань"]],
  "otradnoe": ["Отрадное", ["отрадное"]],
  "ermolino": ["Ермолино", ["ермолино"]],
  "borovsk": ["Боровск", ["боровск"]],
  "balabanovo": ["Балабаново", ["балабаново"]],
  "belousovo": ["Белоусово", ["белоусово"]],
  "zhukov": ["Жуков", ["жуков"]],
  "maloyaroslavets": ["Малоярославец", ["малоярославец"]],
  "kamenskoe": ["Каменское", ["каменское"]],
  "kirov": ["Киров", ["киров"]],
  "shutovschina": ["Шутовщина", ["шутовщина"]],
  "kstinino": ["Кстинино", ["кстинино"]],
  "dresvyanovo": ["Дресвяново", ["дресвяново"]],
  "fateevo": ["Фатеево", ["фатеево"]],
  "aramil": ["Арамиль", ["арамиль"]],
  "beloyarskiy": ["Белоярский", ["белоярский"]],
  "berezovskiy": ["Берёзовский", ["берёзовский", "березовский"]],
  "degtyarsk": ["Дегтярск", ["дегтярск"]],
  "polevskoy": ["Полевской", ["полевской"]],
  "sysert": ["Сысерть", ["сысерть"]],
  "malaya-elnya": ["Малая Ельня", ["малая ельня"]],
  "zimenki": ["Зимёнки", ["зимёнки", "зименки"]],
  "bezvodnoe": ["Безводное", ["безводное"]],
  "senko": ["Сенько", ["сенько"]],
  "belyy-bak": ["Белый Бак", ["белый бак"]],
  "pokrovo-prigorodnoe": ["Покрово-Пригородное", ["покрово-пригородное"]],
  "halino": ["Халино", ["халино"]],
  "yahroma": ["Яхрома", ["яхрома"]],
  "dedenevo": ["Деденево", ["деденево"]],
  "iksha": ["Икша", ["икша"]],
  "nekrasovskiy": ["Некрасовский", ["некрасовский"]],
  "dolgoprudnyy": ["Долгопрудный", ["долгопрудный"]],
  "himki": ["Химки", ["химки"]],
  "putilkovo": ["Путилково", ["путилково"]],
  "mendeleevo": ["Менделеево", ["менделеево"]],
  "andreevka": ["Андреевка", ["андреевка"]],
  "mironcevo": ["Миронцево", ["миронцево"]],
  "klin": ["Клин", ["клин"]],
  "kochubeevskoe": ["Кочубеевское", ["кочубеевское"]],
  "stavropol": ["Ставрополь", ["ставрополь"]],
  "mihaylovsk": ["Михайловск", ["михайловск"]],
  "ivanovskoe": ["Ивановское", ["ивановское"]],
  "svetlograd": ["Светлоград", ["светлоград"]],
  "vladikavkaz": ["Владикавказ", ["владикавказ"]],
  "cherkessk": ["Черкесск", ["черкесск"]],
  "armavir": ["Армавир", ["армавир"]],
  "izobilnyy": ["Изобильный", ["изобильный"]],
  "dedovsk": ["Дедовск", ["дедовск"]],
  "nahabino": ["Нахабино", ["нахабино"]],
  "odincovo": ["Одинцово", ["одинцово"]],
  "zvenigorod": ["Звенигород", ["звенигород"]],
  "nemchinovka": ["Немчиновка", ["немчиновка"]],
  "novoivanovskoe": ["Новоивановское", ["новоивановское"]],
  "vlasiha": ["Власиха", ["власиха"]],
  "krasnokamsk": ["Краснокамск", ["краснокамск"]],
  "kondratovo": ["Кондратово", ["кондратово"]],
  "mysy": ["Мысы", ["мысы"]],
  "nytva": ["Нытва", ["нытва"]],
  "stryapunyata": ["Стряпунята", ["стряпунята"]],
  "mayskiy": ["Майский", ["майский"]],
  "ust-syny": ["Усть-Сыны", ["усть-сыны"]],
  "drozhzhino": ["Дрожжино", ["дрожжино"]],
  "butovo": ["Бутово", ["бутово"]],
  "bykovo": ["Быково", ["быково"]],
  "znamya-oktyabrya": ["Знамя Октября", ["знамя октября"]],
  "erino": ["Ерино", ["ерино"]],
  "devyatskoe": ["Девятское", ["девятское"]],
  "dubrovicy": ["Дубровицы", ["дубровицы"]],
  "bataysk": ["Батайск", ["батайск"]],
  "zernograd": ["Зерноград", ["зерноград"]],
  "rybnoe": ["Рыбное", ["рыбное"]],
  "petra-dubrava": ["Петра Дубрава", ["петра дубрава"]],
  "stroykeramika": ["Стройкерамика", ["стройкерамика"]],
  "alekseevka": ["Алексеевка", ["алексеевка"]],
  "ust-kinelskiy": ["Усть-Кинельский", ["усть-кинельский"]],
  "kinel": ["Кинель", ["кинель"]],
  "novokuybyshevsk": ["Новокуйбышевск", ["новокуйбышевск"]],
  "chapaevsk": ["Чапаевск", ["чапаевск"]],
  "voskresenka": ["Воскресенка", ["воскресенка"]],
  "verhnyaya-podstepnovka": ["Верхняя Подстепновка", ["верхняя подстепновка"]],
  "bolshaya-glushica": ["Большая Глушица", ["большая глушица"]],
  "bezenchuk": ["Безенчук", ["безенчук"]],
  "neftegorsk": ["Нефтегорск", ["нефтегорск"]],
  "bolshaya-chernigovka": ["Большая Черниговка", ["большая черниговка"]],
  "buzuluk": ["Бузулук", ["бузулук"]],
  "pohvistnevo": ["Похвистнево", ["похвистнево"]],
  "hvorostyanka": ["Хворостянка", ["хворостянка"]],
  "kinel-cherkassy": ["Кинель-Черкассы", ["кинель-черкассы"]],
  "mirnyy": ["Мирный", ["мирный"]],
  "obscharovka": ["Обшаровка", ["обшаровка"]],
  "novokurovka": ["Новокуровка", ["новокуровка"]],
  "borskoe": ["Борское", ["борское"]],
  "bogatoe": ["Богатое", ["богатое"]],
  "pugachev": ["Пугачёв", ["пугачёв", "пугачев"]],
  "pestravka": ["Пестравка", ["пестравка"]],
  "syzran": ["Сызрань", ["сызрань"]],
  "engels": ["Энгельс", ["энгельс"]],
  "svetlyy": ["Светлый", ["светлый"]],
  "sokolovyy": ["Соколовый", ["соколовый"]],
  "krasnyy-oktyabr": ["Красный Октябрь", ["красный октябрь"]],
  "dubki": ["Дубки", ["дубки"]],
  "vyazovka": ["Вязовка", ["вязовка"]],
  "oktyabrskiy-gorodok": ["Октябрьский Городок", ["октябрьский городок"]],
  "staraya": ["Старая", ["старая"]],
  "iglino": ["Иглино", ["иглино"]],
  "shaksha": ["Шакша", ["шакша"]],
  "russkiy-yurmash": ["Русский Юрмаш", ["русский юрмаш"]],
  "sterlitamak": ["Стерлитамак", ["стерлитамак"]],
  "asha": ["Аша", ["аша"]],
  "krasnoe-pole": ["Красное Поле", ["красное поле"]],
  "kazancevo": ["Казанцево", ["казанцево"]],
  "esaulskiy": ["Есаульский", ["есаульский"]],
  "novoe-pole": ["Новое Поле", ["новое поле"]],
  "dolgoderеvenskoe": ["Долгодеревенское", ["долгодеревенское"]],
  "adygeysk": ["Адыгейск", ["адыгейск"]],
  "novaya-adygeya": ["Новая Адыгея", ["новая адыгея"]],
  "yablonovskiy": ["Яблоновский", ["яблоновский"]],
  "krasnenskiy": ["Красненский", ["красненский"]],
  "goryachiy-klyuch": ["Горячий Ключ", ["горячий ключ"]],
  "schedrino": ["Щедрино", ["щедрино"]],
  "krasnye-tkachi": ["Красные Ткачи", ["красные ткачи"]],
  "kozmodemyansk": ["Козьмодемьянск", ["козьмодемьянск"]],
  "gavrilov-yam": ["Гаврилов-Ям", ["гаврилов-ям"]],
  "kuznechiha": ["Кузнечиха", ["кузнечиха"]],
  "rostov": ["Ростов", ["ростов"]],
  "tutaev": ["Тутаев", ["тутаев"]],
  "bolshoe-selo": ["Большое Село", ["большое село"]],
  "ivanteevka": ["Ивантеевка", ["ивантеевка"]],
  "korolev": ["Королёв", ["королёв", "королев"]],
  "lesnoy": ["Лесной", ["лесной"]],
  "pravdinskiy": ["Правдинский", ["правдинский"]],
  "pushkino": ["Пушкино", ["пушкино"]],
  "bezheck": ["Бежецк", ["бежецк"]],
  "vysokovsk": ["Высоковск", ["высоковск"]],
  "vyshniy-volochek": ["Вышний Волочёк", ["вышний волочёк", "вышний волочек"]],
  "zaprudnya": ["Запрудня", ["запрудня"]],
  "konakovo": ["Конаково", ["конаково"]],
  "krasnozavodsk": ["Краснозаводск", ["краснозаводск"]],
  "povarovo": ["Поварово", ["поварово"]],
  "radumlya": ["Радумля", ["радумля"]],
  "redkino": ["Редкино", ["редкино"]],
  "rzhev": ["Ржев", ["ржев"]],
  "rogachevo": ["Рогачево", ["рогачево"]],
  "rybinsk": ["Рыбинск", ["рыбинск"]],
  "taldom": ["Талдом", ["талдом"]],
  "venev": ["Венёв", ["венёв", "венев"]],
  "volosovo": ["Волосово", ["волосово"]],
  "kurovskoe": ["Куровское", ["куровское"]],
  "mihaylovskaya-sloboda": ["Михайловская Слобода", ["михайловская слобода"]],
  "roshal": ["Рошаль", ["рошаль"]],
  "uzlovaya": ["Узловая", ["узловая"]],
  "shatura": ["Шатура", ["шатура"]],
  "yasnogorsk": ["Ясногорск", ["ясногорск"]],
  "aleksin": ["Алексин", ["алексин"]],
  "kostroma": ["Кострома", ["кострома"]],
  "kineshma": ["Кинешма", ["кинешма"]],
  "shuya": ["Шуя", ["шуя"]],
  "vihuga": ["Вичуга", ["вичуга"]],
  "borovichi": ["Боровичи", ["боровичи"]],
  "staraya-russa": ["Старая Русса", ["старая русса"]],
  "livny": ["Ливны", ["ливны"]],
  "velikie-luki": ["Великие Луки", ["великие луки"]],
  "kasimov": ["Касимов", ["касимов"]],
  "skopin": ["Скопин", ["скопин"]],
  "sasovo": ["Сасово", ["сасово"]],
  "vyazma": ["Вязьма", ["вязьма"]],
  "roslavl": ["Рославль", ["рославль"]],
  "safonovo": ["Сафоново", ["сафоново"]],
  "yarcevo": ["Ярцево", ["ярцево"]],
  "kimry": ["Кимры", ["кимры"]],
  "torzhok": ["Торжок", ["торжок"]],
  "novomoskovsk": ["Новомосковск", ["новомосковск"]],
  "donskoy": ["Донской", ["донской"]],
  "sovetsk": ["Советск", ["советск"]],
  "uglich": ["Углич", ["углич"]],
  "pereslavl-zalesskiy": ["Переславль-Залесский", ["переславль-залесский"]],
  "borisoglebsk": ["Борисоглебск", ["борисоглебск"]],
  "rossosh": ["Россошь", ["россошь"]],
  "liski": ["Лиски", ["лиски"]],
  "novovoronezh": ["Нововоронеж", ["нововоронеж"]],
  "vsevolozhsk": ["Всеволожск", ["всеволожск"]],
  "gatchina": ["Гатчина", ["гатчина"]],
  "vysotsk": ["Высоцк", ["высоцк"]],
  "primorsk": ["Приморск", ["приморск"]],
  "sestroreck": ["Сестрорецк", ["сестрорецк"]],
  "kronstadt": ["Кронштадт", ["кронштадт"]],
  "klintsy": ["Клинцы", ["клинцы"]],
  "novozybkov": ["Новозыбков", ["новозыбков"]],
  "dyatkovo": ["Дятьково", ["дятьково"]],
  "starodub": ["Стародуб", ["стародуб"]],
  "kovrov": ["Ковров", ["ковров"]],
  "murom": ["Муром", ["муром"]],
  "gus-hrustalnyy": ["Гусь-Хрустальный", ["гусь-хрустальный"]],
  "vyazniki": ["Вязники", ["вязники"]],
  "suzdal": ["Суздаль", ["суздаль"]],
  "lyudinovo": ["Людиново", ["людиново"]],
  "svobodnyy": ["Свободный", ["свободный"]],
  "aleksandrovka": ["Александровка", ["александровка"]],
  "borisovka": ["Борисовка", ["борисовка"]],
  "veydelevka": ["Вейделевка", ["вейделевка"]],
  "dubovoe": ["Дубовое", ["дубовое"]],
  "korocha": ["Короча", ["короча"]],
  "novyy-oskol": ["Новый Оскол", ["новый оскол"]],
  "proletarskiy": ["Пролетарский", ["пролетарский"]],
  "razumnoe": ["Разумное", ["разумное"]],
  "rakitnoe": ["Ракитное", ["ракитное"]],
  "severnyy": ["Северный", ["северный"]],
  "seretino": ["Серетино", ["серетино"]],
  "smidovich": ["Смидович", ["смидович"]],
  "okulovka": ["Окуловка", ["окуловка"]],
  "valday": ["Валдай", ["валдай"]],
  "neman": ["Неман", ["неман"]],
  "polessk": ["Полесск", ["полесск"]],
  "yantarnyy": ["Янтарный", ["янтарный"]],
  "elec": ["Елец", ["елец"]],
  "volodarsk": ["Володарск", ["володарск"]],
  "naryshkino": ["Нарышкино", ["нарышкино"]],
  "bolshoy-kamen": ["Большой Камень", ["большой камень"]],
  "dalnegorsk": ["Дальнегорск", ["дальнегорск"]],
  "dedovichi": ["Дедовичи", ["дедовичи"]],
  "dno": ["Дно", ["дно"]],
  "ostrov": ["Остров", ["остров"]],
  "strugi-krasnye": ["Струги Красные", ["струги красные"]],
  "amursk": ["Амурск", ["амурск"]],
  "sovetskaya-gavan": ["Советская Гавань", ["советская гавань"]],
  "solnechnyy": ["Солнечный", ["солнечный"]],
  "naro-fominsk": ["Наро-Фоминск", ["наро-фоминск"]],
  "dzerzhinskiy": ["Дзержинский", ["дзержинский"]],
  "dmitrov": ["Дмитров", ["дмитров"]],
  "dmitrievskiy": ["Дмитриевский", ["дмитриевский"]],
  "istra": ["Истра", ["истра"]],
  "yoshkar-ola": ["Йошкар-Ола", ["йошкар-ола"]],
  "kashira": ["Кашира", ["кашира"]],
  "kirzhach": ["Киржач", ["киржач"]],
  "kraskovo": ["Красково", ["красково"]],
  "kubinka": ["Кубинка", ["кубинка"]],
  "losino-petrovskiy": ["Лосино-Петровский", ["лосино-петровский"]],
  "lytkarino": ["Лыткарино", ["лыткарино"]],
  "lyubercy": ["Люберцы", ["люберцы"]],
  "mozhaysk": ["Можайск", ["можайск"]],
  "moskovskiy": ["Московский", ["московский"]],
  "ruza": ["Руза", ["руза"]],
  "sverdlovskiy": ["Свердловский", ["свердловский"]],
  "sergiev-posad": ["Сергиев Посад", ["сергиев посад"]],
  "serpukhov": ["Серпухов", ["серпухов"]],
  "stupino": ["Ступино", ["ступино"]],
  "trehgorka": ["Трехгорка", ["трехгорка"]],
  "troick": ["Троицк", ["троицк"]],
  "schapovo": ["Щапово", ["щапово"]],
  "schelkovo": ["Щёлково", ["щёлково", "щелково"]],
  "chehov": ["Чехов", ["чехов"]],
  "bronnicy": ["Бронницы", ["бронницы"]],
  "bugry": ["Бугры", ["бугры"]],
  "murino": ["Мурино", ["мурино"]],
  "novinki": ["Новинки", ["новинки"]],
  "pushkin": ["Пушкин", ["пушкин"]],
  "reutov": ["Реутов", ["реутов"]],
  "hotkovo": ["Хотьково", ["хотьково"]],
  "zelenograd": ["Зеленоград", ["зеленоград"]],
  "kotelniki": ["Котельники", ["котельники"]],
  "aleksandrov": ["Александров", ["александров"]],
  "voskresensk": ["Воскресенск", ["воскресенск"]],
  "domodedovo": ["Домодедово", ["домодедово"]],
  "dubna": ["Дубна", ["дубна"]],
  "egorevsk": ["Егорьевск", ["егорьевск"]],
  "zhukovskiy": ["Жуковский", ["жуковский"]],
  "kolomna": ["Коломна", ["коломна"]],
  "naberezhnye-chelny": ["Набережные Челны", ["набережные челны"]],
  "podolsk": ["Подольск", ["подольск"]],
  "boltino": ["Болтино", ["болтино"]],
  "brehovo": ["Брехово", ["брехово"]],
  "glinkovo": ["Глинково", ["глинково"]],
  "gribki": ["Грибки", ["грибки"]],
  "lunevo": ["Лунёво", ["лунёво", "лунево"]],
  "manyuhino": ["Манюхино", ["манюхино"]],
  "pervomayskiy": ["Первомайский", ["первомайский"]],
  "pirogovo": ["Пирогово", ["пирогово"]],
  "saburovo": ["Сабурово", ["сабурово"]],
  "skoropuskovskiy": ["Скоропусковский", ["скоропусковский"]],
  "soloslovo": ["Солослово", ["солослово"]],
  "mescherino": ["Мещерино", ["мещерино"]],
  "makarovo": ["Макарово", ["макарово"]],
  "agalatovo": ["Агалатово", ["агалатово"]],
  "maloe-karlino": ["Малое Карлино", ["малое карлино"]],
  "poroshkino": ["Порошкино", ["порошкино"]],
  "telmana": ["Тельмана", ["тельмана"]],
  "ust-luga": ["Усть-Луга", ["усть-луга"]],
  "volzhsk": ["Волжск", ["волжск"]],
  "barnaul": ["Барнаул", ["барнаул"]],
  "tomsk": ["Томск", ["томск"]],
  "tyumen": ["Тюмень", ["тюмень"]],

  // ===== Добавлено для офферов из offers/ =====
  "tarusa": ["Таруса", ["таруса"]],
  "schekino": ["Щёкино", ["щёкино", "щекино"]],
  "zaokskiy": ["Заокский", ["заокский"]],
  "golicyno": ["Голицыно", ["голицыно"]],
  "vatutinki": ["Ватутинки", ["ватутинки"]],
  "klimovsk": ["Климовск", ["климовск"]],
  "fryazino": ["Фрязино", ["фрязино"]],
  "krasnoarmeysk": ["Красноармейск", ["красноармейск"]],
  "obuhovo": ["Обухово", ["обухово"]],
  "staraya-kupavna": ["Старая Купавна", ["старая купавна"]],
  "petrovskoe": ["Петровское", ["петровское"]],
  "snegiri": ["Снегири", ["снегири"]],
  "volokolamsk": ["Волоколамск", ["волоколамск"]],
  "nikolskoe": ["Никольское", ["никольское"]],
  "yanino-1": ["Янино-1", ["янино-1", "янино 1"]],
  "slavyanka": ["Славянка", ["славянка"]],
  "kudrovo": ["Кудрово", ["кудрово"]],
  "vladivostok": ["Владивосток", ["владивосток"]],
  "artem": ["Артём", ["артём", "артем"]],
  "ussuriysk": ["Уссурийск", ["уссурийск"]],
  "nadezhdinskoe": ["Надеждинское", ["надеждинское"]],
  "krasnoslobodsk": ["Краснослободск", ["краснослободск"]],
  "bogorodsk": ["Богородск", ["богородск"]],
  "zavolzhe": ["Заволжье", ["заволжье"]],
  "balahna": ["Балахна", ["балахна"]],
  "mahachkala": ["Махачкала", ["махачкала"]],
  "kaspiysk": ["Каспийск", ["каспийск"]],
  "kizilyurt": ["Кизилюрт", ["кизилюрт"]],
  "bujnaksk": ["Буйнакск", ["буйнакск"]],
  "kolyvan": ["Колывань", ["колывань"]],
  "krivodanovka": ["Криводановка", ["криводановка"]],
  "verh-tula": ["Верх-Тула", ["верх-тула", "верх тула"]],
  "krasnoobsk": ["Краснообск", ["краснообск"]],
  "mednoe": ["Медное", ["медное"]],
  "lihoslavl": ["Лихославль", ["лихославль"]],
  "knyaze-volkonskoe": ["Князе-Волконское", ["князе-волконское", "князе волконское"]],
  "topolevo": ["Тополево", ["тополево"]],
  "bragino": ["Брагино", ["брагино"]],
  "zavolga": ["Заволга", ["заволга"]],
  "novocherkassk": ["Новочеркасск", ["новочеркасск"]],
  "shahty": ["Шахты", ["шахты"]],
  "aksay": ["Аксай", ["аксай"]],
  "azov": ["Азов", ["азов"]],
  "taganrog": ["Таганрог", ["таганрог"]],
  "ramon": ["Рамонь", ["рамонь"]],
  "minsk": ["Минск", ["минск"]],
  "borisov": ["Борисов", ["борисов"]],
  "zhodino": ["Жодино", ["жодино"]],
  "smolevichi": ["Смолевичи", ["смолевичи"]],
  "bobruysk": ["Бобруйск", ["бобруйск"]],
  "vitebsk": ["Витебск", ["витебск"]],
  "orsha": ["Орша", ["орша"]],
  "mogilev": ["Могилёв", ["могилёв", "могилев"]],
  "nefteyugansk": ["Нефтеюганск", ["нефтеюганск"]],
  "nizhniy-tagil": ["Нижний Тагил", ["нижний тагил"]],
  "sobinka": ["Собинка", ["собинка"]]
};

// ==========================================
// СПРАВОЧНИК РЕГИОНОВ
// ==========================================
const REGIONS_RAW = [
  { slug: "moskovskaya-oblast", name: "Московская область", okrug: "ЦФО", aliases: ["московская область", "мо", "подмосковье"] },
  { slug: "leningradskaya-oblast", name: "Ленинградская область", okrug: "СЗФО", aliases: ["ленинградская область", "ло"] },
  { slug: "tverskaya-oblast", name: "Тверская область", okrug: "ЦФО", aliases: ["тверская область"] },
  { slug: "vologodskaya-oblast", name: "Вологодская область", okrug: "СЗФО", aliases: ["вологодская область"] },
  { slug: "yaroslavskaya-oblast", name: "Ярославская область", okrug: "ЦФО", aliases: ["ярославская область"] },
  { slug: "amurskaya-oblast", name: "Амурская область", okrug: "ДФО", aliases: ["амурская область"] },
  { slug: "belgorodskaya-oblast", name: "Белгородская область", okrug: "ЦФО", aliases: ["белгородская область"] },
  { slug: "evreyskaya-ao", name: "Еврейская АО", okrug: "ДФО", aliases: ["еврейская ао", "еао"] },
  { slug: "novgorodskaya-oblast", name: "Новгородская область", okrug: "СЗФО", aliases: ["новгородская область"] },
  { slug: "kaliningradskaya-oblast", name: "Калининградская область", okrug: "СЗФО", aliases: ["калининградская область"] },
  { slug: "kaluzhskaya-oblast", name: "Калужская область", okrug: "ЦФО", aliases: ["калужская область"] },
  { slug: "lipetskaya-oblast", name: "Липецкая область", okrug: "ЦФО", aliases: ["липецкая область"] },
  { slug: "nizhegorodskaya-oblast", name: "Нижегородская область", okrug: "ПФО", aliases: ["нижегородская область"] },
  { slug: "orlovskaya-oblast", name: "Орловская область", okrug: "ЦФО", aliases: ["орловская область"] },
  { slug: "primorskiy-kray", name: "Приморский край", okrug: "ДФО", aliases: ["приморский край"] },
  { slug: "pskovskaya-oblast", name: "Псковская область", okrug: "СЗФО", aliases: ["псковская область"] },
  { slug: "smolenskaya-oblast", name: "Смоленская область", okrug: "ЦФО", aliases: ["смоленская область"] },
  { slug: "tulskaya-oblast", name: "Тульская область", okrug: "ЦФО", aliases: ["тульская область"] },
  { slug: "habarovskiy-kray", name: "Хабаровский край", okrug: "ДФО", aliases: ["хабаровский край"] },
  { slug: "bryanskaya-oblast", name: "Брянская область", okrug: "ЦФО", aliases: ["брянская область"] },
  { slug: "vladimirskaya-oblast", name: "Владимирская область", okrug: "ЦФО", aliases: ["владимирская область"] },
  { slug: "ivanovskaya-oblast", name: "Ивановская область", okrug: "ЦФО", aliases: ["ивановская область"] },
  { slug: "kostromskaya-oblast", name: "Костромская область", okrug: "ЦФО", aliases: ["костромская область"] },
  { slug: "ryazanskaya-oblast", name: "Рязанская область", okrug: "ЦФО", aliases: ["рязанская область"] },
  { slug: "voronezhskaya-oblast", name: "Воронежская область", okrug: "ЦФО", aliases: ["воронежская область"] },
  { slug: "kurskaya-oblast", name: "Курская область", okrug: "ЦФО", aliases: ["курская область"] },
  { slug: "tambovskaya-oblast", name: "Тамбовская область", okrug: "ЦФО", aliases: ["тамбовская область"] },
  { slug: "moskva", name: "Москва", okrug: "ЦФО", aliases: ["москва", "мск"] },
  { slug: "sankt-peterburg", name: "Санкт-Петербург", okrug: "СЗФО", aliases: ["санкт-петербург", "спб"] },
  { slug: "volgogradskaya-oblast", name: "Волгоградская область", okrug: "ЮФО", aliases: ["волгоградская область"] },
  { slug: "saratovskaya-oblast", name: "Саратовская область", okrug: "ПФО", aliases: ["саратовская область"] },
  { slug: "tatarstan", name: "Республика Татарстан", okrug: "ПФО", aliases: ["татарстан", "республика татарстан"] },
  { slug: "mordoviya", name: "Республика Мордовия", okrug: "ПФО", aliases: ["мордовия", "республика мордовия"] },
  { slug: "dagestan", name: "Республика Дагестан", okrug: "СКФО", aliases: ["дагестан", "республика дагестан"] }
];

// ==========================================
// БАЗОВЫЙ ШАБЛОН ВАКАНСИИ
// ==========================================
function baseVacancy(overrides) {
  return {
    id: "", source: "", company: "", position: "", details: "", fullDescription: null,
    prof: "", salaryFrom: null, salaryTo: null, salaryHour: null, salaryDay: null,
    salaryNote: null, salaryGross: false, salaryCurrency: "RUB",
    cities: [], regions: [], transportCities: [], addressCities: [],
    isRemote: false, vahta: false, vahtaRegions: [], vahtaOkrugs: [],
    exp: "Без опыта", format: "Полная занятость", schedule: "Сменный", scheduleNote: null,
    tags: [], citizenship: "rf", gender: "any", ageFrom: null, ageTo: null,
    requirements: [], vehicleRequirements: null, referralBonus: null, performanceBonus: null,
    travelCompensation: null, addresses: {}, warehouseCity: null, warehouseAddress: null,
    rcName: null, bonuses: [], priorityCities: [], pop: 50, logo: "",
    partnerUrl: null, partnerType: "click", partnerReward: null, active: true,
    ...overrides
  };
}

// ==========================================
// ЗАГРУЗКА ПАРТНЁРСКИХ ССЫЛОК ИЗ links/
// ==========================================
const LINKS_DIR = path.join(__dirname, "links");

function loadPartnerLinks() {
  const result = { pampadu: {}, lovko: {} };
  if (!fs.existsSync(LINKS_DIR)) return result;

  for (const platform of ["pampadu", "lovko", "leads"]) {
    const filePath = path.join(LINKS_DIR, `${platform}.json`);
    if (!fs.existsSync(filePath)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        console.warn(`⚠️  links/${platform}.json: ожидается объект { id: {...} }`);
        continue;
      }
      result[platform] = raw;
    } catch (e) {
      console.error(`❌ links/${platform}.json: невалидный JSON — ${e.message}`);
    }
  }
  return result;
}

// ==========================================
// ЗАГРУЗКА ОФФЕРОВ ИЗ offers/
// ==========================================
const OFFERS_DIR = path.join(__dirname, "offers");

function mergeOffer(defaults, vacancy) {
  const merged = { ...defaults, ...vacancy };
  merged.tags = [...new Set([...(defaults.tags || []), ...(vacancy.tags || [])])];
  if (merged.bonuses && merged.bonuses.length && !merged.tags.includes("transport")) {
    merged.tags.push("transport");
  }
  return merged;
}

function loadOffers() {
  const result = [];
  const links = loadPartnerLinks();
  const seenIds = { pampadu: new Set(), lovko: new Set(), leads: new Set() };

  if (!fs.existsSync(OFFERS_DIR)) {
    console.warn("⚠️  Папка offers/ не найдена — вакансии не будут загружены.");
    return result;
  }

  for (const platform of ["lovko", "pampadu", "leads"]) {
    const platformDir = path.join(OFFERS_DIR, platform);
    if (!fs.existsSync(platformDir)) continue;

    const platformLinks = links[platform] || {};
    const seen = seenIds[platform];

    for (const file of fs.readdirSync(platformDir)) {
      if (!file.endsWith(".json")) continue;
      const filePath = path.join(platformDir, file);
      let raw;
      try {
        raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch (e) {
        console.error(`❌ ${filePath}: невалидный JSON — ${e.message}`);
        continue;
      }
      if (!raw.company || !Array.isArray(raw.vacancies)) {
        console.error(`❌ ${filePath}: нужны поля company и vacancies[]`);
        continue;
      }
      const defaults = raw.defaults || {};
      raw.vacancies.forEach(v => {
        if (!v.id || !v.position) {
          console.error(`❌ ${filePath}: пропущена вакансия без id/position`);
          return;
        }

        seen.add(v.id);
        const link = platformLinks[v.id] || {};
        const merged = mergeOffer(defaults, v);

        result.push(baseVacancy({
          source: raw.source || (platform === "pampadu" ? "Pampadu" : "Lovko"),
          company: raw.company,
          logo: raw.logo || "",
          partnerType: raw.partnerType || "click",
          partnerReward: raw.partnerReward || null,
          ...merged,
          ...(link.partnerUrl ? { partnerUrl: link.partnerUrl } : {}),
          ...(link.partnerType ? { partnerType: link.partnerType } : {}),
          ...(link.partnerReward ? { partnerReward: link.partnerReward } : {})
        }));
      });
    }

    // Проверка «лишних» id в links/<platform>.json
    Object.keys(platformLinks).forEach(id => {
      if (!seen.has(id)) {
        console.warn(`⚠️  links/${platform}.json: id "${id}" не найден ни в одной вакансии offers/${platform}/`);
      }
    });
  }

  return result;
}

// ==========================================
// СБОРКА
// ==========================================
function build() {
  const vacancies = [];
  vacancies.push(...loadOffers());
  return vacancies;
}

// ==========================================
// ЗАПИСЬ
// ==========================================
function writeJson() {
  const cities = Object.entries(CITIES_RAW).map(([slug, [name, aliases]]) => ({ slug, name, aliases }));

  const data = {
    version: 2,
    updated: new Date().toISOString().slice(0, 10),
    cities,
    regions: REGIONS_RAW,
    vacancies: build()
  };

  const citySet = new Set(cities.map(c => c.slug));
  const missing = new Set();
  data.vacancies.forEach(v => {
    (v.cities || []).forEach(slug => { if (!citySet.has(slug)) missing.add(slug); });
    (v.addressCities || []).forEach(slug => { if (!citySet.has(slug)) missing.add(slug); });
  });
  if (missing.size > 0) {
    console.warn("⚠️  В вакансиях есть slug'и, которых нет в справочнике cities:");
    console.warn(Array.from(missing).join(", "));
    console.warn("Добавь их в CITIES_RAW и перезапусти.");
  } else {
    console.log("✅ Все slug'и в вакансиях есть в справочнике cities.");
  }

  const regionSet = new Set(REGIONS_RAW.map(r => r.slug));
  const missingRegions = new Set();
  data.vacancies.forEach(v => {
    (v.regions || []).forEach(slug => { if (!regionSet.has(slug)) missingRegions.add(slug); });
    (v.vahtaRegions || []).forEach(slug => { if (!regionSet.has(slug)) missingRegions.add(slug); });
  });
  if (missingRegions.size > 0) {
    console.warn("⚠️  В вакансиях есть regions, которых нет в справочнике:");
    console.warn(Array.from(missingRegions).join(", "));
    console.warn("Добавь их в REGIONS_RAW и перезапусти.");
  } else {
    console.log("✅ Все regions в вакансиях есть в справочнике.");
  }

  const ids = data.vacancies.map(v => v.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    console.warn("⚠️  Дубликаты id:", Array.from(new Set(dupes)).join(", "));
  } else {
    console.log("✅ Все id уникальны.");
  }

  const outPath = path.join(__dirname, "vacancies.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`✅ Записано ${data.vacancies.length} вакансий в ${outPath}`);
  console.log(`✅ Городов в справочнике: ${cities.length}`);
  console.log(`✅ Регионов: ${data.regions.length}`);
}

writeJson();