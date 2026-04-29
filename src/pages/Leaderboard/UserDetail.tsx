import React, { useState, useEffect } from "react";
import { DatePicker, ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import clsx from "clsx";
import styles from "../research.module.css";

const OSS_BASE_URL = "https://oss.open-digger.cn";

// 设置 Day.js 使用中文
dayjs.locale("zh-cn");

// 用户详情数据接口
interface UserDetailData {
  name: string;
  login: string;
  avatar: string;
  bio: string;
  location: string;
  company: string;
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

// 转换历史数据格式
function convertHistoryData(dataObj: Record<string, number>): { date: string; value: number }[] {
  if (!dataObj) return [];
  return Object.entries(dataObj)
    .map(([date, value]) => ({ date, value: value || 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// 获取上一个月
function getPrevMonth(): string {
  return dayjs().subtract(1, 'month').format('YYYY-MM');
}

// 从API获取用户真实数据
async function fetchUserData(userName: string, timeRangeType: "month" | "year" = "month"): Promise<UserDetailData> {
  const metaUrl = `${OSS_BASE_URL}/github/${userName}/meta.json`;
  const openrankUrl = `${OSS_BASE_URL}/github/${userName}/openrank.json`;
  const activityUrl = `${OSS_BASE_URL}/github/${userName}/activity.json`;
  const openIssueUrl = `${OSS_BASE_URL}/github/${userName}/open_issue.json`;
  const issueCommentUrl = `${OSS_BASE_URL}/github/${userName}/issue_comment.json`;
  const openPrUrl = `${OSS_BASE_URL}/github/${userName}/open_pull.json`;
  const reviewCommentUrl = `${OSS_BASE_URL}/github/${userName}/review_comment.json`;

  // 并行请求所有数据
  const [metaRes, openrankRes, activityRes, openIssueRes, issueCommentRes, openPrRes, reviewCommentRes] = await Promise.all([
    fetch(metaUrl).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    fetch(openrankUrl).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    fetch(activityUrl).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    fetch(openIssueUrl).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    fetch(issueCommentUrl).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    fetch(openPrUrl).then(r => r.ok ? r.json() : {}).catch(() => ({})),
    fetch(reviewCommentUrl).then(r => r.ok ? r.json() : {}).catch(() => ({})),
  ]);

  // 根据时间范围类型过滤数据
  const filterByTimeRange = (data: Record<string, number>, type: "month" | "year"): Record<string, number> => {
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(data)) {
      if (type === "month") {
        // 月度数据：只保留 yyyy-mm 格式的key
        if (/^\d{4}-\d{2}$/.test(key)) {
          result[key] = value;
        }
      } else {
        // 年度数据：只保留 yyyy 格式的key
        if (/^\d{4}$/.test(key)) {
          result[key] = value;
        }
      }
    }
    return result;
  };

  // 过滤各数据源
  const filteredOpenrank = filterByTimeRange(openrankRes, timeRangeType);
  const filteredActivity = filterByTimeRange(activityRes, timeRangeType);
  const filteredOpenIssue = filterByTimeRange(openIssueRes, timeRangeType);
  const filteredIssueComment = filterByTimeRange(issueCommentRes, timeRangeType);
  const filteredOpenPr = filterByTimeRange(openPrRes, timeRangeType);
  const filteredReviewComment = filterByTimeRange(reviewCommentRes, timeRangeType);

  // 获取当前周期（月份或年份）
  const getCurrentPeriod = () => {
    if (timeRangeType === "year") {
      return dayjs().subtract(1, 'year').format('YYYY');
    }
    return dayjs().subtract(1, 'month').format('YYYY-MM');
  };

  const prevMonth = getCurrentPeriod();

  // 从meta获取用户信息
  const meta = metaRes as any;
  const userInfo = meta?.info || {};
  
  // 获取当前周期和上一周期的数据
  const getCurrentAndPrev = (data: Record<string, number>) => {
    const current = data[prevMonth] || 0;
    const entries = Object.entries(data).filter(entry => entry[0] < prevMonth);
    const prev = entries.length > 0 
      ? entries.sort((a, b) => b[0].localeCompare(a[0]))[0][1]
      : 0;
    return { current, prev };
  };

  // 获取Issue数据特殊处理：当前值取前2个月，变化量取前2个月减去前3个月
  const getIssueCountData = () => {
    const now = dayjs();
    // 当前显示的月份（本月-1）
    // 前1个月 = 当前显示的上个月（即前2个月）
    const prev1Month = now.subtract(2, 'month').format('YYYY-MM');
    // 前2个月 = 当前显示的上上个月（即前3个月）
    const prev2Month = now.subtract(3, 'month').format('YYYY-MM');
    
    const current = filteredOpenIssue[prev1Month] || 0;
    const prev =  (filteredOpenIssue[prev2Month] || 0);
    return { current, prev };
  };

  const openrankData = getCurrentAndPrev(filteredOpenrank);
  const activityData = getCurrentAndPrev(filteredActivity);
  const issueCountData = getIssueCountData();
  const issueCommentData = getCurrentAndPrev(filteredIssueComment);
  const prCountData = getCurrentAndPrev(filteredOpenPr);
  const prReviewData = getCurrentAndPrev(filteredReviewComment);

  // 转换历史数据格式
  const convertHistory = (dataObj: Record<string, number>) => {
    if (!dataObj) return [];
    return Object.entries(dataObj)
      .map(([date, value]) => ({ date, value: value || 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  return {
    name: userInfo.name || userName,
    login: userName,
    avatar: `https://avatars.githubusercontent.com/u/${meta?.id}?v=4`,
    bio: userInfo.bio || '',
    location: userInfo.location || '',
    company: userInfo.company || '',
    platform: 'GitHub',
    profileUrl: `https://github.com/${userName}`,
    currentOpenrank: openrankData.current,
    prevOpenrank: openrankData.prev,
    currentActivity: activityData.current,
    prevActivity: activityData.prev,
    currentIssueCount: issueCountData.current,
    prevIssueCount: issueCountData.prev,
    currentIssueCommentCount: issueCommentData.current,
    prevIssueCommentCount: issueCommentData.prev,
    currentPrCount: prCountData.current,
    prevPrCount: prCountData.prev,
    currentPrReviewCount: prReviewData.current,
    prevPrReviewCount: prReviewData.prev,
    openrankHistory: convertHistory(filteredOpenrank),
    activityHistory: convertHistory(filteredActivity),
    issueCountHistory: convertHistory(filteredOpenIssue),
    prCountHistory: convertHistory(filteredOpenPr),
  };
}

function getMockUserData(userName: string): UserDetailData {
  return {
    name: userName,
    login: userName,
    avatar: `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 100)}?v=1`,
    bio: "Open source contributor and developer",
    location: '',
    company: '',
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

// 折线图组件 - 细线折线图
function LineChart({ data, color = "#22c55e", unit = "", timeRangeType = "month" }: { data: { date: string; value: number }[]; color?: string; unit?: string; timeRangeType?: "month" | "year" }) {
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

  // Y轴刻度（3个点）
  const yAxisTicks = [0, 50, 100];
  const yAxisValues = yAxisTicks.map(tick => {
    const value = minValue + ((100 - tick) / 100) * range;
    return Math.round(value * 10) / 10;
  });

  // X轴日期格式：月度显示4位年份(如2023-05)，年度显示4位年份(如2023)
  const formatXAxisDate = (date: string) => {
    return date; // 月度和年度都显示完整的4位年份
  };

  return (
    <div className={styles.lineChartContainer}>
      {/* Y轴数值显示在图表左侧 */}
<div style={{ position: 'absolute', left: '8px', top: '0', bottom: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
          {yAxisValues.map((value, index) => (
            <span key={index} style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1' }}>
              {value}
            </span>
          ))}
        </div>
      <svg className={styles.lineChart} viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#gradient-${color.replace('#', '')})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* X轴刻度文字 - 只显示第一条和最后一条 */}
      <div className={styles.lineChartXAxis}>
        {data.length > 0 && (
          <>
            <span>{formatXAxisDate(data[0].date)}</span>
            {data.length > 1 && <span style={{ marginLeft: 'auto' }}>{formatXAxisDate(data[data.length - 1].date)}</span>}
          </>
        )}
      </div>
    </div>
  );
}

export default function UserDetail({ userName, userAvatar, onBack }: { userName: string; userAvatar?: string; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserDetailData | null>(null);
  const [timeRangeType, setTimeRangeType] = useState<"month" | "year">("month");

  useEffect(() => {
    if (userName) {
      setLoading(true);
      // 使用真实API获取数据，根据timeRangeType选择不同的API
      fetchUserData(userName, timeRangeType)
        .then(userData => {
          setData(userData);
          setLoading(false);
        })
        .catch(() => {
          // 如果API请求失败，使用mock数据
          setData(getMockUserData(userName));
          setLoading(false);
        });
    }
  }, [userName, timeRangeType]);

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
          <img src={userAvatar || data?.avatar} alt={data?.name || userName} className={styles.userIntroLogo} />
        </div>
        <div className={styles.projectIntroRight}>
          <div className={styles.projectTitleRow}>
            <h1 className={styles.projectIntroTitle}>
              {data.name}(@{data.login})
            </h1>
            <a 
              href={data.profileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.githubLinkButton}
            >
              GitHub 主页
            </a>
          </div>
          
          {/* 简介 */}
          {data.bio && (
            <div className={styles.userMetaItem}>
              <svg className={styles.userMetaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span className={styles.userMetaText}>{data.bio}</span>
            </div>
          )}
          
          {/* 所在地和公司合并为一行 */}
          {(data.location || data.company) && (
            <div className={styles.userMetaRow}>
              {data.location && (
                <div className={styles.userMetaItem}>
                  <svg className={styles.userMetaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className={styles.userMetaText}>{data.location}</span>
                </div>
              )}
              {data.location && data.company && <span className={styles.userMetaDivider}>|</span>}
              {data.company && (
                <div className={styles.userMetaItem}>
                  <svg className={styles.userMetaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span className={styles.userMetaText}>{data.company}</span>
                </div>
              )}
            </div>
          )}
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
            <LineChart data={data.openrankHistory} color="#22c55e" timeRangeType={timeRangeType}/>
          </div>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>活跃度历史趋势</div>
            <LineChart data={data.activityHistory} color="#3b82f6" unit="%" timeRangeType={timeRangeType}/>
          </div>
        </div>
      </div>
    </div>
  );
}