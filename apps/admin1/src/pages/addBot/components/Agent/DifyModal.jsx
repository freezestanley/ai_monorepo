import { Modal, Carousel } from "antd"
import "./DifyModal.scss"
import dify from "@/assets/img/dify2.png"
import bg from "@/assets/img/difyModalBg.png"
import round from "@/assets/img/difyModalRound.png"
import logo from "@/assets/img/logo.png"
import { MessageType } from "@/constants/postMessageType"

const DifyModal = ({ visible, onClickTryDify, onClose }) => {
  // 轮播图配置
  const backgroundImages = [bg]
  const carouselSettings = {
    autoplay: true,
    autoplaySpeed: 3000,
    dots: backgroundImages.length > 1 ? true : false,
    dotPosition: "bottom"
  }

  const handleDifyClick = () => {
    // 向父窗口发送消息，请求导航到工作流列表页面
    window.parent.postMessage(
      {
        type: MessageType.NAVIGATE_TO_PROMPT,
        payload: {}
      },
      "*"
    )
    if (onClickTryDify) onClickTryDify()
  }
  return (
    <Modal open={visible} footer={null} width={810} className="dify-modal" closable={false}>
      <div className="h-[390px] relative">
        {/* 轮播图背景 */}
        <Carousel {...carouselSettings} className="h-full">
          {backgroundImages.map((image, index) => (
            <div key={index}>
              <div
                className="h-[390px] bg-cover bg-center bg-no-repeat w-full rounded-t-[20px]"
                style={{ backgroundImage: `url(${image})` }}
              />
            </div>
          ))}
        </Carousel>
        {/*内容 */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="flex justify-between pt-[27px] ml-[-10px] ">
            <img
              src={dify}
              className="w-[96px] h-[54px] px-[10px] py-[8px] rounded-tr-[8px] rounded-br-[8px] bg-white"
            ></img>
            <div className="text-[18px] text-gray-100 mr-[40px] cursor-pointer " onClick={onClose}>
              关闭
            </div>
          </div>
          <div className="flex justify-between">
            <div className="ml-[100px] mt-[45px]">
              <div className="text-[50px] text-gray-100">灵犀+Dify</div>
              <div className="text-[20px] text-[#70fbb2]">工作流升级，工作流无限可能，</div>
              <div className="text-[20px] text-[#70fbb2]">让AI创造超越想象</div>
              <div className="text-[16px] text-[#5c90f2] leading-[32px] tracking-[1px]">
                创建dify工作流.即刻体验
              </div>
            </div>
            <img src={round} className="w-[320px] h-[320px] mr-[45px] mt-[-30px] "></img>
          </div>
        </div>
      </div>
      {/*底部 */}
      <div className="flex justify-between h-[86px] items-center">
        <img src={logo} className="ml-[20px] mt-[5px]"></img>
        <div
          className="w-[310px] h-[54px] mr-[20px] bg-[#3e3060] hover:bg-[#56437c] text-white rounded-[27px] flex items-center justify-center cursor-pointer shadow-[0_0_6px_rgba(0,0,0,0.8)] "
          style={{
            outline: "3px solid white",
            outlineOffset: "-3px"
          }}
          onClick={handleDifyClick}
        >
          <div className="text-[22px] font-bold ">立刻体验Dify</div>
        </div>
      </div>
    </Modal>
  )
}

export default DifyModal
