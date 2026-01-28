# Svelte AI Fullstack

一个基于 SvelteKit 的全栈 AI 应用，支持聊天和图片生成功能。

## ✨ 特性

- 🤖 **AI 聊天** - 支持多种免费和付费模型
  - 🆓 **Groq** (Llama 3.3) - 免费且极快
  - 🆓 **Google Gemini** - 免费且强大，**支持 Vision (图片识别)** 🖼️
  - 🆓 **智谱 AI** (GLM-4) - 有免费额度
  - 💰 **OpenAI** (GPT-3.5/4) - 付费，**GPT-4o 支持 Vision** 🖼️
  - 💰 **DeepSeek** - 需要余额
- 📸 **Vision (图片识别)** - 在聊天中上传图片，让 AI 分析内容 ⭐️ **新功能**
  - ✅ 支持 Google Gemini (免费推荐)
  - ✅ 支持 OpenAI GPT-4o/4o-mini
  - ✅ 支持 Groq Llama 3.2 Vision (实验性)
  - ✅ 支持智谱 GLM-4V
- 🎨 **AI 图片生成** - 使用 OpenAI DALL-E 3 生成高质量图片
- 🖼️ **图片分析** - 使用 OpenAI GPT-4 Vision 分析图片并生成提示词
- 🔗 **掘金集成** - 一键跳转到掘金使用生成的提示词创建图片
- 📋 **复制功能** - 复制文件名和图片链接到剪贴板
- ⚙️ **灵活配置** - 通过环境变量轻松切换 AI 服务
- 🏗️ **模块化架构** - 高度解耦，易于扩展新的 AI 服务

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件并填入你的 API Keys：

```env
# ==================== 免费 AI 服务（推荐） ====================

# Groq API Key (完全免费，速度极快) ⭐️ 推荐
# 获取地址: https://console.groq.com/
GROQ_API_KEY=your-groq-api-key

# Google Gemini API Key (免费) ⭐️ 推荐
# 获取地址: https://ai.google.dev/
GEMINI_API_KEY=your-gemini-api-key

# 智谱 AI GLM API Key (有免费额度)
# 获取地址: https://open.bigmodel.cn/
GLM_API_KEY=your-glm-api-key

# ==================== 付费 AI 服务 ====================

# DeepSeek API Key (需要余额)
# 获取地址: https://platform.deepseek.com/
DEEPSEEK_API_KEY=your-deepseek-api-key

# OpenAI API Key (用于图片分析、图片生成和聊天)
# 获取地址: https://platform.openai.com/
OPENAI_API_KEY=your-openai-api-key

# ==================== 服务配置 ====================

# 聊天服务类型 (groq | gemini | glm | openai | deepseek)
# 推荐使用免费服务:
# - groq: Groq (完全免费，速度极快) ⭐️
# - gemini: Google Gemini (免费，支持 Vision)
# - glm: 智谱 AI (有免费额度)
# - openai: OpenAI GPT-3.5/4 (付费)
# - deepseek: DeepSeek (需要余额)
CHAT_SERVICE_TYPE=groq
```

#### 🎯 服务选择建议

##### 1️⃣ Groq (推荐首选)
- ✅ **完全免费**
- ✅ **速度极快** (使用专用 AI 芯片)
- ✅ **质量优秀** (Llama 3.3 70B 最新模型)
- 📊 **限制**: 每分钟 30 次请求，每天 14,400 次
- 🆕 **更新**: 已升级到 Llama 3.3 (更强大的性能)

**使用方法**:
```env
CHAT_SERVICE_TYPE=groq
```

##### 2️⃣ Google Gemini (推荐备选)
- ✅ **完全免费**
- ✅ **功能强大** (Gemini 1.5 Flash)
- ✅ **多模态支持** (支持图片识别 Vision)
- 📊 **限制**: 每分钟 15 次请求，每天 1,500 次

**使用方法**:
```env
CHAT_SERVICE_TYPE=gemini
```

##### 3️⃣ 智谱 AI GLM
- ✅ **有免费额度**
- ✅ **中文能力强**
- ✅ **国内服务，速度快**

