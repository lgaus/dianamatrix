// Все тексты интерфейса (только русский). Источник — макеты в docs/mockups/.
// Плейсхолдеры в квадратных скобках — временные заглушки.
// TODO: заменить все плейсхолдеры [...] настоящими данными (строки помечены TODO ниже).
// Ключи с суффиксом Mobile — тексты, которые на телефоне отличаются от компьютера.

// Слова формул «Предназначения»; они же названия карточек (personal, social, spiritual, planetary)
const purposeTerms = {
  sky: 'Небо',
  earth: 'Земля',
  male: 'Мужское',
  female: 'Женское',
  personal: 'Личное',
  social: 'Социальное',
  spiritual: 'Духовное',
  planetary: 'Планетарное',
} as const

export const texts = {
  header: {
    logo: 'Диана',
    // Разделитель перед подписью рисует компонент
    tagline: 'матрица судьбы',
    nav: {
      calculator: 'Калькулятор',
      about: 'Обо мне',
    },
    cta: 'Записаться на разбор',
  },

  form: {
    badge: 'Личная и для пары',
    title: 'Рассчитать матрицу судьбы',
    description: 'Бесплатно и сразу: схема матрицы, карта здоровья и предназначение.',
    tabs: {
      personal: 'Личная',
      couple: 'Для пары',
    },
    nameLabel: 'Имя',
    birthDateLabel: 'Дата рождения',
    submit: 'Рассчитать',
  },

  matrix: {
    // Подпись под схемой; date — дата рождения в том виде, как её показать
    caption: (date: string) => `Ваша матрица • ${date}`,
  },

  healthMap: {
    number: '01',
    title: 'Карта здоровья',
    subtitle: '7 чакр: физика, энергия и эмоции',
    columns: {
      chakra: 'Чакра',
      physics: 'Физика',
      energy: 'Энергия',
      emotions: 'Эмоции',
    },
    total: 'Итого',
    // Ключи — id чакр, порядок как в таблице макета
    chakras: {
      sahasrara: { name: 'Сахасрара', zone: 'Голова, мозг' },
      ajna: { name: 'Аджна', zone: 'Глаза, лицо' },
      vishuddha: { name: 'Вишудха', zone: 'Горло, щитовидная железа' },
      anahata: { name: 'Анахата', zone: 'Сердце, лёгкие' },
      manipura: { name: 'Манипура', zone: 'ЖКТ, обмен веществ' },
      svadhisthana: { name: 'Свадхистхана', zone: 'Поясница, репродуктивная система' },
      muladhara: { name: 'Муладхара', zone: 'Позвоночник, ноги' },
    },
  },

  purpose: {
    number: '02',
    title: 'Предназначение',
    subtitle: 'Личное, социальное и духовное — по возрастам',
    terms: purposeTerms,
    // Подписи возрастов у карточек
    ages: {
      personal: '20–40 лет',
      social: '40–60 лет',
      spiritual: 'после 60',
      planetary: 'всю жизнь',
    },
    // Строки формул под крупной цифрой карточки
    formulas: {
      personal: (sky: number, earth: number) =>
        `${purposeTerms.sky} ${sky} + ${purposeTerms.earth} ${earth}`,
      social: (male: number, female: number) =>
        `${purposeTerms.male} ${male} + ${purposeTerms.female} ${female}`,
      spiritual: (personal: number, social: number) =>
        `${purposeTerms.personal} ${personal} + ${purposeTerms.social} ${social}`,
      planetary: (social: number, spiritual: number) =>
        `${purposeTerms.social} ${social} + ${purposeTerms.spiritual} ${spiritual}`,
    },
  },

  consultation: {
    // Надзаголовок; заглавные буквы задаются классом в компоненте
    label: 'Личный разбор',
    title: 'Калькулятор показывает числа. Я помогу понять, что они значат для вас.',
    titleMobile: 'Хотите понять, что эти числа значат для вас?',
    // TODO: заменить [ФАМИЛИЯ] и [короткая строка об опыте и подходе] настоящими данными
    description: 'Диана [ФАМИЛИЯ] — [короткая строка об опыте и подходе].',
    cta: 'Записаться на разбор',
    // TODO: заменить [ЦЕНА] настоящими данными
    ctaMobile: 'Записаться на разбор • [ЦЕНА]',
    // TODO: заменить [ЦЕНА] настоящими данными
    priceNote: '[ЦЕНА] • онлайн',
  },
} as const
