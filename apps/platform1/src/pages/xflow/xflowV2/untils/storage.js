import LZString from "lz-string"

export const compressedStorage = {
  setItem: (key, value) => {
    try {
      const compressed = LZString.compress(JSON.stringify(value))
      localStorage.setItem(key, compressed)
    } catch (error) {
      console.error(`Error compressing data for ${key}:`, error)
      // 如果压缩失败，尝试直接存储
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (e) {
        console.error(`Error saving data for ${key}:`, e)
      }
    }
  },
  getItem: (key) => {
    try {
      const compressed = localStorage.getItem(key)
      if (!compressed) return null
      const decompressed = LZString.decompress(compressed)
      return decompressed ? JSON.parse(decompressed) : null
    } catch (error) {
      console.error(`Error decompressing data for ${key}:`, error)
      // 如果解压失败，尝试直接解析
      try {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : null
      } catch (e) {
        console.error(`Error parsing data for ${key}:`, e)
        return null
      }
    }
  }
}
