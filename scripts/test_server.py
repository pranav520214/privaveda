import urllib.request, sys
sys.stdout.reconfigure(encoding='utf-8')

with urllib.request.urlopen('http://localhost:3005') as res:
    html = res.read().decode('utf-8').lower()
    checks = [
        'deterministic safety evaluation',
        'sdg',
        'good health',
        'industry, innovation',
        'pranav kumar mishra',
        'safe demo mode',
        'plasma drug concentration trajectory',
        'monte carlo',
        'bayesian',
        'evidence gate',
        'cyp2d6',
        'egfr'
    ]
    for c in checks:
        print(f"'{c}': {'FOUND' if c in html else 'NOT FOUND'}")
