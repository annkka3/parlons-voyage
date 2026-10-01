'use strict';
/* ---------- CONTENT: the 10-day travel deck ---------- */
const SVP_IPA = 'sil vu plɛ', SVP_CY = 'силь ву плэ';
const pad2 = n => String(n).padStart(2, '0');

const DAYS = [
  { d: 1, e: '👋', en: 'Greetings & asking to repeat', ru: 'Приветствие и переспрос' },
  { d: 2, e: '☕', en: 'Café & bakery', ru: 'Кафе и пекарня' },
  { d: 3, e: '💶', en: 'Prices & payment', ru: 'Цены и оплата' },
  { d: 4, e: '🍽️', en: 'Restaurant', ru: 'Ресторан' },
  { d: 5, e: '🏨', en: 'Hotel', ru: 'Отель' },
  { d: 6, e: '🧭', en: 'Getting around', ru: 'Дорога и ориентирование' },
  { d: 7, e: '🔁', en: 'Review & role-play', ru: 'Повторение и диалоги', review: true },
  { d: 8, e: '🛒', en: 'Shop & market', ru: 'Магазин и рынок' },
  { d: 9, e: '🆘', en: 'Help & problems', ru: 'Помощь и проблемы' },
  { d: 10, e: '🎭', en: 'Final dialogues', ru: 'Итоговые диалоги', review: true },
];
const DAY = Object.fromEntries(DAYS.map(x => [x.d, x]));

// k: 's' = Say it, 'h' = Understand by ear
const ph = (d, n, k, sc, en, fr, ru, ipa, cy, ne, nr) => ({
  id: `fr-d${pad2(d)}-${pad2(n)}`, kind: 'ph', d, k, sc, en, fr, ru,
  ipa: ipa.replace('{svp}', SVP_IPA), cy: cy.replace('{svp}', SVP_CY), ne, nr,
});

