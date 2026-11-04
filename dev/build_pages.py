import re, glob, os, sys
SP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pages')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools')
head = open(f'{SP}/head.html').read()
footer = '''<footer class="site-footer">
  <div class="wrap">
    <div>
      <strong>מהמטבח לעסק משלי</strong> · תכנית של <a href="https://www.mirel-chocolate.co.il/">MIREL שוקולד וקונדיטוריית בוטיק</a>
      <div class="small muted">המידע שתזיני נשמר רק בדפדפן שלך, במכשיר הזה. © <span data-year>2026</span></div>
    </div>
    <ul>
      <li><a href="index.html">כל הכלים</a></li>
      <li><a href="students.html">אזור תלמידות</a></li>
      <li><a href="quiz.html">שאלון התאמה</a></li>
      <li><a href="../">על הקורס</a></li>
    </ul>
  </div>
</footer>
'''
def header(cur):
    items = [('../','הקורס',None),('index.html','כל הכלים','hub'),('students.html','אזור תלמידות','students'),
             ('quiz.html','שאלון: מוכנה לעסק?','quiz'),('https://www.mirel-chocolate.co.il/','לאתר MIREL',None)]
    lis = ''.join(f'        <li><a href="{h}"{" aria-current=\"page\"" if k and k==cur else ""}>{t}</a></li>\n' for h,t,k in items)
    return f'''<a class="skip-link" href="#main">דילוג לתוכן</a>

<header class="site-header">
  <div class="wrap">
    <a class="brand" href="../" aria-label="מהמטבח לעסק משלי — עמוד הבית">
      <svg class="brand-logo" viewBox="0 0 40 46" aria-hidden="true"><defs><radialGradient id="mirel-sphere" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#fde6e6"/><stop offset=".45" stop-color="#ec9a9c"/><stop offset="1" stop-color="#d0565a"/></radialGradient></defs><g class="sphere"><circle cx="20" cy="17" r="14" fill="url(#mirel-sphere)"/><path d="M28 5.5c3.2 2.4 5 6.4 4.2 10.6" stroke="#301816" stroke-width="1.2" fill="none" stroke-linecap="round"/></g><path d="M6 35.5c8-3 21-3 29 0M6 41c8-2.5 21-2.5 29 0M6 35.5c-2.2 1.8-2.2 3.8 0 5.5M9 38.3c3-.8 5 .6 8 0s5 .6 8 0 4 .6 7 0" stroke="#301816" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>
      <span class="brand-text"><strong>MIREL</strong><span>מהמטבח לעסק משלי · הקורס</span></span>
    </a>
    <button class="nav-toggle" aria-controls="site-nav" aria-expanded="false" aria-label="תפריט">☰</button>
    <nav id="site-nav" class="site-nav" aria-label="ניווט ראשי">
      <ul>
{lis}        <li><a class="nav-cta" href="../#register">להרשמה לקורס</a></li>
      </ul>
    </nav>
  </div>
</header>
'''
for src in sorted(glob.glob(f'{SP}/src_*.html')):
    name = os.path.basename(src)[4:-5]
    s = open(src).read()
    m = re.search(r'\{\{HEAD title="([^"]*)" desc="([^"]*)"\}\}', s)
    s = s.replace(m.group(0), head.format(title=m.group(1), desc=m.group(2)).rstrip('\n'))
    cur = name if name in ('students','quiz') else 'hub'
    s = s.replace('{{HEADER}}', header(cur).rstrip('\n')).replace('{{FOOTER}}', footer.rstrip('\n'))
    open(f'{OUT}/{"index" if name=="hub" else name}.html','w').write(s)
    print('built', name)
