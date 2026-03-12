import { Card, Checkbox, Form, Select } from 'antd'
import type { CheckboxChangeEvent } from 'antd/es/checkbox'
import CustomSelect from '../custom-select'
import { useEffect, useState } from 'react'

export interface ICheckOption {
  code: string
  label: string
  value: string
  type: string
  disabled?: boolean
}

export interface ITreeCheck {
  type: string
  readonly: boolean
  filedKey: string
  code: string
  filedDisplayName: string
  options?: ICheckOption[]
  customSelectOptions?: any
  sceneTagListOptions?: any
  buttonEditOptions?: any[]
  form: any
  isEdit?: boolean
  isDisabledChange?: (value: any) => void
}
// 细粒度权限控制
const fineGrainedAccessControlList: string[] = ['appKnowledgeList']
const SceneTagCustomSelectConfig = {
  placeholder: '请选择场景',
  allText: '全部场景',
  partialText: '指定场景',
  emptyTipText: '请选择场景标签'
}

export const SingleTreeCheckBoxItem = (props: ITreeCheck) => {
  const { filedKey, filedDisplayName, type, readonly } = props

  return (
    <div style={{ paddingLeft: 24 }}>
      <Form.Item name={filedKey} valuePropName="checked" hidden={type !== 'MENU'}>
        <Checkbox disabled={readonly}>{filedDisplayName}</Checkbox>
      </Form.Item>
    </div>
  )
}
/**
 * 多选树单条
 * @param props {ITreeCheck}
 * @returns
 */