**使用方法**:
```env
CHAT_SERVICE_TYPE=glm
```

##### 4️⃣ OpenAI (付费)
- 💰 **需要付费**
- ✅ **质量最高**
- 🎨 **图片功能必需**: 图片分析和生成需要 OpenAI

**使用方法**:
```env
CHAT_SERVICE_TYPE=openai
```

##### 5️⃣ DeepSeek (需要余额)
- 💰 **需要账户余额**
- ⚠️ **当前余额不足**: 使用前需要充值

**使用方法**:
```env
CHAT_SERVICE_TYPE=deepseek
```

#### 🔄 如何切换服务

1. 编辑 `.env` 文件
2. 修改 `CHAT_SERVICE_TYPE` 的值
3. 保存文件
4. **重启开发服务器** (重要！)

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
pnpm dev
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5174

## 📖 使用指南

### 🤖 聊天功能

1. 访问聊天页面 `/chat`
2. 输入消息并发送
3. AI 会自动回复

**支持的聊天模型对比：**

| 服务 | 类型 | 模型 | 费用 | 速度 | Vision 支持 | 推荐指数 |
|------|------|------|------|------|-------------|---------|
| **Groq** | `groq` | Llama 3.3 70B | 🆓 免费 | ⚡️ 极快 | ❌ | ⭐️⭐️⭐️⭐️⭐️ |
| **Gemini** | `gemini` | Gemini 1.5 Flash | 🆓 免费 | ⚡️ 快 | ✅ 🖼️ | ⭐️⭐️⭐️⭐️⭐️ |
| **智谱 AI** | `glm` | GLM-4-Flash | 💰 免费额度 | ⚡️ 快 | ✅ (GLM-4V) | ⭐️⭐️⭐️⭐️ |
| **OpenAI** | `openai` | GPT-4o-mini | 💰 付费 | ⚡️ 快 | ✅ 🖼️ | ⭐️⭐️⭐️⭐️⭐️ |
| **DeepSeek** | `deepseek` | DeepSeek-Chat | 💰 付费 | ⚡️ 快 | ❌ | ⭐️⭐️⭐️ |

### 📸 Vision (图片识别) 功能 ⭐️ **新功能**

在聊天中上传图片，让 AI 分析图片内容！

#### 使用步骤

1. 访问聊天页面 `/chat`
2. 点击输入框左侧的 **"+"** 按钮
3. 选择一张图片（JPG, PNG, WebP 等，最大 10MB）
4. 输入问题或直接发送
5. AI 会分析图片并回答

#### 支持 Vision 的模型

##### ✅ 完全支持 Vision 的模型

**1. Google Gemini (推荐) ⭐️**
- **模型**: `gemini-1.5-flash`, `gemini-1.5-pro`
- **特点**: 免费，性能优秀，完全支持图片分析
- **配置**: 
  ```env
  CHAT_SERVICE_TYPE=gemini
  GEMINI_API_KEY=your_api_key_here
  ```
- **获取方式**: https://ai.google.dev/

**2. OpenAI GPT-4 Vision**
- **模型**: `gpt-4o`, `gpt-4o-mini`, `gpt-4-vision-preview`
- **特点**: 性能最强，但需要付费
- **配置**:
  ```env
  CHAT_SERVICE_TYPE=openai
  OPENAI_API_KEY=your_api_key_here
  ```
- **获取方式**: https://platform.openai.com/

**3. Groq Llama 3.2 Vision (实验性)**
- **模型**: `llama-3.2-11b-vision-preview`, `llama-3.2-90b-vision-preview`
- **特点**: 免费，但需要切换到 Vision 专用模型
- **配置**:
  ```env
  CHAT_SERVICE_TYPE=groq
  GROQ_API_KEY=your_api_key_here
  # 注意: 需要在代码中指定vision模型
  ```
- **获取方式**: https://console.groq.com/

