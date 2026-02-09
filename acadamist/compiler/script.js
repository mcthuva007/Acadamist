// Configuration
const API_URL = "https://emkc.org/api/v2/piston/execute";

const DEFAULT_CODE = {
    python: `def main():
    print("Default Code: Hello World")

if __name__ == "__main__":
    main()`,
    cpp: `#include <iostream>

int main() {
    std::cout << "Default Code: Hello World" << std::endl;
    return 0;
}`,
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Default Code: Hello World");
    }
}`,
    c: `#include <stdio.h>

int main() {
    printf("Default Code: Hello World\\n");
    return 0;
}`,
    sql: `-- Create a table
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);

-- Insert some data
INSERT INTO users (id, name, email) VALUES (1, 'Thuva', 'thuva@example.com');
INSERT INTO users (id, name, email) VALUES (2, 'Alice', 'alice@example.com');

-- Retrieve data
SELECT * FROM users;
`,
    html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; text-align: center; padding: 20px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a live HTML preview.</p>
</body>
</html>`
};

const MODE_MAP = {
    python: "python",
    cpp: "text/x-c++src",
    java: "text/x-java",
    c: "text/x-csrc",
    sql: "text/x-sql",
    html: "htmlmixed"
};

const PISTON_LANG_MAP = {
    python: { language: "python", version: "3.10.0" },
    cpp: { language: "cpp", version: "10.2.0" },
    java: { language: "java", version: "15.0.2" },
    c: { language: "c", version: "10.2.0" },
    sql: { language: "sqlite3", version: "3.36.0" }
};

// DOM Elements
const dropdownToggle = document.getElementById('dropdown-toggle');
const dropdownMenu = document.getElementById('dropdown-menu');
const dropdownItems = document.querySelectorAll('.dropdown-item');
const selectedLanguageSpan = document.querySelector('.selected-language');
const runBtn = document.getElementById('run-btn');
const outputConsole = document.getElementById('output-console');
const outputFrame = document.getElementById('output-frame');
const loader = document.getElementById('loader');

// Initialize CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
    lineNumbers: true,
    theme: 'monokai', // Using native dark theme
    mode: 'python',
    autoCloseBrackets: true,
    indentUnit: 4,
    viewportMargin: Infinity
});

// State
let currentLanguage = 'python';

// Functions
function setEditorLanguage(lang) {
    currentLanguage = lang;
    const mode = MODE_MAP[lang];
    editor.setOption('mode', mode);
    editor.setValue(DEFAULT_CODE[lang]);

    // Clear output
    outputConsole.textContent = '';
    outputFrame.classList.add('hidden');
    outputConsole.classList.remove('hidden');

    if (lang === 'html') {
        runBtn.textContent = 'PREVIEW';
    } else {
        runBtn.textContent = 'RUN';
    }
}

async function runCode() {
    const code = editor.getValue();

    if (currentLanguage === 'html') {
        outputConsole.classList.add('hidden');
        outputFrame.classList.remove('hidden');
        outputFrame.srcdoc = code;
        return;
    }

    // For other languages, use Piston API
    showLoading(true);
    outputConsole.classList.remove('hidden');
    outputFrame.classList.add('hidden'); // Ensure iframe is hidden
    outputConsole.textContent = ''; // Clear previous output

    try {
        const langConfig = PISTON_LANG_MAP[currentLanguage];

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: langConfig.language,
                version: langConfig.version,
                files: [
                    {
                        content: code
                    }
                ]
            })
        });

        const result = await response.json();

        if (result.run) {
            outputConsole.textContent = result.run.output;
            if (result.run.stderr) {
                // Optionally enable error specific styling here
                // outputConsole.style.color = 'red'; // Keep it B&W for now
            }
        } else {
            outputConsole.textContent = "Error: Failed to execute code.";
        }
    } catch (error) {
        outputConsole.textContent = `Error: ${error.message}`;
    } finally {
        showLoading(false);
    }
}

function showLoading(isLoading) {
    if (isLoading) {
        loader.classList.remove('hidden');
        runBtn.disabled = true;
    } else {
        loader.classList.add('hidden');
        runBtn.disabled = false;
        editor.focus();
    }
}

// Custom Dropdown Event Listeners
dropdownToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownToggle.classList.toggle('active');
    dropdownMenu.classList.toggle('active');
});

dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = item.getAttribute('data-value');
        const languageName = item.textContent;

        // Update UI
        selectedLanguageSpan.textContent = languageName.toUpperCase();

        // Remove selected class from all items
        dropdownItems.forEach(i => i.classList.remove('selected'));
        // Add selected class to clicked item
        item.classList.add('selected');

        // Close dropdown
        dropdownToggle.classList.remove('active');
        dropdownMenu.classList.remove('active');

        // Update editor language
        setEditorLanguage(value);
    });
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownToggle.classList.remove('active');
        dropdownMenu.classList.remove('active');
    }
});

runBtn.addEventListener('click', runCode);

// Download Feature
const FILE_EXTENSIONS = {
    python: 'py',
    cpp: 'cpp',
    java: 'java',
    c: 'c',
    sql: 'sql',
    html: 'html'
};

document.getElementById('download-btn').addEventListener('click', () => {
    const code = editor.getValue();
    const ext = FILE_EXTENSIONS[currentLanguage] || 'txt';
    const filename = `main.${ext}`;

    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
});

// Initial Setup
setEditorLanguage('python');
// Mark Python as selected by default
dropdownItems[0].classList.add('selected');
