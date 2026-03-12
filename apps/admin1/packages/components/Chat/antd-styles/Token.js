export const Token = {
  // Seed Token，影响范围大
  colorPrimary: "#5D5FEF", // 主题色
  lightColorPrimary: "#f9f5ff", // 次级主题（浅色）
  grayBgColor: "#FCFCFD", // 灰色背景
  borderRadius: 8, // 默认圆角
  borderDefalut: "1px solid #E4E7EC", // 默认线
  bgLight: "#F9F5FF", // 亮色背景
  inputTextColor: "#98a2b3", // 表单字体颜色
  placeholderTextColor: "#98a2b3", // placehoder 字体颜色

  // antd 独立覆盖 theme写入
  provider: {
    colorPrimary: "#5D5FEF",
    borderRadius: 8,
    colorBgContainerDisabled: "#F5F7FA", // 禁止背景色
    colorTextDisabled: "#98A2B3", // 禁用状态字体颜色
    colorTextPlaceholder: "#98A2B3", //占位字体颜色
    // From 表单定制
    Form: {
      labelColor: "#181B25",
      labelFontSize: "14px",
      itemMarginBottom: 16,
      verticalLabelPadding: "0 0 4px"
    },
    Input: {
      paddingBlock: 6,
      paddingInline: 8
    }
  },
  // 扩展
  extensive: {
    textDarkPrimary: "#181B25",
    bgWhite: "#fff",
    white: "#fff"
  },
  // 按钮独立设置
  button: {
    default: {
      height: "36px",
      padding: "6px 16px"
    },
    small: {
      height: "24px",
      padding: "6px 16px"
    },
    large: {
      height: "44px",
      padding: "12px 16px"
    }
  },
  // 表单独立
  form: {
    inputHeight: "36px"
  },
  //开关
  Switch: {
    handleSizeSM: 12,
    trackHeightSM: 16,
    trackMinWidthSM: 28
  },
  Steps: {
    iconSizeSM: 16
  }
}
