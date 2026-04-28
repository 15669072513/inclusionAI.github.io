import React, { useState, useMemo, useEffect, useRef } from "react";
import { DatePicker, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import clsx from "clsx";
import styles from "../research.module.css";
import ProjectDetail from "./ProjectDetail";

// 设置 Day.js 使用中文
dayjs.locale("zh-cn");

// Mock data for Leaderboard
interface LeaderboardItem {
  rank: number;
  prevRank: number; // 上期排名
  name: string;
  logo: string;
  description: string;
  org: string;
  country: string;
  participants: number;
  prevParticipants: number; // 上期参与者数量
  openrank: number;
  prevOpenrank: number; // 上期OpenRank排名
  activity: number;
  openness: number;
  impact: number;
  totalScore: number;
}

// Rank badges for top 3
const RANK_BADGES: { [key: number]: string } = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

const MOCK_LEADERBOARD_DATA: LeaderboardItem[] = [
  { rank: 1, prevRank: 1, name: "mosn/layotto", logo: "https://www.gstatic.com/images/branding/product/2x/tensorflow_2020q4_48dp.png", description: "An end-to-end open source machine learning platform", org: "Google", country: "US", participants: 3250, prevParticipants: 3100, openrank: 1, prevOpenrank: 2, activity: 98, openness: 95, impact: 99, totalScore: 97.5 },
  { rank: 2, prevRank: 3, name: "pytorch/pytorch", logo: "https://pytorch.org/assets/images/pytorch-logo.png", description: "An open source machine learning framework", org: "Meta", country: "US", participants: 2800, prevParticipants: 2650, openrank: 2, prevOpenrank: 1, activity: 96, openness: 92, impact: 98, totalScore: 95.2 },
  { rank: 3, prevRank: 2, name: "tensorflow/tensorflow", logo: "https://huggingface.co/front/assets/huggingface_logo.svg", description: "State-of-the-art Machine Learning for JAX, PyTorch and TensorFlow", org: "Hugging Face", country: "US", participants: 2100, prevParticipants: 1950, openrank: 3, prevOpenrank: 3, activity: 94, openness: 98, impact: 95, totalScore: 95.0 },
  { rank: 4, prevRank: 2, name: "tensorflow/tensorflow", logo: "https://huggingface.co/front/assets/huggingface_logo.svg", description: "State-of-the-art Machine Learning for JAX, PyTorch and TensorFlow", org: "Hugging Face", country: "US", participants: 2100, prevParticipants: 1950, openrank: 3, prevOpenrank: 3, activity: 94, openness: 98, impact: 95, totalScore: 95.0 },
  { rank: 5, prevRank: 2, name: "tensorflow/tensorflow", logo: "https://huggingface.co/front/assets/huggingface_logo.svg", description: "State-of-the-art Machine Learning for JAX, PyTorch and TensorFlow", org: "Hugging Face", country: "US", participants: 2100, prevParticipants: 1950, openrank: 3, prevOpenrank: 3, activity: 94, openness: 98, impact: 95, totalScore: 95.0 },
  { rank: 6, prevRank: 2, name: "tensorflow/tensorflow", logo: "https://huggingface.co/front/assets/huggingface_logo.svg", description: "State-of-the-art Machine Learning for JAX, PyTorch and TensorFlow", org: "Hugging Face", country: "US", participants: 2100, prevParticipants: 1950, openrank: 3, prevOpenrank: 3, activity: 94, openness: 98, impact: 95, totalScore: 95.0 },
  { rank: 7, prevRank: 2, name: "tensorflow/tensorflow", logo: "https://huggingface.co/front/assets/huggingface_logo.svg", description: "State-of-the-art Machine Learning for JAX, PyTorch and TensorFlow", org: "Hugging Face", country: "US", participants: 2100, prevParticipants: 1950, openrank: 3, prevOpenrank: 3, activity: 94, openness: 98, impact: 95, totalScore: 95.0 },
  { rank: 8, prevRank: 2, name: "tensorflow/tensorflow", logo: "https://huggingface.co/front/assets/huggingface_logo.svg", description: "State-of-the-art Machine Learning for JAX, PyTorch and TensorFlow", org: "Hugging Face", country: "US", participants: 2100, prevParticipants: 1950, openrank: 3, prevOpenrank: 3, activity: 94, openness: 98, impact: 95, totalScore: 95.0 },
  { rank: 9, prevRank: 2, name: "tensorflow/tensorflow", logo: "https://huggingface.co/front/assets/huggingface_logo.svg", description: "State-of-the-art Machine Learning for JAX, PyTorch and TensorFlow", org: "Hugging Face", country: "US", participants: 2100, prevParticipants: 1950, openrank: 3, prevOpenrank: 3, activity: 94, openness: 98, impact: 95, totalScore: 95.0 },
  { rank: 10, prevRank: 2, name: "tensorflow/tensorflow", logo: "https://huggingface.co/front/assets/huggingface_logo.svg", description: "State-of-the-art Machine Learning for JAX, PyTorch and TensorFlow", org: "Hugging Face", country: "US", participants: 2100, prevParticipants: 1950, openrank: 3, prevOpenrank: 3, activity: 94, openness: 98, impact: 95, totalScore: 95.0 },
  { rank: 11, prevRank: 2, name: "tensorflow/tensorflow", logo: "https://huggingface.co/front/assets/huggingface_logo.svg", description: "State-of-the-art Machine Learning for JAX, PyTorch and TensorFlow", org: "Hugging Face", country: "US", participants: 2100, prevParticipants: 1950, openrank: 3, prevOpenrank: 3, activity: 94, openness: 98, impact: 95, totalScore: 95.0 },
];

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

export default function Leaderboard() {
  const [timeRangeType, setTimeRangeType] = useState<"month" | "year">("month");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("04");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<keyof LeaderboardItem>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

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
  }, [selectedProject]);

  const filteredData = useMemo(() => {
    return MOCK_LEADERBOARD_DATA.filter((item) => {
      // Search filter
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [searchQuery]);

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

  const totalPages = Math.ceil(sortedData.length / pageSize);

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
                    <img src={item.logo} alt={item.name} className={styles.projectLogo} />
                    <div className={styles.projectDetails}>
                      <span
                        className={styles.projectNameLink}
                        onClick={() => setSelectedProject(item.name)}
                      >
                        {item.name}
                      </span>
                      <span className={styles.projectDesc}>{item.description}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.openrankCell}>
                  <span className={styles.openrankValue}>{item.openrank}</span>
                  <RankChange current={item.openrank} previous={item.prevOpenrank} />
                </div>
                <div className={styles.participantsCell}>
                  <div className={styles.participantsValue}>{item.participants.toLocaleString()}</div>
                  <ParticipantChange current={item.participants} previous={item.prevParticipants} />
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
