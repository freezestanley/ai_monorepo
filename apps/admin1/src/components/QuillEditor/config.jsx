import Quill from "quill"
import ImageResize from "quill-image-resize-module-react"
import quillEmoji from "quill-emoji"
import QuillCursors from "quill-cursors"

Quill.register("modules/imageResize", ImageResize)
Quill.register("modules/emoji", quillEmoji)

export const modulesData = {
  toolbar: [
    [{ header: ["1", "2", "3", false] }],
    // [{ font: [] }],
    [{ size: ["small", false, "large", "huge"] }], // 这里定义了字体大小选项
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["bold", "italic", "underline"],
    ["link", "image", "code-block"],
    [
      {
        color: [
          "rgb(  0,   0,   0)",
          "rgb(230,   0,   0)",
          "rgb(255, 153,   0)",
          "rgb(255, 255,   0)",
          "rgb(  0, 138,   0)",
          "rgb(  0, 102, 204)",
          "rgb(153,  51, 255)",
          "rgb(255, 255, 255)",
          "rgb(250, 204, 204)",
          "rgb(255, 235, 204)",
          "rgb(255, 255, 204)",
          "rgb(204, 232, 204)",
          "rgb(204, 224, 245)",
          "rgb(235, 214, 255)",
          "rgb(187, 187, 187)",
          "rgb(240, 102, 102)",
          "rgb(255, 194, 102)",
          "rgb(255, 255, 102)",
          "rgb(102, 185, 102)",
          "rgb(102, 163, 224)",
          "rgb(194, 133, 255)",
          "rgb(136, 136, 136)",
          "rgb(161,   0,   0)",
          "rgb(178, 107,   0)",
          "rgb(178, 178,   0)",
          "rgb(  0,  97,   0)",
          "rgb(  0,  71, 178)",
          "rgb(107,  36, 178)",
          "rgb( 68,  68,  68)",
          "rgb( 92,   0,   0)",
          "rgb(102,  61,   0)",
          "rgb(102, 102,   0)",
          "rgb(  0,  55,   0)",
          "rgb(  0,  41, 102)",
          "rgb( 61,  20,  10)"
        ]
      }
    ],
    ["emoji"] //emoji表情，设置了才能显示
  ],
  "emoji-toolbar": true,
  "emoji-shortname": true,
  imageResize: {
    parchment: Quill.import("parchment"),
    modules: ["Resize", "DisplaySize"]
  }
}
