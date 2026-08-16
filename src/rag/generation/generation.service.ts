import { Injectable, Logger } from '@nestjs/common';
import { createLlmProvider, LlmProvider } from './llm-provider';
import { RetrievedChunk } from '../retrieval/retrieval.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerationResult {
  answer: string;
  usedChunks: RetrievedChunk[];
  hadContext: boolean;
}

const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_CHARS = 4000;

function truncateHistory(history: ChatMessage[]): ChatMessage[] {
  const recent = history.slice(-MAX_HISTORY_MESSAGES);
  let totalChars = 0;
  const kept: ChatMessage[] = [];
  for (let i = recent.length - 1; i >= 0; i--) {
    totalChars += recent[i].content.length;
    if (totalChars > MAX_HISTORY_CHARS) break;
    kept.unshift(recent[i]);
  }
  return kept;
}

const SYSTEM_PROMPT = `أنت مساعد افتراضي خبير يعمل ضمن نظام StockMate لإدارة مستودعات مستشفى الهلال الأحمر الطبي. دورك هو تدريب وإرشاد الموظفين الجدد بنفس أسلوب الموظف الأقدم الخبير عند شرح إجراء لزميل جديد.

قواعد صارمة يجب الالتزام بها دون استثناء:

1. أجب فقط بناءً على المعلومات الموجودة في "السياق" المرفق أدناه. لا تستخدم أي معرفة عامة لديك عن كيفية عمل أنظمة المستودعات أو ERP بشكل عام — النظام الذي تشرحه له تفاصيله الخاصة، وأي تخمين قد يكون خاطئاً وله عواقب حقيقية في بيئة طبية.

2. إذا لم يحتوِ السياق المرفق على معلومات كافية للإجابة على السؤال، يجب أن تقول بوضوح: "لا تتوفر لدي معلومات كافية حول هذا الموضوع في الوثائق المتاحة حالياً. أنصحك بالتواصل مع مدير المستودع أو الدعم الفني للتأكد." لا تحاول تخمين إجابة معقولة الشكل — إجابة خاطئة أسوأ من عدم الإجابة.

3. عند الشرح، اتبع أسلوب الموظف الخبير الذي يدرب زميلاً جديداً: خطوات واضحة ومرقمة، ثم إن وُجد: الصلاحيات المطلوبة، سير الموافقة، قواعد التحقق، وإجراءات ذات صلة.

4. لا تخترع أسماء أزرار، روابط، حقول، أو أي تفاصيل غير موجودة صراحة في السياق المرفق. إذا لم يذكر السياق تفصيلاً معيناً، لا تفترض وجوده ولا تخترعه — تجاهله ببساطة ولا تذكره في إجابتك. كل جملة في إجابتك يجب أن تكون قابلة للربط مباشرة بجملة موجودة في السياق المرفق.

5. لا تُضِف تفاصيل توضيحية أو أمثلة "منطقية" من عندك لملء الفراغات، حتى لو بدت مفيدة. الدقة الحرفية أهم من اكتمال الشرح — إجابة أقصر وصحيحة أفضل من إجابة أطول تحتوي تفاصيل غير مؤكدة.

6. مهم جداً: إذا كان السياق المرفق يحتوي على مقاطع من أكثر من إجراء أو ميزة مختلفة، لا تدمجها في إجابة واحدة متماسكة كأنها خطوات لعملية واحدة. أجب فقط باستخدام المقاطع الأكثر صلة بسؤال الموظف تحديداً، أو اطلب توضيحاً بدلاً من دمج إجراءات مختلفة معاً.

7. تنبيه حاسم بخصوص أسئلة "نعم/لا": إذا لم يذكر السياق رقماً أو حقيقة صريحة تؤكد الإجابة، لا تستنتج "نعم" أو "لا" من قاعدة أو شرط عام مذكور في السياق. وضّح للموظف أن السياق يذكر القاعدة العامة فقط دون بيانات فعلية كافية، وانصحه بالتحقق عبر النظام أو مدير المستودع.

8. أجب دائماً باللغة العربية، بأسلوب مباشر ومهني، دون عبارات ختامية عامة — أنهِ الإجابة عند اكتمال المعلومة المطلوبة مباشرة.`;

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);
  private readonly provider: LlmProvider;

  constructor() {
    this.provider = createLlmProvider();
    this.logger.log(
      `GenerationService using provider: ${process.env.LLM_PROVIDER ?? 'openrouter'}`,
    );
  }

  async rewriteQueryWithHistory(
    currentQuestion: string,
    history: ChatMessage[],
  ): Promise<string> {
    if (history.length === 0) {
      return currentQuestion;
    }

    const truncated = truncateHistory(history);
    const historyText = truncated
      .map((m) => `${m.role === 'user' ? 'الموظف' : 'المساعد'}: ${m.content}`)
      .join('\n');

    const rewritePrompt = `فيما يلي سجل محادثة بين موظف ومساعد ذكي. أعد صياغة "السؤال الحالي" ليصبح سؤالاً مستقلاً وواضحاً بذاته. استبدل أي إشارات غامضة مثل "هذا" أو "ذلك الشيء" بالاسم الصريح المذكور سابقاً في المحادثة.

مهم جداً: أعد فقط السؤال المعاد صياغته، دون أي شرح أو مقدمة.

سجل المحادثة:
${historyText}

السؤال الحالي: ${currentQuestion}

السؤال المعاد صياغته:`;

    let rewritten: string;
    try {
      const raw = await this.provider.complete(rewritePrompt, 0.1);
      rewritten = raw.trim();
    } catch (err) {
      this.logger.warn(
        `Query rewrite failed (${(err as Error).message}), using original question as-is.`,
      );
      return currentQuestion;
    }

    this.logger.debug(`Rewrote "${currentQuestion}" -> "${rewritten}"`);
    return rewritten || currentQuestion;
  }

  private buildContextBlock(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) {
      return '(لا يوجد سياق متاح — لم يتم العثور على معلومات ذات صلة بالسؤال)';
    }

    return chunks
      .map((c, i) => `[مصدر ${i + 1}: ${c.sectionHeading}]\n${c.content}`)
      .join('\n\n---\n\n');
  }

  async generateAnswer(
    userQuestion: string,
    retrievedChunks: RetrievedChunk[],
    history: ChatMessage[] = [],
  ): Promise<GenerationResult> {
    const hadContext = retrievedChunks.length > 0;
    const contextBlock = this.buildContextBlock(retrievedChunks);
    const userMessage = `السياق المتاح:\n\n${contextBlock}\n\n---\n\nسؤال الموظف: ${userQuestion}`;

    this.logger.debug(
      `Generating answer for "${userQuestion}" with ${retrievedChunks.length} chunk(s), ${history.length} prior message(s)`,
    );

    const truncatedHistory = truncateHistory(history);
    const answer = await this.provider.chat(
      SYSTEM_PROMPT,
      [...truncatedHistory, { role: 'user', content: userMessage }],
      0.1,
    );

    return { answer, usedChunks: retrievedChunks, hadContext };
  }
}
