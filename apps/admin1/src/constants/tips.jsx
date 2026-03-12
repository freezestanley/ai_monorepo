// @ts-nocheck
export const TemplateToolTip = () => {
  return (
    <div className="tips-wrapper" style={{ maxHeight: 500, overflowY: "scroll" }}>
      <strong>freemark语法：</strong>
      <div>
        <div>1. 插值: {`$${"{value}"}`}</div>
        <div>
          2. 条件:
          <ul>
            <li>等于: {`<#if variable == "value">`}</li>
            <li>不等于: {`<#if variable != "value">`}</li>
            <li>
              大于/小于: {`<#if (number > 10) >`} 或 {`<#if (number < 5)>`}
            </li>
            <li>
              逻辑与/或: {`<#if condition1 && condition2>`} 或 {`<#if condition1 || condition2>`}
            </li>
            <li>逻辑非: {`<#if !condition>`}</li>
            <li>
              存在性: {`<#if variable??>`} 或 {`<#if variable?has_content>`}
            </li>
          </ul>
        </div>
        <div>3. 循环: {`<#list items as item> $${"{item}"} </#list>`}</div>
        <div>4. 赋值: {`<#assign newVar="Value">`}</div>
        <div>5. 转义: {`\\$${"{...}"}`}</div>
        <div>
          6. 内建函数:
          <ul>
            <li>转大写: {`$${"{value?upper_case}"}`}</li>
            <li>转小写: {`$${"{value?lower_case}"}`}</li>
            <li>判断是否字符串: {`$${"{value?is_string}"}`}</li>
            <li>判断是否数字: {`$${"{value?is_number}"}`}</li>
            <li>获取字符串长度: {`$${"{value?length}"}`}</li>
            <li>去除空白: {`$${"{value?trim}"}`}</li>
          </ul>
        </div>
        <div>7. 注释: {`<#-- Comment -->`}</div>
      </div>
      <br />
      <strong>markdown格式提示：</strong>
      <div>
        <div>1. 标题：使用 `#` 到 `######` 来创建从一级到六级标题。</div>
        <div>
          2. 强调:
          <ul>
            <li>斜体：*斜体* 或 _斜体_</li>
            <li>粗体：**粗体** 或 __粗体__</li>
            <li>粗斜体：**_粗斜体_** 或 __*粗斜体*__</li>
          </ul>
        </div>
        <div>
          3. 列表:
          <ul>
            <li>无序列表使用 `*` 或 `-`</li>
            <li>有序列表使用 `1.`、`2.` 等</li>
          </ul>
        </div>
        <div>
          4. 链接与图片:
          <ul>
            <li>链接：[链接名](URL)</li>
            <li>图片：![替代文本](图片URL)</li>
          </ul>
        </div>
        <div>
          5. 代码：
          <ul>
            <li>内联代码使用反引号</li>
            <li>代码块使用三个反引号，可指定语言。</li>
          </ul>
        </div>
        <div>6. 引用：使用 `{">"}` 符号。</div>
        <div>7. 水平线：使用三个 `-`。</div>
        <div>
          8. 表格：
          <br />
          | 表头1 | 表头2 |<br />
          |-------|-------|
          <br />
          | 内容1 | 内容2 |<br />
        </div>
      </div>
    </div>
  )
}

export const PromptTips = () => {
  return (
    <div className="tips-wrapper">
      <div>
        提示词尽量说明任务目标、规则、输出内容格式，输入项以 ${"字段名"}{" "}
        的格式编写（可在变量管理中查看）要编写清晰的指令，请遵值以下策略：
      </div>
      <div>1.提供明确的说明，避免模糊或含糊不清的表述。</div>
      <div>2.在查询中包含关键细节以获得更相关的答案。</div>
      <div>3.使用分隔符来明确表示输入的不同部分。</div>
      <div>4.提供完成任务所需的具体步骤。</div>
      <div>5. 提供示例以指导期望的结果。</div>
      <div>6.指定所需输出的长度。</div>
      <div>例如：</div>
      <div>
        假设你是一个保险行业营销专家，请按照以下规则，并根据我给的要点${"{inputs_keypoints}"}
        写出营销文案
      </div>
      <div>规则：</div>
      <div>1.突出重点，每次只集中一个方向</div>
      <div>2.控制在100字以内</div>
      <div>按以下格式输出：</div>
      <div>文案内容：</div>

      <div>注意：</div>
      <div>1. 提示词里的变量使用需遵循freemarker语法。</div>
      <div>
        2.
        如果使用的变量是个复杂类型（如json或array），在使用时请使用toJson函数转换，其他类型可直接使用。
        示例：如果inputs_keypoints在变量管理中显示的类型是json或者array，则在上述示例提示词中使用该变量时，书写方式
      </div>
      <div>
        假设你是一个保险行业营销专家，请按照以下规则，并根据我给的要点{" "}
        {"${ toJson(inputs_keypoints) }"}
        写出营销文案
      </div>
    </div>
  )
}

export const TestAssertPromptPlaceholder =
  "你的任务是验证实际结果是否符合预期结果。预期结果可以是真实的结果，也可以是预期的规则。如果实际结果与预期结果的相似度达到90％，或者实际结果符合预期规则，那么可以认为实际结果符合预期。"
export const TestAssertPromptTips = () => {
  return (
    <div className="tips-wrapper">
      如果不填写，服务端会默认使用以下文案：
      <div>{TestAssertPromptPlaceholder}</div>
    </div>
  )
}
