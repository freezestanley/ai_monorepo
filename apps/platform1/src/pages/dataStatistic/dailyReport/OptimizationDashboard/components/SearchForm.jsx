import { SearchForm } from "form-render"
import RangeTimePicker from "@/components/RangeTime"
import getSchema from "../../schema"

function OptimizationSearchForm({
  form,
  groupList,
  botList,
  startTime,
  endTime,
  botNo,
  iframeStyle,
  onSearch,
  watch
}) {
  return (
    <SearchForm
      schema={getSchema(groupList, botList, startTime, endTime, botNo, iframeStyle)}
      form={form}
      labelWidth={100}
      collapsed={true}
      onSearch={onSearch}
      watch={watch}
      widgets={{ RangeTimePicker }}
    />
  )
}

export default OptimizationSearchForm
