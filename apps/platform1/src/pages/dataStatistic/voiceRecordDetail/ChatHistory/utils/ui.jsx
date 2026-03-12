import dayjs from "dayjs"

export const formatDate = (time) => {
  if (time) {
    return dayjs(time).format("YYYY-MM-DD HH:mm:ss")
  }
  return time
}

export const avatorColor = [
  "#2D92F3",
  "#97C954",
  "#6DD0B8",
  "#67BDF4",
  "#8698F2",
  "#E2ADF8",
  "#EFA7A8",
  "#EBC582",
  "#EF7D70"
]
