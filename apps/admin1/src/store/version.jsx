import { create } from "zustand"

export const usePublishConfigStore = create((set) => ({
  data: {},
  setData: (data) => set({ data })
}))

export const useStudioenvStore = create((set) => ({
  data: "",
  setData: (data) => set({ data })
}))
