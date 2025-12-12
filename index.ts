import path from "path";
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { catJudgementHandler } from "./routes/catJudgement";
import { weiboHotSearchHandler } from "./routes/weiboHotSearch";
import { douyinHotSearchHandler } from "./routes/douyinHotSearch";
import { xiaohongshuHotSearchHandler } from "./routes/xiaohongshuHotSearch";
import { hotSearchSummaryHandler } from "./routes/hotSearchSummary";
import { complimentStylesHandler } from "./routes/complimentStyles";
import { tarotHandler } from "./routes/getTarot";

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 静态文件服务（React 构建产物）
app.use(express.static(path.join(__dirname, "public")));

// API 路由

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req: Request, res: Response) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  } else {
    res.status(400).send("Missing x-wx-source header");
  }
});

// 猫猫法官接口
app.post("/api/cat-judgement", catJudgementHandler);

// 塔罗牌解读接口
app.post("/api/tarot-reading", tarotHandler);

// 微博热搜榜接口
app.get("/api/weibo-hot-search", weiboHotSearchHandler);

// 抖音热搜榜接口
app.get("/api/douyin-hot-search", douyinHotSearchHandler);

// 小红书热搜榜接口
app.get("/api/xiaohongshu-hot-search", xiaohongshuHotSearchHandler);

// 热搜总结接口
app.get("/api/hot-search-summary", hotSearchSummaryHandler);

// 夸夸喵灵感接口
app.get("/api/compliment-styles", complimentStylesHandler);


// React 应用路由处理（所有非 API 路由都返回 index.html）
app.get("*", (req: Request, res: Response) => {
  // 排除 API 路由
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ code: 404, message: "Not found" });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;

async function bootstrap() {
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