export const TreeMultiCheckBoxItem = (props: ITreeCheck) => {
  const {
    form,
    options = [],
    filedKey,
    filedDisplayName,
    readonly,
    customSelectOptions,
    sceneTagListOptions,
    buttonEditOptions,
    isEdit = false,
    isDisabledChange
  } = props

  const [indeterminate, setIndeterminate] = useState(false)
  const [selectsDisabled, setSelectsDisabled] = useState(true)

  // 只监听知识管理的 checkbox 状态
  const knowledgeOption = options.find((opt: any) => opt.code === 'appKnowledgeList') //文档/问答/结构化知识管理   知识管理
  const checkedValue = Form.useWatch([filedKey, 'checked', knowledgeOption?.value], form)

  useEffect(() => {
    setSelectsDisabled(!checkedValue)
    isDisabledChange?.(!checkedValue)
  }, [checkedValue])

  useEffect(() => {
    if (!isEdit) {
      const buttonEditOptionsInitValue =
        buttonEditOptions
          ?.map((item: any) => {
            return ['faqAnswerEdit', 'structureEdit'].includes(item.code) ? item.value : ''
          })
          .filter((v) => v) || []
      form.setFieldsValue({
        [filedKey]: {
          bizSources: buttonEditOptionsInitValue
        }
      })
    }
  }, [isEdit, buttonEditOptions])

  const handleIndeterminateChange = () => {
    const checkedValue = form.getFieldValue([filedKey, 'checked']) || {}
    const optionsLength = options.length
    const checkedValueList = Object.keys(checkedValue)
    const checkedValueTrueLength = checkedValueList.filter((key) => checkedValue[key] === true)?.length

    // 更新全选状态
    if (checkedValueTrueLength === optionsLength) {
      form.setFieldValue([filedKey, 'checkAll'], true)
      setIndeterminate(false)
    } else if (checkedValueTrueLength === 0) {
      form.setFieldValue([filedKey, 'checkAll'], false)
      setIndeterminate(false)
    } else {
      form.setFieldValue([filedKey, 'checkAll'], false)
      setIndeterminate(true)
    }
  }

  useEffect(() => {
    handleIndeterminateChange()
  }, [props])

  const onCheckAllChange = (e: any) => {
    const isCheckedAll = e.target.checked
    const checkedObj: any = {}
    options?.forEach((item: any) => {
      checkedObj[item.value] = isCheckedAll
    })

    const data: any = {
      checked: checkedObj,
      checkAll: isCheckedAll
    }

    form.setFieldsValue({
      [filedKey]: data
    })
    setIndeterminate(false)
  }

  const onCheckboxChange = (optionValue: string) => (e: CheckboxChangeEvent) => {
    const checked = e.target.checked
    const checkFields = form.getFieldValue([filedKey, 'checked']) || {}

    // 更新当前选中的值
    checkFields[optionValue] = checked
    form.setFieldsValue({
      [filedKey]: {
        checked: checkFields
      }
    })
    handleIndeterminateChange()
  }

  return (
    <div>
      <Card
        title={
          <Form.Item name={[filedKey, 'checkAll']} valuePropName="checked" style={{ marginBottom: 0 }}>
            <Checkbox disabled={readonly} indeterminate={indeterminate === true} onChange={onCheckAllChange}>
              {filedDisplayName}
            </Checkbox>
          </Form.Item>
        }
        style={{ marginBottom: 10 }}
      >
        <div style={{ padding: '26px 49px', display: 'flex', alignItems: 'baseline' }}>
          {options.map((option: any) => {
            return (
              <>
                {fineGrainedAccessControlList.includes(option.code) ? (
                  <div style={{ padding: 10, backgroundColor: '#f8f8f8', borderRadius: 5 }}>
                    <Form.Item name={[filedKey, 'checked', option.value]} valuePropName="checked" style={{ marginBottom: 0, width: '250px' }}>
                      <Checkbox disabled={readonly} onChange={onCheckboxChange(option.value)}>
                        {option.label}
                      </Checkbox>
                    </Form.Item>
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, curValues) =>
                        prevValues?.[filedKey]?.checked?.[option.value] !== curValues?.[filedKey]?.checked?.[option.value]
                      }
                    >
                      {({ getFieldValue, validateFields }) => {
                        const isCheckedVal = !!getFieldValue(filedKey)?.checked?.[option.value]
                        !isCheckedVal &&
                          validateFields([
                            [filedKey, option.value],
                            [filedKey, 'sceneTag'],
                            [filedKey, 'bizSources']
                          ])
                        return (
                          <>
                            <Form.Item
                              rules={[{ required: isCheckedVal, message: '请选择来源' }]}
                              label={'选择来源'}
                              name={[filedKey, option.value]}
                              style={{ marginTop: '10px' }}
                            >
                              <CustomSelect disabled={readonly || selectsDisabled} options={customSelectOptions} style={{ marginTop: '0' }} />
                            </Form.Item>
                            <Form.Item rules={[{ required: isCheckedVal, message: '选择标签' }]} label={'选择标签'} name={[filedKey, 'sceneTag']}>
                              <CustomSelect
                                disabled={readonly || selectsDisabled}
                                options={sceneTagListOptions}
                                style={{ marginTop: '0' }}
                                config={SceneTagCustomSelectConfig}
                              />
                            </Form.Item>
                            <Form.Item
                              rules={[{ required: isCheckedVal, message: '请选择按钮编辑权限选项' }]}
                              name={[filedKey, 'bizSources']}
                              label={'按钮权限'}
                            >
                              <Select
                                disabled={readonly || selectsDisabled}
                                mode="multiple"
                                style={{ width: '300px', marginTop: '0' }}
                                placeholder="请选择按钮编辑权限选项"
                                options={buttonEditOptions}
                              />
                            </Form.Item>
                          </>
                        )
                      }}
                    </Form.Item>
                  </div>
                ) : (
                  <div style={{ paddingLeft: 24 }}>
                    <Form.Item name={[filedKey, 'checked', option.value]} valuePropName="checked">
                      <Checkbox disabled={readonly} onChange={onCheckboxChange(option.value)}>
                        {option.label}
                      </Checkbox>
                    </Form.Item>
                  </div>
                )}
              </>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