const PH = [
  /* Day 1 */
  ph(1, 1, 's', '👋🙂', 'Hello / Good morning', 'Bonjour !', 'Здравствуйте! / Добрый день!', 'bɔ̃ʒuʁ', 'бонжур',
    'This deck uses the polite form: vous.', 'В этой колоде используем вежливое обращение vous.'),
  ph(1, 2, 's', '🙏😊', 'Thank you', 'Merci.', 'Спасибо.', 'mɛʁsi', 'мерси',
    'Works as a stand-alone reply.', 'Можно использовать как самостоятельную реплику.'),
  ph(1, 3, 's', '🙋', 'Excuse me', 'Excusez-moi.', 'Извините.', 'ɛkskyze mwa', 'экскюзэ муа',
    'Use it before a question or a request.', 'Подходит перед вопросом или просьбой.'),
  ph(1, 4, 's', '🤷❓', 'I don’t understand', 'Je ne comprends pas.', 'Я не понимаю.', 'ʒə nə kɔ̃pʁɑ̃ pa', 'жё нё компран па',
    'Follow it with a request to repeat or to speak slowly.', 'После этого можно попросить повторить или говорить медленнее.'),
  ph(1, 5, 's', '🔁🗣️', 'Can you repeat that, please?', 'Vous pouvez répéter, s’il vous plaît ?', 'Вы можете повторить, пожалуйста?',
    'vu puve ʁepete, {svp}', 'ву пувэ рэпэтэ, {svp}',
    'A polite question; say it as one chunk.', 'Вежливый вопрос; произносим как цельную реплику.'),
  ph(1, 6, 's', '🐢🗣️', 'More slowly, please', 'Plus lentement, s’il vous plaît.', 'Помедленнее, пожалуйста.',
    'ply lɑ̃tmɑ̃, {svp}', 'плю лантман, {svp}',
    'A short request; no need to repeat the whole question.', 'Короткая просьба, не требует повторять весь вопрос.'),
  ph(1, 7, 's', '👋🚪', 'Goodbye', 'Au revoir !', 'До свидания!', 'o ʁəvwaʁ', 'о рёвуар',
    'To close a short conversation.', 'Для завершения короткого разговора.'),

  /* Day 2 */
  ph(2, 1, 's', '☕🧍', 'I’d like a coffee, please', 'Je voudrais un café, s’il vous plaît.', 'Я хотела бы кофе, пожалуйста.',
    'ʒə vudʁɛ ɛ̃ kafe, {svp}', 'жё вудрэ ан кафэ, {svp}',
    'un café = a coffee; Je voudrais… = I would like…', 'un café — кофе; конструкция Je voudrais… — «Я хотела бы…».'),
  ph(2, 2, 's', '💧🥤', 'I’d like some water, please', 'Je voudrais de l’eau, s’il vous plaît.', 'Я хотела бы воды, пожалуйста.',
    'ʒə vudʁɛ də lo, {svp}', 'жё вудрэ дё ло, {svp}',
    'de l’eau = (some) water; never “un eau”.', 'de l’eau — воды; не заменяем на un eau.'),
  ph(2, 3, 's', '🥐🥐', 'I’d like two croissants, please', 'Je voudrais deux croissants, s’il vous plaît.', 'Я хотела бы два круассана, пожалуйста.',
    'ʒə vudʁɛ dø kʁwasɑ̃, {svp}', 'жё вудрэ дё круассан, {svp}',
    'deux croissants = two croissants; swap the number as needed.', 'deux croissants — два круассана; количество можно менять.'),
  ph(2, 4, 's', '🪑☕', 'To eat / drink here, please', 'Sur place, s’il vous plaît.', 'Здесь, пожалуйста.',
    'syʁ plas, {svp}', 'сюр пляс, {svp}',
    'The answer to: Sur place ou à emporter ?', 'Ответ на вопрос Sur place ou à emporter ?'),
  ph(2, 5, 's', '🥡☕', 'To take away, please', 'À emporter, s’il vous plaît.', 'С собой, пожалуйста.',
    'a ɑ̃pɔʁte, {svp}', 'а анпортэ, {svp}',
    'The answer to: Sur place ou à emporter ?', 'Ответ на вопрос Sur place ou à emporter ?'),
  ph(2, 6, 'h', '🪑❓🥡', 'For here or to take away?', 'Sur place ou à emporter ?', 'Здесь или с собой?',
    'syʁ plas u a ɑ̃pɔʁte', 'сюр пляс у а анпортэ',
    'Pick one: Sur place or À emporter.', 'Нужно выбрать Sur place или À emporter.'),
  ph(2, 7, 's', '🙅🙂', 'No, thank you', 'Non, merci.', 'Нет, спасибо.', 'nɔ̃ mɛʁsi', 'нон мерси',
    'For example, when they offer you something else.', 'Например, когда предлагают что-то ещё.'),

  /* Day 3 */
  ph(3, 1, 's', '🏷️❓', 'How much is it?', 'C’est combien ?', 'Сколько это стоит?', 'sɛ kɔ̃bjɛ̃', 'сэ конбьен',
    'A short, spoken question about the price.', 'Короткий разговорный вопрос о стоимости.'),
  ph(3, 2, 's', '💳❓', 'Can I pay by card?', 'Je peux payer par carte ?', 'Я могу оплатить картой?',
    'ʒə pø peje paʁ kaʁt', 'жё пё пэйе пар карт',
    'par carte = by card; here carte is a bank card.', 'par carte — картой; здесь carte означает банковскую карту.'),
  ph(3, 3, 's', '💳🙂', 'By card, please', 'Par carte, s’il vous plaît.', 'Картой, пожалуйста.',
    'paʁ kaʁt, {svp}', 'пар карт, {svp}',
    'A short answer when asked how you’ll pay.', 'Короткий ответ, когда спрашивают способ оплаты.'),
  ph(3, 4, 'h', '💳❓💶', 'By card or in cash?', 'Par carte ou en espèces ?', 'Картой или наличными?',
    'paʁ kaʁt u ɑ̃n‿ɛspɛs', 'пар карт у ан эспэс',
    'en espèces = in cash; learn to recognize it.', 'en espèces — наличными; это выражение для узнавания.'),
  ph(3, 5, 's', '✍️🏷️', 'Can you write down the price, please?', 'Vous pouvez écrire le prix, s’il vous plaît ?', 'Вы можете написать цену, пожалуйста?',
    'vu puve ekʁiʁ lə pʁi, {svp}', 'ву пувэ экрир лё при, {svp}',
    'A fallback way to confirm the amount.', 'Запасной способ уточнить сумму.'),
  ph(3, 6, 'h', '🧾💶', 'That comes to twelve euros fifty', 'Ça fait douze euros cinquante.', 'С вас 12 евро 50 центов.',
    'sa fɛ duz øʁo sɛ̃kɑ̃t', 'са фэ дуз эро сенкант',
    'One sample price; practise other amounts too.', 'Один пример цены; для проверки используем и другие суммы.'),
  ph(3, 7, 's', '✅🧾', 'Yes, please', 'Oui, s’il vous plaît.', 'Да, пожалуйста.', 'wi, {svp}', 'уи, {svp}',
    'For example, when they offer a receipt.', 'Например, когда предлагают чек.'),

  /* Day 4 */
  ph(4, 1, 's', '🪑🪑', 'A table for two, please', 'Une table pour deux, s’il vous plaît.', 'Столик на двоих, пожалуйста.',
    'yn tabl puʁ dø, {svp}', 'юн табль пур дё, {svp}',
    'une table = a table; pour deux = for two.', 'une table — стол; pour deux — на двоих.'),
  ph(4, 2, 'h', '📅❓', 'Have you booked?', 'Vous avez réservé ?', 'Вы бронировали?',
    'vu zave ʁezɛʁve', 'ву завэ рэзервэ',
    'You can answer Non or Oui, au nom d’Anna.', 'Можно ответить Non или Oui, au nom d’Anna.'),
  ph(4, 3, 's', '📖🍽️', 'The menu, please', 'La carte, s’il vous plaît.', 'Меню, пожалуйста.',
    'la kaʁt, {svp}', 'ля карт, {svp}',
    'Here la carte = the menu; the meaning depends on the situation.', 'Здесь la carte — меню; значение зависит от ситуации.'),
  ph(4, 4, 's', '💧🍾', 'A carafe of water, please', 'Une carafe d’eau, s’il vous plaît.', 'Графин воды, пожалуйста.',
    'yn kaʁaf do, {svp}', 'юн карафь до, {svp}',
    'Tap water served in a jug. It is usually free with a meal, but check if unsure.', 'Графин водопроводной воды. К еде обычно бесплатно, но если сомневаешься, уточни.'),
  ph(4, 5, 's', '🧾🍽️', 'The bill, please', 'L’addition, s’il vous plaît.', 'Счёт, пожалуйста.',
    'ladisjɔ̃, {svp}', 'ладисьон, {svp}',
    'The bill in a restaurant or café.', 'Счёт за еду в ресторане или кафе.'),
  ph(4, 6, 's', '🤔🍽️', 'What do you recommend?', 'Qu’est-ce que vous recommandez ?', 'Что вы рекомендуете?',
    'kɛs kə vu ʁəkɔmɑ̃de', 'кэс кё ву рёкоманде',
    'The answer may be hard to follow: it’s fine to ask them to point to it on the menu.', 'Ответ может оказаться сложным: разрешено попросить показать в меню.'),
  ph(4, 7, 'h', '🚫🪑', 'We’re fully booked / full', 'C’est complet.', 'Всё занято / мест нет.',
    'sɛ kɔ̃plɛ', 'сэ конплэ',
    'At a restaurant: no tables; at a hotel: no rooms.', 'В ресторане — нет столиков; в отеле — нет номеров.'),

  /* Day 5 */
  ph(5, 1, 's', '🏨📋', 'I have a reservation under the name Anna', 'J’ai une réservation au nom d’Anna.', 'У меня бронирование на имя Анна.',
    'ʒe yn ʁezɛʁvasjɔ̃ o nɔ̃ dana', 'жэ юн рэзервасьон о нон дана',
    'On a real trip, give the name on the booking.', 'В настоящей поездке называй имя или фамилию из бронирования.'),
  ph(5, 2, 's', '🌙🌙', 'For two nights', 'Pour deux nuits.', 'На две ночи.', 'puʁ dø nɥi', 'пур дё нюи',
    'une nuit = one night; deux nuits = two nights.', 'une nuit — ночь; deux nuits — две ночи.'),
  ph(5, 3, 's', '🍳❓', 'Is breakfast included?', 'Le petit-déjeuner est compris ?', 'Завтрак включён?',
    'lə pəti deʒœne ɛ kɔ̃pʁi', 'лё пёти дежёнэ э конпри',
    'le petit-déjeuner = breakfast; compris = included.', 'le petit-déjeuner — завтрак; compris — включён.'),
  ph(5, 4, 's', '⏰🍳', 'What time is breakfast?', 'À quelle heure est le petit-déjeuner ?', 'Во сколько завтрак?',
    'a kɛl œʁ ɛ lə pəti deʒœne', 'а кэль ёр э лё пёти дежёнэ',
    'À quelle heure… ? = At what time…?', 'À quelle heure… ? — Во сколько… ?'),
  ph(5, 5, 's', '🛄⏰', 'What time do we need to check out?', 'À quelle heure faut-il libérer la chambre ?', 'Во сколько нужно освободить номер?',
    'a kɛl œʁ fotil libeʁe la ʃɑ̃bʁ', 'а кэль ёр фо-тиль либэрэ ля шанбр',
    'A ready-made hotel formula; la chambre = the room.', 'Готовая формула для отеля; la chambre — номер.'),
  ph(5, 6, 's', '📶🔑', 'What is the Wi-Fi password?', 'Quel est le mot de passe du Wi-Fi ?', 'Какой пароль от Wi-Fi?',
    'kɛl ɛ lə mo də pas dy wifi', 'кэль э лё мо дё пас дю уифи',
    'le mot de passe = password.', 'le mot de passe — пароль.'),
  ph(5, 7, 'h', '🛂', 'Your passport, please', 'Votre passeport, s’il vous plaît.', 'Ваш паспорт, пожалуйста.',
    'vɔtʁ paspɔʁ, {svp}', 'вотр паспор, {svp}',
    'A sample line, not a rule for every hotel.', 'Учебный пример реплики, а не утверждение о требованиях всех отелей.'),

  /* Day 6 */
  ph(6, 1, 's', '🚻', 'Where are the toilets?', 'Où sont les toilettes ?', 'Где туалет?', 'u sɔ̃ le twalɛt', 'у сон ле туалэт',
    'les toilettes is grammatically plural.', 'les toilettes — грамматически множественное число.'),
  ph(6, 2, 's', '🚉', 'Where is the train station?', 'Où est la gare ?', 'Где железнодорожный вокзал?', 'u ɛ la gaʁ', 'у э ля гар',
    'la gare = the train station.', 'la gare — железнодорожный вокзал или станция.'),
  ph(6, 3, 's', '🅿️🚗', 'Where is the car park?', 'Où est le parking ?', 'Где парковка?', 'u ɛ lə paʁkiŋ', 'у э лё паркинг',
    'le parking = car park.', 'le parking — парковка.'),
  ph(6, 4, 's', '🗺️👆', 'Can you show me on the map?', 'Vous pouvez me montrer sur la carte ?', 'Вы можете показать мне на карте?',
    'vu puve mə mɔ̃tʁe syʁ la kaʁt', 'ву пувэ мё монтрэ сюр ля карт',
    'Here la carte = a map, not a menu.', 'Здесь la carte — карта местности, а не меню.'),
  ph(6, 5, 'h', '➡️', 'To the right', 'À droite.', 'Направо.', 'a dʁwat', 'а друат',
    'Listening only; the arrow stays hidden until you answer.', 'Для узнавания на слух; не показывать стрелку до раскрытия ответа.'),
  ph(6, 6, 'h', '⬅️', 'To the left', 'À gauche.', 'Налево.', 'a goʃ', 'а гош',
    'Listening only; the arrow stays hidden until you answer.', 'Для узнавания на слух; не показывать стрелку до раскрытия ответа.'),
  ph(6, 7, 'h', '⬆️', 'Straight ahead', 'Tout droit.', 'Прямо.', 'tu dʁwa', 'ту друа',
    'Don’t mix it up with À droite = to the right.', 'Не путать с À droite — направо.'),

  /* Day 8 */
  ph(8, 1, 's', '🦪❓', 'Do you have oysters?', 'Vous avez des huîtres ?', 'У вас есть устрицы?',
    'vu zave de zɥitʁ', 'ву завэ де зюитр',
    'une huître = oyster; des huîtres = oysters.', 'une huître — устрица; des huîtres — устрицы.'),
  ph(8, 2, 's', '6️⃣🦪', 'I’d like six oysters, please', 'Je voudrais six huîtres, s’il vous plaît.', 'Я хотела бы шесть устриц, пожалуйста.',
    'ʒə vudʁɛ si zɥitʁ, {svp}', 'жё вудрэ си зюитр, {svp}',
    'Practise the number inside the whole phrase.', 'Произношение количества тренируем внутри всей фразы.'),
  ph(8, 3, 's', '🐚❓', 'Do you have scallop meat?', 'Vous avez des noix de Saint-Jacques ?', 'У вас есть мясо морских гребешков?',
    'vu zave de nwa də sɛ̃ ʒak', 'ву завэ де нуа дё сен жак',
    'noix de Saint-Jacques = scallop meat; coquilles Saint-Jacques can mean scallops in the shell.', 'noix de Saint-Jacques — мясо гребешка; coquilles Saint-Jacques может обозначать гребешки в раковинах.'),
  ph(8, 4, 's', '1️⃣⚖️', 'I’d like one kilo, please', 'Je voudrais un kilo, s’il vous plaît.', 'Я хотела бы один килограмм, пожалуйста.',
    'ʒə vudʁɛ ɛ̃ kilo, {svp}', 'жё вудрэ ан кило, {svp}',
    'Use it once it’s clear which item you’re buying.', 'Используем, когда уже ясно, какой товар покупаем.'),
  ph(8, 5, 's', '⚖️💶❓', 'How much is it per kilo?', 'C’est combien le kilo ?', 'Сколько стоит килограмм?',
    'sɛ kɔ̃bjɛ̃ lə kilo', 'сэ конбьен лё кило',
    'A spoken question to the seller.', 'Разговорный вопрос продавцу.'),
  ph(8, 6, 'h', '🛒❓', 'Anything else?', 'Autre chose ?', 'Что-нибудь ещё?', 'otʁ ʃoz', 'отр шоз',
    'Variant to recognize: Vous désirez autre chose ?', 'Вариант для узнавания: Vous désirez autre chose ?'),
  ph(8, 7, 's', '✅🛍️', 'That’s all, thank you', 'C’est tout, merci.', 'Это всё, спасибо.', 'sɛ tu mɛʁsi', 'сэ ту мерси',
    'Works in shops and cafés.', 'Подходит в магазине и кафе.'),

  /* Day 9 */
  ph(9, 1, 's', '🆘', 'I need help', 'J’ai besoin d’aide.', 'Мне нужна помощь.', 'ʒe bəzwɛ̃ dɛd', 'жэ бёзуэн дэд',
    'After this, explain what the problem is.', 'После этой фразы поясняем, в чём проблема.'),
  ph(9, 2, 's', '🔧🚫', 'It doesn’t work', 'Ça ne marche pas.', 'Это не работает.', 'sa nə maʁʃ pa', 'са нё марш па',
    'You can point at the object or screen.', 'Можно показать предмет или экран.'),
  ph(9, 3, 's', '⚠️📅', 'I have a problem with my reservation', 'J’ai un problème avec ma réservation.', 'У меня проблема с бронированием.',
    'ʒe ɛ̃ pʁɔblɛm avɛk ma ʁezɛʁvasjɔ̃', 'жэ ан проблэм авэк ма рэзервасьон',
    'Show your booking confirmation if needed.', 'Покажи подтверждение бронирования при необходимости.'),
  ph(9, 4, 's', '🇬🇧❓', 'Do you speak English?', 'Vous parlez anglais ?', 'Вы говорите по-английски?',
    'vu paʁle ɑ̃glɛ', 'ву парлэ англэ',
    'A fallback to keep talking, not a required first line.', 'Запасной способ продолжить общение, а не обязательная первая реплика.'),
  ph(9, 5, 's', '✍️❓', 'Can you write it down, please?', 'Vous pouvez l’écrire, s’il vous plaît ?', 'Вы можете это написать, пожалуйста?',
    'vu puve lekʁiʁ, {svp}', 'ву пувэ лэкрир, {svp}',
    'A general request, not only for prices.', 'Универсальная просьба, не только о цене.'),
  ph(9, 6, 's', '📍🔎', 'I’m looking for this address', 'Je cherche cette adresse.', 'Я ищу этот адрес.',
    'ʒə ʃɛʁʃ sɛt adʁɛs', 'жё шерш сэт адрэс',
    'cette adresse = this address; adresse is feminine.', 'cette adresse — этот адрес; слово adresse женского рода.'),
  ph(9, 7, 'h', '⏳✋', 'One moment, please', 'Attendez un instant, s’il vous plaît.', 'Подождите немного, пожалуйста.',
    'atɑ̃de ɛ̃n‿ɛ̃stɑ̃, {svp}', 'атандэ ан нэнстан, {svp}',
    'For recognition, so you don’t mistake the pause for a refusal.', 'Реплика для понимания, чтобы не принять паузу за отказ.'),
];

