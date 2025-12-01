import { Request, Response } from "express";
import { getWeiboHotSearch } from "./weiboHotSearch";
import { getDouyinHotSearch } from "./douyinHotSearch";

/**
 * 聚合热搜接口路由处理
 */
export async function allHotSearchHandler(req: Request, res: Response) {
  try {
    // 并行请求微博和抖音热搜
    const [weiboList, douyinList] = await Promise.all([
      getWeiboHotSearch().catch((err) => {
        console.error("获取微博热搜失败:", err);
        return [];
      }),
      getDouyinHotSearch().catch((err) => {
        console.error("获取抖音热搜失败:", err);
        return [];
      }),
    ]);

    res.json({
      code: 0,
      message: "获取成功",
      data: {
        weibo: weiboList,
        douyin: douyinList,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("聚合热搜接口错误:", error);

    res.status(500).json({
      code: 500,
      message: error.message || "获取热搜失败，请稍后再试",
    });
  }
}

