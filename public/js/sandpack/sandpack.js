// Example Usage with full control of multiple files:
// <rr-sandpack template="react-ts" show-tabs>
//   <template>
//   {
//     "/App.tsx": {
//       "file": "/public/js/sandpack/examples/SnesRomHeaderViewer.tsx"
//     }
//     "/code.ts": {
//       "code": "console.log('hello world')"
//     }
//   }
//   </template>
// </rr-sandpack>

//  Simple example usage that only overrides the App.tsx
// <rr-sandpack
//   template="react-ts"
//   app="/public/js/sandpack/examples/SnesRomHeaderViewer.tsx"
//   editor-height="500"
//   editor-width="70">
// </rr-sandpack>

const deps = "?deps=react@18,react-dom@18";

const reactUrl = `https://esm.sh/react@18${deps}`;
const reactDomUrl = `https://esm.sh/react-dom@18/client${deps}`;
const sandpackUrl = `https://esm.sh/@codesandbox/sandpack-react@2.2.0${deps}`;
const themeUrl = `https://esm.sh/@codesandbox/sandpack-themes@2.0.21${deps}`;
const RESIZE_HANDLE_HEIGHT = 12;

const defaultFiles = {
  "/App.tsx": {
    code: `export default function App() { return <h1>Default Example</h1>; }`
  },
  "/FileUpload.tsx": {
    file: '/public/js/sandpack/common/FileUpload.tsx'
  },
  "/index.js": {
    code: `import App from './App';\nimport { createRoot } from 'react-dom/client';\ncreateRoot(document.getElementById('root')).render(<App />);`
  },
  "/index.html": {
    code: `<link href="/index.css" rel="stylesheet">\n<div id='root'></div>`
  },
  "/index.css": {
    code: `.w-full { width: 100%; }\n.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }\n.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }\n.font-medium { font-weight: 500; }\n.capitalize { text-transform: capitalize; }`
  }
};

class RRSandpack extends HTMLElement {
  constructor() {
    super();
    this._editorHeight = parseInt(this.getAttribute("editor-height") || "400", 10);
    this._editorWidth = parseInt(this.getAttribute("editor-width") || "60", 10);
    this._resizable = this.getAttribute("resizable") !== "false";
    this._hostHeight = this._resizable
      ? this._editorHeight + RESIZE_HANDLE_HEIGHT
      : this._editorHeight;
    this._root = null;
    this._renderProps = null;
    this._resizeObserver = null;
    this._isDraggingResize = false;
    this._resizeStartY = 0;
    this._resizeStartHeight = 0;

    this.style.display = "block";
    this.style.width = "100%";
    this.style.minHeight = `${this._hostHeight}px`;
    this.style.position = "relative";
    if (this._resizable) {
      this.style.height = `${this._hostHeight}px`;
      this.style.overflow = "hidden";
    }

    const contentHeight = this._resizable
      ? `calc(100% - ${RESIZE_HANDLE_HEIGHT}px)`
      : "100%";

    this._container = document.createElement("div");
    this._container.style.width = "100%";
    this._container.style.height = contentHeight;
    this._container.style.minHeight = `${this._editorHeight}px`;
    this._placeholder = document.createElement("div");
    this._placeholder.style.width = "100%";
    this._placeholder.style.height = contentHeight;
    this._placeholder.style.minHeight = `${this._editorHeight}px`;
    this._placeholder.style.display = "flex";
    this._placeholder.style.flexDirection = "column";
    this._placeholder.style.alignItems = "center";
    this._placeholder.style.justifyContent = "center";
    this._placeholder.style.gap = "12px";
    this._placeholder.style.cursor = "pointer";
    this._placeholder.style.background = "rgba(0,0,0,0.05)";
    this._placeholder.style.border = "2px dashed rgba(128,128,128,0.4)";
    this._placeholder.style.borderRadius = "6px";
    this._placeholder.style.color = "rgba(128,128,128,0.9)";
    this._placeholder.style.userSelect = "none";

    const _label = document.createElement("span");
    _label.textContent = this.getAttribute("placeholder") || "▶  Click to load interactive example";
    _label.style.fontSize = "0.95rem";
    _label.style.fontFamily = "system-ui, sans-serif";
    this._placeholder.appendChild(_label);

    this._onPlaceholderClick = () => {
      this._placeholder.removeEventListener("click", this._onPlaceholderClick);
      _label.textContent = "Loading...";
      this._placeholder.style.cursor = "default";
      this._initSandpack();
    };
    this._placeholder.addEventListener("click", this._onPlaceholderClick);
    this.appendChild(this._placeholder);

    this._resizeHandle = document.createElement("div");
    this._resizeHandle.style.height = `${RESIZE_HANDLE_HEIGHT}px`;
    this._resizeHandle.style.width = "100%";
    this._resizeHandle.style.cursor = "ns-resize";
    this._resizeHandle.style.userSelect = "none";
    this._resizeHandle.style.touchAction = "none";
    this._resizeHandle.style.borderTop = "1px solid rgba(255, 255, 255, 0.2)";
    this._resizeHandle.style.background = "rgba(255, 255, 255, 0.04)";

    if (this._resizable) {
      this._resizeHandle.addEventListener("pointerdown", this._onResizePointerDown);
      this.appendChild(this._resizeHandle);
    }

  }