// Direction arrows would give the answer away in the listening hints
PH.filter(p => ['fr-d06-05', 'fr-d06-06', 'fr-d06-07'].includes(p.id)).forEach(p => { p.hideScene = true; });

/* ---------- The 1000-word core list (js/vocab.js) ---------- */
// tp: topic id; g: m / f / pl; n: numeric value for number words
const WORDS = CORE_ROWS.map(r => ({
  id: r[0], kind: r[10] ? 'nm' : 'wd', k: 's', tp: r[1], d: 0, ru: r[10] ? String(r[9]) : r[2], en: r[10] ? String(r[9]) : r[3],
  ru0: r[2], en0: r[3], fr: r[4], ipa: r[5], cy: r[6], sc: r[7], g: r[8], n: r[9],
}));
const VOC = WORDS.filter(w => w.kind === 'wd');
const NUM = WORDS.filter(w => w.kind === 'nm');
const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));
// Travel-first order (the list order is the alternative)
const TOPIC_ORDER_TRAVEL = ['01', '16', '09', '10', '08', '17', '02', '11', '12', '07', '03', '04', '18', '19', '05', '06', '15', '14', '13', '20'];
const WORD_INDEX = Object.fromEntries(WORDS.map((w, i) => [w.id, i]));
function wordSequence(order) {
  const rank = Object.fromEntries((order === 'list' ? TOPICS.map(t => t.id) : TOPIC_ORDER_TRAVEL).map((id, i) => [id, i]));
  return WORDS.slice().sort((a, b) => (rank[a.tp] - rank[b.tp]) || (WORD_INDEX[a.id] - WORD_INDEX[b.id]));
}

