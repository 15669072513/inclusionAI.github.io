import React, { useState, useMemo, useEffect, useRef } from "react";
import { DatePicker, ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import clsx from "clsx";
import styles from "../research.module.css";
import ProjectDetail from "./ProjectDetail";

// 设置 Day.js 使用中文
dayjs.locale("zh-cn");

// API 基础 URL
const API_BASE_URL = "https://selfoss.open-digger.cn";

// 项目列表数据接口
interface LeaderboardItem {
  rank: number;
  prevRank: number;
  id: string;
  platform: string;
  avatar: string;
  name: string;
  name_zh: string;
  description: string;
  description_zh: string;
  openrank: number;
  openrankDelta: number;
  participants: number;
  participantsDelta: number;
}

// Rank badges for top 3
const RANK_BADGES: { [key: number]: string } = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

// Helper function for rank change indicators
function RankChange({ current, previous }: { current: number; previous: number }) {
  const diff = previous - current; // 排名上升为正，下降为负

  if (diff === 0) {
    return <span className={styles.rankNoChange}>-</span>;
  }

  const isUp = diff > 0;
  return (
    <span className={clsx(styles.rankChange, isUp ? styles.rankUp : styles.rankDown)}>
      {isUp ? "↑" : "↓"} {Math.abs(diff)}
    </span>
  );
}

// Helper function for participant change
function ParticipantChange({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;

  if (diff === 0) {
    return <span className={styles.rankNoChange}>-</span>;
  }

  const isUp = diff > 0;
  return (
    <span className={clsx(styles.rankChange, isUp ? styles.rankUp : styles.rankDown)}>
      {isUp ? "↑" : "↓"} {Math.abs(diff).toLocaleString()}
    </span>
  );
}

// 获取项目列表数据
async function fetchLeaderboardData(timeType: "month" | "year", year: string, month: string): Promise<LeaderboardItem[]> {
  try {
    const dateStr = timeType === "month" ? `${year}${parseInt(month)}` : year;
    const url = `${API_BASE_URL}/open_leaderboard/agentic%20ai/project/${timeType}/${dateStr}/data.json`;
    console.log("Fetching leaderboard from:", url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const json = await response.json();
    const data = json.data || json;
    console.log("Leaderboard data:", data);
    
    return (Array.isArray(data) ? data : []).map((item: any, index: number) => ({
      rank: item.rank || index + 1,
      prevRank: item.rank + (item.rankDelta || 0),
      id: item.id || "",
      platform: item.platform || "All",
      avatar: item.avatar || "",
      name: item.name || "",
      name_zh: item.name_zh || item.name || "",
      description: item.description || "",
      description_zh: item.description_zh || item.description || "",
      openrank: item.openrank || 0,
      openrankDelta: item.openrankDelta || 0,
      participants: item.participants || 0,
      participantsDelta: item.participantsDelta || 0,
    }));
  } catch (error) {
    console.error("Failed to fetch leaderboard data:", error);
    return [];
  }
}

export default function Leaderboard() {
  // 获取上一个月的时间
  const lastMonth = dayjs().subtract(1, 'month');
  
  const [timeRangeType, setTimeRangeType] = useState<"month" | "year">("month");
  const [selectedYear, setSelectedYear] = useState(lastMonth.format("YYYY"));
  const [selectedMonth, setSelectedMonth] = useState(lastMonth.format("MM"));
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<keyof LeaderboardItem>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  // 获取数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchLeaderboardData(timeRangeType, selectedYear, selectedMonth);
      setLeaderboardData(data);
      setLoading(false);
      setCurrentPage(1);
    };
    loadData();
  }, [timeRangeType, selectedYear, selectedMonth]);

  // 发送高度给父页面
  useEffect(() => {
    const sendHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        window.parent.postMessage({ type: 'leaderboard-height', height }, '*');
      }
    };

    sendHeight();

    const observer = new ResizeObserver(sendHeight);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => observer.disconnect();
  }, [selectedProject, leaderboardData]);

  const filteredData = useMemo(() => {
    return leaderboardData.filter((item) => {
      // Search filter
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [searchQuery, leaderboardData]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [filteredData, sortBy, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));

  const handleSort = (column: keyof LeaderboardItem) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ column }: { column: keyof LeaderboardItem }) => {
    if (sortBy !== column) return null;
    return (
      <span className={styles.sortIcon}>
        {sortOrder === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  // 处理项目点击，传递完整项目信息
  const handleProjectClick = (item: LeaderboardItem) => {
    // 从 id 中提取项目名，例如 ":companies/nvidia/dynamo" -> "dynamo"
    const projectId = item.id;
    setSelectedProject(projectId);
  };

  // 加载状态
  if (loading) {
    return (
      <div className={styles.leaderboard} ref={contentRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.leaderboard} ref={contentRef}>
      {selectedProject ? (
        <ProjectDetail 
          projectName={selectedProject} 
          onBack={() => setSelectedProject(null)} 
        />
      ) : (
        <>
          <div className={styles.leaderboardFilters}>
        {/* 时间范围类型 Tab 按钮 */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>时间粒度</label>
          <div className={styles.tabButtons}>
            <button
              className={clsx(styles.tabButton, timeRangeType === "month" && styles.tabButtonActive)}
              onClick={() => setTimeRangeType("month")}
            >
              按月
            </button>
            <button
              className={clsx(styles.tabButton, timeRangeType === "year" && styles.tabButtonActive)}
              onClick={() => setTimeRangeType("year")}
            >
              按年
            </button>
          </div>
        </div>

        {/* 日期选择框 */}
        <div className={styles.filterGroup} style={{ width: '180px' }}>
          <label className={styles.filterLabel}>时间选择</label>
          <ConfigProvider
            locale={zhCN}
            theme={{
              token: {
                fontSize: 16,
              },
            }}
          >
            <DatePicker
              value={timeRangeType === "month"
                ? dayjs(`${selectedYear}-${selectedMonth}`, "YYYY-MM")
                : dayjs(selectedYear, "YYYY")
              }
              format={timeRangeType === "month" ? "YYYY/MM" : "YYYY"}
              picker={timeRangeType}
              onChange={(date) => {
                if (date) {
                  const year = date.year();
                  setSelectedYear(String(year));
                  if (timeRangeType === "month") {
                    setSelectedMonth(String(date.month() + 1).padStart(2, "0"));
                  }
                }
              }}
              allowClear={false}
              style={{ width: '100%', height: '42px' }}
              popupClassName="custom-date-picker-popup"
            />
          </ConfigProvider>
        </div>

        {/* 搜索框 */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>搜索</label>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="搜索项目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.leaderboardTable}>
          {/* 表头 */}
          <div className={styles.leaderboardHeader}>
            <div className={styles.headerCell} style={{ width: "100px" }} onClick={() => handleSort("rank")}>
              排名 <SortIcon column="rank" />
            </div>
            <div className={styles.headerCellProject}  style={{ width: "800px" }} onClick={() => handleSort("name")}>
              项目 <SortIcon column="name" />
            </div>
            <div className={styles.headerCellRank} style={{ width: "150px" }} onClick={() => handleSort("openrank")}>
              OpenRank <SortIcon column="openrank" />
            </div>
            <div className={styles.headerCell} style={{ width: "150px" }} onClick={() => handleSort("participants")}>
              参与者数量 <SortIcon column="participants" />
            </div>
          </div>


          {/* 数据行 */}
          <div className={styles.leaderboardTbody}>
            {paginatedData.map((item) => (
              <div key={item.rank} className={styles.leaderboardRow}>
                <div className={styles.rankCellWrapper}>
                  <div className={clsx(styles.rankCell, {
                    [styles.rank1]: item.rank === 1,
                    [styles.rank2]: item.rank === 2,
                    [styles.rank3]: item.rank === 3,
                  })}>
                    {RANK_BADGES[item.rank] || `${item.rank}`}
                  </div>
                  <RankChange current={item.rank} previous={item.prevRank} />
                </div>
                <div className={styles.projectCellWrapper}>
                  <div className={styles.projectInfo}>
                    <img src={item.avatar} alt={item.name} className={styles.projectLogo} />
                    <div className={styles.projectDetails}>
                      <span
                        className={styles.projectNameLink}
                        onClick={() => handleProjectClick(item)}
                      >
                        {item.name_zh || item.name}
                      </span>
                      <span className={styles.projectDesc}>{item.description_zh || item.description}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.openrankCell}>
                  <span className={styles.openrankValue}>{item.openrank?.toFixed(2) || '0.00'}</span>
                  <span className={clsx(styles.rankChange, item.openrankDelta >= 0 ? styles.rankUp : styles.rankDown)}>
                    {item.openrankDelta >= 0 ? "↑" : "↓"} {Math.abs(item.openrankDelta).toFixed(2)}
                  </span>
                </div>
                <div className={styles.participantsCell}>
                  <div className={styles.participantsValue}>{item.participants?.toLocaleString() || 0}</div>
                  <span className={clsx(styles.rankChange, item.participantsDelta >= 0 ? styles.rankUp : styles.rankDown)}>
                    {item.participantsDelta >= 0 ? "↑" : "↓"} {Math.abs(item.participantsDelta).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageArrow}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ◀
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={clsx(styles.pageNum, currentPage === page && styles.pageNumActive)}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className={styles.pageArrow}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            ▶
          </button>
        </div>
        )}
        </>
      )}
    </div>
  );
}
