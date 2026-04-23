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
  { rank: 1, prevRank: 1, name: "TensorFlow", logo: "https://www.gstatic.com/images/branding/product/2x/tensorflow_2020q4_48dp.png", description: "An end-to-end open source machine learning platform", org: "Google", country: "US", participants: 3250, prevParticipants: 3100, openrank: 1, prevOpenrank: 2, activity: 98, openness: 95, impact: 99, totalScore: 97.5 },
  { rank: 2, prevRank: 3, name: "PyTorch", logo: "https://pytorch.org/assets/images/pytorch-logo.png", description: "An open source machine learning framework", org: "Meta", country: "US", participants: 2800, prevParticipants: 2650, openrank: 2, prevOpenrank: 1, activity: 96, openness: 92, impact: 98, totalScore: 95.2 },
  { rank: 3, prevRank: 2, name: "Transformers", logo: "https://huggingface.co/front/assets/huggingface_logo.svg", description: "State-of-the-art Machine Learning for JAX, PyTorch and TensorFlow", org: "Hugging Face", country: "US", participants: 2100, prevParticipants: 1950, openrank: 3, prevOpenrank: 3, activity: 94, openness: 98, impact: 95, totalScore: 95.0 },
  { rank: 4, prevRank: 4, name: "Kubernetes", logo: "https://kubernetes.io/images/kubernetes-horizontal-color.png", description: "Container Orchestration", org: "CNCF", country: "US", participants: 3500, prevParticipants: 3400, openrank: 4, prevOpenrank: 5, activity: 95, openness: 90, impact: 96, totalScore: 93.8 },
  { rank: 5, prevRank: 7, name: "React", logo: "https://react.dev/images/logo.svg", description: "The library for web and native user interfaces", org: "Meta", country: "US", participants: 2900, prevParticipants: 2700, openrank: 5, prevOpenrank: 4, activity: 93, openness: 88, impact: 97, totalScore: 92.5 },
  { rank: 6, prevRank: 5, name: "Vue", logo: "https://vuejs.org/logo.svg", description: "The Progressive JavaScript Framework", org: "Vue Team", country: "CN", participants: 1800, prevParticipants: 1850, openrank: 8, prevOpenrank: 6, activity: 90, openness: 95, impact: 91, totalScore: 91.2 },
  { rank: 7, prevRank: 6, name: "Ansible", logo: "https://www.ansible.com/favicon.ico", description: "Simple IT automation", org: "Red Hat", country: "US", participants: 1500, prevParticipants: 1520, openrank: 7, prevOpenrank: 7, activity: 88, openness: 92, impact: 88, totalScore: 89.5 },
  { rank: 8, prevRank: 10, name: "Istio", logo: "https://istio.io/favicons/android-chrome-192x192.png", description: "Connect, secure, control, and observe services", org: "CNCF", country: "US", participants: 1200, prevParticipants: 1100, openrank: 6, prevOpenrank: 9, activity: 85, openness: 94, impact: 86, totalScore: 88.2 },
  { rank: 9, prevRank: 8, name: "Apache Dubbo", logo: "https://dubbo.apache.org/img/favicon.ico", description: "A high-performance, java based, RPC framework", org: "Apache", country: "CN", participants: 980, prevParticipants: 1000, openrank: 10, prevOpenrank: 8, activity: 82, openness: 90, impact: 84, totalScore: 85.5 },
  { rank: 10, prevRank: 9, name: "Ant Design", logo: "https://gw.alipayobjects.com/zos/basement_prod/4e818234-1b2a-4cca-857f-1529c3859a2f.svg", description: "An enterprise-class UI design language", org: "Ant Group", country: "CN", participants: 1650, prevParticipants: 1680, openrank: 9, prevOpenrank: 10, activity: 86, openness: 88, impact: 82, totalScore: 85.0 },
  { rank: 11, prevRank: 12, name: "Flink", logo: "https://flink.apache.org/img/favicon.ico", description: "Distributed stream processing framework", org: "Apache", country: "CN", participants: 1100, prevParticipants: 1050, openrank: 12, prevOpenrank: 11, activity: 84, openness: 89, impact: 80, totalScore: 84.2 },
  { rank: 12, prevRank: 11, name: "RocketMQ", logo: "https://rocketmq.apache.org/assets/favicon.ico", description: "Distributed messaging and streaming platform", org: "Apache", country: "CN", participants: 950, prevParticipants: 980, openrank: 11, prevOpenrank: 12, activity: 80, openness: 91, impact: 78, totalScore: 83.0 },
  { rank: 13, prevRank: 15, name: "Spring Boot", logo: "https://spring.io/favicon.ico", description: "Creating stand-alone, production-grade Spring applications", org: "VMware", country: "US", participants: 2200, prevParticipants: 2000, openrank: 13, prevOpenrank: 14, activity: 87, openness: 80, impact: 85, totalScore: 82.8 },
  { rank: 14, prevRank: 13, name: ".NET", logo: "https:// dotnet.microsoft.com/favicon.ico", description: "Development platform for building many types of applications", org: "Microsoft", country: "US", participants: 2000, prevParticipants: 2050, openrank: 14, prevOpenrank: 13, activity: 85, openness: 78, impact: 84, totalScore: 81.5 },
  { rank: 15, prevRank: 14, name: "Seata", logo: "https://seata.io/img/favicon.ico", description: "Distributed transaction solution", org: "Apache", country: "CN", participants: 780, prevParticipants: 800, openrank: 15, prevOpenrank: 15, activity: 76, openness: 87, impact: 74, totalScore: 78.8 },
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
            <div className={styles.headerCell} style={{ width: "80px" }} onClick={() => handleSort("rank")}>
              排名 <SortIcon column="rank" />
            </div>
            <div className={styles.headerCellProject}  style={{ width: "850px" }} onClick={() => handleSort("name")}>
              项目 <SortIcon column="name" />
            </div>
            <div className={styles.headerCell} style={{ width: "120px" }} onClick={() => handleSort("openrank")}>
              OpenRank <SortIcon column="openrank" />
            </div>
            <div className={styles.headerCell} style={{ width: "120px" }} onClick={() => handleSort("participants")}>
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
