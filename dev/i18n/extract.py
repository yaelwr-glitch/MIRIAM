import re, glob, json, html
from html.parser import HTMLParser
ROOT=__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), '..', '..') + '/'
HEB=re.compile(r'[\u0590-\u05FF]')
keys={}  # key -> set(files)
def norm(s): return re.sub(r'\s+',' ',s).strip()
def add(k,f):
    k=norm(k)
    if k and HEB.search(k): keys.setdefault(k,set()).add(f)

# ---- JS scanner: yields string literal contents; template literals with ${} -> {n}
def scan_js(src, f):
    i=0; n=len(src)
    def read_template(i):
        # src[i] == '`'; returns (end_index, text_with_placeholders, nested_list)
        i+=1; out=''; ph=0
        while i<n:
            c=src[i]
            if c=='\\': out+=src[i:i+2]; i+=2; continue
            if c=='`': return i+1, out
            if c=='$' and i+1<n and src[i+1]=='{':
                # parse expression until matching }
                j=i+2; depth=1
                expr_start=j
                while j<n and depth>0:
                    d=src[j]
                    if d in '"\'':
                        q=d; j+=1
                        s0=j
                        while j<n and src[j]!=q:
                            if src[j]=='\\': j+=1
                            j+=1
                        add(bytes(src[s0:j],'utf-8').decode('unicode_escape') if '\\u' in src[s0:j] else src[s0:j].replace('\\n','\n'), f); j+=1; continue
                    if d=='`':
                        j, inner = read_template(j); handle_template(inner); continue
                    if d=='{': depth+=1
                    elif d=='}': depth-=1
                    j+=1
                out+='{%d}'%ph; ph+=1; i=j; continue
            out+=c; i+=1
        return i, out
    def handle_template(t):
        # split on html tags
        t=t.replace('\\n','\n')
        for chunk in re.split(r'<[^>]*>', t):
            # renumber placeholders inside chunk from 0
            m=re.findall(r'\{\d+\}', chunk)
            if not HEB.search(chunk): continue
            cnt=[0]
            def rn(_):
                r='{%d}'%cnt[0]; cnt[0]+=1; return r
            c2=re.sub(r'\{\d+\}', rn, chunk)
            # attributes inside tags with hebrew (aria-label etc.)
            add(html.unescape(c2), f)
        for tag in re.findall(r'<[^>]*>', t):
            for a in re.findall(r'(?:aria-label|placeholder|alt|title)="([^"]*)"', tag):
                if HEB.search(a):
                    cnt=[0]
                    def rn(_):
                        r='{%d}'%cnt[0]; cnt[0]+=1; return r
                    add(re.sub(r'\{\d+\}', rn, a), f)
    while i<n:
        c=src[i]
        if c=='/' and i+1<n and src[i+1]=='/':
            j=src.find('\n',i); i = n if j<0 else j; continue
        if c=='/' and i+1<n and src[i+1]=='*':
            j=src.find('*/',i+2); i = n if j<0 else j+2; continue
        if c in '"\'':
            q=c; j=i+1
            while j<n and src[j]!=q and src[j]!='\n':
                if src[j]=='\\': j+=1
                j+=1
            s=src[i+1:j].replace('\\n','\n').replace("\\'", "'").replace('\\"','"')
            if HEB.search(s):
                if '<' in s:
                    handle_template(s)
                else:
                    for part in (s.split('\n') if '\n' in s and not f.endswith(('messages.js',)) else [s]):
                        add(part,f)
            i=j+1; continue
        if c=='`':
            i, t = read_template(i); handle_template(t); continue
        i+=1

class P(HTMLParser):
    def __init__(s,f): super().__init__(convert_charrefs=True); s.f=f; s.skip=0; s.script=''
    def handle_starttag(s,tag,attrs):
        if tag in ('script','style'): s.skip=1; s.script=''
        for k,v in attrs:
            if k in ('placeholder','aria-label','alt','title','content') and v and HEB.search(v): add(v,s.f)
    def handle_endtag(s,tag):
        if tag in ('script','style'):
            if tag=='script' and s.script: scan_js(s.script, s.f)
            s.skip=0
    def handle_data(s,d):
        if s.skip: s.script+=d; return
        add(d,s.f)

for f in [ROOT+'index.html']+sorted(glob.glob(ROOT+'tools/*.html')):
    p=P(f.replace(ROOT,'')); p.feed(open(f).read())
for f in sorted(glob.glob(ROOT+'assets/js/*.js'))+[ROOT+'assets/common.js', ROOT+'tools/course-data.js']:
    scan_js(open(f).read(), f.replace(ROOT,''))
out=[{'k':k,'f':sorted(v)} for k,v in keys.items()]
json.dump(out, open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)), 'keys.json'),'w'), ensure_ascii=False, indent=0)
print(len(out), 'strings found')
tr=json.load(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'translations.json')))
missing=[x['k'] for x in out if norm(x['k']) not in tr]
print(len(missing), 'without translation:')
for k in missing: print('  ', k)
