#!/usr/bin/env python3
"""Builds js/vocab.js from the 1000-card source, the hand-written IPA lists, emoji and gender tables."""
import json, re, pathlib, unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = json.loads((ROOT / 'tools/source/french_core_1000.json').read_text(encoding='utf8'))

# ---------- IPA -> Russian respelling (approximate, for learners) ----------
CONS = {'p': 'п', 'b': 'б', 't': 'т', 'd': 'д', 'k': 'к', 'g': 'г', 'f': 'ф', 'v': 'в', 's': 'с', 'z': 'з',
        'ʃ': 'ш', 'ʒ': 'ж', 'm': 'м', 'n': 'н', 'ɲ': 'нь', 'ŋ': 'нг', 'l': 'л', 'ʁ': 'р', 'j': 'й', 'w': 'в'}
VOW = {'i': 'и', 'y': 'ю', 'e': 'э', 'ɛ': 'э', 'ə': 'ё', 'ø': 'ё', 'œ': 'ё', 'a': 'а', 'ɑ': 'а', 'o': 'о', 'ɔ': 'о', 'u': 'у'}
NAS = {'ɑ': 'ан', 'ɛ': 'эн', 'ɔ': 'он', 'œ': 'ан'}
IOT = {'а': 'я', 'э': 'е', 'о': 'ьо', 'у': 'ю', 'ё': 'ё', 'и': 'и', 'ю': 'ю', 'ан': 'ьян', 'эн': 'ен', 'он': 'ьон'}
TILDE = '̃'


def tokens(w):
    out, i = [], 0
    w = w.replace('‿', '')
    while i < len(w):
        c = w[i]
        if i + 1 < len(w) and w[i + 1] == TILDE:
            out.append(c + TILDE); i += 2
        elif c == 't' and i + 1 < len(w) and w[i + 1] == 'ʃ':
            out.append('tʃ'); i += 2
        elif c == 'd' and i + 1 < len(w) and w[i + 1] == 'ʒ':
            out.append('dʒ'); i += 2
        elif c in '()':
            i += 1
        else:
            out.append(c); i += 1
    return out


WORD_OVERRIDE = {'la': 'ля', 'lə': 'лё', 'le': 'ле', 'lez': 'лез', 'sil': 'силь'}


def cyr_word(w):
    if w in WORD_OVERRIDE:
        return WORD_OVERRIDE[w]
    tk = tokens(w)
    res, soft = [], False
    for k, t in enumerate(tk):
        nxt = tk[k + 1] if k + 1 < len(tk) else ''
        prev = tk[k - 1] if k else ''
        if t.endswith(TILDE):
            v = NAS[t[0]]
            if nxt in ('p', 'b', 'm'):
                v = v[:-1] + 'м'
            if soft: v = IOT.get(v, v); soft = False
            res.append(v)
        elif t in VOW:
            v = VOW[t]
            if soft:
                v = IOT.get(v, v); soft = False
            res.append(v)
        elif t == 'ɥ':
            res.append('ю')
        elif t == 'w':
            res.append('у')
        elif t == 'j':
            vowel_next = nxt and (nxt in VOW or nxt.endswith(TILDE))
            after_vowel = prev and (prev in VOW or prev.endswith(TILDE))
            if not vowel_next:
                res.append('й')
            elif k == 0:
                soft = True; res.append('')
            elif after_vowel:
                res.append('й')
            else:
                res.append('ь'); soft = True
        elif t == 'tʃ':
            res.append('ч')
        elif t == 'dʒ':
            res.append('дж')
        elif t == 'l' and k == len(tk) - 1 and prev and (prev in VOW):
            res.append('ль')
        elif t in CONS:
            res.append(CONS[t])
        else:
            res.append(t)
    s = ''.join(res)
    s = re.sub(r'ьь', 'ь', s)
    return s


def cyr(ipa):
    return ' / '.join(' '.join(cyr_word(w) for w in form.split(' ')) for form in ipa.split(' / '))


# ---------- tables ----------
TOPICS_EN = {
    '01': 'Pronouns, questions & basics', '02': 'Core verbs', '03': 'Everyday actions & movement',
    '04': 'Communication & decisions', '05': 'People, family & relationships', '06': 'Home & everyday objects',
    '07': 'Food', '08': 'Drinks, restaurant & food shopping', '09': 'Travel & transport', '10': 'City, places & hotel',
    '11': 'Shopping, clothes & money', '12': 'Body, health & help', '13': 'Work & study',
    '14': 'Tech, culture & leisure', '15': 'Nature, weather & time', '16': 'Numbers, weekdays & months',
    '17': 'Prepositions, place & frequency', '18': 'Size, looks & properties', '19': 'Feelings, character & opinions',
    '20': 'Connectors, quantity & ideas',
}
TOPIC_EMOJI = {'01': '💬', '02': '🏃', '03': '🚶', '04': '🗣️', '05': '👪', '06': '🏠', '07': '🥖', '08': '🍷', '09': '✈️',
               '10': '🏙️', '11': '🛍️', '12': '🩺', '13': '💼', '14': '📱', '15': '🌦️', '16': '🔢', '17': '🧭', '18': '📏',
               '19': '😊', '20': '🔗'}
