/*
 * @Author: dyton
 * @Date: 2023-10-16 14:52:58
 * @Descripttion: 文件描述
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-05-28 17:24:31
 * @FilePath: /za-aigc-platform-admin-static/vite.config.js
 * Copyright (c) 2023 by ZA-智能中台, All Rights Reserved.
 */
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import viteEslint from "vite-plugin-eslint"
import svgr from "vite-plugin-svgr"
// import { visualizer } from "rollup-plugin-visualizer"
// import { terser } from "rollup-plugin-terser" // 压缩

// 为 Node.js 环境添加 fetch polyfill
if (!globalThis.fetch) {
  const { default: fetch } = await import("node-fetch")
  globalThis.fetch = fetch
}

const knowledgeExtractorHost = "http://za-aigc-platform-knowledge-solution.test.za.biz/" //4297436-
const knowledgeHostLocal = "http://za-aigc-platform-knowledge.test.za.biz/" //4297436-
// const botHost = "http://4315629-za-aigc-platform.test.za.biz/" //4310589-
const botHost = "http://za-aigc-platform.test.za.biz"
const newsHost = "http://4315837-za-aigc-platform-cms.test.za.biz"

// 技术雷达
const technicalRadarHost = "http://za-aigc-platform-cms.test.za.biz/" // 4310133-
const nluHost = "http://fin-ivr-nlu-web.test.za.biz/"
const finOSSHost = "http://fin-mars-test.oss-cn-hzjbp-b-internal.aliyuncs.com" //""
const finVoiceOSSHost = "http://fin-za-ivr-nlu-open-test.oss-cn-hzfinance.aliyuncs.com" // voice 生成声音下载代理
const voiceAgentHost = "http://fin-ivr-nlu-web.test.za.biz" //4291611- "http://fin-ivr-nlu-web.test.za.biz/" //4297436-
const knowledgeOssHost =
  "http://za-aigc-platform-knowledge-test.oss-cn-hzjbp-b-internal.aliyuncs.com/"

// 声音市集相关
const timbreHost = "http://fin-ivr-nlu-web.test.za.biz/" //4291611-
// 数据飞轮相关
const flywheelHost = "http://4315629-za-aigc-flywheel.test.za.biz"

const botStudioHost = "http://4310589-za-aigc-platform-studio.test.za.biz"

// 模型广场相关
const modelManagementHost = "http://ai-platform-management.test.za.biz"
//  const modelManagementHost = "http://localhost:8080"

// admin 端 数据报表接口
const reportStudioHost = "http://4313015-za-aigc-platform-studio.test.za.biz"
/**
 * @description: 指定特定路径接口代理不同host
 * @param {*} url
 * @param {*} host
 * @return {*}
 */
const temProxy = (url, host = botHost) => {
  const prefix = `/botWeb`
  const obj = {}
  const key = `${prefix}${url}`
  obj[key] = {
    target: `${host}${url}`,
    rewrite: (path) => path.replace(key, ""),
    changeOrigin: true
  }
  return obj
}