const ITEMS = [...PH, ...WORDS];
const IT = Object.fromEntries(ITEMS.map(x => [x.id, x]));

/* ---------- French number words (for prices and dialogues) ---------- */
const U_ = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
const TENS_ = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };
function frNum(n) {
  if (n < 17) return U_[n];
  if (n < 20) return 'dix-' + U_[n - 10];
  if (n < 70) {
    const t = Math.floor(n / 10), u = n % 10;
    return TENS_[t] + (u === 0 ? '' : u === 1 ? ' et un' : '-' + U_[u]);
  }
  if (n < 80) { const u = n - 60; return u === 11 ? 'soixante et onze' : 'soixante-' + frNum(u); }
  if (n < 100) { const u = n - 80; return u === 0 ? 'quatre-vingts' : 'quatre-vingt-' + frNum(u); }
  const h = Math.floor(n / 100), r = n % 100;
  if (r === 0) return h === 1 ? 'cent' : U_[h] + ' cents';
  return (h === 1 ? 'cent' : U_[h] + ' cent') + ' ' + frNum(r);
}
function priceFr(e, c) { return frNum(e) + ' euro' + (e > 1 ? 's' : '') + (c ? ' ' + frNum(c) : ''); }
function priceNum(e, c) { return c ? `${e},${pad2(c)} €` : `${e} €`; }
function priceEn(e, c) { return c ? `€${e}.${pad2(c)}` : `€${e}`; }
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function rndPrice(max) { return { e: 1 + Math.floor(Math.random() * max), c: rnd([0, 0, 0, 10, 20, 30, 40, 50, 50, 60, 70, 80, 90]) }; }

