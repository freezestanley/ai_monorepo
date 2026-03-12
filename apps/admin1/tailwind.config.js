/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {},
    // 禁用 container 的响应式 max-width
    container: {
      center: false,
      padding: "0",
      screens: {} // 清空所有断点的 max-width 设置
    }
  },
  plugins: [
    require("@tailwindcss/typography"),
    // 添加自定义插件来支持基础样式
    function ({ addBase }) {
      addBase({
        "*": {
          "box-sizing": "border-box"
        },
        "html, body": {
          margin: "0",
          padding: "0"
        }
      })
    }
  ],
  corePlugins: {
    preflight: false // <== disable this!
  }
}
