/*
 * @Author: Dyton
 * @Date: 2024-03-14 20:49:04
 * @Descripttion:
 * @LastEditors:  xuyang003@zhongan.com
 * @LastEditTime: 2024-03-15 18:55:29
 * @FilePath: /za-aigc-platform-admin-static/src/pages/knowledgeProject/utils/index.ts
 * Copyright (c) 2024 by ZA-智能中台, All Rights Reserved.
 */

export function getQueryParameters(): Record<string, string> {
  const search = window.location.search.substring(1)
  const params: Record<string, string> = {}

  if (!search) {
    return params
  }

  const urlSearchParams = new URLSearchParams(search)

  urlSearchParams.forEach((value, key) => {
    params[key] = value
  })

  return params
}

export const findKnowledgeLayerNodes = (tree, id, opts, path = []) => {
  const { childName, isToId } = opts || {}
  const keyName = childName || "childKnowledgeConfigs"
  for (const node of tree) {
    if (node.id === id) {
      return isToId ? [...path, id] : [...path, node]
    } else if (node?.[keyName]) {
      const found = findKnowledgeLayerNodes(
        node[keyName],
        id,
        opts,
        isToId ? [...path, node.id] : [...path, node]
      )
      if (found) {
        return found
      }
    }
  }
  return undefined
}
