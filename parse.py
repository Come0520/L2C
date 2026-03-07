import re, sys
try:
    with open('e2e-failed-list.json', 'r', encoding='utf-16-le', errors='ignore') as f:
        s = f.read()
    if '"file"' not in s:
        with open('e2e-failed-list.json', 'r', encoding='utf-8', errors='ignore') as f:
            s = f.read()
    
    files = set(re.findall(r'"file":\s*"([^"]+\.spec\.ts)"', s))
    result = '\n'.join(sorted([f.replace('\\\\', '/').split('/e2e/')[-1] for f in files]))
    print(result)
except Exception as e:
    print(f"Error: {e}")
