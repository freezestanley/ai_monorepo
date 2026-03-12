import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { Form, Divider, Alert } from "antd"
import InputParameter from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/InputParameter"
import { useNode } from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/hooks/useNode"
import DynamicFormComponent from "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/components/DynamicFormComponent"
import "@/pages/xflow/CustomFlowchartFormPanel/NodeComponent/index.scss"
import { useCustomFormControlType } from "../hooks"
import useFormDisabled from "@/pages/xflow/hooks/useFormDisabled"
import { useSkillFlowData } from "@/store"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import CustomDivider from "@/components/CustomDivider"

const FormInput = forwardRef(({ targetData, onClose, save }, ref) => {
  const [form] = Form.useForm()
  const [formKey, setFormKey] = useState(0)
  const [formData, setFormData] = useState([])
  const skillFlowData = useSkillFlowData((state) => state.skillFlowData)
  const { inputs, addInput, deleteInput } = useNode(form, targetData)

  const { data: formControlOptions = [] } = useCustomFormControlType()
  const [isDisabled] = useFormDisabled()
  const queryClient = useQueryClient()

  console.log("inputs:", inputs)

  const onFinish = () => {
    return form.validateFields().then((values) => {
      console.log("Received values of form: ", values)
      const { inputParams, ...rest } = values
      const formattedValues = {
        ...rest,
        inputParams: inputParams?.map((item, index) => ({
          ...item,
          id: inputs[index].id,
          attributeType: formControlOptions.find((v) => item.controlType === v.code)
            ?.variableValueType
        }))
      }
      save(
        {
          ...skillFlowData,
          edges: skillFlowData?.flowDefinition?.graph?.edges,
          nodes: skillFlowData?.flowDefinition?.graph?.nodes,
          formControlDefinitions: { ...targetData, ...formattedValues }
        },
        () => {
          onClose()
          queryClient.invalidateQueries([QUERY_KEYS.GLOBAL_VARIABLE])
        }
      )
    })
  }

  const initFormData = () => {
    const formData = form.getFieldValue("inputParams")
    setFormData(formData)
  }
  useEffect(() => {
    initFormData()
  }, [])

  useImperativeHandle(ref, () => ({
    onFinish
  }))

  return (
    <div className="common-node-wrapper" style={{ boxShadow: "none" }}>
      <div className="header"></div>
      <div className="base-node-comp" style={{ display: "block" }}>
        <Form
          form={form}
          onFinish={onFinish}
          labelCol={{ span: 10 }}
          disabled={isDisabled}
          onValuesChange={initFormData}
        >
          {inputs.map((input, index) => (
            <>
              {form.getFieldValue(`inputParams[${index}].controlType`) === "upload" && (
                <Alert
                  className="mb-2"
                  message={<span className="text-red-500">请勿将内网文件上传至公网</span>}
                  type="error"
                />
              )}
              <InputParameter
                formControlOptions={formControlOptions}
                key={index}
                add={true}
                addInput={addInput}
                input={input}
                index={index}
                deleteInput={deleteInput}
                form={form}
                length={inputs.length}
              />
            </>
          ))}
        </Form>
        <CustomDivider showTopLine={true}>预览</CustomDivider>
        <DynamicFormComponent
          preview={true}
          formData={formData || []}
          nodeId={undefined}
          isProcess={undefined}
          onFinish={undefined}
          forceShowPanel={true}
        />
      </div>
    </div>
  )
})

export default FormInput
