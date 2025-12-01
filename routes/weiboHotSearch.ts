import puppeteer from "puppeteer";
import { Request, Response } from "express";

interface HotSearchItem {
  rank: string | number | null;
  title: string;
  link: string | null;
  hot: string | null;
  iconType: string | null;
}

/**
 * 爬取微博热搜榜
 */
export async function getWeiboHotSearch(): Promise<HotSearchItem[]> {
  let browser = null;

  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // 设置视口大小
    await page.setViewport({ width: 375, height: 667 });

    // 设置额外的 HTTP 头，进一步模拟真实浏览器
    await page.setExtraHTTPHeaders({
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    });

    // 访问微博热搜榜页面，只等待HTML加载完成，不等待JS执行
    await page.goto("https://s.weibo.com/top/summary?cate=realtimehot", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // 等待热搜列表加载（表格结构）
    await page.waitForSelector("table tbody tr", { timeout: 10000 });

    // 提取热搜数据
    const hotSearchList = await page.evaluate(() => {
      const items: any[] = [];

      // 查找所有热搜项（表格行）
      const rows = document.querySelectorAll("table tbody tr");

      rows.forEach((row) => {
        try {
          // 第一列：排名
          const rankCell = row.querySelector("td.td-01");
          // 第二列：标题和链接
          const titleCell = row.querySelector("td.td-02");
          // 第三列：图标类型
          const iconCell = row.querySelector("td.td-03");

          if (!titleCell) return;

          // 提取排名
          let rank: string | number | null = null;
          if (rankCell) {
            const rankText = rankCell.textContent?.trim() || "";
            // 检查是否有置顶图标
            const topIcon = rankCell.querySelector("i.icon-top");
            if (topIcon) {
              rank = "置顶";
            } else if (rankText) {
              // 尝试解析为数字
              const rankNum = parseInt(rankText);
              rank = isNaN(rankNum) ? rankText : rankNum;
            }
          }

          // 提取标题和链接
          const linkElement = titleCell.querySelector("a");
          if (!linkElement) return;

          const title = linkElement.textContent?.trim() || "";
          const href = linkElement.getAttribute("href") || "";

          // 提取热度值（在span中，紧跟在a标签后面）
          const spanElement = titleCell.querySelector("span");
          let hot: string | null = null;
          if (spanElement) {
            hot = spanElement.textContent?.trim() || "";
            // 移除可能的"剧集"、"电影"等前缀
            hot = hot.replace(/^(剧集|电影)\s*/, "").trim();
          }

          // 提取图标类型
          let iconType: string | null = null;
          if (iconCell) {
            const iconElement = iconCell.querySelector("i.icon-txt");
            if (iconElement) {
              const iconText = iconElement.textContent?.trim() || "";
              // 根据图标文本判断类型
              if (iconText === "热") {
                iconType = "hot";
              } else if (iconText === "新") {
                iconType = "new";
              } else if (iconText === "沸") {
                iconType = "boil";
              } else if (iconText === "辟谣") {
                iconType = "rumor";
              } else {
                iconType = iconText;
              }
            }
          }

          // 处理链接（如果是相对路径，需要拼接完整URL）
          let fullLink: string | null = href;
          if (
            href &&
            href !== "#" &&
            !href.startsWith("http") &&
            !href.startsWith("javascript")
          ) {
            fullLink = href.startsWith("/")
              ? `https://s.weibo.com${href}`
              : `https://s.weibo.com/${href}`;
          } else if (href.startsWith("javascript")) {
            fullLink = null;
          }

          // 只添加有标题的项
          if (title) {
            items.push({
              rank: rank,
              title: title,
              link: fullLink,
              hot: hot || null,
              iconType: iconType,
            });
          }
        } catch (error) {
          console.error("解析热搜项错误:", error);
        }
      });

      return items;
    });

    return hotSearchList;
  } catch (error) {
    console.error("爬取微博热搜榜错误:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 微博热搜榜接口路由处理
 */
export async function weiboHotSearchHandler(req: Request, res: Response) {
  try {
    const hotSearchList = await getWeiboHotSearch();

    res.json({
      code: 0,
      message: "获取成功",
      data: {
        list: hotSearchList,
        count: hotSearchList.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("微博热搜榜接口错误:", error);

    res.status(500).json({
      code: 500,
      message: error.message || "获取微博热搜榜失败，请稍后再试",
    });
  }
}
