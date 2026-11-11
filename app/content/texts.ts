// Все тексты интерфейса (только русский). Источник — макеты в docs/mockups/.
// Плейсхолдеры в квадратных скобках — временные заглушки.
// TODO: заменить все плейсхолдеры [...] настоящими данными (строки помечены TODO ниже).
// Ключи с суффиксом Mobile — тексты, которые на телефоне отличаются от компьютера.
import type { ChakraId } from '../utils/matrix/types'
import type { BirthDateError } from '../utils/date/birthDate'

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
      about: 'Обо мне',
    },
    cta: 'Записаться на разбор',
    // Кнопка записи в шапке /about на экранах уже 480 px (перелом xs; полный текст не помещается)
    ctaShort: 'Записаться',
    // aria-label кнопки-бургера (телефон)
    menuLabel: 'Меню',
    // Скрытый текст ссылки-логотипа на /about (вместо арки — стрелка «назад»); доступное имя — он + имя логотипа
    backToHome: 'На главную',
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
    // Подписи-подсказки внутри пустых полей
    namePlaceholder: 'Как вас зовут',
    birthDatePlaceholder: 'ДД.ММ.ГГГГ',
    // Пометка у таба «Для пары», пока он не работает
    soon: 'скоро',
    // Ошибки поля даты; ключи — коды ошибок из app/utils/date/birthDate.ts.
    // tooEarly — функция от самого раннего допустимого года (граница задаётся только в birthDate.ts, MIN_BIRTH_DATE)
    errors: {
      required: 'Введите дату рождения',
      format: 'Введите дату в формате ДД.ММ.ГГГГ',
      nonexistent: 'Такой даты нет — проверьте день и месяц',
      future: 'Дата не может быть в будущем',
      tooEarly: (minYear: number) => `Год — не раньше ${minYear}`,
    } satisfies Record<BirthDateError, string | ((minYear: number) => string)>,
    calendar: {
      // Доступное имя окна календаря
      label: 'Календарь',
      confirm: 'Подтвердить',
      prevMonth: 'Предыдущий месяц',
      nextMonth: 'Следующий месяц',
      // Доступные имена селектов года и месяца
      year: 'Год',
      month: 'Месяц',
      // С января по декабрь
      months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
      // С понедельника
      weekdays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    },
  },

  matrix: {
    // Подпись под схемой; date — дата рождения в том виде, как её показать, name — имя из формы (если введено)
    caption: (date: string, name?: string) => `${name || 'Ваша матрица'} • ${date}`,
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
    } satisfies Record<ChakraId, { name: string, zone: string }>,
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