// Prices from the course, for the listening practice
const PRICES_FIXED = [[2, 50], [3, 0], [7, 20], [12, 50], [18, 0], [20, 0], [35, 0], [49, 0], [72, 0], [95, 0]];

/* ---------- Role-play scenarios (randomized each time) ---------- */
const T_ = (w, fr, en, ru) => ({ w, fr, en, ru });
const SCEN = [
  {
    id: 'cafe', e: '☕', en: 'At the café', ru: 'В кафе', days: [7, 10],
    build() {
      const dr = rnd([{ fr: 'un café', en: 'a coffee', ru: 'кофе' }, { fr: 'un thé', en: 'a tea', ru: 'чай' }, { fr: 'de l’eau', en: 'some water', ru: 'воды' }]);
      const ex = rnd([null, { fr: 'un croissant', en: 'a croissant', ru: 'круассан' }, { fr: 'deux croissants', en: 'two croissants', ru: 'два круассана' }]);
      const place = rnd([{ fr: 'Sur place', en: 'To eat here', ru: 'Здесь' }, { fr: 'À emporter', en: 'To take away', ru: 'С собой' }]);
      const pay = rnd([{ fr: 'Par carte', en: 'By card', ru: 'Картой' }, { fr: 'En espèces', en: 'In cash', ru: 'Наличными' }]);
      const p = rndPrice(12);
      return [
        T_('them', 'Bonjour ! Vous désirez ?', 'Hello! What would you like?', 'Здравствуйте! Что желаете?'),
        T_('me', `Bonjour ! Je voudrais ${dr.fr}${ex ? ' et ' + ex.fr : ''}, s’il vous plaît.`, `Hello! I’d like ${dr.en}${ex ? ' and ' + ex.en : ''}, please.`, `Здравствуйте! Я хотела бы ${dr.ru}${ex ? ' и ' + ex.ru : ''}, пожалуйста.`),
        T_('them', 'Sur place ou à emporter ?', 'For here or to take away?', 'Здесь или с собой?'),
        T_('me', `${place.fr}, s’il vous plaît.`, `${place.en}, please.`, `${place.ru}, пожалуйста.`),
        T_('them', `Ça fait ${priceFr(p.e, p.c)}. Par carte ou en espèces ?`, `That’s ${priceEn(p.e, p.c)}. By card or in cash?`, `С вас ${priceNum(p.e, p.c)}. Картой или наличными?`),
        T_('me', `${pay.fr}, s’il vous plaît.`, `${pay.en}, please.`, `${pay.ru}, пожалуйста.`),
        T_('them', 'Merci ! Bonne journée !', 'Thank you! Have a nice day!', 'Спасибо! Хорошего дня!'),
        T_('me', 'Merci. Au revoir !', 'Thank you. Goodbye!', 'Спасибо. До свидания!'),
      ];
    },
  },
  {
    id: 'resto', e: '🍽️', en: 'At the restaurant', ru: 'В ресторане', days: [7, 10],
    build() {
      const n = rnd([['deux', 'two'], ['trois', 'three'], ['quatre', 'four']]);
      const booked = Math.random() < 0.4, full = !booked && Math.random() < 0.25;
      const s = [T_('them', 'Bonsoir ! Vous avez réservé ?', 'Good evening! Have you booked?', 'Добрый вечер! Вы бронировали?')];
      if (booked) {
        s.push(T_('me', 'Oui, au nom d’Anna.', 'Yes, under the name Anna.', 'Да, на имя Анна.'));
        s.push(T_('them', 'Très bien. Par ici, s’il vous plaît.', 'Very good. This way, please.', 'Хорошо. Сюда, пожалуйста.'));
      } else {
        const ruN = { deux: 'двоих', trois: 'троих', quatre: 'четверых' }[n[0]];
        s.push(T_('me', `Non. Une table pour ${n[0]}, s’il vous plaît.`, `No. A table for ${n[1]}, please.`, `Нет. Столик на ${ruN}, пожалуйста.`));
        if (full) {
          s.push(T_('them', 'Désolé, c’est complet.', 'Sorry, we’re full.', 'Простите, мест нет.'));
          s.push(T_('me', 'Merci. Au revoir !', 'Thank you. Goodbye!', 'Спасибо. До свидания!'));
          return s;
        }
        s.push(T_('them', 'Oui, bien sûr. Par ici, s’il vous plaît.', 'Yes, of course. This way, please.', 'Да, конечно. Сюда, пожалуйста.'));
      }
      s.push(T_('them', 'Voici la carte.', 'Here is the menu.', 'Вот меню.'));
      s.push(T_('me', 'Qu’est-ce que vous recommandez ?', 'What do you recommend?', 'Что вы рекомендуете?'));
      const rec = rnd([['le poisson', 'the fish', 'рыбу'], ['le plat du jour', 'the dish of the day', 'блюдо дня']]);
      s.push(T_('them', `Je recommande ${rec[0]}.`, `I recommend ${rec[1]}.`, `Я рекомендую ${rec[2]}.`));
      s.push(T_('me', 'Une carafe d’eau, s’il vous plaît.', 'A carafe of water, please.', 'Графин воды, пожалуйста.'));
      s.push(T_('them', 'Bien sûr.', 'Of course.', 'Конечно.'));
      s.push(T_('me', 'L’addition, s’il vous plaît.', 'The bill, please.', 'Счёт, пожалуйста.'));
      s.push(T_('them', 'Tout de suite.', 'Right away.', 'Сейчас.'));
      return s;
    },
  },
  {
    id: 'hotel', e: '🏨', en: 'At the hotel desk', ru: 'На ресепшене', days: [7, 10],
    build() {
      const nt = rnd([['deux', 'two', 'две'], ['trois', 'three', 'три'], ['quatre', 'four', 'четыре']]);
      const a = rnd([7, 8]), b = rnd([10, 11]);
      return [
        T_('them', 'Bonjour ! Vous avez une réservation ?', 'Hello! Do you have a reservation?', 'Здравствуйте! У вас есть бронирование?'),
        T_('me', 'Oui, j’ai une réservation au nom d’Anna.', 'Yes, I have a reservation under the name Anna.', 'Да, у меня бронирование на имя Анна.'),
        T_('them', 'Pour combien de nuits ?', 'For how many nights?', 'На сколько ночей?'),
        T_('me', `Pour ${nt[0]} nuits.`, `For ${nt[1]} nights.`, `На ${nt[2]} ночи.`),
        T_('them', 'Votre passeport, s’il vous plaît.', 'Your passport, please.', 'Ваш паспорт, пожалуйста.'),
        T_('me', 'Voilà.', 'Here you are.', 'Вот, пожалуйста.'),
        T_('them', 'Merci. Voici votre clé.', 'Thank you. Here is your key.', 'Спасибо. Вот ваш ключ.'),
        T_('me', 'Le petit-déjeuner est compris ?', 'Is breakfast included?', 'Завтрак включён?'),
        T_('them', `Oui, de ${frNum(a)} heures à ${frNum(b)} heures.`, `Yes, from ${a} to ${b}.`, `Да, с ${a} до ${b}.`),
        T_('me', 'Quel est le mot de passe du Wi-Fi ?', 'What is the Wi-Fi password?', 'Какой пароль от Wi-Fi?'),
        T_('them', 'Voici le mot de passe.', 'Here is the password.', 'Вот пароль.'),
        T_('me', 'Merci. Au revoir !', 'Thank you. Goodbye!', 'Спасибо. До свидания!'),
      ];
    },
  },
  {
    id: 'way', e: '🧭', en: 'Asking the way', ru: 'Как пройти', days: [7, 10],
    build() {
      const pl = rnd([
        { q: 'Où est la gare ?', en: 'Where is the train station?', ru: 'Где вокзал?' },
        { q: 'Où est le parking ?', en: 'Where is the car park?', ru: 'Где парковка?' },
        { q: 'Où sont les toilettes ?', en: 'Where are the toilets?', ru: 'Где туалет?' },
      ]);
      const dir = rnd([
        ['Tout droit, puis à gauche.', 'Straight ahead, then to the left.', 'Прямо, потом налево.'],
        ['Tout droit, puis à droite.', 'Straight ahead, then to the right.', 'Прямо, потом направо.'],
        ['À droite, puis tout droit.', 'To the right, then straight ahead.', 'Направо, потом прямо.'],
        ['À gauche, puis tout droit.', 'To the left, then straight ahead.', 'Налево, потом прямо.'],
      ]);
      return [
        T_('me', `Excusez-moi. ${pl.q}`, `Excuse me. ${pl.en}`, `Извините. ${pl.ru}`),
        T_('them', dir[0], dir[1], dir[2]),
        T_('me', 'Je ne comprends pas. Plus lentement, s’il vous plaît.', 'I don’t understand. More slowly, please.', 'Я не понимаю. Помедленнее, пожалуйста.'),
        T_('them', dir[0], dir[1], dir[2]),
        T_('me', 'Vous pouvez me montrer sur la carte ?', 'Can you show me on the map?', 'Вы можете показать мне на карте?'),
        T_('them', 'Oui, bien sûr. Ici.', 'Yes, of course. Here.', 'Да, конечно. Вот здесь.'),
        T_('me', 'Merci beaucoup. Au revoir !', 'Thank you very much. Goodbye!', 'Большое спасибо. До свидания!'),
      ];
    },
  },
  {
    id: 'market', e: '🛒', en: 'At the market', ru: 'На рынке', days: [10],
    build() {
      if (Math.random() < 0.5) {
        const n = rnd([['six', 'six', 'шесть'], ['douze', 'twelve', 'двенадцать']]);
        const p = { e: rnd([9, 12, 14, 18, 24]), c: 0 };
        return [
          T_('me', 'Bonjour ! Vous avez des huîtres ?', 'Hello! Do you have oysters?', 'Здравствуйте! У вас есть устрицы?'),
          T_('them', 'Oui, bien sûr. Combien ?', 'Yes, of course. How many?', 'Да, конечно. Сколько?'),
          T_('me', `Je voudrais ${n[0]} huîtres, s’il vous plaît.`, `I’d like ${n[1]} oysters, please.`, `Я хотела бы ${n[2]} устриц, пожалуйста.`),
          T_('them', 'Autre chose ?', 'Anything else?', 'Что-нибудь ещё?'),
          T_('me', 'C’est tout, merci.', 'That’s all, thank you.', 'Это всё, спасибо.'),
          T_('them', `Ça fait ${priceFr(p.e, 0)}.`, `That’s ${priceEn(p.e, 0)}.`, `С вас ${priceNum(p.e, 0)}.`),
          T_('me', 'Par carte, s’il vous plaît.', 'By card, please.', 'Картой, пожалуйста.'),
        ];
      }
      const pk = rnd([28, 32, 36, 40, 45]);
      return [
        T_('me', 'Bonjour ! Vous avez des noix de Saint-Jacques ?', 'Hello! Do you have scallop meat?', 'Здравствуйте! У вас есть мясо морских гребешков?'),
        T_('them', 'Oui, bien sûr.', 'Yes, of course.', 'Да, конечно.'),
        T_('me', 'C’est combien le kilo ?', 'How much is it per kilo?', 'Сколько стоит килограмм?'),
        T_('them', `C’est ${priceFr(pk, 0)} le kilo.`, `It’s ${priceEn(pk, 0)} a kilo.`, `${priceNum(pk, 0)} за килограмм.`),
        T_('me', 'Je voudrais un kilo, s’il vous plaît.', 'I’d like one kilo, please.', 'Я хотела бы один килограмм, пожалуйста.'),
        T_('them', 'Autre chose ?', 'Anything else?', 'Что-нибудь ещё?'),
        T_('me', 'C’est tout, merci.', 'That’s all, thank you.', 'Это всё, спасибо.'),
        T_('them', `Ça fait ${priceFr(pk, 0)}.`, `That’s ${priceEn(pk, 0)}.`, `С вас ${priceNum(pk, 0)}.`),
        T_('me', 'Par carte, s’il vous plaît.', 'By card, please.', 'Картой, пожалуйста.'),
      ];
    },
  },
  {
    id: 'problem', e: '🆘', en: 'A problem at the hotel', ru: 'Проблема в отеле', days: [10],
    build() {
      return [
        T_('me', 'Excusez-moi. J’ai un problème avec ma réservation.', 'Excuse me. I have a problem with my reservation.', 'Извините. У меня проблема с бронированием.'),
        T_('them', 'Un instant, s’il vous plaît. Quel est votre nom ?', 'One moment, please. What is your name?', 'Минутку, пожалуйста. Как вас зовут?'),
        T_('me', 'Anna. Vous parlez anglais ?', 'Anna. Do you speak English?', 'Анна. Вы говорите по-английски?'),
        T_('them', 'Un peu.', 'A little.', 'Немного.'),
        T_('me', 'Vous pouvez l’écrire, s’il vous plaît ?', 'Can you write it down, please?', 'Вы можете это написать, пожалуйста?'),
        T_('them', 'Bien sûr. Attendez un instant, s’il vous plaît.', 'Of course. Wait a moment, please.', 'Конечно. Подождите немного, пожалуйста.'),
        T_('me', 'Merci.', 'Thank you.', 'Спасибо.'),
      ];
    },
  },
];
