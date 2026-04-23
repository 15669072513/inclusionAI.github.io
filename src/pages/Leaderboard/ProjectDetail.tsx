import React, { useState, useEffect } from "react";
import { DatePicker, ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import styles from "../research.module.css";

// 设置 Day.js 使用中文
dayjs.locale("zh-cn");

// 项目详情数据接口
interface ProjectDetailData {
  name: string;
  logo: string;
  description: string;
  org: string;
  country: string;
  currentOpenrank: number;
  prevOpenrank: number;
  currentParticipants: number;
  prevParticipants: number;
  currentActivity: number;
  prevActivity: number;
  openness: number;
  impact: number;
  totalScore: number;
  rankHistory: { date: string; openrank: number }[];
  contributors: { rank: number; name: string; platform: string; openrank: number; change: number }[];
}

function getMockProjectData(projectName: string): ProjectDetailData {
  const projectData: { [key: string]: ProjectDetailData } = {
    "TensorFlow": {
      name: "TensorFlow",
      logo: "https://www.gstatic.com/images/branding/product/2x/tensorflow_2020q4_48dp.png",
      description: "An end-to-end open source machine learning platform",
      org: "Google",
      country: "US",
      currentOpenrank: 1,
      prevOpenrank: 2,
      currentParticipants: 3250,
      prevParticipants: 3100,
      currentActivity: 98,
      prevActivity: 95,
      openness: 95,
      impact: 99,
      totalScore: 97.5,
      rankHistory: [
        { date: "2025-12", openrank: 85.2 },
        { date: "2026-01", openrank: 88.1 },
        { date: "2026-02", openrank: 90.5 },
        { date: "2026-03", openrank: 92.3 },
      ],
      contributors: [
        { rank: 1, name: "tensorflow_dev", platform: "G", openrank: 45.2, change: 2.1 },
        { rank: 2, name: "ml_expert", platform: "G", openrank: 38.7, change: -1.2 },
        { rank: 3, name: "ai_researcher", platform: "G", openrank: 35.4, change: 0.5 },
      ],
    },
    "PyTorch": {
      name: "PyTorch",
      logo: "https://pytorch.org/assets/images/pytorch-logo.png",
      description: "An open source machine learning framework",
      org: "Meta",
      country: "US",
      currentOpenrank: 2,
      prevOpenrank: 1,
      currentParticipants: 2800,
      prevParticipants: 2650,
      currentActivity: 96,
      prevActivity: 94,
      openness: 92,
      impact: 98,
      totalScore: 95.2,
      rankHistory: [
        { date: "2025-12", openrank: 82.1 },
        { date: "2026-01", openrank: 84.5 },
        { date: "2026-02", openrank: 87.2 },
        { date: "2026-03", openrank: 89.8 },
      ],
      contributors: [
        { rank: 1, name: "pytorch_team", platform: "G", openrank: 42.1, change: 1.5 },
        { rank: 2, name: "deeplearning_dev", platform: "G", openrank: 36.8, change: 0.8 },
        { rank: 3, name: "meta_ai", platform: "G", openrank: 34.2, change: -0.3 },
      ],
    },
  };

  return projectData[projectName] || {
    name: projectName,
    logo: `https://via.placeholder.com/80?text=${projectName.charAt(0)}`,
    description: "Project description",
    org: "Unknown",
    country: "US",
    currentOpenrank: 10,
    prevOpenrank: 12,
    currentParticipants: 1500,
    prevParticipants: 1400,
    currentActivity: 85,
    prevActivity: 82,
    openness: 88,
    impact: 86,
    totalScore: 86.2,
    rankHistory: [
      { date: "2025-12", openrank: 70.5 },
      { date: "2026-01", openrank: 72.3 },
      { date: "2026-02", openrank: 75.1 },
      { date: "2026-03", openrank: 78.2 },
    ],
    contributors: [
      { rank: 1, name: "developer_1", platform: "G", openrank: 25.3, change: 1.2 },
      { rank: 2, name: "developer_2", platform: "G", openrank: 22.1, change: -0.5 },
      { rank: 3, name: "developer_3", platform: "G", openrank: 19.8, change: 0.3 },
    ],
  };
}

// 排名变化指示器
function RankChange({ current, previous }: { current: number; previous: number }) {
  const diff = previous - current;
  if (diff === 0) {
    return <span className={styles.rankNoChange}>-</span>;
  }
  const isUp = diff > 0;
  return (
    <span className={`${styles.rankChange} ${isUp ? styles.rankUp : styles.rankDown}`}>
      {isUp ? "↑" : "↓"} {Math.abs(diff)}
    </span>
  );
}

export default function ProjectDetail({ projectName, onBack }: { projectName: string; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("03");

  useEffect(() => {
    if (projectName) {
      setLoading(true);
      setTimeout(() => {
        setData(getMockProjectData(projectName));
        setLoading(false);
      }, 300);
    }
  }, [projectName]);

  const handleBack = () => {
    onBack();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <p>加载中...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.errorContainer}>
        <p>未找到项目数据</p>
        <button onClick={handleBack} className={styles.backButton}>返回</button>
      </div>
    );
  }

  return (
    <div className={styles.projectDetailContainer}>
      <button className={styles.backButton} onClick={handleBack}>
        ← 返回 Leaderboard
      </button>

      <div className={styles.projectHeader}>
        <img src={data.logo} alt={data.name} className={styles.projectDetailLogo} />
        <div className={styles.projectDetailInfo}>
          <h1 className={styles.projectDetailTitle}>{data.name}</h1>
          <p className={styles.projectDetailDesc}>{data.description}</p>
          <div className={styles.projectMeta}>
            <span className={styles.orgTag}>{data.org}</span>
            <span className={styles.countryTag}>{data.country}</span>
          </div>
        </div>
      </div>

      <div className={styles.dateSelector}>
        <ConfigProvider
          locale={zhCN}
          theme={{ token: { fontSize: 16 } }}
        >
          <DatePicker
            value={dayjs(`${selectedYear}-${selectedMonth}`, "YYYY-MM")}
            format="YYYY/MM"
            picker="month"
            onChange={(date) => {
              if (date) {
                setSelectedYear(String(date.year()));
                setSelectedMonth(String(date.month() + 1).padStart(2, "0"));
              }
            }}
            allowClear={false}
            style={{ width: '180px', height: '42px' }}
          />
        </ConfigProvider>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>OpenRank 影响力</div>
          <div className={styles.statValue}>{data.currentOpenrank}</div>
          <div className={`${styles.statChange} ${data.currentOpenrank >= data.prevOpenrank ? styles.statChangeUp : styles.statChangeDown}`}>
            {data.currentOpenrank >= data.prevOpenrank ? "↑" : "↓"} {Math.abs(data.currentOpenrank - data.prevOpenrank)}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>活跃度</div>
          <div className={styles.statValue}>{data.currentActivity}<span className={styles.statUnit}>%</span></div>
          <div className={`${styles.statChange} ${data.currentActivity >= data.prevActivity ? styles.statChangeUp : styles.statChangeDown}`}>
            {data.currentActivity >= data.prevActivity ? "↑" : "↓"} {Math.abs(data.currentActivity - data.prevActivity)}%
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>开发者数量</div>
          <div className={styles.statValue}>{data.currentParticipants.toLocaleString()}</div>
          <div className={`${styles.statChange} ${data.currentParticipants >= data.prevParticipants ? styles.statChangeUp : styles.statChangeDown}`}>
            {data.currentParticipants >= data.prevParticipants ? "↑" : "↓"} {Math.abs(data.currentParticipants - data.prevParticipants).toLocaleString()}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>开放度</div>
          <div className={styles.statValue}>{data.openness}<span className={styles.statUnit}>%</span></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>影响力</div>
          <div className={styles.statValue}>{data.impact}<span className={styles.statUnit}>%</span></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>总评分</div>
          <div className={styles.statValue}>{data.totalScore}</div>
        </div>
      </div>

      {/* 历史趋势图表 */}
      <div className={styles.trendChart}>
        <div className={styles.trendChartTitle}>OpenRank 历史趋势</div>
        <div className={styles.trendChartContainer}>
          <div className={styles.trendChartYAxis}>
            <span>{Math.max(...data.rankHistory.map(d => d.openrank))}</span>
            <span>{((Math.max(...data.rankHistory.map(d => d.openrank)) + Math.min(...data.rankHistory.map(d => d.openrank))) / 2).toFixed(1)}</span>
            <span>{Math.min(...data.rankHistory.map(d => d.openrank))}</span>
          </div>
          <div className={styles.trendChartArea}>
            {data.rankHistory.map((item, index) => {
              const maxValue = Math.max(...data.rankHistory.map(d => d.openrank));
              const minValue = Math.min(...data.rankHistory.map(d => d.openrank));
              const range = maxValue - minValue || 1;
              const height = ((item.openrank - minValue) / range) * 100;
              const left = (index / (data.rankHistory.length - 1)) * 100;
              return (
                <div
                  key={item.date}
                  className={styles.trendChartDot}
                  style={{ left: `${left}%`, bottom: `${height}%` }}
                >
                  <div className={styles.trendChartTooltip}>{item.date}: {item.openrank}</div>
                </div>
              );
            })}
            <svg className={styles.trendChartLine} viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points={data.rankHistory.map((item, index) => {
                  const maxValue = Math.max(...data.rankHistory.map(d => d.openrank));
                  const minValue = Math.min(...data.rankHistory.map(d => d.openrank));
                  const range = maxValue - minValue || 1;
                  const x = (index / (data.rankHistory.length - 1)) * 100;
                  const y = 100 - ((item.openrank - minValue) / range) * 100;
                  return `${x},${y}`;
                }).join(" ")}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          <div className={styles.trendChartXAxis}>
            {data.rankHistory.map(item => (
              <span key={item.date}>{item.date}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 贡献者表格 */}
      <div className={styles.contributorsSection}>
        <h3 className={styles.sectionTitle}>社区贡献者排名</h3>
        <table className={styles.contributorsTable}>
          <thead>
            <tr>
              <th>排名</th>
              <th>平台</th>
              <th>用户名</th>
              <th>OpenRank</th>
              <th>变化</th>
            </tr>
          </thead>
          <tbody>
            {data.contributors.map((contributor) => (
              <tr key={contributor.rank}>
                <td>{contributor.rank}</td>
                <td><span className={styles.platformBadge}>{contributor.platform === "G" ? "GitHub" : contributor.platform}</span></td>
                <td className={styles.contributorName}>{contributor.name}</td>
                <td className={styles.contributorOpenrank}>{contributor.openrank}</td>
                <td>
                  <RankChange
                    current={contributor.openrank}
                    previous={contributor.openrank - contributor.change}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
