import React, { useState, useEffect } from "react";
import { DatePicker, ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import clsx from "clsx";
import styles from "../research.module.css";
import UserDetail from "./UserDetail";

// 设置 Day.js 使用中文
dayjs.locale("zh-cn");

// 项目详情数据接口
interface ProjectDetailData {
  name: string;
  logo: string;
  description: string;
  org: string;
  country: string;
  tags: string[];
  website: string;
  currentOpenrank: number;
  prevOpenrank: number;
  currentParticipants: number;
  prevParticipants: number;
  currentActivity: number;
  prevActivity: number;
  openness: number;
  impact: number;
  totalScore: number;
  // 历史数据
  openrankHistory: { date: string; value: number }[];
  activityHistory: { date: string; value: number }[];
  participantsHistory: { date: string; value: number }[];
  issueCountHistory: { date: string; value: number }[];
  // 贡献者
  contributors: { rank: number; prevRank: number; name: string; platform: string; avatar: string; openrank: number; change: number; profileUrl: string }[];
}

// 生成历史数据
function generateHistoryData(baseValue: number, months: number, variance: number): { date: string; value: number }[] {
  const data = [];
  let value = baseValue * 0.8;
  const now = dayjs();
  for (let i = months - 1; i >= 0; i--) {
    const date = now.subtract(i, 'month').format('YYYY-MM');
    value = value + (Math.random() - 0.4) * variance;
    value = Math.max(baseValue * 0.5, Math.min(baseValue * 1.2, value));
    data.push({ date, value: Math.round(value * 10) / 10 });
  }
  return data;
}

function getMockProjectData(projectName: string): ProjectDetailData {
  const projectData: { [key: string]: ProjectDetailData } = {
    "TensorFlow": {
      name: "TensorFlow",
      logo: "https://www.gstatic.com/images/branding/product/2x/tensorflow_2020q4_48dp.png",
      description: "An end-to-end open source machine learning platform",
      org: "Google",
      country: "US",
      tags: ["Machine Learning", "Deep Learning", "AI"],
      website: "https://tensorflow.org",
      currentOpenrank: 1,
      prevOpenrank: 2,
      currentParticipants: 3250,
      prevParticipants: 3100,
      currentActivity: 98,
      prevActivity: 95,
      openness: 95,
      impact: 99,
      totalScore: 97.5,
      openrankHistory: [
        { date: "2025-01", value: 85.2 },
        { date: "2025-02", value: 86.5 },
        { date: "2025-03", value: 88.1 },
        { date: "2025-04", value: 87.3 },
        { date: "2025-05", value: 89.2 },
        { date: "2025-06", value: 90.5 },
        { date: "2025-07", value: 91.2 },
        { date: "2025-08", value: 90.8 },
        { date: "2025-09", value: 92.1 },
        { date: "2025-10", value: 91.5 },
        { date: "2025-11", value: 93.2 },
        { date: "2025-12", value: 92.8 },
        { date: "2026-01", value: 94.1 },
        { date: "2026-02", value: 95.3 },
        { date: "2026-03", value: 96.2 },
      ],
      activityHistory: [
        { date: "2025-01", value: 85 },
        { date: "2025-02", value: 86 },
        { date: "2025-03", value: 88 },
        { date: "2025-04", value: 87 },
        { date: "2025-05", value: 89 },
        { date: "2025-06", value: 90 },
        { date: "2025-07", value: 91 },
        { date: "2025-08", value: 90 },
        { date: "2025-09", value: 92 },
        { date: "2025-10", value: 91 },
        { date: "2025-11", value: 93 },
        { date: "2025-12", value: 95 },
        { date: "2026-01", value: 96 },
        { date: "2026-02", value: 97 },
        { date: "2026-03", value: 98 },
      ],
      participantsHistory: [
        { date: "2025-01", value: 2800 },
        { date: "2025-02", value: 2850 },
        { date: "2025-03", value: 2900 },
        { date: "2025-04", value: 2950 },
        { date: "2025-05", value: 3000 },
        { date: "2025-06", value: 3050 },
        { date: "2025-07", value: 3100 },
        { date: "2025-08", value: 3080 },
        { date: "2025-09", value: 3120 },
        { date: "2025-10", value: 3150 },
        { date: "2025-11", value: 3180 },
        { date: "2025-12", value: 3200 },
        { date: "2026-01", value: 3220 },
        { date: "2026-02", value: 3240 },
        { date: "2026-03", value: 3250 },
      ],
      issueCountHistory: [
        { date: "2025-01", value: 450 },
        { date: "2025-02", value: 480 },
        { date: "2025-03", value: 520 },
        { date: "2025-04", value: 490 },
        { date: "2025-05", value: 530 },
        { date: "2025-06", value: 550 },
        { date: "2025-07", value: 580 },
        { date: "2025-08", value: 560 },
        { date: "2025-09", value: 590 },
        { date: "2025-10", value: 610 },
        { date: "2025-11", value: 640 },
        { date: "2025-12", value: 620 },
        { date: "2026-01", value: 650 },
        { date: "2026-02", value: 680 },
        { date: "2026-03", value: 720 },
      ],
      contributors: [
        { rank: 1, prevRank: 3, name: "tensorflow_dev", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/1?v=4", openrank: 45.2, change: 2.1, profileUrl: "https://github.com/tensorflow" },
        { rank: 2, prevRank: 1, name: "ml_expert", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/2?v=4", openrank: 38.7, change: -1.2, profileUrl: "https://github.com" },
        { rank: 3, prevRank: 2, name: "ai_researcher", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/3?v=4", openrank: 35.4, change: 0.5, profileUrl: "https://github.com" },
        { rank: 4, prevRank: 6, name: "deep_learning_dev", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/4?v=4", openrank: 32.1, change: 1.8, profileUrl: "https://github.com" },
        { rank: 5, prevRank: 4, name: "data_scientist", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/5?v=4", openrank: 28.9, change: -0.5, profileUrl: "https://github.com" },
        { rank: 6, prevRank: 8, name: "ml_engineer", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/6?v=4", openrank: 25.6, change: 1.2, profileUrl: "https://github.com" },
        { rank: 7, prevRank: 5, name: "ai_developer", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/7?v=4", openrank: 23.2, change: 0.8, profileUrl: "https://github.com" },
        { rank: 8, prevRank: 7, name: "research_scientist", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/8?v=4", openrank: 21.5, change: -0.3, profileUrl: "https://github.com" },
        { rank: 9, prevRank: 10, name: "neural_net_dev", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/9?v=4", openrank: 19.8, change: 1.5, profileUrl: "https://github.com" },
        { rank: 10, prevRank: 9, name: "model_trainer", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/10?v=4", openrank: 18.2, change: 0.2, profileUrl: "https://github.com" },
      ],
    },
    "PyTorch": {
      name: "PyTorch",
      logo: "https://pytorch.org/assets/images/pytorch-logo.png",
      description: "An open source machine learning framework",
      org: "Meta",
      country: "US",
      tags: ["Machine Learning", "Deep Learning", "AI"],
      website: "https://pytorch.org",
      currentOpenrank: 2,
      prevOpenrank: 1,
      currentParticipants: 2800,
      prevParticipants: 2650,
      currentActivity: 96,
      prevActivity: 94,
      openness: 92,
      impact: 98,
      totalScore: 95.2,
      openrankHistory: generateHistoryData(90, 15, 5),
      activityHistory: generateHistoryData(95, 15, 3),
      participantsHistory: generateHistoryData(2800, 15, 100),
      issueCountHistory: generateHistoryData(600, 15, 50),
      contributors: [
        { rank: 1, prevRank: 2, name: "pytorch_team", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/11?v=4", openrank: 42.1, change: 1.5, profileUrl: "https://github.com/pytorch" },
        { rank: 2, prevRank: 3, name: "deeplearning_dev", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/12?v=4", openrank: 36.8, change: 0.8, profileUrl: "https://github.com" },
        { rank: 3, prevRank: 1, name: "meta_ai", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/13?v=4", openrank: 34.2, change: -0.3, profileUrl: "https://github.com" },
        { rank: 4, prevRank: 5, name: "ml_researcher", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/14?v=4", openrank: 30.5, change: 1.2, profileUrl: "https://github.com" },
        { rank: 5, prevRank: 4, name: "tensor_dev", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/15?v=4", openrank: 27.8, change: 0.5, profileUrl: "https://github.com" },
        { rank: 6, prevRank: 8, name: "ai_scientist", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/16?v=4", openrank: 24.3, change: -0.8, profileUrl: "https://github.com" },
        { rank: 7, prevRank: 6, name: "neural_ninja", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/17?v=4", openrank: 22.1, change: 1.1, profileUrl: "https://github.com" },
        { rank: 8, prevRank: 10, name: "deep_mind", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/18?v=4", openrank: 20.5, change: 0.3, profileUrl: "https://github.com" },
        { rank: 9, prevRank: 7, name: "torch_user", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/19?v=4", openrank: 18.9, change: -0.5, profileUrl: "https://github.com" },
        { rank: 10, prevRank: 9, name: "ml_enthusiast", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/20?v=4", openrank: 17.2, change: 0.8, profileUrl: "https://github.com" },
      ],
    },
  };

  const base = projectData[projectName];
  if (base) return base;

  return {
    name: projectName,
    logo: `https://via.placeholder.com/80?text=${projectName.charAt(0)}`,
    description: "Project description",
    org: "Unknown",
    country: "US",
    tags: ["Open Source"],
    website: "https://example.com",
    currentOpenrank: 10,
    prevOpenrank: 12,
    currentParticipants: 1500,
    prevParticipants: 1400,
    currentActivity: 85,
    prevActivity: 82,
    openness: 88,
    impact: 86,
    totalScore: 86.2,
    openrankHistory: generateHistoryData(75, 15, 5),
    activityHistory: generateHistoryData(85, 15, 3),
    participantsHistory: generateHistoryData(1500, 15, 80),
    issueCountHistory: generateHistoryData(400, 15, 40),
    contributors: [
      { rank: 1, prevRank: 2, name: "developer_1", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/1?v=4", openrank: 25.3, change: 1.2, profileUrl: "https://github.com" },
      { rank: 2, prevRank: 1, name: "developer_2", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/2?v=4", openrank: 22.1, change: -0.5, profileUrl: "https://github.com" },
      { rank: 3, prevRank: 4, name: "developer_3", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/3?v=4", openrank: 19.8, change: 0.3, profileUrl: "https://github.com" },
      { rank: 4, prevRank: 3, name: "developer_4", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/4?v=4", openrank: 17.5, change: 0.8, profileUrl: "https://github.com" },
      { rank: 5, prevRank: 6, name: "developer_5", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/5?v=4", openrank: 15.2, change: -0.2, profileUrl: "https://github.com" },
      { rank: 6, prevRank: 5, name: "developer_6", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/6?v=4", openrank: 13.8, change: 0.5, profileUrl: "https://github.com" },
      { rank: 7, prevRank: 8, name: "developer_7", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/7?v=4", openrank: 12.1, change: 0.3, profileUrl: "https://github.com" },
      { rank: 8, prevRank: 7, name: "developer_8", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/8?v=4", openrank: 10.5, change: -0.4, profileUrl: "https://github.com" },
      { rank: 9, prevRank: 10, name: "developer_9", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/9?v=4", openrank: 9.2, change: 0.6, profileUrl: "https://github.com" },
      { rank: 10, prevRank: 9, name: "developer_10", platform: "GitHub", avatar: "https://avatars.githubusercontent.com/u/10?v=4", openrank: 8.1, change: 0.1, profileUrl: "https://github.com" },
    ],
  };
}

// 排名变化指示器
function ChangeIndicator({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff === 0) {
    return <span className={styles.changeZero}>0</span>;
  }
  const isUp = diff > 0;
  return (
    <span className={clsx(styles.changeIndicator, isUp ? styles.changeUp : styles.changeDown)}>
      {isUp ? "↑" : "↓"} {Math.abs(Math.round(diff * 10) / 10)}
    </span>
  );
}

// 排名变化组件（用于表格，同时显示排名和变化）
function RankWithChange({ rank, prevRank }: { rank: number; prevRank: number }) {
  const change = prevRank - rank; // 排名上升 = 数字变大 = change为正

  return (
    <div className={styles.rankWithChange}>
      <span className={clsx(styles.rankBadge, {
        [styles.rankBadge1]: rank === 1,
        [styles.rankBadge2]: rank === 2,
        [styles.rankBadge3]: rank === 3,
      })}>
        {rank}
      </span>
      <span className={clsx(styles.rankChange, {
        [styles.rankChangeUp]: change > 0,
        [styles.rankChangeDown]: change < 0,
        [styles.rankChangeZero]: change === 0,
      })}>
        {change > 0 ? `↑${change}` : change < 0 ? `↓${Math.abs(change)}` : '-'}
      </span>
    </div>
  );
}

// 折线图组件
function LineChart({ data, color = "#22c55e", unit = "" }: { data: { date: string; value: number }[]; color?: string; unit?: string }) {
  if (!data || data.length === 0) return null;

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className={styles.lineChartContainer}>
      <svg className={styles.lineChart} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#gradient-${color})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((item.value - minValue) / range) * 100;
          return (
            <circle
              key={item.date}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <div className={styles.lineChartXAxis}>
        {data.filter((_, i) => i % 3 === 0).map(item => (
          <span key={item.date}>{item.date.slice(2)}</span>
        ))}
      </div>
    </div>
  );
}

export default function ProjectDetail({ projectName, onBack }: { projectName: string; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [timeRangeType, setTimeRangeType] = useState<"month" | "year">("month");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("03");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

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

  const handleUserClick = (userName: string) => {
    setSelectedUser(userName);
  };

  const handleUserBack = () => {
    setSelectedUser(null);
  };

  // 渲染用户详情
  if (selectedUser) {
    return <UserDetail userName={selectedUser} onBack={handleUserBack} />;
  }

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
      {/* 返回按钮 */}
      <button className={styles.backButton} onClick={handleBack}>
        ← 返回
      </button>

      {/* 第1部分：项目简介 */}
      <div className={styles.projectIntroSection}>
        <div className={styles.projectIntroLeft}>
          <img src={data.logo} alt={data.name} className={styles.projectIntroLogo} />
        </div>
        <div className={styles.projectIntroRight}>
          <div className={styles.projectTitleRow}>
            <h1 className={styles.projectIntroTitle}>{data.name}</h1>
            <div className={styles.projectIntroTags}>
              {data.tags.map((tag, index) => (
                <span key={index} className={styles.projectTag}>{tag}</span>
              ))}
            </div>
          </div>
          <p className={styles.projectIntroDesc}>{data.description}</p>
        </div>
      </div>

      {/* 第2部分：基本数据统计 */}
      <div className={styles.statsSection}>
        <div className={styles.statsSectionHeader}>
          <h2 className={styles.sectionTitle}>基础统计数据</h2>
          <div className={styles.timeSelector}>
            <div className={styles.tabButtonsSmall}>
              <button
                className={clsx(styles.tabButtonSmall, timeRangeType === "month" && styles.tabButtonSmallActive)}
                onClick={() => setTimeRangeType("month")}
              >
                月度
              </button>
              <button
                className={clsx(styles.tabButtonSmall, timeRangeType === "year" && styles.tabButtonSmallActive)}
                onClick={() => setTimeRangeType("year")}
              >
                年度
              </button>
            </div>
          </div>
        </div>

        <div className={styles.statsCards}>
          <div className={styles.statCardLarge}>
            <div className={styles.statCardContent}>
              <div className={styles.statCardLeft}>
                <div className={styles.statIconWrapper}>
                  <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className={styles.statValueBlock}>
                  <span className={styles.statValueLarge}>{data.currentOpenrank}</span>
                  <span className={styles.statLabel}>OpenRank 影响力</span>
                </div>
              </div>
              <div className={styles.statCardRight}>
                <ChangeIndicator current={data.currentOpenrank} previous={data.prevOpenrank} />
                <span className={styles.statChangeLabel}>较上月</span>
              </div>
            </div>
          </div>
          <div className={styles.statCardLarge}>
            <div className={styles.statCardContent}>
              <div className={styles.statCardLeft}>
                <div className={styles.statIconWrapper} style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                  <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div className={styles.statValueBlock}>
                  <span className={styles.statValueLarge}>{data.currentActivity}<span className={styles.statUnit}>%</span></span>
                  <span className={styles.statLabel}>活跃度</span>
                </div>
              </div>
              <div className={styles.statCardRight}>
                <ChangeIndicator current={data.currentActivity} previous={data.prevActivity} />
                <span className={styles.statChangeLabel}>较上月</span>
              </div>
            </div>
          </div>
          <div className={styles.statCardLarge}>
            <div className={styles.statCardContent}>
              <div className={styles.statCardLeft}>
                <div className={styles.statIconWrapper} style={{ background: '#fef3c7', color: '#d97706' }}>
                  <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className={styles.statValueBlock}>
                  <span className={styles.statValueLarge}>{data.currentParticipants.toLocaleString()}</span>
                  <span className={styles.statLabel}>开发者数量</span>
                </div>
              </div>
              <div className={styles.statCardRight}>
                <ChangeIndicator current={data.currentParticipants} previous={data.prevParticipants} />
                <span className={styles.statChangeLabel}>较上月</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第3部分：历史数据趋势 */}
      <div className={styles.historySection}>
        <h2 className={styles.sectionTitle}>历史数据趋势</h2>
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>OpenRank 影响力历史趋势</div>
            <LineChart data={data.openrankHistory} color="#22c55e"/>
          </div>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>活跃度历史趋势</div>
            <LineChart data={data.activityHistory} color="#3b82f6" unit="%"/>
          </div>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>开发者参与数量历史趋势</div>
            <LineChart data={data.participantsHistory} color="#f59e0b" />
          </div>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>活跃 Issue/PR 数量历史趋势</div>
            <LineChart data={data.issueCountHistory} color="#ef4444" />
          </div>
        </div>
      </div>

      {/* 第4部分：社区开发者贡献度 */}
      <div className={styles.contributorsSection}>
        <div className={styles.contributorsSectionHeader}>
          <h2 className={styles.sectionTitle}>社区开发者贡献度 Top 10</h2>
          <div className={styles.contributorsTimeSelector}>
            <ConfigProvider locale={zhCN} theme={{ token: { fontSize: 14 } }}>
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
                style={{ width: '120px', height: '36px' }}
              />
            </ConfigProvider>
          </div>
        </div>
        <table className={styles.contributorsTable}>
          <thead>
          <tr>
            <th>排名</th>
            <th>用户</th>
            <th>用户数据看板</th>
            <th>OpenRank</th>
            <th>变化</th>
          </tr>
          </thead>
          <tbody>
            {data.contributors.map((contributor) => (
                <tr key={contributor.rank}>
                  <td>
                  <RankWithChange rank={contributor.rank} prevRank={contributor.prevRank} />
                </td>
                  <td>
                    <div className={styles.contributorInfo}>
                      <img src={contributor.avatar} alt={contributor.name} className={styles.contributorAvatar}/>
                      <a href={contributor.profileUrl} target="_blank" rel="noopener noreferrer"
                         className={styles.contributorName}>
                        {contributor.name}
                      </a>
                      <span className={styles.platformBadge}>{contributor.platform}</span>
                    </div>
                  </td>
                  <td>
                    <button
                        className={styles.userDashboardButton}
                        onClick={() => handleUserClick(contributor.name)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                      </svg>
                    </button>
                  </td>
                  <td className={styles.contributorOpenrank}>{contributor.openrank}</td>
                  <td>
                    <ChangeIndicator current={contributor.openrank}
                                     previous={contributor.openrank - contributor.change}/>
                  </td>

                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
