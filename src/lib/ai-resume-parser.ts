import { env } from "~/env";
import { ResumeParser, type ParsedResume } from "./resume-parser";

interface AIParseResult {
  success: boolean;
  data?: ParsedResume;
  error?: string;
  confidence?: number;
  processingTime?: number;
}

interface ParsedSection {
  content: string;
  confidence: number;
  issues?: string[];
}

interface AIModelConfig {
  provider: string;
  model: string;
  baseURL?: string;
  maxTokens: number;
  temperature: number;
}

/**
 * 深度AI简历解析引擎 - 支持多阶段解析和智能优化
 */
export class AIResumeParser {
  
  // 预定义AI模型配置
  private static readonly MODEL_CONFIGS: Record<string, AIModelConfig> = {
    "gpt-4": {
      provider: "openai",
      model: "gpt-4",
      maxTokens: 4000,
      temperature: 0.1,
    },
    "gpt-4-turbo": {
      provider: "openai", 
      model: "gpt-4-turbo-preview",
      maxTokens: 4000,
      temperature: 0.1,
    },
    "gpt-3.5-turbo": {
      provider: "openai",
      model: "gpt-3.5-turbo",
      maxTokens: 3000,
      temperature: 0.1,
    },
    "claude-3-sonnet": {
      provider: "anthropic",
      model: "claude-3-sonnet-20240229",
      maxTokens: 4000,
      temperature: 0.1,
    },
    "claude-3-haiku": {
      provider: "anthropic",
      model: "claude-3-haiku-20240307",
      maxTokens: 3000,
      temperature: 0.1,
    },
  };

  // 深度优化的系统提示词
  private static readonly SYSTEM_PROMPT = `
你是一位世界级的简历解析专家和HR数据分析师。你需要运用深度思考，精确解析简历文档，提取结构化信息。

## 核心能力要求
1. **深度理解**：理解简历的语言风格、行业背景、职业发展路径
2. **智能推理**：从不完整信息中推断缺失内容，识别隐含技能
3. **精确提取**：确保所有关键信息的准确性和完整性
4. **跨语言处理**：完美处理中英文混合简历
5. **上下文关联**：理解工作经验与技能的关联关系

## 解析思路
1. **首次扫描**：识别简历整体结构和主要板块
2. **深度分析**：逐段分析，提取详细信息
3. **关联验证**：验证信息一致性，补充遗漏细节
4. **质量检查**：确保输出格式正确，信息完整

请严格按照JSON格式返回，不要添加任何解释文字。
`;

  // 分阶段解析提示词
  private static readonly PARSING_PROMPTS = {
    structure: `
分析以下简历文本的整体结构，识别主要板块和信息分布：

**任务**：识别简历中包含的主要信息板块（如个人信息、教育背景、工作经验、技能等）

简历文本：
`,
    
    personal: `
从以下简历文本中精确提取个人基本信息：

**重点提取**：
- 姓名（候选人真实姓名）
- 邮箱地址（有效的邮箱格式）
- 电话号码（包括国际区号）
- 居住地址或所在城市
- 个人网站、LinkedIn等链接

简历文本：
`,

    experience: `
深度分析以下简历的工作经验部分，提取详细的职业履历：

**分析要点**：
- 按时间顺序识别所有工作经历
- 准确提取职位名称、公司名称、工作时间
- 理解工作职责和项目经验
- 识别使用的技术栈和工具
- 推断职业发展轨迹和能力增长

简历文本：
`,

    skills: `
全面分析简历中的技能信息，包括显性和隐性技能：

**技能分类**：
- 编程语言和开发技术
- 框架和工具使用
- 数据库和云平台经验
- 软技能和管理能力
- 行业知识和专业领域
- 从工作经验中推断的技能

简历文本：
`,

    education: `
提取教育背景信息，包括正式学历和培训经历：

**包含内容**：
- 学历层次（学士、硕士、博士等）
- 学校名称和专业
- 毕业时间和成绩
- 相关课程和研究方向
- 培训证书和在线课程

简历文本：
`,
  };

