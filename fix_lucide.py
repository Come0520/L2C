import os
import re

def to_kebab_case(s):
    # insert hyphen before uppercase letters (except at the start), and convert to lowercase
    s = re.sub(r'(?<!^)(?=[A-Z])', '-', s).lower()
    return s

def fix_lucide_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # regex to match lucide-react imports, robust for multi-line
    pattern = re.compile(r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"];?", re.MULTILINE | re.DOTALL)
    
    def replace_match(match):
        icons = match.group(1).split(',')
        replacements = []
        for icon in icons:
            icon = icon.strip()
            if not icon:
                continue
            # Handle aliased imports if any, e.g. "AlertCircle as AlertIcon" (assuming none for now, but just in case)
            if ' as ' in icon:
                original, alias = icon.split(' as ')
                original = original.strip()
                alias = alias.strip()
                kebab_icon = to_kebab_case(original)
                replacements.append(f"import {alias} from 'lucide-react/dist/esm/icons/{kebab_icon}';")
            else:
                kebab_icon = to_kebab_case(icon)
                replacements.append(f"import {icon} from 'lucide-react/dist/esm/icons/{kebab_icon}';")
        return "\n".join(replacements)

    new_content = pattern.sub(replace_match, content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")

modules_to_check = [
    r'c:\Users\bigey\Documents\Antigravity\L2C\src\features\customers',
    r'c:\Users\bigey\Documents\Antigravity\L2C\src\features\leads',
    r'c:\Users\bigey\Documents\Antigravity\L2C\src\features\sales',
    r'c:\Users\bigey\Documents\Antigravity\L2C\src\features\channels',
    r'c:\Users\bigey\Documents\Antigravity\L2C\src\features\quotes',
    r'c:\Users\bigey\Documents\Antigravity\L2C\src\features\orders'
]

for directory in modules_to_check:
    for root, _, files in os.walk(directory):
        for f in files:
            if f.endswith('.tsx') or f.endswith('.ts'):
                fix_lucide_imports(os.path.join(root, f))