  connectedCallback() {}

  disconnectedCallback() {
    if (this._onPlaceholderClick) {
      this._placeholder.removeEventListener("click", this._onPlaceholderClick);
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    if (this._resizable) {
      this._resizeHandle.removeEventListener("pointerdown", this._onResizePointerDown);
      window.removeEventListener("pointermove", this._onResizePointerMove);
      window.removeEventListener("pointerup", this._onResizePointerUp);
      document.body.style.cursor = "";
    }
  }

  _getCurrentEditorHeight() {
    const resizeHandleOffset = this._resizable ? RESIZE_HANDLE_HEIGHT : 0;
    return this._resizable
      ? Math.max(this._editorHeight, Math.round((this.clientHeight || this._editorHeight) - resizeHandleOffset))
      : this._editorHeight;
  }

  _onResizePointerDown = (event) => {
    event.preventDefault();
    this._isDraggingResize = true;
    this._resizeStartY = event.clientY;
    this._resizeStartHeight = this.clientHeight;
    document.body.style.cursor = "ns-resize";
    window.addEventListener("pointermove", this._onResizePointerMove);
    window.addEventListener("pointerup", this._onResizePointerUp);
  };

  _onResizePointerMove = (event) => {
    if (!this._isDraggingResize) return;
    const deltaY = event.clientY - this._resizeStartY;
    const minHeight = this._editorHeight + RESIZE_HANDLE_HEIGHT;
    const nextHeight = Math.max(minHeight, Math.round(this._resizeStartHeight + deltaY));
    this.style.height = `${nextHeight}px`;
    this._renderSandpack();
  };

  _onResizePointerUp = () => {
    this._isDraggingResize = false;
    document.body.style.cursor = "";
    window.removeEventListener("pointermove", this._onResizePointerMove);
    window.removeEventListener("pointerup", this._onResizePointerUp);
  };

  _renderSandpack() {
    if (!this._root || !this._renderProps) return;

    this._root.render(
      this._renderProps.React.createElement(this._renderProps.Sandpack, {
        template: this._renderProps.templateAttr,
        theme: "auto",
        files: this._renderProps.files,
        options: {
          initMode: "user-visible",
          showTabs: this._renderProps.showTabsAttr,
          showLineNumbers: true,
          showConsoleButton: true,
          wrapContent: true,
          editorHeight: this._getCurrentEditorHeight(),
          editorWidthPercentage: this._editorWidth,
          resizablePanels: true,
        },
      })
    );
  }

  async _initSandpack() {
    const [React, ReactDOM, { Sandpack }, { nightOwl }] = await Promise.all([
      import(reactUrl),
      import(reactDomUrl),
      import(sandpackUrl),
      import(themeUrl),
    ]);

    const templateAttr = this.getAttribute("template") || "react-ts";
    const showTabsAttr = this.hasAttribute("show-tabs");

    let userFiles = {};
    const tpl = this.querySelector("template");

    if (tpl) {
      try {
        const raw = tpl.innerHTML.trim();
        userFiles = JSON.parse(raw);
      } catch (err) {
        console.error("Invalid JSON inside <template>", err);
      }
    }

    const appFileUrl = this.getAttribute("app");
    if (appFileUrl) {
      userFiles["/App.tsx"] = { file: appFileUrl };
    }

    // Merge user files over defaults
    const combinedFiles = { ...defaultFiles, ...userFiles };

    const files = {};
    await Promise.all(
      Object.entries(combinedFiles).map(async ([filename, value]) => {
        if (value.code) {
          files[filename] = { code: value.code };
        } else if (value.file) {
          try {
            const res = await fetch(value.file);
            if (!res.ok) throw new Error(`Failed to fetch ${value.file}`);
            const content = await res.text();
            files[filename] = { code: content };
          } catch (err) {
            files[filename] = { code: `// Error loading ${value.file}\n${err.message}` };
          }
        }
      })
    );

    this.removeChild(this._placeholder);
    if (this._resizable) {
      this.insertBefore(this._container, this._resizeHandle);
    } else {
      this.appendChild(this._container);
    }

    this._root = ReactDOM.createRoot(this._container);
    this._renderProps = { React, Sandpack, templateAttr, showTabsAttr, files };
    this._renderSandpack();

    if (this._resizable) {
      this._resizeObserver = new ResizeObserver(() => {
        this._renderSandpack();
      });
      this._resizeObserver.observe(this);
    }
  }
}

customElements.define("rr-sandpack", RRSandpack);
