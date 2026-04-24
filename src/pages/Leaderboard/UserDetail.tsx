import React, { useState, useEffect } from "react";
import { DatePicker, ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import clsx from "clsx";
import styles from "../research.module.css";

// 设置 Day.js 使用中文
dayjs.locale("zh-cn");

// 用户详情数据接口
interface UserDetailData {
  name: string;
  avatar: string;
  bio: string;
  platform: string;
  profileUrl: string;
  currentOpenrank: number;
  prevOpenrank: number;
  currentActivity: number;
  prevActivity: number;
  currentIssueCount: number;
  prevIssueCount: number;
  currentIssueCommentCount: number;
  prevIssueCommentCount: number;
  currentPrCount: number;
  prevPrCount: number;
  currentPrReviewCount: number;
  prevPrReviewCount: number;
  // 历史数据
  openrankHistory: { date: string; value: number }[];
  activityHistory: { date: string; value: number }[];
  issueCountHistory: { date: string; value: number }[];
  prCountHistory: { date: string; value: number }[];
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

function getMockUserData(userName: string): UserDetailData {
  return {
    name: userName,
    avatar: `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 100)}?v=1`,
    bio: "Open source contributor and developer",
    platform: "GitHub",
    profileUrl: `https://github.com/${userName}`,
    currentOpenrank: 45.2,
    prevOpenrank: 42.1,
    currentActivity: 92,
    prevActivity: 88,
    currentIssueCount: 28,
    prevIssueCount: 22,
    currentIssueCommentCount: 156,
    prevIssueCommentCount: 142,
    currentPrCount: 15,
    prevPrCount: 12,
    currentPrReviewCount: 32,
    prevPrReviewCount: 28,
    openrankHistory: generateHistoryData(45, 15, 5),
    activityHistory: generateHistoryData(90, 15, 8),
    issueCountHistory: generateHistoryData(25, 15, 5),
    prCountHistory: generateHistoryData(14, 15, 3),
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

export default function UserDetail({ userName, onBack }: { userName: string; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserDetailData | null>(null);
  const [timeRangeType, setTimeRangeType] = useState<"month" | "year">("month");

  useEffect(() => {
    if (userName) {
      setLoading(true);
      setTimeout(() => {
        setData(getMockUserData(userName));
        setLoading(false);
      }, 300);
    }
  }, [userName]);

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
        <p>未找到用户数据</p>
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

      {/* 第1部分：用户简介 */}
      <div className={styles.projectIntroSection}>
        <div className={styles.projectIntroLeft}>
          <img src={data.avatar} alt={data.name} className={styles.userIntroLogo} />
        </div>
        <div className={styles.projectIntroRight}>
          <div className={styles.projectTitleRow}>
            <h1 className={styles.projectIntroTitle}>{data.name}</h1>
            <span className={styles.platformBadge}>{data.platform}</span>
          </div>
          <p className={styles.projectIntroDesc}>{data.bio}</p>
        </div>
      </div>

      {/* 第2部分：基础数据统计 - 上排2个 */}
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

        {/* 第一行：2个指标卡 */}
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
        </div>

        {/* 第二行：4个指标卡 */}
        <div className={styles.statsCards} style={{ marginTop: '16px' }}>
          <div className={styles.statCardLarge}>
            <div className={styles.statCardContent}>
              <div className={styles.statCardLeft}>
                <div className={styles.statIconWrapper} style={{ background: '#fce7f3', color: '#db2777' }}>
                  <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className={styles.statValueBlock}>
                  <span className={styles.statValueLarge}>{data.currentIssueCount}</span>
                  <span className={styles.statLabel}>提交 Issue</span>
                </div>
              </div>
              <div className={styles.statCardRight}>
                <ChangeIndicator current={data.currentIssueCount} previous={data.prevIssueCount} />
                <span className={styles.statChangeLabel}>较上月</span>
              </div>
            </div>
          </div>
          <div className={styles.statCardLarge}>
            <div className={styles.statCardContent}>
              <div className={styles.statCardLeft}>
                <div className={styles.statIconWrapper} style={{ background: '#f3e8ff', color: '#9333ea' }}>
                  <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className={styles.statValueBlock}>
                  <span className={styles.statValueLarge}>{data.currentIssueCommentCount}</span>
                  <span className={styles.statLabel}>Issue 评论</span>
                </div>
              </div>
              <div className={styles.statCardRight}>
                <ChangeIndicator current={data.currentIssueCommentCount} previous={data.prevIssueCommentCount} />
                <span className={styles.statChangeLabel}>较上月</span>
              </div>
            </div>
          </div>
          <div className={styles.statCardLarge}>
            <div className={styles.statCardContent}>
              <div className={styles.statCardLeft}>
                <div className={styles.statIconWrapper} style={{ background: '#dbeafe', color: '#2563eb' }}>
                  <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="18" r="3" />
                    <circle cx="6" cy="6" r="3" />
                    <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                    <line x1="6" y1="9" x2="6" y2="21" />
                  </svg>
                </div>
                <div className={styles.statValueBlock}>
                  <span className={styles.statValueLarge}>{data.currentPrCount}</span>
                  <span className={styles.statLabel}>提交 PR</span>
                </div>
              </div>
              <div className={styles.statCardRight}>
                <ChangeIndicator current={data.currentPrCount} previous={data.prevPrCount} />
                <span className={styles.statChangeLabel}>较上月</span>
              </div>
            </div>
          </div>
          <div className={styles.statCardLarge}>
            <div className={styles.statCardContent}>
              <div className={styles.statCardLeft}>
                <div className={styles.statIconWrapper} style={{ background: '#fef3c7', color: '#d97706' }}>
                  <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
                <div className={styles.statValueBlock}>
                  <span className={styles.statValueLarge}>{data.currentPrReviewCount}</span>
                  <span className={styles.statLabel}>PR 评审</span>
                </div>
              </div>
              <div className={styles.statCardRight}>
                <ChangeIndicator current={data.currentPrReviewCount} previous={data.prevPrReviewCount} />
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
        </div>
      </div>
    </div>
  );
}
