import Link from "next/link";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 动态背景效果 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow animation-delay-4000"></div>
      </div>

      {/* 粒子背景 */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="container mx-auto max-w-7xl">
          {/* 主标题区域 */}
          <div className="text-center mb-16">
            <div className="animate-float">
              <h1 className="text-responsive-4xl font-black tracking-tight mb-6">
                <span className="text-gradient bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                  简历匹配
                </span>{" "}
                <span className="text-white">CV2</span>
              </h1>
            </div>
            <p className="text-responsive-xl text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed">
              基于人工智能的智能招聘平台，通过深度简历分析和精准岗位匹配，
              <br className="hidden sm:block" />
              为企业提供高效的人才筛选解决方案
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <span className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium glass">
                AI智能分析
              </span>
              <span className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-medium glass">
                多维度匹配
              </span>
              <span className="px-4 py-2 bg-pink-500/20 text-pink-300 rounded-full text-sm font-medium glass">
                批量处理
              </span>
            </div>
          </div>

          {/* 功能卡片网格 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* 智能解析卡片 */}
            <div className="glass card-hover rounded-2xl p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-6 shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">智能简历解析</h3>
              <p className="text-gray-300 leading-relaxed">
                支持PDF、Word、文本等多种格式，AI自动提取结构化信息，
                准确识别技能、经验、教育背景等关键要素
              </p>
            </div>

            {/* AI匹配卡片 */}
            <div className="glass card-hover rounded-2xl p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-2xl flex items-center justify-center mb-6 shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI精准匹配</h3>
              <p className="text-gray-300 leading-relaxed">
                多维度智能评分算法，从技能匹配、经验适配、文化契合等角度
                全面评估候选人与岗位的匹配度
              </p>
            </div>

            {/* 智能筛选卡片 */}
            <div className="glass card-hover rounded-2xl p-8 group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-700 rounded-2xl flex items-center justify-center mb-6 shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">智能筛选推荐</h3>
              <p className="text-gray-300 leading-relaxed">
                批量处理大量简历，自动标签分类，提供优先推荐和淘汰建议，
                大幅提升招聘效率和精准度
              </p>
            </div>
          </div>

          {/* 行动按钮区域 */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/auth/signin"
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-bold text-lg shadow-elegant hover:shadow-glow-lg transition-all duration-300 btn-glow"
            >
              <span className="relative z-10">立即登录 →</span>
            </Link>
            <Link
              href="/auth/signup"
              className="group relative px-8 py-4 glass rounded-xl text-white font-bold text-lg border border-white/20 hover:border-white/40 transition-all duration-300 btn-glow"
            >
              <span className="relative z-10">免费注册</span>
            </Link>
          </div>

          {/* 特性展示 */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold text-white mb-12">
              为什么选择 <span className="text-gradient">简历匹配 CV2</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-purple-700/20 rounded-2xl flex items-center justify-center mx-auto mb-4 glass">
                  <span className="text-3xl font-bold text-purple-400">AI</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">人工智能驱动</h3>
                <p className="text-gray-400 text-sm">先进的AI算法提供精准分析</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-cyan-700/20 rounded-2xl flex items-center justify-center mx-auto mb-4 glass">
                  <span className="text-3xl font-bold text-cyan-400">10x</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">效率提升</h3>
                <p className="text-gray-400 text-sm">较传统方式提升10倍筛选效率</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-pink-700/20 rounded-2xl flex items-center justify-center mx-auto mb-4 glass">
                  <span className="text-3xl font-bold text-pink-400">95%</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">匹配精度</h3>
                <p className="text-gray-400 text-sm">高达95%的候选人匹配准确率</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 rounded-2xl flex items-center justify-center mx-auto mb-4 glass">
                  <span className="text-3xl font-bold text-emerald-400">24/7</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">全天候服务</h3>
                <p className="text-gray-400 text-sm">云端部署，随时随地访问</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
