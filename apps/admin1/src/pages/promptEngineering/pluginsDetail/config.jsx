/*
 * @Author: Dyton
 * @Date: 2024-04-18 21:08:08
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-04-19 11:51:19
 * @FilePath: /za-aigc-platform-admin-static/src/pages/promptEngineering/pluginsDetail/config.jsx
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */
export const columns = [
  {
    title: "参数名",
    dataIndex: "name",
    key: "name",
    width: 254
  },
  {
    title: "参数类型",
    dataIndex: "type",
    key: "type",
    width: 120
  },
  {
    title: "参数说明",
    dataIndex: "description",
    key: "description"
  }
]
export const mockImg =
  "https://p6-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/17b29982959e41eba97c317785efdd13~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1716026662&x-signature=wZQuqVb8MFe8Dl1bwLpj2uOYyk4%3D"

export const mockData = [
  {
    name: "Text",
    type: "string",
    description: "字段描述"
  },
  {
    name: "Text",
    type: "string",
    description: "字段描述"
  },
  {
    name: "Text",
    type: "string",
    description: "字段描述"
  }
]

export const mockDetail = {
  isOwner: true,
  pluginInfo: {
    description: "exercitation cupidatat aliqua non",
    pluginNo: "ipsum officia",
    subscriberCount: 91921767.88242388,
    iconUrl: mockImg,
    id: 57069017.80401617,
    isSubscriber: false,
    name: "in ad eiusmod ut enim",
    ownerInfo: {
      avatar_url: mockImg,
      id: 4141295.5288339257,
      name: "veniam sunt mollit aliquip"
    },
    status: -43996480.675257124,
    publishTime: "ea enim sint non occaecat"
  },
  pluginExtra: {
    tools: [
      {
        id: 62000110.639975995,
        name: "tempor cillum ipsum",
        description: "cillum ex aute do ullamco",
        parameters: [
          {
            description: "cupidatat ut",
            name: "ullamco nisi laboris",
            required: false,
            type: "in eu tempor exercitation incididunt"
          }
        ]
      },
      {
        id: -71835192.33011557,
        name: "id pariatur ad",
        description: "reprehenderit",
        parameters: [
          {
            description: "do sed eu ex",
            name: "commodo anim sed enim sint",
            required: false,
            type: "aliquip"
          },
          {
            description: "ipsum est ullamco enim elit",
            name: "eiusmod proident tempor",
            required: true,
            type: "aliqua"
          },
          {
            description: "id ut enim",
            name: "amet minim fugiat dolor aliquip",
            required: false,
            type: "eu Ut"
          },
          {
            description: "elit nulla aliqua proident pariatur",
            name: "laborum dolor",
            required: true,
            type: "irure ipsum cillum ut"
          },
          {
            description: "eu nostrud et in nisi",
            name: "occaecat reprehenderit",
            required: true,
            type: "id est"
          }
        ]
      },
      {
        id: -19716019.238459915,
        name: "laboris Lorem",
        description: "nulla",
        parameters: [
          {
            description: "anim nulla exercitation",
            name: "cillum Ut adipisicing veniam consequat",
            required: true,
            type: "non enim"
          },
          {
            description: "do nostrud ut",
            name: "est in",
            required: true,
            type: "tempor Lorem ad"
          },
          {
            description: "pariatur",
            name: "dolor do amet",
            required: true,
            type: "id culpa dolor"
          },
          {
            description: "exercitation enim reprehenderit occaecat",
            name: "eiusmod",
            required: true,
            type: "cupidatat sit in"
          },
          {
            description: "culpa",
            name: "Ut anim minim sint magna",
            required: true,
            type: "et irure ullamco id"
          }
        ]
      }
    ]
  }
}
