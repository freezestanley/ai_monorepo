// @ts-nocheck
import { useCallback, useEffect } from "react"
import { useSkillFlowData, useHandleSave } from "@/store"
import { useFetchGlobalVariable, useSaveDefinition } from "@/api/skill"
import { message } from "antd"
import { customNodesMap } from "../custom-nodes"
import { useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "@/constants/queryKeys"
import { isStudio } from "@/config.env"

// 不需要保存的节点
const excludeNodes = ["begin-node", "condition-node"]

// 定义复杂类型
const complexType = ["json", "array"]

export const useSkillFlow = () => {
  const changeSkillFlowData = useSkillFlowData((state) => state.changeSkillFlowData) //改变画布数据函数
  const skillFlowData = useSkillFlowData((state) => state.skillFlowData) //画布数据
  const { mutate: saveSkill, isLoading } = useSaveDefinition() //保存画布接口
  // const { changeHandleSave } = useHandleSave() //全局保存函数,需要时刻更新,否则数据有延迟

  // const { data: globalData = [] } = useFetchGlobalVariable(
  //   skillFlowData?.versionNo
  // )
  // console.log(globalData)

  const queryClient = useQueryClient()

  /**
   * 保存画布函数
   * @param {*} param0
   * @param {*} callback
   */
  const handleSave = useCallback(
    ({ formControlDefinitions, edges, nodes }, callback, noMessage = false) => {
      console.log({ formControlDefinitions, edges, nodes }, callback, "保存参数")
      const flowNodeDefinitionsArr = skillFlowData?.flowDefinition?.flowNodeDefinitions
      const skillComponentDefinitionsArr = skillFlowData?.skillComponentDefinitions

      if (!skillFlowData) {
        return
      }

      // 转换variableDefinitions 参数的函数
      const transformVariableDefinitions = (item) => {
        const {
          inputParams = [],
          outputParams = [],
          globalDataOptions = [],
          inputItems = [],
          name
        } = item
        const currentSkillComponentDefinitionsVars = skillComponentDefinitionsArr?.find(
          (def) => def.nodeId === item.id
        )?.variableDefinitions

        // 辅助函数：根据 displayName 查找 globalData
        const findGlobalData = (displayName) =>
          globalDataOptions?.find((option) => option.displayName === displayName)

        // 递归函数：处理 webhoook children
        const inputsWithglobalData = (data, vars) =>
          data.map((childItem) => {
            childItem = { ...childItem }
            const defVars = vars || currentSkillComponentDefinitionsVars
            const foundDefinition = defVars?.find(
              (def) => def.variableName === childItem.variableName
            )
            const globalItemData = findGlobalData(childItem.inputParams)
            if (childItem.children?.length) {
              childItem.children = inputsWithglobalData(
                childItem.children,
                foundDefinition?.children
              )
            }

            const isCustomer = !globalItemData
            //如果是复杂类型，则不是固定值
            const valueIsFixed = complexType.includes(childItem.variableValueType)
              ? false
              : isCustomer

            return {
              valueExpression: isCustomer && childItem.inputParams,
              ...globalItemData,
              ...childItem,
              referenceVariableNo:
                foundDefinition?.referenceVariableNo || globalItemData?.globalVariableNo,
              variableValueType: childItem.variableValueType,
              variableNo: foundDefinition?.variableNo,
              valueIsFixed,
              useType: "INPUT"
            }
          })

        // 处理输入参数
        const processInputParams = () =>
          inputParams
            .map((v) => findGlobalData(v) || v)
            .filter(Boolean)
            .map((globalItem, index) => {
              // 历史遗留问题，variableName、variableValueType需要取inputItems对应的值(主要是是script组件)
              const variableName = inputItems[index]?.variableName || globalItem.variableName
              const variableValueType =
                inputItems[index]?.variableType || globalItem.variableValueType || "string"
              const foundDefinition = currentSkillComponentDefinitionsVars?.find(
                (def) => def.variableName === globalItem.displayName
              )

              const isCustomer = typeof globalItem === "string" //固定值
              const valueIsFixed = complexType.includes(variableValueType) ? false : isCustomer
              return {
                useType: "INPUT",
                valueIsFixed,
                valueExpression:
                  globalItem.valueExpression ||
                  globalItem.variableName ||
                  (isCustomer && globalItem),
                description: globalItem.description,
                referenceVariableNo:
                  foundDefinition?.referenceVariableNo || globalItem?.globalVariableNo,
                variableName: variableName || new Date().getTime()?.toString(),
                variableSource: globalItem.variableSource,
                variableValueType,
                variableNo: foundDefinition?.variableNo,
                tag: globalItem.tag,
                sourceTag: item.sourceTag
              }
            })

        const outputsWithChildren = (data, vars) =>
          data.map((outputItem) => {
            outputItem = { ...outputItem }
            const foundDefinition = vars?.find(
              (def) => def.variableName === outputItem.variableName
            )
            if (outputItem.children?.length) {
              outputItem.children = outputsWithChildren(
                outputItem.children,
                foundDefinition?.children
              )
            }

            const isCustomer = !outputItem.valueExpression
            //如果是复杂类型，则不是固定值
            const valueIsFixed = complexType.includes(outputItem.variableValueType)
              ? false
              : isCustomer

            return {
              ...outputItem,
              useType: "OUTPUT",
              valueIsFixed,
              variableValueType: outputItem.variableValueType || "string",
              variableNo: foundDefinition?.variableNo,
              variableSource: outputItem.variableSource,
              valueExpression: outputItem.valueExpression || outputItem?.inputParams,
              referenceVariableNo:
                foundDefinition?.referenceVariableNo || new Date().getTime()?.toString()
            }
          })

        // 处理输出参数
        const processOutputParams = () => {
          const currentSkillComponentDefinitionsVars = skillComponentDefinitionsArr?.find(
            (def) => def.nodeId === item.id
          )?.variableDefinitions

          return outputParams.map((outputItem) => {
            const foundDefinition = currentSkillComponentDefinitionsVars?.find(
              (def) => def.variableName === outputItem.variableName
            )

            const isCustomer = !outputItem.valueExpression
            //如果是复杂类型，则不是固定值
            const valueIsFixed = complexType.includes(outputItem.variableValueType)
              ? false
              : isCustomer
            let outputs = {
              useType: "OUTPUT",
              valueIsFixed,
              variableValueType: outputItem.variableValueType || "string",
              variableName: outputItem.variableName || new Date().getTime()?.toString(),
              description: outputItem.description,
              variableNo: foundDefinition?.variableNo,
              variableSource: outputItem.variableSource,
              valueExpression: outputItem.valueExpression || outputItem?.inputParams,
              referenceVariableNo: foundDefinition?.referenceVariableNo
            }

            // 如果有 children，则递归处理
            if (outputItem.children?.length) {
              outputs.children = outputsWithChildren(outputItem.children, foundDefinition?.children)
            }

            return outputs
          })
        }
        // 如果是 webhook-node，使用 inputsWithglobalData 处理，否则使用 processInputParams
        let inputs =
          name === "webhook-node" || name === "plugin-node" || name === "skill-node"
            ? inputsWithglobalData(inputItems)
            : processInputParams()
        const outputs = processOutputParams()

        // 如果是 prompt-node 则需要过滤出useType为INPUT的参数
        // if (name === "prompt-node") {
        //   inputs = inputs.filter((v) => v.useType !== "INPUT")
        // }

        // 返回处理后的输入和输出参数列表
        let result = [...inputs, ...outputs].filter(Boolean)

        // 如果是 TTS 节点，需要特殊处理音色/音速/音量的变量定义
        if (name === "tts-node") {
          // 先过滤掉可能重复的 INPUT 类型的变量定义
          result = result.filter((variable) => {
            // 保留非 INPUT 类型的变量定义
            if (variable.useType !== "INPUT") return true

            // 如果是 INPUT 类型，检查是否是音色/音速/音量的变量
            const isVoiceVariable =
              item.isVariableVoiceId && item.timbreId && variable.valueExpression === item.timbreId
            const isSpeedVariable =
              item.isVariableSpeed && item.speed && variable.valueExpression === item.speed
            const isVolumeVariable =
              item.isVariableVolume && item.volume && variable.valueExpression === item.volume

            // 如果是音色/音速/音量的变量，过滤掉（后面会重新添加）
            return !(isVoiceVariable || isSpeedVariable || isVolumeVariable)
          })

          // 处理音色变量
          if (item.isVariableVoiceId && item.timbreId) {
            const globalItemData = findGlobalData(item.timbreId)
            if (globalItemData) {
              result.push({
                ...globalItemData,
                useType: "VOICE_ID",
                valueIsFixed: false
              })
            }
          }

          // 处理音频速率变量
          if (item.isVariableSpeed && item.speed) {
            const globalItemData = findGlobalData(item.speed)
            if (globalItemData) {
              result.push({
                ...globalItemData,
                useType: "SPEED",
                valueIsFixed: false
              })
            }
          }

          // 处理音量变量
          if (item.isVariableVolume && item.volume) {
            const globalItemData = findGlobalData(item.volume)
            if (globalItemData) {
              result.push({
                ...globalItemData,
                useType: "VOLUME",
                valueIsFixed: false
              })
            }
          }
        }

        return result
      }

      // 个性化额外信息
      const getExtraInfo = (item) => {
        const { name } = item
        if (name === "prompt-node") {
          let modelList = []
          if (item.enableMultiModel) {
            modelList = [
              ...(item.modelList || []).filter((v) => !!v?.expression),
              {
                modelType: item.modelElse?.modelType,
                reasoningEffort: item.modelElse?.reasoningEffort
              }
            ].map((v, i) => ({
              ...v,
              order: i + 1
            }))
          }
          return {
            modelList,
            modelType: item.modelType,
            reasoningEffort: item.reasoningEffort,
            enableMultiModel: item.enableMultiModel ?? false,
            temperature: item.temperature,
            content: item.content,
            appendReasoning: item.appendReasoning,
            // 高级设置相关字段
            advancedSettingEnable: item.advancedSettingEnable,
            topKEnable: item.topKEnable,
            topK: item.topK,
            topPEnable: item.topPEnable,
            topP: item.topP,
            top_p: item.top_p, // 兼容原有字段
            maxTokenEnable: item.maxTokenEnable,
            maxToken: item.maxToken,
            seedEnable: item.seedEnable,
            seed: item.seed,
            responseFormatEnable: item.responseFormatEnable,
            responseFormat: item.responseFormat,
            // 新增模式相关字段
            promptMode: item.promptMode,
            professionalContents: item.professionalContents,
            script: item.script
          }
        }
        if (name === "multimodal-node") {
          return {
            modelType: item.modelType,
            content: item.content
          }
        }
        if (name === "tool-node") {
          return {
            toolCode: item.toolCode,
            toolConfig: {
              ext: item?.ext,
              headers: item?.headers,
              pictureModelType: item?.pictureModelType
            }
          }
        }
        if (name === "pic-generator-node") {
          return {
            ttiModel: item._extraInfo || item.ttiModel,
            enableSubSetting: !!item._extraInfo,
            isAsyncTask: !!item.isAsyncTask,
            geminiSetting:
              item.ttiModel === "GEMINI_FLASH" || item.ttiModel === "GEMINI_3PRO_IMAGE"
                ? item.geminiSetting
                : undefined,
            subSetting: !item._extraInfo
              ? undefined
              : {
                  ...item.subSetting,
                  model: item.ttiModel
                }
          }
        }
        if (name === "video-generator-node") {
          return {
            generateMode: item.generateMode,
            vividModeConfig: item.vividModeConfig,
            prompt: item.prompt,
            fileUrl: item.fileUrl,
            aspectRatio: item.aspectRatio,
            ...(item.generateMode === "jmFirstTailMode"
              ? {
                  firstTailModeConfig: {
                    ...item.firstTailModeConfig,
                    seed: item.seed,
                    seconds: item.seconds
                  }
                }
              : {
                  seed: item.seed,
                  seconds: item.seconds
                })
          }
        }
        if (name === "end-node") {
          return {
            template: item.template,
            stream: item.stream,
            modelType: item.modelType,
            temperature: item.temperature,
            appendReasoning: item.appendReasoning,
            promptTemplate: item.content,
            reasoningEffort: item.reasoningEffort,
            // 高级设置相关字段
            advancedSettingEnable: item.advancedSettingEnable,
            topKEnable: item.topKEnable,
            topK: item.topK,
            topPEnable: item.topPEnable,
            topP: item.topP,
            top_p: item.top_p, // 兼容原有字段
            maxTokenEnable: item.maxTokenEnable,
            maxToken: item.maxToken,
            seedEnable: item.seedEnable,
            seed: item.seed,
            responseFormatEnable: item.responseFormatEnable,
            responseFormat: item.responseFormat
          }
        }
        if (name === "search-node") {
          return {
            size: item.size,
            exactMatch: item.exactMatch,
            catalogNos: item.catalogNos,
            languageIntelligentDetector: item.languageIntelligentDetector,
            maxStandardQuestionSize: item.maxStandardQuestionSize,
            language: item.language,
            sourceTag: item.sourceTag,
            matchScore: item.matchScore,
            searchMode: item.searchMode,
            catalogSetType: item.catalogSetType || 0,
            appointCatalogNo: item.appointCatalogNo || undefined,
            answerTypes: item.answerTypes,
            includes: item.includes
          }
        }
        if (name === "document-search-node") {
          return {
            size: item.size,
            matchScore: item.matchScore,
            catalogSetType: item.catalogSetType || 0,
            appointCatalogNo: item.appointCatalogNo || undefined,
            catalogNos: item.catalogNos,
            enableRerank: item.enableRerank,
            rerankModel: item.rerankModel
          }
        }
        if (name === "query-dataset-node") {
          return {
            size: item.size,
            structureNo: item.inputData,
            variableList: item.items
          }
        }
        // if (
        //   ["img2-text-node", "asr-node", "identify-language-node"].includes(
        //     name
        //   )
        // ) {
        //   return {
        //     ...preJudgmentSession
        //   }
        // }
        if (name === "webhook-node") {
          return {
            callUrl: item.callUrl,
            httpMethodName: item.httpMethodName,
            retryCount: item.retryCount,
            retryInterval: item.retryInterval,
            readTimeout: item.readTimeout,
            headers: item.headers,
            protocol: item.protocol,
            isAsync: item.isAsync
          }
        }
        if (name === "script-node") {
          return {
            scriptType: item.scriptType,
            script: item.codeContent,
            scriptDesc: item.methodDesc
          }
        }

        if (name === "search-tool-node" || name === "web-search-node") {
          return {
            engine: item.engine
          }
        }
        if (name === "tts-node") {
          return {
            scene: item.scene
          }
        }
        if (name === "agent-node") {
          return {
            agentNo: item.agentNo
          }
        }
        if (name === "plugin-node") {
          return {
            pluginCode: item.pluginCode,
            toolCode: item.toolCode
          }
        }
        if (name === "skill-node") {
          return {
            skillNo: item.skillNo,
            isAsync: item.isAsync,
            batchEnabled: item.batchEnabled,
            parallelEnabled: item.parallelEnabled,
            batchExecuteParams: item.batchExecuteParams,
            concurrency: item.concurrency
          }
        }
      }

      // 处理额外信息公共部分
      const getCommonExtraInfo = (item) => {
        const info = {
          preJudgment: {
            enable: item.enable,
            rule: item.rule
          },
          session: item.session,
          sceneId: item.sceneId,
          timeReturned: item.timeReturned,
          model: item.model,
          hotWordId: item.hotWordId,
          dissociation: item.dissociation,
          recognizeAllChannel: item.recognizeAllChannel,
          voiceId: item.timbreId, //item.voiceId,
          audioFormat: item.audioFormat,
          isVariableVoiceId: item.isVariableVoiceId,
          isVariableSpeed: item.isVariableSpeed,
          isVariableVolume: item.isVariableVolume,
          timbreId: item.timbreId,
          selectSound: item.selectSound,
          sampleRate: item.sampleRate,
          speed: item.speed,
          volume: item.volume,

          postJudgment: {
            enable: item.postJudgEnable,
            rule: item.postJudgRule
          },
          delSessionKeySetUpList: item.delSessionKeySetUpList,
          bottomConfig: {
            enable: item.bottomConfigEnable,
            rules: item.rules
          },
          outputMode: item.outputMode,
          ocrModel: item.ocrModel
        }
        return info
      }

      // 流程节点定义
      const flowNodeDefinitions = nodes?.map((item) => ({
        nodeType: customNodesMap?.[item.name]?.nodeType,
        nodeClassification: customNodesMap?.[item.name]?.nodeClassification,
        nodeId: item.id,
        nodeConfig: item.name === "condition-node" ? { expressions: item.expressions } : undefined,
        nodeNo: flowNodeDefinitionsArr?.find((v) => v.nodeId === item.id)?.nodeNo,
        nodeName: item.label
      }))

      // 业务组件定义元数据
      const skillComponentDefinitions = nodes
        ?.filter((item) => !excludeNodes.includes(item.name))
        .map((item) => {
          // console.log(
          //   "transformVariableDefinitions(item)",
          //   item,
          //   skillComponentDefinitionsArr?.find((v) => v.nodeId === item.id)?.bizNo,
          //   transformVariableDefinitions(item)
          // )
          return {
            componentName: item.label || item.componentName,
            componentNo: skillComponentDefinitionsArr?.find((v) => v.nodeId === item.id)
              ?.componentNo,
            nodeId: item.id,
            outputName: item.outputName,
            outputType:
              item.name === "prompt-node" ||
              item.name === "script-node" ||
              item.name === "multimodal-node" ||
              item.name === "skill-node"
                ? item.parseMethod
                : item.name === "JSON_ARRAY"
                  ? item.outputType
                  : item.outputType,
            extraInfo: { ...getCommonExtraInfo(item), ...getExtraInfo(item) },
            bizNo: skillComponentDefinitionsArr?.find((v) => v.nodeId === item.id)?.bizNo,
            variableDefinitions:
              item.name === "skill-node" && item.parseMethod === "PLAIN_TEXT" // 工作流组件输出参数单独处理逻辑
                ? transformVariableDefinitions(item)?.filter((p) => {
                    if (
                      (p?.valueExpression &&
                        p?.valueExpression?.length &&
                        p.useType !== "OUTPUT") ||
                      (p?.children && p?.children?.length > 0)
                    ) {
                      return p
                    }
                  })
                : item.name === "tts-node"
                  ? transformVariableDefinitions(item)?.filter((p) => {
                      if (
                        (p?.valueExpression && p?.valueExpression?.length) ||
                        p.useType === "OUTPUT" ||
                        (p?.children && p?.children?.length > 0)
                      ) {
                        return p
                      }
                    })
                  : transformVariableDefinitions(item)?.filter((p) => {
                      if (
                        (p?.valueExpression && p?.valueExpression?.length) ||
                        p.useType === "OUTPUT" ||
                        (p?.children && p?.children?.length > 0)
                      ) {
                        return p
                      }
                    })
          }
        })

      const params = {
        releaseStatus: skillFlowData.releaseStatus,
        versionNo: skillFlowData.versionNo,
        botNo: skillFlowData.botNo,
        skillNo: skillFlowData.skillNo,
        versionName: skillFlowData.versionName, //版本名,后续会替换
        skillComponentDefinitions,
        flowDefinition: {
          graph: {
            edges,
            nodes
          },
          flowNo: skillFlowData?.flowDefinition?.flowNo,
          flowNodeDefinitions
        },
        formControlDefinitions: formControlDefinitions
          ? formControlDefinitions.inputParams
          : skillFlowData.formControlDefinitions
      }

      saveSkill(params, {
        onSuccess: (e) => {
          console.log(e)
          if (e.success) {
            if (!noMessage) {
              message.success("保存成功")
            }
            if (e.data) {
              changeSkillFlowData(e.data)
              queryClient.invalidateQueries([QUERY_KEYS.GLOBAL_VARIABLE])

              setTimeout(() => {
                console.log(callback)
                callback && callback()
              }, 100)
            }

            // queryClient.invalidateQueries([QUERY_KEYS.LATEST_DEFINITION])

            //只有草稿状态才会更新最新版本
            if (skillFlowData?.releaseStatus !== "draft") {
              queryClient.invalidateQueries([QUERY_KEYS.LATEST_DEFINITION])
            }
          } else {
            if (isStudio()) {
              callback && callback()
            } else {
              message.error(e.message)
            }
          }
        }
      })
    },
    [skillFlowData, saveSkill, changeSkillFlowData, queryClient]
  )

  // useEffect(() => {
  //   console.log(skillFlowData, "skillFlowData")
  //   if (skillFlowData) {
  //     changeHandleSave(handleSave)
  //   }
  //   return () => changeHandleSave(null)
  // }, [changeHandleSave, handleSave, skillFlowData])

  return {
    // currentSkill,
    // currentSkillProcessData,
    changeSkillFlowData,
    skillFlowData,
    saveSkill,
    handleSave,
    isLoading
  }
}
