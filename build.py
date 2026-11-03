#!/usr/bin/env python3
"""يجمع src/engine.js و src/ui.js داخل src/template.html في ملف واحد index.html"""
import pathlib
root = pathlib.Path(__file__).parent
t = (root/'src/template.html').read_text(encoding='utf-8')
t = t.replace('/*__ENGINE__*/', (root/'src/engine.js').read_text(encoding='utf-8'))
t = t.replace('/*__UI__*/', (root/'src/ui.js').read_text(encoding='utf-8'))
(root/'index.html').write_text(t, encoding='utf-8')
print('index.html', len(t)//1024, 'KB')
