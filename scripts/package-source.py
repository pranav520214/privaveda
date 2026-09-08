"""Create a local source-only release archive without credentials or runtime data."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
target = root / ".local" / "personalized-medicine-ai-v1.zip"
folders = {"backend", "frontend", "data", "scripts", "docs", "specs", ".github"}
root_files = {"README.md", "SECURITY.md", "LICENSE", ".gitignore", ".dockerignore", ".env.example", "docker-compose.yml"}
excluded = {"node_modules", ".next", "__pycache__", ".pytest_cache", "test-results", "playwright-report", ".venv", ".local", ".git"}
target.parent.mkdir(exist_ok=True)
count = 0
with ZipFile(target, "w", ZIP_DEFLATED) as archive:
    for file in sorted(root.rglob("*")):
        rel = file.relative_to(root)
        if not file.is_file() or any(part in excluded for part in rel.parts):
            continue
        if rel.parts[0] not in folders and rel.as_posix() not in root_files:
            continue
        if file.name == "demo-credentials.txt" or file.name.startswith(".env") and file.name != ".env.example":
            continue
        if file.suffix in {".db", ".pyc", ".tsbuildinfo", ".log"} or ".db-" in file.name:
            continue
        archive.write(file, "personalized-medicine-ai/" + rel.as_posix())
        count += 1
print(f"Packaged {count} source/documentation files: {target}")
