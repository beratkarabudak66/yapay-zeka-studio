import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Code2,
  Copy,
  Download,
  Loader2,
  Sparkles,
  Terminal,
} from "lucide-react";
import { addHistoryItem } from "@/lib/history";

type Language = "javascript" | "python" | "html" | "css" | "sql" | "bash";

const languages: { id: Language; label: string; icon: string }[] = [
  { id: "javascript", label: "JavaScript", icon: "JS" },
  { id: "python", label: "Python", icon: "PY" },
  { id: "html", label: "HTML", icon: "HTML" },
  { id: "css", label: "CSS", icon: "CSS" },
  { id: "sql", label: "SQL", icon: "SQL" },
  { id: "bash", label: "Bash", icon: "$" },
];

type SnippetType = {
  id: string;
  label: string;
  desc: string;
  languages: Language[];
};

const snippetTypes: SnippetType[] = [
  { id: "function", label: "Fonksiyon", desc: "Yeniden kullanılabilir fonksiyon şablonu", languages: ["javascript", "python"] },
  { id: "loop", label: "Döngü", desc: "For/while döngüsü örneği", languages: ["javascript", "python", "bash"] },
  { id: "array", label: "Dizi İşlemi", desc: "Map, filter, reduce örnekleri", languages: ["javascript", "python"] },
  { id: "fetch", label: "API İsteği", desc: "HTTP GET/POST isteği", languages: ["javascript", "python"] },
  { id: "form", label: "Form", desc: "HTML form yapısı", languages: ["html", "css"] },
  { id: "layout", label: "Flex Layout", desc: "CSS Flexbox düzeni", languages: ["css"] },
  { id: "select", label: "SELECT Sorgusu", desc: "Veritabanı sorgu örnekleri", languages: ["sql"] },
  { id: "script", label: "Shell Script", desc: "Bash betik örneği", languages: ["bash"] },
];