export default defineConfig(({ mode }) => {
  return {
    base: "/",
    build: {
      // build目录名称，默认为"dist"
      outDir: "build",
      // 静态资源存放目录名称，默认为"assets"
      assetsDir: "static",
      assetsInlineLimit: (filePath) => {
        if (filePath.includes("?url")) {
          return false // 不内联特定目录下的资源
        }
        return undefined // 使用默认逻辑（基于 4096）
      },
      rollupOptions: {
        // visualizer({ open: true }),
        // plugins: [terser()],
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react")) {
              return "react" // 将 React 单独打包
            }
            if (id.includes("node_modules/react-dom")) {
              return "react-dom" // 将 ReactDOM 单独打包
            }
            if (id.includes("node_modules/lodash")) {
              return "lodash"
            }
            if (id.includes("node_modules/highlight")) {
              return "highlight"
            }
            // if (id.includes("node_modules/@antv")) {
            //   return "@antv"
            // }
            if (id.includes("node_modules/@codemirror")) {
              return "codemirror"
            }
            // if (id.includes("node_modules/antd")) {
            //   return "antd" // 将 lodash 单独打包
            // }
          }
        }
      }
    },
    server: {
      // 支持IP访问
      host: true,
      port: 3000,
      // 自动打开浏览器运行以下页面
      open: "/",
      // 设置反向代理
      proxy: {
        // ...temProxy("/admin/authResource/listBotResource", host1215667),
        // "/admin": {
        //   target: knowledgeHostLocal,
        //   rewrite: (path) => path.replace(/^\/admin/, ""),
        //   changeOrigin: true
        // },
        "/news": {
          target: newsHost,
          rewrite: (path) => path.replace(/^\/news/, ""),
          changeOrigin: true
        },
        "/botWeb": {
          target: mode === "studio" ? botStudioHost : botHost,
          rewrite: (path) => path.replace(/^\/botWeb/, ""),
          changeOrigin: true
        },
        "/knowledgeWeb": {
          target: knowledgeHostLocal,
          rewrite: (path) => path.replace(/^\/knowledgeWeb/, ""),
          changeOrigin: true
        },
        // 知识萃取
        "/knowledgeExtractorWeb": {
          target: knowledgeExtractorHost,
          rewrite: (path) => path.replace(/^\/knowledgeExtractorWeb/, ""),
          changeOrigin: true
        },
        "/nluWeb": {
          target: nluHost,
          rewrite: (path) => path.replace(/^\/nluWeb/, ""),
          changeOrigin: true
        },
        "/finOSSWeb": {
          target: finOSSHost,
          rewrite: (path) => path.replace(/^\/finOSSWeb/, ""),
          changeOrigin: true
        },
        "/finVoiceOSSHost": {
          target: finVoiceOSSHost,
          rewrite: (path) => path.replace(/^\/finVoiceOSSHost/, ""),
          changeOrigin: true
        },
        // 语音 agent 相关接口
        "/voiceAgentWeb": {
          target: voiceAgentHost,
          rewrite: (path) => path.replace(/^\/voiceAgentWeb/, ""),
          changeOrigin: true
        },
        "/knowledge-oss": {
          target: knowledgeOssHost,
          rewrite: (path) => path.replace(/^\/knowledge-oss/, ""),
          changeOrigin: true
        },
        // 声音市集相关
        "/timbreWeb": {
          target: timbreHost,
          rewrite: (path) => path.replace(/^\/timbreWeb/, ""),
          changeOrigin: true
        },
        // 数据飞轮相关
        "/flywheel": {
          target: flywheelHost,
          rewrite: (path) => path.replace(/^\/flywheel/, ""),
          changeOrigin: true
        },
        // 模型广场相关
        "/gateway/api": {
          target: modelManagementHost,
          rewrite: (path) => path.replace(/^\/gateway\/api/, ""),
          changeOrigin: true
        },
        // 技术雷达
        "/technicalRadarWeb": {
          target: technicalRadarHost,
          rewrite: (path) => path.replace(/^\/technicalRadarWeb/, ""),
          changeOrigin: true
        },
        // admin 端数据报表
        "/reportStudio": {
          target: reportStudioHost,
          rewrite: (path) => path.replace(/^\/reportStudio/, ""),
          changeOrigin: true
        },
        "/api/proxy": {
          target:
            mode === "studio"
              ? "http://4296262-za-aigc-platform-studio.test.za.biz"
              : "http://4315629-za-aigc-platform.test.za.biz", //4308142-
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/proxy/, "")
        }
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src")
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["legacy-js-api"]
        }
      }
    },
    plugins: [
      react(),
      // // 只在开发环境启用 ESLint 插件
      // process.env.NODE_ENV !== "production" &&
      //   viteEslint({
      //     failOnError: false
      //   }),
      svgr()
    ]
  }
})
