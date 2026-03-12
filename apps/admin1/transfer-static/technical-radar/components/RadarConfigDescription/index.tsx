import { FC, useEffect, useState } from "react"
import {
  AppstoreOutlined,
  GlobalOutlined,
  CodeOutlined,
  ClusterOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  SearchOutlined,
  StopOutlined,
  AimOutlined
} from "@ant-design/icons"
import {
  queryTechnicalRadarQuadrant,
  queryTechnicalRadarRing
} from "../../../services/technicalRadar"
import styles from "./index.module.scss"

const RadarConfigDescription: FC = () => {
  const [quadrants, setQuadrants] = useState<any[]>([])
  const [rings, setRings] = useState<any[]>([])

  const staticQuadrants = [
    {
      key: "1",
      defaultTitle: "infrastructure",
      icon: <ClusterOutlined />,
      color: "#EF4444",
      bgColor: "#FEF2F2"
    },
    {
      key: "2",
      defaultTitle: "model_and_agents",
      icon: <AppstoreOutlined />,
      color: "#3B82F6",
      bgColor: "#EFF6FF"
    },
    {
      key: "3",
      defaultTitle: "frameworks",
      icon: <GlobalOutlined />,
      color: "#10B981",
      bgColor: "#ECFDF5"
    },
    {
      key: "4",
      defaultTitle: "techniques",
      icon: <CodeOutlined />,
      color: "#F59E0B",
      bgColor: "#FFFBEB"
    }
  ]

  const staticRings = [
    {
      key: "adopt",
      defaultTitle: "adopt",
      icon: <CheckCircleOutlined />,
      color: "#6eb7a1", // Green
      titleColor: "#1f6d57",
      bgColor: "#f2fcf9"
    },
    {
      key: "trial",
      defaultTitle: "trial",
      icon: <ExperimentOutlined />,
      color: "#7e98e9", // Blue
      titleColor: "#3453b7",
      bgColor: "#f4f8ff"
    },
    {
      key: "assess",
      defaultTitle: "assess",
      icon: <SearchOutlined />,
      color: "#da8d71", // Orange
      titleColor: "#9a3111",
      bgColor: "#fbf9f6"
    },
    {
      key: "hold",
      defaultTitle: "hold",
      icon: <StopOutlined />,
      color: "#dfa5a5", // Red
      titleColor: "#b46952",
      bgColor: "#fcf7f8"
    }
  ]

  useEffect(() => {
    getQuadrants()
    getRings()
  }, [])

  /** 获取象限定义 */
  const getQuadrants = async () => {
    try {
      const res = await queryTechnicalRadarQuadrant()
      if (Array.isArray(res) && res?.length > 0) {
        const quadrants = staticQuadrants.map((item) => {
          const apiData = res?.find(
            (q: { quadrantKey: string }) => String(q.quadrantKey) === item.defaultTitle
          )
          return {
            ...item,
            title: apiData?.name || item.defaultTitle,
            desc: apiData?.description || "--",
            example: apiData?.quadrantCase ?? "--"
          }
        })
        setQuadrants(quadrants || [])
      } else {
        setQuadrants(
          staticQuadrants.map((item) => ({
            ...item,
            title: item.defaultTitle,
            desc: "--",
            example: "--"
          }))
        )
      }
    } catch (error) {
      console.error("获取象限定义失败", error)
      setQuadrants(
        staticQuadrants.map((item) => ({
          ...item,
          title: item.defaultTitle,
          desc: "--",
          example: "--"
        }))
      )
    }
  }

  /** 获取环定义 */
  const getRings = async () => {
    try {
      const res = await queryTechnicalRadarRing()
      if (Array.isArray(res) && res?.length > 0) {
        const rings = staticRings.map((item) => {
          const apiData = res.find((r: { ringKey: string }) => r.ringKey === item.key)
          return {
            ...item,
            title: apiData?.name || item.defaultTitle,
            desc1: apiData.keyWord,
            desc2: apiData?.description
          }
        })
        setRings(rings)
      } else {
        setRings(
          staticRings.map((item) => ({
            ...item,
            title: item.defaultTitle,
            desc1: "--",
            desc2: "--"
          }))
        )
      }
    } catch (error) {
      console.error("获取环定义失败", error)
      setRings(
        staticRings.map((item) => ({
          ...item,
          title: item.defaultTitle,
          desc1: "--",
          desc2: "--"
        }))
      )
    }
  }

  return (
    <div className={styles.container}>
      {/* 象限定义 (Quadrants) */}
      <div className={styles.section}>
        <div className={styles.header}>
          <AppstoreOutlined className={styles.icon} />
          <h3>象限定义 (Quadrants)</h3>
        </div>

        <div className={styles.grid}>
          {quadrants.map((item) => (
            <div key={item.key} className={styles.card}>
              <div className={styles.leftBar} style={{ backgroundColor: item.color }} />

              <div className={styles.cardHeader}>
                <div
                  className={styles.iconWrapper}
                  style={{
                    color: item.color,
                    backgroundColor: item.bgColor
                  }}
                >
                  {item.icon}
                </div>
                <h4>{item.title}</h4>
              </div>

              <div className={styles.cardContent}>
                <p>{item.desc}</p>
                <p className={styles.example}>{item.example}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 环定义 (Rings) */}
      <div className={styles.section}>
        <div className={styles.header}>
          <AimOutlined className={styles.icon} />
          <h3>环定义 (Rings)</h3>
        </div>

        <div className={styles.grid}>
          {rings.map((item) => (
            <div
              key={item.key}
              className={`${styles.card} ${styles.ringCard}`}
              style={{
                backgroundColor: item.bgColor,
                borderLeft: `4px solid ${item.color}`,
                borderColor: item.bgColor
              }}
            >
              <div className={styles.cardHeader}>
                <div
                  className={styles.iconWrapper}
                  style={{
                    color: item.color,
                    padding: 0,
                    width: "auto",
                    height: "auto",
                    fontSize: 20
                  }}
                >
                  {item.icon}
                </div>
                <h4 style={{ color: item.titleColor }}>{item.title}</h4>
              </div>

              <div className={styles.cardContent}>
                <p
                  style={{
                    fontWeight: 500,
                    marginBottom: 4,
                    color: item.color
                  }}
                >
                  {item.desc1}
                </p>
                <p
                  style={{
                    color: item.color,
                    opacity: 1
                  }}
                >
                  {item.desc2}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RadarConfigDescription