function generateCode(lang: Language, typeId: string, topic: string): { code: string; explanation: string } {
  const t = topic.trim() || "örnek";
  switch (typeId) {
    case "function":
      if (lang === "javascript") {
        return {
          code: `// ${t} için fonksiyon
function process${capitalize(t)}(input) {
  if (!input) {
    throw new Error("Girdi boş olamaz");
  }
  const result = input;
  return result;
}

// Kullanım:
const output = process${capitalize(t)}("test verisi");
console.log(output);`,
          explanation: `${t} işlemek için bir JavaScript fonksiyonu. Hata kontrolü içerir ve bir değer döndürür.`,
        };
      }
      return {
        code: `# ${t} için fonksiyon
def process_${snakeCase(t)}(input):
    if not input:
        raise ValueError("Girdi boş olamaz")
    result = input
    return result

# Kullanım:
output = process_${snakeCase(t)}("test verisi")
print(output)`,
        explanation: `${t} işlemek için bir Python fonksiyonu. Hata kontrolü içerir ve bir değer döndürür.`,
      };

    case "loop":
      if (lang === "javascript") {
        return {
          code: `// ${t} için döngü örneği
const items = ["a", "b", "c", "d"];

// For döngüsü
for (let i = 0; i < items.length; i++) {
  console.log(\`Öğe \${i}: \${items[i]}\`);
}

// For...of döngüsü
for (const item of items) {
  console.log(item);
}

// While döngüsü
let count = 0;
while (count < items.length) {
  console.log(\`Sayım: \${count}\`);
  count++;
}`,
          explanation: `${t} için üç farklı döngü türü: klasik for, for...of ve while.`,
        };
      }
      if (lang === "python") {
        return {
          code: `# ${t} için döngü örneği
items = ["a", "b", "c", "d"]

# For döngüsü
for i, item in enumerate(items):
    print(f"Öğe {i}: {item}")

# While döngüsü
count = 0
while count < len(items):
    print(f"Sayım: {count}")
    count += 1`,
          explanation: `${t} için Python döngü örnekleri: enumerate ile for ve while.`,
        };
      }
      return {
        code: `#!/bin/bash
# ${t} için bash döngü
items=("a" "b" "c" "d")

for item in "\${items[@]}"; do
    echo "Öğe: $item"
done

count=0
while [ $count -lt \${#items[@]} ]; do
    echo "Sayım: $count"
    ((count++))
done`,
        explanation: `${t} için bash döngü örnekleri: for ve while.`,
      };

    case "array":
      if (lang === "javascript") {
        return {
          code: `// ${t} için dizi işlemleri
const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// map: her elemanı dönüştür
const doubled = data.map(n => n * 2);

// filter: koşula uyanları seç
const evens = data.filter(n => n % 2 === 0);

// reduce: tek bir değere indir
const sum = data.reduce((acc, n) => acc + n, 0);

// find: ilk eşleşen eleman
const firstBig = data.find(n => n > 5);

console.log({ doubled, evens, sum, firstBig });`,
          explanation: `${t} için JavaScript dizi metotları: map, filter, reduce ve find.`,
        };
      }
      return {
        code: `# ${t} için liste işlemleri
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# map: her elemanı dönüştür
doubled = list(map(lambda n: n * 2, data))

# filter: koşula uyanları seç
evens = list(filter(lambda n: n % 2 == 0, data))

# reduce: tek bir değere indir
from functools import reduce
total = reduce(lambda acc, n: acc + n, data, 0)

print({"doubled": doubled, "evens": evens, "sum": total})`,
        explanation: `${t} için Python liste işlemleri: map, filter ve reduce.`,
      };

    case "fetch":
      if (lang === "javascript") {
        return {
          code: `// ${t} için API isteği
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`HTTP hatası: \${response.status}\`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("İstek başarısız:", error);
    throw error;
  }
}

// POST isteği
async function postData(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

// Kullanım:
fetchData("https://api.example.com/${snakeCase(t)}")
  .then(data => console.log(data));`,
          explanation: `${t} için async/await ile GET ve POST istekleri. Hata yönetimi içerir.`,
        };
      }
      return {
        code: `# ${t} için API isteği
import urllib.request
import json

def fetch_data(url):
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        print(f"İstek başarısız: {e}")
        raise

# requests kütüphanesi ile (pip install requests)
import requests

def post_data(url, body):
    response = requests.post(url, json=body)
    response.raise_for_status()
    return response.json()

# Kullanım:
data = fetch_data("https://api.example.com/${snakeCase(t)}")
print(data)`,
        explanation: `${t} için Python HTTP istekleri. urllib ve requests kütüphanesi örnekleri.`,
      };

    case "form":
      return {
        code: `<!-- ${t} için form -->
<form id="${snakeCase(t)}-form" class="form-container">
  <h2>${capitalize(t)}</h2>

  <div class="form-group">
    <label for="name">Ad:</label>
    <input type="text" id="name" name="name" required placeholder="Adınızı girin" />
  </div>

  <div class="form-group">
    <label for="email">E-posta:</label>
    <input type="email" id="email" name="email" required placeholder="email@ornek.com" />
  </div>

  <div class="form-group">
    <label for="message">Mesaj:</label>
    <textarea id="message" name="message" rows="4" placeholder="Mesajınız"></textarea>
  </div>

  <button type="submit">Gönder</button>
</form>`,
        explanation: `${t} için erişilebilir bir HTML form yapısı. Etiketler, doğrulama ve placeholder içerir.`,
      };

    case "layout":
      return {
        code: `/* ${t} için Flexbox düzeni */
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.card {
  flex: 1 1 300px;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* Responsive: mobilde tek sütun */
@media (max-width: 640px) {
  .row {
    flex-direction: column;
  }
}`,
        explanation: `${t} için CSS Flexbox düzeni. Responsive ve kart yapısı içerir.`,
      };

    case "select":
      return {
        code: `-- ${t} için SQL sorguları

-- Tüm kayıtları getir
SELECT * FROM ${snakeCase(t)};

-- Belirli sütunları seç ve filtrele
SELECT id, name, created_at
FROM ${snakeCase(t)}
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- Gruplama ve sayım
SELECT status, COUNT(*) as count
FROM ${snakeCase(t)}
GROUP BY status;

-- İki tabloyu birleştir (JOIN)
SELECT t.id, t.name, c.category_name
FROM ${snakeCase(t)} t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.status = 'active';`,
        explanation: `${t} için SQL örnekleri: SELECT, WHERE, ORDER BY, GROUP BY ve JOIN.`,
      };

    case "script":
      return {
        code: `#!/bin/bash
# ${t} için shell script

set -e  # Hata durumunda dur

# Değişkenler
INPUT_DIR="./input"
OUTPUT_DIR="./output"
DATE=$(date +%Y%m%d)

# Klasör oluştur
mkdir -p "$OUTPUT_DIR"

# Dosyaları işle
for file in "$INPUT_DIR"/*; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "İşleniyor: $filename"
    cp "$file" "$OUTPUT_DIR/\${DATE}_$filename"
  fi
done

echo "Tamamlandı: $(ls "$OUTPUT_DIR" | wc -l) dosya işlendi"`,
        explanation: `${t} için bash script. Dosya işleme, değişkenler ve hata yönetimi içerir.`,
      };

    default:
      return { code: "// Kod şablonu seçilmedi", explanation: "Bir şablon türü seçin." };
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/\s+/g, "");
}

