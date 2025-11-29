const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
require("dotenv").config();

// Configuration
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL =
  process.env.GEMINI_MODEL || "gemini-2.0-flash"; // 2.5-proは未リリースの可能性があるため、動作確認済みのモデルまたは環境変数に従う
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const ROOT_DIR = path.join(__dirname, "..");
const BLOG_DIR = path.join(ROOT_DIR, "content", "blog");

// Validate API Key
if (!API_KEY) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "Error: GEMINI_API_KEY is not set.",
  );
  console.error(
    "Please set the GEMINI_API_KEY environment variable.",
  );
  console.error("Example: export GEMINI_API_KEY=AIza...");
  process.exit(1);
}

async function translateText(text, context = "") {
  if (!text) return "";

  const systemPrompt = `You are a professional technical translator.
Translate the following Japanese text to English for a technical blog.
Maintain the original Markdown formatting, code blocks, and links perfectly.
Ensure technical terms are translated accurately in the context of software engineering (Unity, UE5, Web, etc.).
Do not translate the file path in the image link.
${context ? `Context: ${context}` : ""}
`;

  const requestBody = {
    system_instruction: {
      parts: { text: systemPrompt },
    },
    contents: [
      {
        role: "user",
        parts: [{ text: text }],
      },
    ],
    // 修正箇所: セーフティ設定を追加し、誤検知による停止を防ぐ
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_NONE",
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_NONE",
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192, // 修正箇所: 長文での途中切れを防ぐため十分なトークン数を確保
    },
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `API Error: ${response.status} - ${JSON.stringify(error)}`,
      );
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]) {
      console.warn(
        "Unexpected response format:",
        JSON.stringify(data),
      );
      throw new Error(
        "Failed to parse Gemini response: No candidates found",
      );
    }

    const candidate = data.candidates[0];

    // 修正箇所: 終了理由を確認し、正常終了でない場合は警告を出す
    if (
      candidate.finishReason &&
      candidate.finishReason !== "STOP"
    ) {
      console.warn(
        `\x1b[33mWarning: Translation stopped early. Reason: ${candidate.finishReason}\x1b[0m`,
      );
      // SAFETY等の理由でコンテンツが空の場合はエラーとする
      if (
        !candidate.content ||
        !candidate.content.parts ||
        !candidate.content.parts[0].text
      ) {
        throw new Error(
          `Generation blocked due to: ${candidate.finishReason}`,
        );
      }
    }

    if (
      !candidate.content ||
      !candidate.content.parts ||
      !candidate.content.parts[0].text
    ) {
      throw new Error(
        "Failed to parse Gemini response: No text content",
      );
    }

    return candidate.content.parts[0].text.trim();
  } catch (error) {
    console.error("Translation failed:", error);
    throw error;
  }
}

async function processFile(filePath) {
  const fileName = path.basename(filePath);
  const id = path.basename(filePath, ".md");
  const enFilePath = path.join(BLOG_DIR, `${id}.en.md`);

  if (fs.existsSync(enFilePath)) {
    console.log(
      `Skipping ${fileName}: English version already exists.`,
    );
    return;
  }

  console.log(`Processing ${fileName}...`);
  const content = fs.readFileSync(filePath, "utf8");
  const { data: frontmatter, content: markdownBody } =
    matter(content);

  try {
    // 1. Translate Frontmatter
    console.log(`  - Translating metadata...`);
    const translatedTitle = await translateText(
      frontmatter.title,
      "Title of the blog post",
    );
    const translatedDesc = await translateText(
      frontmatter.description,
      "Description of the blog post",
    );

    let translatedCategory = frontmatter.category;
    if (
      /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(
        translatedCategory,
      )
    ) {
      translatedCategory = await translateText(
        translatedCategory,
        "Category name",
      );
    }

    // Tags
    let translatedTags = [];
    if (Array.isArray(frontmatter.tags)) {
      for (const tag of frontmatter.tags) {
        // Skip translation for simple ASCII tags, translate others
        if (
          /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(
            tag,
          )
        ) {
          translatedTags.push(
            await translateText(tag, "Tag"),
          );
        } else {
          translatedTags.push(tag);
        }
      }
    }

    // 2. Translate Body
    console.log(`  - Translating body...`);
    const translatedBody = await translateText(
      markdownBody,
      "Main content of the blog post in Markdown format",
    );

    // 3. Construct new Frontmatter
    const newFrontmatter = {
      ...frontmatter,
      title: translatedTitle,
      description: translatedDesc,
      category: translatedCategory,
      tags: translatedTags,
    };

    // 4. Write file
    const newContent = matter.stringify(
      translatedBody,
      newFrontmatter,
    );
    fs.writeFileSync(enFilePath, newContent, "utf8");
    console.log(`\x1b[32mCreated ${id}.en.md\x1b[0m`);
  } catch (error) {
    console.error(
      `\x1b[31mFailed to process ${fileName}:\x1b[0m`,
      error.message,
    );
    // エラー時に中途半端なファイルを残さないため、必要であれば削除処理を追加することも検討できますが、
    // ここではエラーログの表示にとどめます。
  }
}

async function main() {
  const targetId = process.argv[2];

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter(
      (f) => f.endsWith(".md") && !f.endsWith(".en.md"),
    );

  if (targetId) {
    const targetFile = files.find(
      (f) => f === `${targetId}.md` || f === targetId,
    );
    if (targetFile) {
      await processFile(path.join(BLOG_DIR, targetFile));
    } else {
      console.error(`File not found: ${targetId}`);
    }
  } else {
    console.log(`Found ${files.length} Japanese articles.`);
    for (const file of files) {
      await processFile(path.join(BLOG_DIR, file));
    }
  }
}

main().catch(console.error);
