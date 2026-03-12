import { useState, useEffect } from "react"
import { fetchCallLogsColumns } from "@/api/userFeedback/api"
import { PAGE_CODE } from "@/constants/pageCode"

export const useCallLogsColumns = () => {
  const [columns, setColumns] = useState([])

  const getSelectColumns = async () => {
    const res = await fetchCallLogsColumns(PAGE_CODE.CALL_LOGS)
    setColumns(res)
  }

  useEffect(() => {
    getSelectColumns()
  }, [])

  return {
    columns,
    setColumns,
    refreshColumns: getSelectColumns
  }
}