function snakeCase(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

type CodingResult = {
  code: string;
  explanation: string;
  language: Language;
  topic: string;
};

export default function CodingAssistant() {
  const [topic, setTopic] = useState("");
  const [selectedLang, setSelectedLang] = useState<Language>("javascript");
  const [selectedType, setSelectedType] = useState("function");
  const [result, setResult] = useState<CodingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter snippet types by selected language
  const availableTypes = snippetTypes.filter((t) => t.languages.includes(selectedLang));

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Lütfen bir konu girin.");
      return;
    }
    // Ensure selected type is valid for the language
    if (!availableTypes.some((t) => t.id === selectedType)) {
      setSelectedType(availableTypes[0]?.id || "function");
    }
    setIsProcessing(true);
    setTimeout(() => {
      const { code, explanation } = generateCode(selectedLang, selectedType, topic);
      const codingResult: CodingResult = { code, explanation, language: selectedLang, topic: topic.trim() };
      setResult(codingResult);
      addHistoryItem({
        toolType: "coding",
        metadata: JSON.stringify({
          language: selectedLang,
          explanation,
          code,
        }),
      });
      setIsProcessing(false);
      toast.success("Kod şablonu oluşturuldu!");
    }, 400);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.code);
    toast.success("Kod kopyalandı!");
  };

  const handleDownload = () => {
    if (!result) return;
    const ext: Record<Language, string> = {
      javascript: "js",
      python: "py",
      html: "html",
      css: "css",
      sql: "sql",
      bash: "sh",
    };
    const blob = new Blob([result.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snakeCase(result.topic)}.${ext[result.language]}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Kod indirildi!");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
            <Code2 className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kodlama Asistanı</h1>
            <p className="text-muted-foreground text-sm">
              Konu ve dil seç — hazır kod şablonu anında oluşsun
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ayarlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Language */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Dil</label>
                  <div className="grid grid-cols-3 gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => {
                          setSelectedLang(lang.id);
                          // Reset type to first available for this language
                          const validTypes = snippetTypes.filter((t) => t.languages.includes(lang.id));
                          if (validTypes.length > 0 && !validTypes.some((t) => t.id === selectedType)) {
                            setSelectedType(validTypes[0].id);
                          }
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                          selectedLang === lang.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <span className="w-6 h-6 rounded bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">
                          {lang.icon}
                        </span>
                        <span className="text-xs font-medium text-foreground">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Snippet Type */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Şablon Türü</label>
                  <div className="space-y-1.5">
                    {availableTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 transition-all text-left ${
                          selectedType === type.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-sm text-foreground">{type.label}</span>
                          <span className="text-xs text-muted-foreground block">{type.desc}</span>
                        </div>
                        <Terminal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Konu / Açıklama
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="örn: kullanıcı listesi, veri filtreleme"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    maxLength={50}
                  />
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleGenerate}
                  disabled={isProcessing || !topic.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Kod Oluştur
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-3">
            {result ? (
              <div className="space-y-4">
                <Card className="shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <span className="text-slate-300 text-xs font-mono ml-2">
                        {snakeCase(result.topic)}.{result.language === "javascript" ? "js" : result.language}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="text-slate-300 hover:text-white transition-colors p-1"
                        title="Kopyala"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDownload}
                        className="text-slate-300 hover:text-white transition-colors p-1"
                        title="İndir"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <pre className="code-block !rounded-none !m-0 max-h-[400px] overflow-auto">
                    <code>{result.code}</code>
                  </pre>
                </Card>

                <Card className="shadow-sm bg-blue-50/40">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Açıklama</p>
                        <p className="text-sm text-muted-foreground">{result.explanation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
                    <Copy className="w-4 h-4" />
                    Kopyala
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownload} className="gap-2">
                    <Download className="w-4 h-4" />
                    İndir
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border h-full min-h-[300px] flex items-center justify-center bg-white shadow-sm">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
                    <Code2 className="w-8 h-8 text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Kod Hazır Değil</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Dil seç, şablon türü belirle ve konu gir, ardından "Kod Oluştur" butonuna tıkla.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8 bg-slate-50/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2025 SMG Yapay Zeka. Öğrenciler için tasarlandı.</p>
          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text" style={{fontFamily: "'Poppins', sans-serif", fontWeight: "800", letterSpacing: "-0.3px"}}>Made by @Beratkarabudak</span>
        </div>
      </footer>
    </div>
  );
}