**4. 智谱 GLM-4V**
- **模型**: `glm-4v`
- **特点**: 中文能力强，需要使用特定的 vision 模型
- **配置**:
  ```env
  CHAT_SERVICE_TYPE=glm
  GLM_API_KEY=your_api_key_here
  # 注意: 需要使用glm-4v而不是glm-4
  ```
- **获取方式**: https://open.bigmodel.cn/

##### ❌ 不支持 Vision 的模型

以下模型**不支持**图片识别，只能进行文本对话：
- Groq Llama 3.3/3.1 (标准版本)
- Groq Mixtral
- Groq Gemma 2
- DeepSeek Chat

#### 推荐配置

**最佳免费选择: Google Gemini**

```env
CHAT_SERVICE_TYPE=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

**优势**:
- ✅ 完全免费
- ✅ 性能优秀
- ✅ 支持高分辨率图片
- ✅ 多语言支持
- ✅ API 稳定可靠

**最佳性能选择: OpenAI GPT-4o**

```env
CHAT_SERVICE_TYPE=openai
OPENAI_API_KEY=your_openai_api_key_here
```

**优势**:
- ✅ 最强的理解能力
- ✅ 最准确的识别结果
- ✅ 支持复杂场景分析
- ❌ 需要付费

#### Vision 技术实现

**前端**:
- 使用 `FileReader` API 读取图片为 base64
- 在消息中显示图片预览
- 支持图片删除和重新选择

**后端**:
- 接收 base64 编码的图片数据
- 构建多模态消息格式（文本 + 图片）
- 发送到支持 Vision 的 AI 模型

**消息格式**:
```typescript
// 纯文本消息
{ 
  role: 'user', 
  content: 'Hello' 
}

// 包含图片的消息
{ 
  role: 'user', 
  content: [
    { type: 'text', text: '这是什么?' },
    { 
      type: 'image_url', 
      image_url: { 
        url: 'data:image/jpeg;base64,...',
        detail: 'auto'
      } 
    }
  ]
}
```

#### Vision 注意事项

1. **模型选择**: 确保选择的模型支持 Vision 功能
2. **图片大小**: 过大的图片会影响上传速度和API响应时间
3. **API 费用**: OpenAI Vision 会产生费用，建议使用免费的 Gemini
4. **隐私保护**: 上传的图片会发送到第三方 AI 服务，请注意隐私
5. **格式支持**: 建议使用常见格式（JPG, PNG），某些特殊格式可能不被支持

#### Vision 故障排除

**上传失败**:
- 检查图片大小是否超过 10MB
- 检查图片格式是否支持
- 检查网络连接

**AI 无法识别图片**:
- 确认当前使用的模型支持 Vision
- 检查 API Key 是否正确配置
- 查看控制台是否有错误信息

**响应缓慢**:
- 图片过大会导致上传和处理时间增加
- 尝试压缩图片或降低分辨率
- 考虑切换到响应更快的模型（如 gpt-4o-mini）

### 🎨 图片生成功能

1. 访问 `/image-generator`
2. 上传一张或多张图片
3. 点击"开始处理"
4. AI 会分析图片并生成提示词
5. 点击提示词旁的按钮手动生成图片
6. 使用以下功能：
   - 🖼️ **下载** - 下载生成的图片
   - 📋 **复制** - 复制文件名到剪贴板
   - 🗑️ **删除** - 删除不需要的图片

**使用 OpenAI DALL-E 3 和 GPT-4o-mini**，确保图片质量和分析准确性。

## 🏗️ 项目架构

```
src/
├── lib/
│   ├── components/
│   │   ├── Toast.svelte         # Toast 通知组件
│   │   └── Tooltip.svelte       # Tooltip 提示组件
│   ├── config/
│   │   └── api.ts               # API 配置常量
│   ├── services/
│   │   ├── chat.ts              # 聊天服务
│   │   └── image-generator.ts  # 图片生成服务
│   ├── stores/
│   │   └── toast.svelte.ts      # Toast 状态管理
│   └── utils/
│       └── http.ts              # HTTP 请求工具
└── routes/
    ├── +page.svelte             # 欢迎页
    ├── +layout.svelte           # 全局布局
    ├── chat/
    │   └── +page.svelte         # 聊天页面
    ├── image-generator/
    │   └── +page.svelte         # 图片生成页面
    └── api/                     # API 端点
        ├── chat/
        │   └── +server.ts       # 聊天 API
        ├── analyze-image/
        │   └── +server.ts       # 图片分析 API
        ├── generate-image/
        │   └── +server.ts       # 图片生成 API
        └── download-image/
            └── +server.ts       # 图片下载 API