MASC = """l’homme l’âge l’amour l’anniversaire l’oncle l’appartement l’escalier l’étage l’ascenseur l’oreiller l’œuf l’abricot
l’oignon l’ail l’ingrédient l’itinéraire l’aller_simple l’aller-retour l’aéroport l’avion l’embarquement l’autocar l’achat l’argent
l’emballage l’accident l’emploi l’entretien l’exercice l’examen l’objectif l’ordinateur l’écran l’événement l’article l’art l’arbre
l’animal l’oiseau l’océan l’orage l’environnement l’été l’automne l’hiver l’après-midi l’avis l’avantage l’inconvénient l’espoir
l’avenir l’hôpital l’immeuble l’hôtel l’accueil l’arrêt l’ongle""".replace('_', ' ').split()
FEM = """l’adresse l’amitié l’invitation l’entrée l’armoire l’étagère l’eau l’orange l’aubergine l’huile l’amande l’assiette l’addition
l’huître l’arrivée l’autoroute l’essence l’annulation l’avenue l’église l’écharpe l’oreille l’épaule l’allergie l’urgence
l’ordonnance l’assurance l’entreprise l’usine l’équipe l’expérience l’école l’université l’erreur l’application l’information
l’actualité l’histoire l’exposition l’île l’étoile l’année l’heure l’idée l’envie""".split()
# multi-word entries that the whitespace split above would break
MASC = set(MASC) | {'l’aller simple'}
MASC.discard('l’aller'); MASC.discard('simple')
FEM = set(FEM)

NUMWORDS = {'zéro': 0, 'un': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5, 'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10,
            'onze': 11, 'douze': 12, 'treize': 13, 'quatorze': 14, 'quinze': 15, 'seize': 16, 'dix-sept': 17, 'dix-huit': 18,
            'dix-neuf': 19, 'vingt': 20, 'trente': 30, 'quarante': 40, 'cinquante': 50, 'soixante': 60, 'soixante-dix': 70,
            'quatre-vingts': 80, 'quatre-vingt-dix': 90, 'cent': 100, 'mille': 1000}


def gender(fr):
    if ' / ' in fr: return ''
    if fr.startswith('le '): return 'm'
    if fr.startswith('la '): return 'f'
    if fr.startswith('les '): return 'pl'
    if fr in MASC: return 'm'
    if fr in FEM: return 'f'
    return ''


ipa = {}
for t in range(1, 21):
    for line in (ROOT / f'tools/ipa/{t:02d}.txt').read_text(encoding='utf8').splitlines():
        if line.strip():
            fr, v = line.split('|', 1); ipa[fr] = v
for line in (ROOT / 'tools/ipa/x.txt').read_text(encoding='utf8').splitlines():
    if line.strip():
        fr, v = line.split('|', 1); ipa[fr] = v
emoji = {}
for line in (ROOT / 'tools/emoji.txt').read_text(encoding='utf8').splitlines():
    if line.strip():
        fr, e = line.split('|', 1); emoji[fr] = e

rows = []
for c in SRC['cards']:
    fr = c['fr']
    n = NUMWORDS.get(fr) if c['topic_id'] == '16' and fr in NUMWORDS else None
    rows.append([c['id'], c['topic_id'], c['ru'], c['en'], fr, ipa[fr], cyr(ipa[fr]), emoji.get(fr, ''), gender(fr), n if n is not None else 0, 1 if n is not None else 0])
# two items from the course that are not in the list
extra = [
    ['x-01', '11', 'кассовый чек', 'till receipt', 'le ticket de caisse', ipa['le ticket de caisse'], cyr(ipa['le ticket de caisse']), emoji['le ticket de caisse'], 'm', 0, 0],
    ['x-02', '08', 'мясо морских гребешков', 'scallop meat', 'les noix de Saint-Jacques', ipa['les noix de Saint-Jacques'], cyr(ipa['les noix de Saint-Jacques']), emoji['les noix de Saint-Jacques'], 'pl', 0, 0],
]
rows += extra

topics = []
for t in SRC['topics']:
    topics.append({'id': t['id'], 'ru': t['name_ru'], 'en': TOPICS_EN[t['id']], 'e': TOPIC_EMOJI[t['id']]})

out = ['/* Generated by tools/make_vocab.py from the 1000-card list. Do not edit by hand.',
       '   Row: [id, topic, ru, en, fr, ipa, cyrillic, emoji, gender, number, isNumber] */',
       'const TOPICS = ' + json.dumps(topics, ensure_ascii=False) + ';',
       'const CORE_ROWS = [']
for r in rows:
    out.append(json.dumps(r, ensure_ascii=False) + ',')
out.append('];')
(ROOT / 'js').mkdir(exist_ok=True)
(ROOT / 'js/vocab.js').write_text('\n'.join(out) + '\n', encoding='utf8')
print('rows', len(rows), 'with emoji', sum(1 for r in rows if r[7]), 'gender', sum(1 for r in rows if r[8]), 'numbers', sum(r[10] for r in rows))
miss = [r[4] for r in rows if r[4].startswith('l’') and not r[8] and ' / ' not in r[4]]
print('l’ without gender:', miss)

if __name__ == '__main__':
    # quick sanity print of a few conversions
    for s in ['bɔ̃ʒuʁ', 'ʒə vudʁɛ ɛ̃ kafe', 'kɔ̃pʁɑ̃', 'nɥi', 'bjɛ̃', 'miljɔ̃', 'ɛkskyze mwa', 'lœ̃di', 'ʃɔkɔla', 'sil vu plɛ', 'ajœʁ', 'wi', 'jauʁt']:
        print(s, '->', cyr(s))
