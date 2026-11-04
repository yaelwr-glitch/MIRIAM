import json, re, glob
import os; D=os.path.dirname(os.path.abspath(__file__))+'/'
keys=json.load(open(D+'keys.json'))
tr={}
for f in sorted(glob.glob(D+'tr_*.json')): tr.update(json.load(open(f)))
def norm(s): return re.sub(r'\s+',' ',s).strip()
out={'en':{},'fr':{}}
missing=[]
for i,x in enumerate(keys):
    t=tr.get(str(i))
    if not t: missing.append(i); continue
    out['en'][norm(x['k'])]=t[0]; out['fr'][norm(x['k'])]=t[1]
for k,v in json.load(open(D+'extras.json')).items():
    out['en'][norm(k)]=v[0]; out['fr'][norm(k)]=v[1]
# sanity: placeholders must match
bad=[]
for lang in out:
    for k,v in out[lang].items():
        a=sorted(set(re.findall(r'\{\d\}',k))); b=sorted(set(re.findall(r'\{\d\}',v)))
        if a!=b: bad.append((lang,k,v))
        for ph in ('{W}','{P}','{D}','{N}'):
            if (ph in k)!=(ph in v): bad.append((lang,k,v))
print('missing', len(missing), [keys[i]['k'][:30] for i in missing])
print('bad', bad[:10])
import os
os.makedirs(''+D+'../../assets/i18n', exist_ok=True)
for lang,d in out.items():
    open(f''+D+'../../assets/i18n/{lang}.js','w').write('/* '+lang+' translations — generated; key = Hebrew source text */\nwindow.MIREL_I18N = '+json.dumps(d, ensure_ascii=False, indent=0)+';\n')
    print(lang, len(d), os.path.getsize(f''+D+'../../assets/i18n/{lang}.js'))
