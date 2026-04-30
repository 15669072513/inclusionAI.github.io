import React, { useState, useEffect, useRef } from "react";
import { DatePicker, ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import clsx from "clsx";
import * as echarts from 'echarts';
import 'echarts/lib/chart/map';
import 'echarts/lib/component/geo';
import 'echarts/lib/component/visualMap';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import styles from "../research.module.css";
import UserDetail from "./UserDetail";

// 设置 Day.js 使用中文
dayjs.locale("zh-cn");

// API 基础 URL
const OSS_BASE_URL = "https://oss.open-digger.cn";
const API_BASE_URL = "https://selfoss.open-digger.cn";

// 项目详情数据接口
interface ProjectDetailData {
  id: string;
  name: string;
  name_zh: string;
  logo: string;
  description: string;
  description_zh: string;
  tags: string[];
  website: string;
  // 当前指标
  currentOpenrank: number;
  prevOpenrank: number;
  currentParticipants: number;
  prevParticipants: number;
  currentActivity: number;
  prevActivity: number;
  // 历史数据
  openrankHistory: { date: string; value: number }[];
  activityHistory: { date: string; value: number }[];
  participantsHistory: { date: string; value: number }[];
  issueCountHistory: { date: string; value: number }[];
  // 贡献者
  contributors: { rank: number; prevRank: number; name: string; platform: string; avatar: string; openrank: number; change: number; rankChange?: number; profileUrl: string }[];
  // 贡献度分布（近一年）- 国家
  countryDistribution: { rank: number; country: string; countryCode: string; flag: string; openrank: number; developers: number; count: number }[];
  // 保存完整的贡献者数据，按月份存储
  _allContributors?: { [key: string]: any[] };
}

// 国家名称映射（英文到中文）
const countryNameMap: { [key: string]: string } = {
  'United States': '美国',
  'China': '中国',
  'Germany': '德国',
  'United Kingdom': '英国',
  'India': '印度',
  'France': '法国',
  'Canada': '加拿大',
  'Japan': '日本',
  'South Korea': '韩国',
  'Brazil': '巴西',
  'Australia': '澳大利亚',
  'Russia': '俄罗斯',
  'Netherlands': '荷兰',
  'Singapore': '新加坡',
  'Switzerland': '瑞士',
  'Italy': '意大利',
  'Spain': '西班牙',
  'Mexico': '墨西哥',
  'Indonesia': '印度尼西亚',
  'Saudi Arabia': '沙特阿拉伯',
  'South Africa': '南非',
  'Egypt': '埃及',
  'Nigeria': '尼日利亚',
  'Argentina': '阿根廷',
  'Poland': '波兰',
  'Turkey': '土耳其',
  'Iran': '伊朗',
  'Thailand': '泰国',
  'Vietnam': '越南',
  'Philippines': '菲律宾',
  'Pakistan': '巴基斯坦',
  'Bangladesh': '孟加拉国',
  'Ukraine': '乌克兰',
};

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

// 从ID中提取项目名，例如 ":companies/nvidia/dynamo" -> "dynamo"
function extractProjectName(projectId: string): string {
  if (!projectId) return '';
  const parts = projectId.split('/');
  return parts[parts.length - 1] || '';
}

// 国家旗帜映射
const countryFlagMap: { [key: string]: string } = {
  'United States of America': '🇺🇸',
  'United States': '🇺🇸',
  'China': '🇨🇳',
  'Germany': '🇩🇪',
  'United Kingdom': '🇬🇧',
  'India': '🇮🇳',
  'France': '🇫🇷',
  'Canada': '🇨🇦',
  'Japan': '🇯🇵',
  'South Korea': '🇰🇷',
  'Korea': '🇰🇷',
  'Brazil': '🇧🇷',
  'Australia': '🇦🇺',
  'Russia': '🇷🇺',
  'Netherlands': '🇳🇱',
  'Singapore': '🇸🇬',
  'Switzerland': '🇨🇭',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Mexico': '🇲🇽',
  'Indonesia': '🇮🇩',
  'Saudi Arabia': '🇸🇦',
  'South Africa': '🇿🇦',
  'Egypt': '🇪🇬',
  'Nigeria': '🇳🇬',
  'Argentina': '🇦🇷',
  'Poland': '🇵🇱',
  'Turkey': '🇹🇷',
  'Iran': '🇮🇷',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Philippines': '🇵🇭',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Ukraine': '🇺🇦',
};

// 国家代码映射
const countryCodeMap: { [key: string]: string } = {
  'United States of America': 'US',
  'United States': 'US',
  'China': 'CN',
  'Germany': 'DE',
  'United Kingdom': 'GB',
  'India': 'IN',
  'France': 'FR',
  'Canada': 'CA',
  'Japan': 'JP',
  'South Korea': 'KR',
  'Korea': 'KR',
  'Brazil': 'BR',
  'Australia': 'AU',
  'Russia': 'RU',
  'Netherlands': 'NL',
  'Singapore': 'SG',
  'Switzerland': 'CH',
  'Italy': 'IT',
  'Spain': 'ES',
  'Mexico': 'MX',
  'Indonesia': 'ID',
  'Saudi Arabia': 'SA',
  'South Africa': 'ZA',
  'Egypt': 'EG',
  'Nigeria': 'NG',
  'Argentina': 'AR',
  'Poland': 'PL',
  'Turkey': 'TR',
  'Iran': 'IR',
  'Thailand': 'TH',
  'Vietnam': 'VN',
  'Pakistan': 'PK',
  'Bangladesh': 'BD',
  'Ukraine': 'UA',
};

// 获取项目详情数据
async function fetchProjectData(projectId: string, timeRangeType: "month" | "year" = "month"): Promise<ProjectDetailData | null> {
  try {
    // 项目ID：直接从id获取，格式如 :companies/nvidia/dynamo
    // OSS路径使用projectId，格式如 :companies/nvidia/dynamo
    const projectName = extractProjectName(projectId);
    console.log("Fetching project data for:", projectId, "->", projectName);
    
    // 使用新的API路径格式：${OSS_BASE_URL}/${projectId}/
    const basePath = `${OSS_BASE_URL}/${projectId}`;
    
    // 获取项目meta信息
    const metaUrl = `${basePath}/meta.json`;
    console.log("Fetching meta from:", metaUrl);
    
    const [metaResponse, openrankResponse, activityResponse, participantsResponse, issuesResponse, contributorsResponse] = await Promise.all([
      fetch(metaUrl).then(r => r.ok ? r.json() : Promise.resolve(null)).catch(() => null),
      fetch(`${basePath}/openrank.json`).then(r => r.ok ? r.json() : ({} as any)).catch(() => ({})),
      fetch(`${basePath}/activity.json`).then(r => r.ok ? r.json() : ({} as any)).catch(() => ({})),
      fetch(`${basePath}/participants.json`).then(r => r.ok ? r.json() : ({} as any)).catch(() => ({})),
      fetch(`${basePath}/issues_and_change_request_active.json`).then(r => r.ok ? r.json() : ({} as any)).catch(() => ({})),
      fetch(`${basePath}/community_openrank_details.json`).then(r => r.ok ? r.json() : ({} as any)).catch(() => ({})),
    ]);
    
    console.log("Meta data:", metaResponse);
    console.log("Openrank data:", openrankResponse);
    console.log("Contributors data:", contributorsResponse);
    
    // 处理项目meta信息
    const projectMeta = metaResponse || {};
    const tags = projectMeta.labels?.map((l: any) => l.name_zh || l.name) || [];
    
    // 处理历史数据（根据时间范围类型过滤）
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

    // 按时间范围类型筛选历史数据
    const openrankData = filterByTimeRange(openrankResponse || {}, timeRangeType);
    const activityData = filterByTimeRange(activityResponse || {}, timeRangeType);
    const participantsData = filterByTimeRange(participantsResponse || {}, timeRangeType);
    const issuesData = filterByTimeRange(issuesResponse || {}, timeRangeType);
    
    // 获取当前日期（上个月）
    const now = dayjs();
    const lastMonth = now.subtract(1, 'month');
    const currentYear = lastMonth.format('YYYY');
    const currentMonth = lastMonth.format('YYYY-MM');
    const prevMonth = lastMonth.subtract(1, 'month').format('YYYY-MM');
    
    // 处理openrank历史数据（取最近15个月）
    const openrankHistory: { date: string; value: number }[] = [];
    for (let i = 14; i >= 0; i--) {
      const date = lastMonth.subtract(i, 'month').format('YYYY-MM');
      const value = openrankData[date];
      if (value !== undefined) {
        openrankHistory.push({ date, value });
      }
    }
    
    // 处理activity历史数据
    const activityHistory: { date: string; value: number }[] = [];
    for (let i = 14; i >= 0; i--) {
      const date = lastMonth.subtract(i, 'month').format('YYYY-MM');
      const value = activityData[date];
      if (value !== undefined) {
        activityHistory.push({ date, value });
      }
    }
    
    // 处理participants历史数据
    const participantsHistory: { date: string; value: number }[] = [];
    for (let i = 14; i >= 0; i--) {
      const date = lastMonth.subtract(i, 'month').format('YYYY-MM');
      const value = participantsData[date];
      if (value !== undefined) {
        participantsHistory.push({ date, value });
      }
    }
    
    // 处理issues历史数据
    const issueCountHistory: { date: string; value: number }[] = [];
    for (let i = 14; i >= 0; i--) {
      const date = lastMonth.subtract(i, 'month').format('YYYY-MM');
      const value = issuesData[date];
      if (value !== undefined) {
        issueCountHistory.push({ date, value });
      }
    }
    
    // 当前值
    const currentOpenrank = openrankData[currentMonth] || openrankData[currentYear] || 0;
    const prevOpenrank = openrankData[prevMonth] || 0;
    const currentActivity = activityData[currentMonth] || activityData[currentYear] || 0;
    const prevActivity = activityData[prevMonth] || 0;
    const currentParticipants = participantsData[currentMonth] || participantsData[currentYear] || 0;
    const prevParticipants = participantsData[prevMonth] || 0;
    
    // 保存完整的贡献者数据，按月份存储
    const contributorsData = contributorsResponse || {};
    // 找出当前选中的月份数据
    const currentMonthKey = currentMonth; // 例如 "2026-03"
    const monthData = contributorsData[currentMonthKey] || [];
    const contributors = monthData.slice(0, 10).map((item: any, index: number) => ({
      rank: index + 1,
      prevRank: index + 1,
      name: item[2] || '',
      platform: item[0] || 'GitHub',
      avatar: item[2] ? `https://avatars.githubusercontent.com/${item[2]}?v=4` : '',
      openrank: item[3] || 0,
      change: 0,
      profileUrl: item[0] === 'GitHub' && item[2] ? `https://github.com/${item[2]}` : '',
    }));
    
    // 处理国家分布数据（从meta中的contributions获取）
    const contributions = projectMeta.contributions || [];
    const totalOpenrank = contributions.reduce((sum: number, c: any) => sum + (c.openrank || 0), 0);
    const countryDistribution = contributions.map((item: any, index: number) => ({
      rank: index + 1,
      country: item.country_zh || item.country || '',
      countryCode: countryCodeMap[item.country] || '',
      flag: countryFlagMap[item.country] || '🏳️',
      openrank: item.openrank || 0,
      developers: item.developers || 0
      }));
    
    return {
      id: projectId,
      name: projectMeta.name || projectName,
      name_zh: projectMeta.name_zh || projectMeta.name || projectName,
      logo: `${OSS_BASE_URL}/${projectId}/logo.png`,
      description: projectMeta.description || '',
      description_zh: projectMeta.description_zh || projectMeta.description || '',
      tags,
      website: `https://github.com/${projectName}`,
      currentOpenrank,
      prevOpenrank,
      currentParticipants,
      prevParticipants,
      currentActivity,
      prevActivity,
      openrankHistory,
      activityHistory,
      participantsHistory,
      issueCountHistory,
      contributors,
      countryDistribution,
      // 保存原始的 contributors 数据，按月份存储
      _allContributors: contributorsData,
    };
  } catch (error) {
    console.error("Failed to fetch project data:", error);
    return null;
  }
}

export default function ProjectDetail({ projectName, projectAvatar, onBack }: { projectName: string; projectAvatar?: string; onBack: () => void }) {

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
    const change = prevRank - rank;

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
  function LineChart({ data, color = "#22c55e", unit = "", timeRangeType = "month" }: { data: { date: string; value: number }[]; color?: string; unit?: string; timeRangeType?: "month" | "year" }) {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    // 生成平滑曲线路径（使用贝塞尔曲线）
    const getPoint = (index: number) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((data[index].value - minValue) / range) * 100;
      return { x, y };
    };

    // 生成平滑的贝塞尔曲线路径
    let pathD = "";
    if (data.length === 1) {
      const p = getPoint(0);
      pathD = `M ${p.x} ${p.y}`;
    } else {
      // 使用三次贝塞尔曲线连接各点
      const points = data.map((_, i) => getPoint(i));
      
      pathD = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        
        // 计算控制点
        const cp1x = p0.x + (p1.x - p0.x) / 3;
        const cp1y = p0.y;
        const cp2x = p0.x + (p1.x - p0.x) * 2 / 3;
        const cp2y = p1.y;
        
        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }
    }

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
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={pathD + " L 100,100 L 0,100 Z"}
            fill={`url(#gradient-${color})`}
          />
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* X轴刻度文字 - 只显示第一条和最后一条 */}
        <div className={styles.lineChartXAxis}>
          {data.length > 0 && (
            <>
              <span>{data[0].date}</span>
              {data.length > 1 && <span style={{ marginLeft: 'auto' }}>{data[data.length - 1].date}</span>}
            </>
          )}
        </div>
      </div>
    );
  }

  // 地图分布组件 - 使用世界地图
  function CountryMapChart({ data }: { data: ProjectDetailData['countryDistribution'] }) {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
      if (!chartRef.current || !data || data.length === 0) return;

      // 清理之前的图表实例
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      const chart = echarts.init(chartRef.current);
      chartInstanceRef.current = chart;

      // 准备地图数据
      const mapData = data.map(item => {
        return {
          name: item.country,
          value: item.openrank,
          flag: item.flag,
          developers: item.developers,
        };
      });

      const maxValue = Math.max(...data.map(d => d.openrank));
      const minValue = 0;

      // 显示加载状态
      chart.showLoading();

      // 从远程加载世界地图
      fetch('https://fastly.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json')
        .then(response => response.json())
        .then(geoJson => {
          chart.hideLoading();
          echarts.registerMap('world', geoJson);

          const option: any = {
            title: {
              text: '',
              left: 'center',
            },
            tooltip: {
              trigger: 'item',
              formatter: (params: any) => {
                if (params.data && params.data.value != null) {
                  const flag = params.data.flag || '';
                  const value = params.data.value ?? 0;
                  const developers = params.data.developers ?? 0;
                  return `${flag} ${params.name}<br/>OpenRank: ${value.toLocaleString()}<br/>开发者: ${developers}`;
                }
                return params.name ? `${params.name}<br/>无数据` : '';
              },
            },
            toolbox: {
              show: true,
              orient: 'vertical',
              left: 'right',
              top: 'center',
              feature: {
                dataView: { readOnly: false },
                restore: {},
                saveAsImage: {}
              }
            },
            visualMap: {
              min: minValue,
              max: maxValue,
              text: ['高', '低'],
              realtime: false,
              calculable: true,
              inRange: {
                color: ['lightskyblue', 'yellow', 'orangered']
              }
            },
            series: [
              {
                name: '国家贡献度',
                type: 'map',
                map: 'world',
                roam: true,
                label: {
                  show: false
                },
                emphasis: {
                  label: {
                    show: true,
                  },
                  itemStyle: {
                    areaColor: '#fef08a',
                  },
                },
                data: mapData,
                // 自定义名称映射（英文到中文）
                nameMap: countryNameMap,
              },
            ],
          };

          chart.setOption(option);
        })
        .catch(error => {
          console.error('加载地图数据失败:', error);
          chart.hideLoading();
        });

      const handleResize = () => {
        chart.resize();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.dispose();
      };
    }, [data]);

    return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
  }

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [timeRangeType, setTimeRangeType] = useState<"month" | "year">("month");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("03");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string>('');
  const [contributors, setContributors] = useState<ProjectDetailData['contributors']>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [allContributors, setAllContributors] = useState<ProjectDetailData['contributors']>([]);
  const pageSize = 10;

  // 获取项目数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const projectData = await fetchProjectData(projectName, timeRangeType);
      setData(projectData);
      setLoading(false);
      
      // 设置默认时间为上个月
      const lastMonth = dayjs().subtract(1, 'month');
      setSelectedYear(lastMonth.format('YYYY'));
      setSelectedMonth(lastMonth.format('MM'));
      
      // 初始化贡献者数据
        if (projectData && projectData._allContributors) {
        const currentMonth = lastMonth.format('YYYY-MM');
        const monthData = projectData._allContributors[currentMonth] || [];

        // 获取上一个月的数据来计算变化
        const prevMonthKey = lastMonth.subtract(1, 'month').format('YYYY-MM');
        const prevMonthData = projectData._allContributors[prevMonthKey] || [];

        // 构建上月数据映射
        const prevMonthMap = new Map();
        prevMonthData.forEach((item: any) => {
          prevMonthMap.set(item[2], item[3]);
        });

        // 构建上月排名映射
        const prevUserRankMap = new Map<string, number>();
        prevMonthData.forEach((item: any, index: number) => {
          if (item[2]) {
            prevUserRankMap.set(item[2], index + 1);
          }
        });

        const contributorsData = monthData.map((item: any, index: number) => {
          const userLogin = item[2];
          const currentOpenrank = item[3] || 0;
          const prevOpenrank = prevMonthMap.get(userLogin) || 0;
          const change = currentOpenrank - prevOpenrank;

          // 计算排名变化：当前月排名 - 上月排名
          const currentRank = index + 1;
          const prevRank = prevUserRankMap.get(userLogin) || currentRank;
          const rankChange = currentRank - prevRank;

          return {
            rank: currentRank,
            prevRank: prevRank,
            name: userLogin || '',
            platform: item[0] || 'GitHub',
            avatar: userLogin ? `https://avatars.githubusercontent.com/${userLogin}?v=4` : '',
            openrank: currentOpenrank,
            change: change,
            rankChange: rankChange,
            profileUrl: item[0] === 'GitHub' && userLogin ? `https://github.com/${userLogin}` : '',
          };
        });
        setAllContributors(contributorsData);
        setCurrentPage(1);
        setContributors(contributorsData.slice(0, pageSize));
      }
    };
    
    if (projectName) {
      loadData();
    }
  }, [projectName, timeRangeType]);

  // 当选择的日期变化时，更新贡献者数据
  useEffect(() => {
    if (!data || !data._allContributors) return;

    const monthKey = `${selectedYear}-${selectedMonth}`;
    const monthData = data._allContributors[monthKey] || [];

    // 获取上一个月的数据来计算排名变化
    const currentDate = dayjs(`${selectedYear}-${selectedMonth}`, "YYYY-MM");
    const prevMonthKey = currentDate.subtract(1, 'month').format('YYYY-MM');
    const prevMonthData = data._allContributors[prevMonthKey] || [];

    // 构建上月数据映射（用户登录名 -> openrank）
    const prevMonthMap = new Map();
    prevMonthData.forEach((item: any) => {
      prevMonthMap.set(item[2], item[3]);
    });

    // 构建上月排名映射（用户登录名 -> 排名）
    const prevMonthRankMap = new Map<number, number>();
    prevMonthData.forEach((item: any, index: number) => {
      prevMonthRankMap.set(index + 1, item[2]);
    });
    // 创建用户名到排名的映射
    const prevUserRankMap = new Map<string, number>();
    prevMonthData.forEach((item: any, index: number) => {
      if (item[2]) {
        prevUserRankMap.set(item[2], index + 1);
      }
    });

    const contributorsData = monthData.map((item: any, index: number) => {
      const userLogin = item[2];
      const currentOpenrank = item[3] || 0;
      const prevOpenrank = prevMonthMap.get(userLogin) || 0;
      const change = currentOpenrank - prevOpenrank;

      // 计算排名变化：当前月排名 - 上月排名
      const currentRank = index + 1;
      const prevRank = prevUserRankMap.get(userLogin) || currentRank;
      const rankChange = currentRank - prevRank;

      return {
        rank: currentRank,
        prevRank: prevRank,
        name: userLogin || '',
        platform: item[0] || 'GitHub',
        avatar: userLogin ? `https://avatars.githubusercontent.com/${userLogin}?v=4` : '',
        openrank: currentOpenrank,
        change: change,
        rankChange: rankChange,
        profileUrl: item[0] === 'GitHub' && userLogin ? `https://github.com/${userLogin}` : '',
      };
    });

    setAllContributors(contributorsData);
    setCurrentPage(1);
    setContributors(contributorsData.slice(0, pageSize));
  }, [selectedYear, selectedMonth, data]);

  // 分页变化时更新表格数据
  useEffect(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    setContributors(allContributors.slice(start, end));
  }, [currentPage, allContributors, pageSize]);

  const handleBack = () => {
    onBack();
  };

  const handleUserClick = (userName: string, userAvatar: string) => {
    setSelectedUser(userName);
    setSelectedUserAvatar(userAvatar);
  };

  const handleUserBack = () => {
    setSelectedUser(null);
  };

  // 渲染用户详情
  if (selectedUser) {
    return <UserDetail userName={selectedUser} userAvatar={selectedUserAvatar} onBack={handleUserBack} />;
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
          <img src={projectAvatar || data.logo} alt={data.name} className={styles.projectIntroLogo} />
        </div>
        <div className={styles.projectIntroRight}>
          <div className={styles.projectTitleRow}>
            <h1 className={styles.projectIntroTitle}>{data.name_zh || data.name}</h1>
            <div className={styles.projectIntroTags}>
              {data.tags.map((tag, index) => (
                <span key={index} className={styles.projectTag}>{tag}</span>
              ))}
            </div>
          </div>
          <p className={styles.projectIntroDesc}>{data.description_zh || data.description}</p>
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
                  <span className={styles.statValueLarge}>{data.currentOpenrank?.toFixed(2) || '0.00'}</span>
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
                  <span className={styles.statValueLarge}>{data.currentActivity?.toFixed(2) || '0.00'}</span>
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
                  <span className={styles.statValueLarge}>{data.currentParticipants?.toLocaleString() || 0}</span>
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
            <LineChart data={data.openrankHistory} color="#22c55e" timeRangeType={timeRangeType}/>
          </div>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>活跃度历史趋势</div>
            <LineChart data={data.activityHistory} color="#3b82f6" unit="%" timeRangeType={timeRangeType}/>
          </div>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>开发者参与数量历史趋势</div>
            <LineChart data={data.participantsHistory} color="#f59e0b" timeRangeType={timeRangeType}/>
          </div>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}>活跃 Issue/PR 数量历史趋势</div>
            <LineChart data={data.issueCountHistory} color="#ef4444" timeRangeType={timeRangeType}/>
          </div>
        </div>
      </div>

      {/* 第4部分：社区开发者贡献度 */}
      <div className={styles.contributorsSection}>
        <div className={styles.contributorsSectionHeader}>
          <h2 className={styles.sectionTitle}>社区开发者贡献度</h2>
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
            <div className={styles.paginationControls}>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ‹
              </button>
              <span className={styles.paginationInfo}>
                {currentPage} / {Math.ceil(allContributors.length / pageSize) || 1}
              </span>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(allContributors.length / pageSize), p + 1))}
                disabled={currentPage >= Math.ceil(allContributors.length / pageSize)}
              >
                ›
              </button>
            </div>
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
            {contributors.map((contributor) => (
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
                    </div>
                  </td>
                  <td>
                    <button
                        className={styles.userDashboardButton}
                        onClick={() => handleUserClick(contributor.name, contributor.avatar)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="21" x2="9" y2="9"/>
                      </svg>
                    </button>
                  </td>
                  <td className={styles.contributorOpenrank}>{contributor.openrank?.toFixed(2) || '0.00'}</td>
                  <td>
                    {contributor.rankChange !== undefined ? (
                      <span className={clsx(styles.rankChange, {
                        [styles.rankChangeUp]: contributor.rankChange < 0,
                        [styles.rankChangeDown]: contributor.rankChange > 0,
                        [styles.rankChangeZero]: contributor.rankChange === 0,
                      })}>
                        {contributor.rankChange < 0 ? `↑${Math.abs(contributor.rankChange)}` : contributor.rankChange > 0 ? `↓${contributor.rankChange}` : '-'}
                      </span>
                    ) : (
                      <ChangeIndicator current={contributor.openrank} previous={contributor.openrank - contributor.change}/>
                    )}
                  </td>

                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 第5部分：贡献度分布（近一年） */}
      {data && data.countryDistribution && data.countryDistribution.length > 0 && (
      <div className={styles.countryDistributionSection}>
        <h2 className={styles.sectionTitle}>贡献度分布（近一年）</h2>
        <div className={styles.countryDistributionContent}>
          {/* 左边：贡献度分布TOP10列表 */}
          <div className={styles.countryDistributionList}>
            <table className={styles.countryTable}>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>国家</th>
                  <th>开发者</th>
                  <th>OpenRank</th>
                </tr>
              </thead>
              <tbody>
                {data.countryDistribution.map((item) => (
                  <tr key={item.rank}>
                    <td>
                      <span className={clsx(styles.countryRankBadge, {
                        [styles.countryRankBadge1]: item.rank === 1,
                        [styles.countryRankBadge2]: item.rank === 2,
                        [styles.countryRankBadge3]: item.rank === 3,
                      })}>
                        {item.rank}
                      </span>
                    </td>
                    <td>
                      <div className={styles.countryInfo}>
                        <span className={styles.countryFlag}>{item.flag}</span>
                        <span className={styles.countryName}>{item.country}</span>
                      </div>
                    </td>
                    <td className={styles.countryDeveloper}>{(item.developers ?? 0).toLocaleString()}</td>
                    <td className={styles.countryOpenrank}>{(item.openrank ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 右边：地图分布 */}
          <div className={styles.countryMapContainer}>
            <CountryMapChart data={data.countryDistribution} />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}