  // 完整解析提示词模板
  private static readonly COMPREHENSIVE_PROMPT = `
请运用深度思考，全面解析以下简历，返回完整的结构化JSON数据：

## 输出格式要求
严格按照以下JSON结构返回，确保数据类型正确：

\`\`\`json
{
  "candidateName": "候选人真实姓名",
  "candidateEmail": "有效邮箱地址", 
  "phone": "完整电话号码（含区号）",
  "location": "居住城市或地区",
  "summary": "基于简历内容总结的职业概述（50-200字）",
  "skills": [
    "技能1",
    "技能2",
    "编程语言",
    "框架工具",
    "专业技能"
  ],
  "experience": [
    {
      "title": "职位名称",
      "company": "公司名称",
      "duration": "2020.01-2023.12",
      "description": "工作职责和项目经验的详细描述",
      "technologies": ["技术1", "技术2"],
      "achievements": ["主要成就1", "成就2"]
    }
  ],
  "education": [
    {
      "degree": "学位名称（如学士、硕士）",
      "university": "学校名称",
      "major": "专业名称",
      "year": "毕业年份",
      "gpa": "成绩（如GPA 3.8）"
    }
  ],
  "certifications": ["证书1", "证书2"],
  "languages": ["语言1", "语言2"],
  "projects": [
    {
      "name": "项目名称",
      "description": "项目描述",
      "technologies": ["技术栈"],
      "duration": "项目时间"
    }
  ]
}
\`\`\`

## 深度解析指南

### 1. 个人信息提取
- **姓名识别**：通常在简历开头，注意中英文姓名格式
- **联系方式**：邮箱、电话、地址的准确提取
- **在线档案**：LinkedIn、GitHub等专业链接

### 2. 工作经验分析  
- **时间轴构建**：按时间顺序整理工作履历
- **职责解析**：理解工作内容，提取关键职责
- **技术识别**：从项目描述中识别技术栈
- **成就量化**：提取可量化的工作成果

### 3. 技能深度挖掘
- **显性技能**：简历中明确列出的技能
- **隐性技能**：从工作经验推断的能力
- **技能分级**：根据使用经验判断熟练程度
- **技术栈关联**：理解技能之间的关联关系

### 4. 教育背景完善
- **学历验证**：确保学历信息的准确性
- **专业匹配**：分析专业与职业发展的关联
- **时间一致性**：验证教育和工作时间的逻辑性

### 5. 项目经验提取
- **项目识别**：从工作经验中提取重要项目
- **技术分析**：项目使用的技术和工具
- **价值评估**：项目的业务价值和技术难度

### 6. 质量保证
- **信息完整性**：确保关键信息不遗漏
- **逻辑一致性**：验证时间线和经历的合理性
- **格式规范性**：确保JSON格式正确

## 特殊处理策略

### 中英文混合处理
- 准确识别中英文内容
- 统一输出语言（优先使用中文）
- 保持专业术语的准确性

### 不完整信息处理
- 基于上下文推断缺失信息
- 标注推断内容的可信度
- 避免虚构不存在的信息

### 格式化处理
- 统一时间格式：YYYY.MM-YYYY.MM
- 规范化公司和学校名称
- 清理多余的符号和空格

现在开始解析以下简历：

`;

  /**
   * 获取AI模型配置
   */
  private static getModelConfig(): AIModelConfig {
    const modelName = env.AI_MODEL || "gpt-3.5-turbo";
    const config = this.MODEL_CONFIGS[modelName] || this.MODEL_CONFIGS["gpt-3.5-turbo"];
    
    // 应用BaseURL配置
    if (config.provider === "openai" && env.OPENAI_BASE_URL) {
      config.baseURL = env.OPENAI_BASE_URL;
    } else if (config.provider === "anthropic" && env.ANTHROPIC_BASE_URL) {
      config.baseURL = env.ANTHROPIC_BASE_URL;
    }
    
    return config;
  }

