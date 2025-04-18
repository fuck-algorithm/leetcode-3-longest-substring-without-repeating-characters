# 部署说明

此项目使用GitHub Actions自动部署到GitHub Pages。

## 自动部署

每当有代码推送到`main`分支时，GitHub Actions工作流会自动触发：

1. 检出代码
2. 设置Node.js环境
3. 安装依赖
4. 构建项目
5. 将构建后的文件部署到`gh-pages`分支

无需手动操作，部署会自动完成。

## 手动部署

如需手动部署，请执行以下步骤：

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 部署到GitHub Pages（如果已安装gh-pages包）
npx gh-pages -d dist
```

## 部署配置说明

- 项目的基础路径在`vite.config.ts`中配置为`/leetcode-3-longest-substring-without-repeating-characters/`
- GitHub Actions配置文件位于`.github/workflows/deploy.yml`
- 为支持单页应用路由，添加了自定义的404页面重定向机制

## 访问已部署的站点

部署完成后，可以通过以下URL访问应用：

https://fuck-algorithm.github.io/leetcode-3-longest-substring-without-repeating-characters/ 