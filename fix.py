import re

file_path = 'src/App.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Remove the broken injection (it sits between the first import and the second import)
broken_injection_pattern = r"useState \} from 'react';\n.*?\nimport"
# Replace with a clean import
content = re.sub(broken_injection_pattern, "useState } from 'react';\nimport", content, flags=re.DOTALL)

# 2. Define the correct injection block
injection = """
  const [liveHealth, setLiveHealth] = useState({ status: 'Loading...', score: 0 });

  useEffect(() => {
    fetch('http://127.0.0.1:9999/api/health')
      .then(res => res.json())
      .then(data => {
        setLiveHealth({ status: data.status, score: data.status === 'Healthy' ? 100 : 0 });
      })
      .catch(() => setLiveHealth({ status: 'Offline', score: 0 }));
  }, []);
"""

# 3. Find the App component declaration and insert the block right after it
app_declaration = "export default function App() {"
if app_declaration in content:
    content = content.replace(app_declaration, app_declaration + "\n" + injection)
else:
    # Fallback if the declaration is slightly different
    content = re.sub(r"(function App\(.*?\)\s*\{)", r"\1\n" + injection, content, count=1)

with open(file_path, 'w') as f:
    f.write(content)

print("✅ Fixed the syntax error and injected the API hook correctly!")
