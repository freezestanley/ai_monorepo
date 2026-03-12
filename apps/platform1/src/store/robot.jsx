import { create } from "zustand"

export const useBotsInfo = create((set) => ({
  data: { showBots: true, currentBot: { botName: "" } },
  setData: (data) => set({ data })
}))

export const useBotsExtendInfo = create((set) => ({
  data: {},
  setData: (data) => set({ data })
}))
