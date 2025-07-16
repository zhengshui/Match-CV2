import pdf from "pdf-parse";
import mammoth from "mammoth";

export interface ParsedResume {
  candidateName: string;
  candidateEmail: string;
  phone?: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description?: string;
    technologies?: string[];
  }[];
  education: {
    degree: string;
    university: string;
    year: string;
    gpa?: string;
  }[];
  summary?: string;
  certifications?: string[];
  languages?: string[];
  location?: string;
}

export class ResumeParser {
  /**
   * Extract text from different file formats
   */
  static async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      switch (mimeType) {
        case "application/pdf":
          const pdfData = await pdf(buffer);
          return pdfData.text;

        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        case "application/msword":
          const docResult = await mammoth.extractRawText({ buffer });
          return docResult.value;

        case "text/plain":
          return buffer.toString("utf-8");

        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Parse resume text into structured data
   */
  static parseResumeText(text: string): ParsedResume {
    const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    
    const parsed: ParsedResume = {
      candidateName: "",
      candidateEmail: "",
      phone: "",
      skills: [],
      experience: [],
      education: [],
      summary: "",
      certifications: [],
      languages: [],
      location: "",
    };

    let currentSection = "";
    let currentExperience: Partial<ParsedResume['experience'][0]> | null = null;
    let currentEducation: Partial<ParsedResume['education'][0]> | null = null;

    // Common patterns
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g;
    const skillsKeywords = ["skills", "technical skills", "technologies", "programming languages", "languages", "tools"];
    const experienceKeywords = ["experience", "work experience", "employment", "career", "professional experience"];
    const educationKeywords = ["education", "academic", "degree", "university", "college", "school"];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const lowerLine = line.toLowerCase();

      // Extract email
      const emailMatch = line.match(emailPattern);
      if (emailMatch && !parsed.candidateEmail) {
        parsed.candidateEmail = emailMatch[0];
      }

      // Extract phone
      const phoneMatch = line.match(phonePattern);
      if (phoneMatch && !parsed.phone) {
        parsed.phone = phoneMatch[0];
      }

      // Extract name (usually first line or line before email)
      if (!parsed.candidateName && i < 3 && line.length > 2 && line.length < 50) {
        // Simple heuristic: if it's not an email/phone and looks like a name
        if (!emailMatch && !phoneMatch && /^[A-Za-z\\s.'-]+$/.test(line)) {
          parsed.candidateName = line;
        }
      }

      // Identify sections
      if (skillsKeywords.some(keyword => lowerLine.includes(keyword))) {
        currentSection = "skills";
        continue;
      }

      if (experienceKeywords.some(keyword => lowerLine.includes(keyword))) {
        currentSection = "experience";
        continue;
      }

      if (educationKeywords.some(keyword => lowerLine.includes(keyword))) {
        currentSection = "education";
        continue;
      }

      // Parse content based on current section
      if (currentSection === "skills") {
        const skillsLine = line.replace(/[•·-]/g, ",").split(/[,|;]/);
        skillsLine.forEach(skill => {
          const cleanSkill = skill.trim();
          if (cleanSkill.length > 1 && cleanSkill.length < 30) {
            parsed.skills.push(cleanSkill);
          }
        });
      }

      if (currentSection === "experience") {
        // Look for job title and company patterns
        if (line.includes("-") || line.includes("@") || line.includes("at")) {
          if (currentExperience) {
            parsed.experience.push(currentExperience as ParsedResume['experience'][0]);
          }
          currentExperience = {
            title: "",
            company: "",
            duration: "",
            description: "",
            technologies: [],
          };

          // Parse job title and company
          const parts = line.split(/[-@]|\bat\b/);
          if (parts.length >= 2 && currentExperience) {
            currentExperience.title = parts[0]?.trim() ?? "";
            currentExperience.company = parts[1]?.trim() ?? "";
          }

          // Look for duration in next few lines
          for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
            const nextLine = lines[j];
            if (nextLine && /\b(19|20)\d{2}\b/.exec(nextLine)) {
              currentExperience.duration = nextLine.trim();
              break;
            }
          }
        }

        // Add description to current experience
        if (currentExperience && !line.includes("-") && !line.includes("@")) {
          currentExperience.description = (currentExperience.description ?? "") + line + " ";
        }
      }

      if (currentSection === "education") {
        if (line.includes("University") || line.includes("College") || line.includes("School")) {
          if (currentEducation) {
            parsed.education.push(currentEducation as ParsedResume['education'][0]);
          }
          currentEducation = {
            degree: "",
            university: "",
            year: "",
            gpa: "",
          };

          // Extract university name
          currentEducation.university = line.trim();

          // Look for degree in previous line
          if (i > 0) {
            const prevLine = lines[i - 1];
            if (prevLine && (prevLine.includes("Bachelor") || prevLine.includes("Master") || prevLine.includes("PhD") || prevLine.includes("Degree"))) {
              currentEducation.degree = prevLine.trim();
            }
          }

          // Look for year
          const yearMatch = /\b(19|20)\d{2}\b/.exec(line);
          if (yearMatch && currentEducation) {
            currentEducation.year = yearMatch[0];
          }
        }
      }
    }

    // Add final items
    if (currentExperience) {
      parsed.experience.push(currentExperience as ParsedResume['experience'][0]);
    }
    if (currentEducation) {
      parsed.education.push(currentEducation as ParsedResume['education'][0]);
    }

    // Remove duplicates from skills
    parsed.skills = [...new Set(parsed.skills)];

    return parsed;
  }

  /**
   * Main parsing function
   */
  static async parseResume(buffer: Buffer, mimeType: string): Promise<ParsedResume> {
    try {
      // Extract text from file
      const text = await this.extractText(buffer, mimeType);
      
      // Parse structured data
      const parsed = this.parseResumeText(text);
      
      return parsed;
    } catch (error) {
      throw new Error(`Resume parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}