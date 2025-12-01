import puppeteer from "puppeteer";
import { Request, Response } from "express";

interface DouyinHotSearchItem {
  rank: number;
  title: string;
  hot: number;
  link: string;
  iconType: string | null;
  originalData?: any;
}

/**
 * 爬取抖音热搜榜
 */
export async function getDouyinHotSearch(): Promise<DouyinHotSearchItem[]> {
  let browser = null;

  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled", // 关键：禁用自动化控制特征
      ],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // 注入反爬虫规避脚本
    await page.evaluateOnNewDocument(() => {
      // @ts-ignore
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
      // @ts-ignore
      window.chrome = {
        runtime: {},
      };
      // @ts-ignore
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      // @ts-ignore
      Object.defineProperty(navigator, "languages", {
        get: () => ["zh-CN", "zh", "en"],
      });
    });

    // 设置视口大小 (桌面端分辨率)
    await page.setViewport({ width: 1920, height: 1080 });

    // 设置额外的 HTTP 头
    await page.setExtraHTTPHeaders({
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    });

    // 访问抖音热搜榜页面
    // 抖音页面动态性强，建议等待 networkidle2
    await page.goto("https://www.douyin.com/hot", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 尝试从 DOM 中提取热搜数据
    const hotSearchList = await page.evaluate(() => {
      const items: any[] = [];

      try {
        // 查找包含"抖音热榜"的标题，然后找到其后的列表
        const h1 = Array.from(document.querySelectorAll("h1")).find((el) =>
          el.textContent?.includes("抖音热榜")
        );

        if (!h1) return items;

        // 列表通常在 h1 的父元素的兄弟元素或者后面的元素中
        // 根据日志结构: <div class="bMt1sF9E"><h1>抖音热榜</h1></div> <ul class="WxZ6fnC5">
        const container = h1.parentElement;
        const listUl = container?.nextElementSibling;

        if (!listUl || listUl.tagName !== "UL") return items;

        const listItems = listUl.querySelectorAll("li");

        listItems.forEach((li, index) => {
          try {
            // 提取标题和链接
            const linkEl = li.querySelector("a");
            if (!linkEl) return;

            const title = linkEl.textContent?.trim() || "";
            const link = linkEl.getAttribute("href") || "";

            // 提取热度
            // 结构: <div><span>1156.5万</span><span>热度</span></div>
            // 找到包含"热度"的元素，然后找它前面的兄弟元素
            let hot = "";
            const hotLabel = Array.from(li.querySelectorAll("span")).find((s) =>
              s.textContent?.includes("热度")
            );
            if (hotLabel) {
              const hotValueEl = hotLabel.previousElementSibling;
              if (hotValueEl) {
                hot = hotValueEl.textContent?.trim() || "";
              }
            }

            // 提取排名
            // 可能是图片（置顶/前三）或文本
            let rank: string | number = index + 1;
            const listStyleDiv = li.querySelector(".listStyle");
            if (listStyleDiv) {
              const img = listStyleDiv.querySelector("img");
              if (img) {
                const src = img.src;
                if (src.includes("up.svg")) rank = "置顶";
                else if (src.includes("hot_top1.svg")) rank = 1;
                else if (src.includes("hot_top2.svg")) rank = 2;
                else if (src.includes("hot_top3.svg")) rank = 3;
              } else {
                const rankText = listStyleDiv.textContent?.trim();
                if (rankText && !isNaN(parseInt(rankText))) {
                  rank = parseInt(rankText);
                }
              }
            }

            // 提取图标类型
            let iconType = null;
            // 图标通常在标题链接后面
            // <a ...><h3>标题</h3></a><img src=".../hot_hot.png" />
            const titleContainer = linkEl.parentElement;
            if (titleContainer) {
              const iconImg = titleContainer.querySelector("img");
              if (iconImg) {
                const src = iconImg.src;
                if (src.includes("hot_hot")) iconType = "hot";
                else if (src.includes("hot_new")) iconType = "new";
                else if (src.includes("hot_first")) iconType = "first"; // 首发?
                else if (src.includes("hot_exclusive"))
                  iconType = "exclusive"; // 独家?
                else if (src.includes("piyao")) iconType = "rumor";
              }
            }

            // 处理链接完整性
            let fullLink = link;
            if (link && !link.startsWith("http")) {
              fullLink = `https://www.douyin.com${link}`;
            }

            items.push({
              rank,
              title,
              hot,
              link: fullLink,
              iconType,
            });
          } catch (err) {
            console.error("解析列表项失败", err);
          }
        });
      } catch (e) {
        console.error("解析 DOM 失败:", e);
      }

      return items;
    });

    return hotSearchList;
  } catch (error) {
    console.error("爬取抖音热搜榜错误:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 抖音热搜榜接口路由处理
 */
export async function douyinHotSearchHandler(req: Request, res: Response) {
  try {
    const hotSearchList = await getDouyinHotSearch();

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
    console.error("抖音热搜榜接口错误:", error);

    res.status(500).json({
      code: 500,
      message: error.message || "获取抖音热搜榜失败，请稍后再试",
    });
  }
}