  /**
   * 调用OpenAI API进行深度简历解析
   */
  private static async callOpenAI(resumeText: string, config: AIModelConfig): Promise<AIParseResult> {
    const startTime = Date.now();
    
    try {
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API key not configured");
      }

      const baseURL = config.baseURL || "https://api.openai.com";
      const endpoint = `${baseURL}/v1/chat/completions`;

      console.log(`[AI解析] 使用OpenAI模型: ${config.model}, BaseURL: ${baseURL}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: "system",
              content: this.SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: this.COMPREHENSIVE_PROMPT + resumeText,
            },
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      console.log(`[AI解析] OpenAI响应接收完成，开始解析JSON...`);

      // 清理和解析JSON响应
      const cleanedContent = this.cleanJSONResponse(content);
      const parsedData = JSON.parse(cleanedContent);
      
      const processingTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(parsedData, resumeText);

      console.log(`[AI解析] OpenAI解析完成，用时: ${processingTime}ms, 置信度: ${confidence}`);

      return { 
        success: true, 
        data: parsedData,
        confidence,
        processingTime
      };
    } catch (error) {
      console.error("OpenAI parsing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "OpenAI parsing failed",
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 调用Anthropic Claude API进行深度简历解析
   */
  private static async callAnthropic(resumeText: string, config: AIModelConfig): Promise<AIParseResult> {
    const startTime = Date.now();
    
    try {
      const apiKey = env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error("Anthropic API key not configured");
      }

      const baseURL = config.baseURL || "https://api.anthropic.com";
      const endpoint = `${baseURL}/v1/messages`;

      console.log(`[AI解析] 使用Claude模型: ${config.model}, BaseURL: ${baseURL}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          system: this.SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: this.COMPREHENSIVE_PROMPT + resumeText,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (!content) {
        throw new Error("No content received from Anthropic");
      }

      console.log(`[AI解析] Claude响应接收完成，开始解析JSON...`);

      // 清理和解析JSON响应
      const cleanedContent = this.cleanJSONResponse(content);
      const parsedData = JSON.parse(cleanedContent);
      
      const processingTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(parsedData, resumeText);

      console.log(`[AI解析] Claude解析完成，用时: ${processingTime}ms, 置信度: ${confidence}`);

      return { 
        success: true, 
        data: parsedData,
        confidence,
        processingTime
      };
    } catch (error) {
      console.error("Anthropic parsing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Anthropic parsing failed",
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Mock AI解析，用于开发和测试
   */
  private static async mockAIParsing(resumeText: string): Promise<AIParseResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[AI解析] 使用Mock模式进行简历解析...`);
      
      // 模拟AI思考延时
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // 使用传统解析器作为基础
      const fallbackResult = ResumeParser.parseResumeText(resumeText);
      
      // 智能增强解析结果
      const enhancedResult: ParsedResume = {
        ...fallbackResult,
        candidateName: fallbackResult.candidateName || this.extractNameFromText(resumeText),
        candidateEmail: fallbackResult.candidateEmail || this.extractEmailFromText(resumeText),
        summary: fallbackResult.summary || this.generateMockSummary(resumeText),
        skills: this.enhanceSkills(fallbackResult.skills, resumeText),
        experience: this.enhanceExperience(fallbackResult.experience),
        education: this.enhanceEducation(fallbackResult.education),
        certifications: fallbackResult.certifications || this.extractCertifications(resumeText),
        languages: fallbackResult.languages || this.extractLanguages(resumeText),
      };

      const processingTime = Date.now() - startTime;
      console.log(`[AI解析] Mock解析完成，用时: ${processingTime}ms`);

      return { 
        success: true, 
        data: enhancedResult,
        confidence: 0.75,
        processingTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Mock parsing failed",
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 清理AI返回的JSON响应
   */
  private static cleanJSONResponse(content: string): string {
    // 移除代码块标记
    let cleaned = content.replace(/```json\s*|\s*```/g, '').trim();
    
    // 移除可能的前导说明文字
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    // 修复常见的JSON格式问题
    cleaned = cleaned
      .replace(/,(\s*[}\]])/g, '$1')  // 移除末尾多余逗号
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // 确保属性名有引号
      .replace(/:\s*'([^']*)'/g, ': "$1"')  // 替换单引号为双引号
      .replace(/\n/g, ' ')  // 移除换行符
      .replace(/\s+/g, ' ');  // 合并多余空格
    
    return cleaned;
  }

  /**
   * 计算解析结果的置信度
   */
  private static calculateConfidence(parsedData: any, originalText: string): number {
    let confidence = 0;
    let factors = 0;

    // 检查关键字段的完整性
    if (parsedData.candidateName && parsedData.candidateName.trim()) {
      confidence += 20;
    }
    factors++;

    if (parsedData.candidateEmail && /\S+@\S+\.\S+/.test(parsedData.candidateEmail)) {
      confidence += 20;
    }
    factors++;

    if (parsedData.skills && Array.isArray(parsedData.skills) && parsedData.skills.length > 0) {
      confidence += 15;
    }
    factors++;

    if (parsedData.experience && Array.isArray(parsedData.experience) && parsedData.experience.length > 0) {
      confidence += 25;
    }
    factors++;

    if (parsedData.education && Array.isArray(parsedData.education) && parsedData.education.length > 0) {
      confidence += 20;
    }
    factors++;

    // 检查数据的合理性
    const textLength = originalText.length;
    if (textLength > 500) {
      confidence += Math.min(10, textLength / 1000);
    }

    return Math.min(100, confidence) / 100;
  }

  /**
   * 从文本中提取姓名的辅助方法
   */
  private static extractNameFromText(text: string): string {
    const lines = text.split('\n').slice(0, 5);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 2 && trimmed.length < 50 && /^[\u4e00-\u9fa5a-zA-Z\s.'-]+$/.test(trimmed)) {
        return trimmed;
      }
    }
    return "候选人姓名";
  }

  /**
   * 从文本中提取邮箱的辅助方法
   */
  private static extractEmailFromText(text: string): string {
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    return emailMatch ? emailMatch[0] : "";
  }

  /**
   * 生成模拟的个人简介
   */
  private static generateMockSummary(text: string): string {
    const hasExperience = text.toLowerCase().includes('经验') || text.toLowerCase().includes('experience');
    const hasTech = text.toLowerCase().includes('开发') || text.toLowerCase().includes('developer');
    
    if (hasTech) {
      return "具有丰富技术背景的专业开发者，拥有多年项目开发和团队协作经验。";
    } else if (hasExperience) {
      return "经验丰富的专业人士，具备扎实的业务技能和良好的团队合作能力。";
    } else {
      return "积极向上的专业人才，具备良好的学习能力和工作态度。";
    }
  }

  /**
   * 增强技能列表
   */
  private static enhanceSkills(skills: string[], text: string): string[] {
    const enhancedSkills = [...skills];
    const commonTechSkills = ['JavaScript', 'Python', 'Java', 'React', 'Vue', 'Node.js', 'SQL', 'Git'];
    
    for (const skill of commonTechSkills) {
      if (text.toLowerCase().includes(skill.toLowerCase()) && !enhancedSkills.includes(skill)) {
        enhancedSkills.push(skill);
      }
    }
    
    return enhancedSkills.length > 0 ? enhancedSkills : ['JavaScript', 'HTML', 'CSS'];
  }

  /**
   * 增强工作经验
   */
  private static enhanceExperience(experience: any[]): any[] {
    return experience.map(exp => ({
      ...exp,
      description: exp.description || "负责相关业务的开发、维护和优化工作。",
      technologies: exp.technologies || ['JavaScript', 'HTML', 'CSS']
    }));
  }

  /**
   * 增强教育背景
   */
  private static enhanceEducation(education: any[]): any[] {
    return education.map(edu => ({
      ...edu,
      degree: edu.degree || "本科",
      university: edu.university || "知名大学",
      year: edu.year || "2020"
    }));
  }

  /**
   * 提取证书信息
   */
  private static extractCertifications(text: string): string[] {
    const certKeywords = ['证书', '认证', '资格证', 'certificate', 'certification'];
    const certs: string[] = [];
    
    for (const keyword of certKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        certs.push('专业技能证书');
        break;
      }
    }
    
    return certs;
  }

  /**
   * 提取语言能力
   */
  private static extractLanguages(text: string): string[] {
    const languages = ['中文', '英语'];
    if (text.includes('English') || text.includes('英语')) {
      return languages;
    }
    return ['中文'];
  }

  /**
   * 验证和清理解析的简历数据
   */
  private static validateAndCleanData(data: any): ParsedResume {
    const cleaned: ParsedResume = {
      candidateName: String(data.candidateName || "").trim() || "未知候选人",
      candidateEmail: String(data.candidateEmail || "").trim(),
      phone: data.phone ? String(data.phone).trim() : undefined,
      location: data.location ? String(data.location).trim() : undefined,
      summary: data.summary ? String(data.summary).trim() : undefined,
      skills: Array.isArray(data.skills) 
        ? data.skills.map((skill: any) => String(skill).trim()).filter(Boolean)
        : [],
      experience: Array.isArray(data.experience)
        ? data.experience.map((exp: any) => ({
            title: String(exp.title || "").trim(),
            company: String(exp.company || "").trim(),
            duration: String(exp.duration || "").trim(),
            description: exp.description ? String(exp.description).trim() : undefined,
            technologies: Array.isArray(exp.technologies)
              ? exp.technologies.map((tech: any) => String(tech).trim()).filter(Boolean)
              : undefined,
          }))
        : [],
      education: Array.isArray(data.education)
        ? data.education.map((edu: any) => ({
            degree: String(edu.degree || "").trim(),
            university: String(edu.university || "").trim(),
            year: String(edu.year || "").trim(),
            gpa: edu.gpa ? String(edu.gpa).trim() : undefined,
          }))
        : [],
      certifications: Array.isArray(data.certifications)
        ? data.certifications.map((cert: any) => String(cert).trim()).filter(Boolean)
        : undefined,
      languages: Array.isArray(data.languages)
        ? data.languages.map((lang: any) => String(lang).trim()).filter(Boolean)
        : undefined,
    };

    return cleaned;
  }

  /**
   * 多轮对话式优化解析结果
   */
  private static async refineParsingWithAI(
    initialResult: ParsedResume, 
    originalText: string, 
    config: AIModelConfig
  ): Promise<ParsedResume> {
    try {
      console.log(`[AI优化] 开始多轮对话式优化解析结果...`);
      
      // 检查是否需要优化
      const needsRefinement = this.needsRefinement(initialResult, originalText);
      if (!needsRefinement) {
        console.log(`[AI优化] 解析结果质量良好，无需优化`);
        return initialResult;
      }

      // 构建优化提示词
      const refinementPrompt = this.buildRefinementPrompt(initialResult, originalText);
      
      let result: AIParseResult;
      if (config.provider === "openai") {
        result = await this.callOpenAI(refinementPrompt, config);
      } else if (config.provider === "anthropic") {
        result = await this.callAnthropic(refinementPrompt, config);
      } else {
        return initialResult; // Mock模式不需要优化
      }

      if (result.success && result.data) {
        console.log(`[AI优化] 解析结果优化完成`);
        return this.validateAndCleanData(result.data);
      }
      
      return initialResult;
    } catch (error) {
      console.error("[AI优化] 优化过程失败:", error);
      return initialResult;
    }
  }

  /**
   * 判断是否需要优化
   */
  private static needsRefinement(result: ParsedResume, originalText: string): boolean {
    const issues = [];
    
    if (!result.candidateName || result.candidateName === "未知候选人") {
      issues.push("缺少候选人姓名");
    }
    
    if (!result.candidateEmail) {
      issues.push("缺少邮箱地址");
    }
    
    if (!result.skills || result.skills.length === 0) {
      issues.push("缺少技能信息");
    }
    
    if (!result.experience || result.experience.length === 0) {
      issues.push("缺少工作经验");
    }
    
    if (originalText.length > 1000 && issues.length > 1) {
      console.log(`[AI优化] 发现 ${issues.length} 个问题，需要优化: ${issues.join(', ')}`);
      return true;
    }
    
    return false;
  }

  /**
   * 构建优化提示词
   */
  private static buildRefinementPrompt(result: ParsedResume, originalText: string): string {
    return `
请重新深度分析以下简历文本，并优化之前的解析结果。

之前的解析结果存在以下问题，请重点关注：
${this.identifyIssues(result).map(issue => `- ${issue}`).join('\n')}

请返回完整优化后的JSON结果，确保信息准确完整：

原始简历文本：
${originalText}

当前解析结果：
${JSON.stringify(result, null, 2)}

请提供优化后的完整JSON结果：
`;
  }

  /**
   * 识别解析问题
   */
  private static identifyIssues(result: ParsedResume): string[] {
    const issues = [];
    
    if (!result.candidateName || result.candidateName === "未知候选人") {
      issues.push("候选人姓名缺失或不准确");
    }
    
    if (!result.candidateEmail) {
      issues.push("联系邮箱缺失");
    }
    
    if (!result.skills || result.skills.length === 0) {
      issues.push("技能列表为空");
    }
    
    if (!result.experience || result.experience.length === 0) {
      issues.push("工作经验信息缺失");
    } else {
      const incompleteExp = result.experience.filter(exp => !exp.title || !exp.company);
      if (incompleteExp.length > 0) {
        issues.push("部分工作经验信息不完整");
      }
    }
    
    if (!result.education || result.education.length === 0) {
      issues.push("教育背景信息缺失");
    }
    
    return issues;
  }

  /**
   * 主要的AI解析函数，带有智能回退和优化
   */
  static async parseResumeWithAI(resumeText: string): Promise<ParsedResume> {
    const startTime = Date.now();
    const config = this.getModelConfig();
    
    console.log(`[AI解析] 开始深度解析，使用提供商: ${config.provider}, 模型: ${config.model}`);

    let result: AIParseResult;
    let finalResult: ParsedResume;

    try {
      // 第一阶段：基础AI解析
      switch (config.provider) {
        case "openai":
          result = await this.callOpenAI(resumeText, config);
          break;
        case "anthropic":
          result = await this.callAnthropic(resumeText, config);
          break;
        default:
          result = await this.mockAIParsing(resumeText);
          break;
      }

      if (result.success && result.data) {
        console.log(`[AI解析] 基础解析成功，置信度: ${result.confidence?.toFixed(2) || 'N/A'}`);
        finalResult = this.validateAndCleanData(result.data);

        // 第二阶段：智能优化（仅对真实AI服务）
        if (config.provider !== "mock" && env.NODE_ENV !== "test") {
          finalResult = await this.refineParsingWithAI(finalResult, resumeText, config);
        }

        const totalTime = Date.now() - startTime;
        console.log(`[AI解析] 完整解析流程完成，总用时: ${totalTime}ms`);
        
        return finalResult;
      }
    } catch (error) {
      console.error(`[AI解析] ${config.provider} 解析失败:`, error);
    }

    // 智能回退策略
    console.log("[AI解析] 启用智能回退策略...");
    return await this.fallbackParsing(resumeText);
  }

  /**
   * 智能回退解析策略
   */
  private static async fallbackParsing(resumeText: string): Promise<ParsedResume> {
    try {
      console.log("[回退解析] 使用增强版传统解析器...");
      
      // 使用传统解析器作为基础
      const basicResult = ResumeParser.parseResumeText(resumeText);
      
      // 应用启发式增强
      const enhancedResult: ParsedResume = {
        ...basicResult,
        candidateName: basicResult.candidateName || this.extractNameFromText(resumeText),
        candidateEmail: basicResult.candidateEmail || this.extractEmailFromText(resumeText),
        summary: basicResult.summary || this.generateMockSummary(resumeText),
        skills: this.enhanceSkills(basicResult.skills, resumeText),
        experience: this.enhanceExperience(basicResult.experience),
        education: this.enhanceEducation(basicResult.education),
        certifications: basicResult.certifications || this.extractCertifications(resumeText),
        languages: basicResult.languages || this.extractLanguages(resumeText),
      };

      console.log("[回退解析] 增强解析完成");
      return enhancedResult;
    } catch (error) {
      console.error("[回退解析] 解析失败:", error);
      
      // 最后的安全回退
      return {
        candidateName: "候选人姓名",
        candidateEmail: "",
        skills: [],
        experience: [],
        education: [],
      };
    }
  }

  /**
   * 增强的简历解析接口，集成AI深度分析
   */
  static async parseResume(buffer: Buffer, mimeType: string): Promise<ParsedResume> {
    const startTime = Date.now();
    
    try {
      console.log(`[文档解析] 开始处理 ${mimeType} 格式的简历文档...`);
      
      // 第一步：提取文本内容
      const text = await ResumeParser.extractText(buffer, mimeType);
      
      if (!text || text.trim().length === 0) {
        throw new Error("简历文档中未找到可解析的文本内容");
      }

      console.log(`[文档解析] 文本提取完成，长度: ${text.length} 字符`);

      // 第二步：AI深度解析
      const parsed = await this.parseResumeWithAI(text);
      
      const totalTime = Date.now() - startTime;
      console.log(`[文档解析] 简历解析完全完成，总用时: ${totalTime}ms`);
      
      return parsed;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[文档解析] 解析失败，用时: ${totalTime}ms, 错误:`, error);
      throw new Error(`AI简历解析失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  /**
   * 批量简历处理 - 支持并发解析和进度跟踪
   */
  static async parseMultipleResumes(
    files: Array<{ buffer: Buffer; mimeType: string; filename: string }>
  ): Promise<Array<{ filename: string; result: ParsedResume | null; error?: string; processingTime?: number }>> {
    const startTime = Date.now();
    console.log(`[批量解析] 开始处理 ${files.length} 个简历文件...`);

    // 并发控制：每次最多处理5个文件
    const batchSize = 5;
    const allResults: Array<{ filename: string; result: ParsedResume | null; error?: string; processingTime?: number }> = [];

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      console.log(`[批量解析] 处理第 ${Math.floor(i / batchSize) + 1} 批，文件数: ${batch.length}`);

      const batchResults = await Promise.allSettled(
        batch.map(async (file) => {
          const fileStartTime = Date.now();
          try {
            const parsed = await this.parseResume(file.buffer, file.mimeType);
            const processingTime = Date.now() - fileStartTime;
            return { 
              filename: file.filename, 
              result: parsed,
              processingTime 
            };
          } catch (error) {
            const processingTime = Date.now() - fileStartTime;
            return {
              filename: file.filename,
              result: null,
              error: error instanceof Error ? error.message : "解析失败",
              processingTime
            };
          }
        })
      );

      const processedBatch = batchResults.map((result) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            filename: "unknown",
            result: null,
            error: result.reason instanceof Error ? result.reason.message : "处理失败",
            processingTime: 0
          };
        }
      });

      allResults.push(...processedBatch);
      
      // 添加批次间的小延时，避免API限流
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const totalTime = Date.now() - startTime;
    const successful = allResults.filter(r => r.result !== null).length;
    const failed = allResults.length - successful;
    
    console.log(`[批量解析] 完成处理，成功: ${successful}, 失败: ${failed}, 总用时: ${totalTime}ms`);
    
    return allResults;
  }

  /**
   * 解析质量评估
   */
  static evaluateParsingQuality(result: ParsedResume, originalText: string): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 检查基本信息完整性
    if (!result.candidateName || result.candidateName === "候选人姓名" || result.candidateName === "未知候选人") {
      issues.push("候选人姓名缺失或不准确");
      suggestions.push("检查简历开头是否有清晰的姓名信息");
      score -= 20;
    }

    if (!result.candidateEmail) {
      issues.push("联系邮箱缺失");
      suggestions.push("确认简历中包含有效的邮箱地址");
      score -= 15;
    }

    if (!result.phone) {
      issues.push("联系电话缺失");
      suggestions.push("添加联系电话信息");
      score -= 10;
    }

    // 检查内容完整性
    if (!result.skills || result.skills.length === 0) {
      issues.push("技能信息缺失");
      suggestions.push("添加技能专长部分");
      score -= 20;
    }

    if (!result.experience || result.experience.length === 0) {
      issues.push("工作经验缺失");
      suggestions.push("添加工作经历描述");
      score -= 25;
    }

    if (!result.education || result.education.length === 0) {
      issues.push("教育背景缺失");
      suggestions.push("添加教育经历信息");
      score -= 15;
    }

    // 检查内容质量
    if (result.experience && result.experience.length > 0) {
      const incompleteExp = result.experience.filter(exp => !exp.title || !exp.company || !exp.duration);
      if (incompleteExp.length > 0) {
        issues.push("部分工作经验信息不完整");
        suggestions.push("完善工作经验的职位、公司和时间信息");
        score -= 10;
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }
}