```

## 🔧 技术栈

- **前端框架**：SvelteKit 5
- **样式**：TailwindCSS + Melt UI
- **类型**：TypeScript
- **包管理**：pnpm
- **AI 服务**：
  - Groq (Llama 3.3)
  - Google Gemini
  - 智谱 AI (GLM-4)
  - OpenAI (GPT-4, DALL-E 3)
  - DeepSeek

## 💡 扩展新服务

### 添加新的聊天服务

1. 在 `src/lib/config/api.ts` 中添加端点配置和模型定义
2. 在 `src/lib/services/chat.ts` 中：
   - 如果是 OpenAI 兼容格式，直接在 `SERVICE_CONFIGS` 中添加配置
   - 如果是特殊格式，创建新的服务类实现 `ChatService` 接口
3. 在 `ChatServiceFactory` 中注册新服务
4. 在 `.env` 中添加对应的 API Key 和服务类型

### 添加新的图片生成服务

1. 在 `src/lib/config/api.ts` 中添加端点配置
2. 在 `src/lib/services/image-generator.ts` 中实现 `ImageGeneratorService` 接口
3. 更新 `src/routes/api/generate-image/+server.ts` 调用新服务

## 🎯 设计原则

- ✅ **单一职责** - 每个模块只负责一件事
- ✅ **开闭原则** - 对扩展开放，对修改关闭
- ✅ **依赖倒置** - 依赖抽象而非具体实现
- ✅ **高内聚低耦合** - 模块之间松散耦合

## 📝 开发命令

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 预览
pnpm preview

# 类型检查
pnpm check
```

## 🐛 故障排除

### 常见问题

#### Q: 提示 "API Key 未配置"
A: 确保 `.env` 文件中配置了对应服务的 API Key，并重启了开发服务器。

#### Q: Groq 返回 429 错误
A: 超出了速率限制，请稍等片刻或切换到其他服务。

#### Q: DeepSeek 返回 402 错误
A: 账户余额不足，请充值或切换到免费服务（Groq/Gemini）。

#### Q: 如何知道当前使用的是哪个服务？
A: 查看开发服务器的终端输出，会显示"使用聊天服务: xxx"。

#### Q: Vision 功能无法使用
A: 确认当前模型支持 Vision（Gemini 或 OpenAI），并检查 API Key 配置。

### 聊天失败
- 检查对应服务的 API Key 是否配置正确
- 检查 `CHAT_SERVICE_TYPE` 配置是否正确
- 查看终端日志了解详细错误信息

### 图片生成/分析失败
- 检查 `OPENAI_API_KEY` 是否配置正确
- 确保 OpenAI 账户有足够余额
- 检查网络连接是否正常
- 检查图片格式和大小是否符合要求

### 服务器错误
- 修改 `.env` 后需要重启服务器
- 查看终端日志了解详细错误信息

## 📚 相关文档

- **Groq 文档**: https://console.groq.com/docs
- **Gemini 文档**: https://ai.google.dev/docs
- **智谱 AI 文档**: https://open.bigmodel.cn/dev/api
- **OpenAI 文档**: https://platform.openai.com/docs
- **DeepSeek 文档**: https://platform.deepseek.com/docs

## 📄 许可证

MIT

- [SvelteKit](https://kit.svelte.dev)
- [Groq](https://groq.com)
- [Google Gemini](https://ai.google.dev)
- [智谱 AI](https://open.bigmodel.cn)
- [OpenAI](https://openai.com)
- [DeepSeek](https://www.deepseek.com)