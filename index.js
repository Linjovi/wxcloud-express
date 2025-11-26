const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { catJudgementHandler } = require("./routes/catJudgement");

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
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

// 猫猫法官接口
app.post("/api/cat-judgement", catJudgementHandler);

// React 应用路由处理（所有非 API 路由都返回 index.html）
app.get("*", (req, res) => {
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
