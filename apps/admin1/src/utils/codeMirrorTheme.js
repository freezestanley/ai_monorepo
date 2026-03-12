import { createTheme } from "@uiw/codemirror-themes"
import { EditorView } from "@codemirror/view"

export const codemirrorThemeGray = createTheme({
  theme: "light",
  settings: {
    background: "#F5F7FA",
    foreground: "#475467",
    caret: "#044289",
    selection: "#036dd626",
    selectionMatch: "#036dd626",
    lineHighlight: "#f6f8fa",
    color: "#475467"
  },
  styles: [
    {
      tag: "comment",
      color: "#6a737d"
    },
    {
      tag: "string",
      color: "#032f62"
    },
    {
      tag: "number",
      color: "#005cc5"
    },
    {
      tag: "keyword",
      color: "#d73a49"
    }
  ]
})
