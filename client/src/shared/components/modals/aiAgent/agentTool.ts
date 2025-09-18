import {
  FeatureExtractionPipeline,
  pipeline,
  TextGenerationPipeline,
} from "@xenova/transformers";
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import { Accessor } from "solid-js";
import { useDnDBackgrounds } from "../../../customHooks/dndInfo/info/all/backgrounds";
import { useDnDClasses } from "../../../customHooks/dndInfo/info/all/classes";
import { useDnDFeats } from "../../../customHooks/dndInfo/info/all/feats";
import { useDnDItems } from "../../../customHooks/dndInfo/info/all/items";
import { useDnDMasteries } from "../../../customHooks/dndInfo/info/all/masteries";
import { useDnDRaces } from "../../../customHooks/dndInfo/info/all/races";
import { useDnDSubraces } from "../../../customHooks/dndInfo/info/all/subraces";
import { useDnDSubclasses } from "../../../customHooks/dndInfo/info/all/subclasses";
import { useDnDSpells } from "../../../customHooks/dndInfo/info/all/spells";
import {
  Background,
  Item,
  Spell,
  Class5E,
  Subclass,
  Feat,
  WeaponMastery,
  Race,
  Subrace,
  ItemType,
} from "../../../../models/data";

interface AIKnowledgeData {
  kind: string; // Category (Spell, Class, etc.)
  text: string; // Serialized text for the knowledge item
  embedding: number[]; // Numeric vector
}

export class AgentTool {
  private mlcEngine: MLCEngine | null = null;
  private genPipeline: TextGenerationPipeline | null = null;
  private embeddingPipeline: FeatureExtractionPipeline | null = null;
  private model: string = "";
  private started = false;

  private knowledgeBase: AIKnowledgeData[] = [];

  private backgrounds: Accessor<Background[]>;
  private classes: Accessor<Class5E[]>;
  private feats: Accessor<Feat[]>;
  private items: Accessor<Item[]>;
  private masteries: Accessor<WeaponMastery[]>;
  private races: Accessor<Race[]>;
  private subraces: Accessor<Subrace[]>;
  private subclasses: Accessor<Subclass[]>;
  private spells: Accessor<Spell[]>;

  constructor(model: string) {
    this.model = model;
    this.backgrounds = useDnDBackgrounds();
    this.classes = useDnDClasses();
    this.feats = useDnDFeats();
    this.items = useDnDItems();
    this.masteries = useDnDMasteries();
    this.races = useDnDRaces();
    this.subraces = useDnDSubraces();
    this.subclasses = useDnDSubclasses();
    this.spells = useDnDSpells();
  }

  // Initialize required pipelines (idempotent)
  public async start() {
    if (this.started) return;
    const initProgress = ({ progress }: { progress: number }) => {
      console.log(`Model loading progress: ${progress}`);
    };
    this.mlcEngine = await CreateMLCEngine(this.model, {
      initProgressCallback: initProgress,
    });
    this.genPipeline = await pipeline("text-generation", this.model);
    // Separate well-known sentence embedding model
    this.embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    this.started = true;
  }

  // Bulk build knowledge base from all datasets
  public async buildAllKnowledge() {
    if (!this.started)
      throw new Error("AgentTool not started. Call start() first.");
    await Promise.all([
      this.buildKnowledgeBase(this.backgrounds(), "Background", (b) =>
        `${b.name}: ${b.desc} : ${b.features?.map(f => `${f.name} | ${f.description}`).join(", ")} : ${b.feat}`
      ),
      this.buildKnowledgeBase(this.classes(), "Class", (c) =>
        `${c.name} : ${this.subclasses()?.filter(x=>x.parent_class === c.name)?.map(sc => sc.name).join(", ")} : ${c.proficiencies.weapons.join(", ")} : ${c.proficiencies.armor.join(", ")} : ${c.proficiencies.tools.join(", ")} : ${c.saving_throws.join(", ")} : ${c.hit_die}`
      ),
      this.buildKnowledgeBase(this.subclasses(), "Subclass", (s) =>
        `${s.name}: ${s.description} : ${Object.keys(s.features).map(x=>s.features?.[+x])?.flatMap(x=>x).map(f => `${f.name} | ${f.description}`).join(", ")}`
      ),
      this.buildKnowledgeBase(this.feats(), "Feat", (f) => 
        `${f.details.name}: ${f.details.description}`
      ),
      this.buildKnowledgeBase(this.items(), "Item", (i) => 
        `${i.name}: ${i.desc} : ${ItemType[i.type]} : ${i.weight} : ${i.cost}`),
      this.buildKnowledgeBase(this.masteries(), "WeaponMastery", (m) =>
        `${m.name}: ${m.mastery} : ${m.damage}`
      ),
      // Race / Subrace / Spell adapted to actual model definitions
      this.buildKnowledgeBase(this.races(), "Race", (r) => {
        const langs = r.languages?.join(", ") || "";
        const abilities = r.abilityBonuses?.map(a => `${a.stat}+${a.value}`).join(" ") || "";
        const traits = r.traits?.map(t => t.details.name).join(", ") || "";
        const desc = r.descriptions ? Object.values(r.descriptions).join(" ") : "";
        return `${r.name} | Size: ${r.size} | Speed: ${r.speed} | Languages: ${langs} | Ability Bonuses: ${abilities} | Traits: ${traits} | ${desc}`;
      }),
      this.buildKnowledgeBase(this.subraces(), "Subrace", (sr) => {
        const langs = sr.languages?.join(", ") || "";
        const abilities = sr.abilityBonuses?.map(a => `${a.stat}+${a.value}`).join(" ") || "";
        const traits = sr.traits?.map(t => t.details.name).join(", ") || "";
        const desc = sr.descriptions ? Object.values(sr.descriptions).join(" ") : "";
        return `${sr.name} (Parent: ${sr.parentRace}) | Size: ${sr.size} | Speed: ${sr.speed} | Languages: ${langs} | Ability Bonuses: ${abilities} | Traits: ${traits} | ${desc}`;
      }),
      this.buildKnowledgeBase(this.spells(), "Spell", (sp) => {
        const cls = sp.classes?.join(", ") || "";
        const subcls = sp.subClasses?.join(", ") || "";
        // components is a single string in model; keep as-is
        return `${sp.name} | Level ${sp.level} ${sp.school} | Casting Time: ${sp.castingTime} | Range: ${sp.range} | Duration: ${sp.duration} | Concentration: ${sp.is_concentration} | Ritual: ${sp.is_ritual} | Components: ${sp.components} | Classes: ${cls} | Subclasses: ${subcls} | ${sp.description}`;
      }),
    ]);
  }

  // Return snapshot
  public getKnowledge(): AIKnowledgeData[] {
    return [...this.knowledgeBase];
  }

  // Generate text continuation or answer from the model
  public async generateText(prompt: string, options?: { maxNewTokens?: number, temperature?: number }): Promise<string> {
    if (!this.started || !this.genPipeline) {
      throw new Error("AgentTool not started or generation pipeline not available.");
    }
    const generationOpts = { max_new_tokens: options?.maxNewTokens ?? 200, temperature: options?.temperature ?? 0.7 };
    // Cast to any because @xenova/transformers typing for pipeline returns a broad union
    const result: any = await this.genPipeline(prompt, generationOpts);
    // The pipeline returns an array of generated results (objects or strings)
    let text: string;
    if (Array.isArray(result)) {
        if (typeof result[0] === 'string') {
          text = result[0];
        } else if (result[0] && typeof (result[0] as any).generated_text !== 'undefined') {
          // Some model bindings may return object where generated_text can be a string or structured Chat object.
          const generated = (result[0] as any).generated_text;
          text = typeof generated === 'string' ? generated : JSON.stringify(generated);
        } else {
          text = String(result[0]);
        }
    } else {
        text = typeof result === 'string' ? result : JSON.stringify(result);
    }
    return text;
  }


  public async searchKnowledge(
    query: string,
    topK: number = 5
  ): Promise<AIKnowledgeData[]> {
    if (!this.started || !this.embeddingPipeline) {
      throw new Error(
        "AgentTool not started or embedding pipeline not available."
      );
    }
    // Compute embedding for the query text (normalized, same as knowledge)
  const output: any = await this.embeddingPipeline(query, {
      pooling: "mean",
      normalize: true,
    });
  // Different versions of @xenova/transformers may return either a Tensor, a plain array, or an object with `embeddings` / `data`.
  let raw: any = (output && (output.embeddings ?? output.data)) ?? output;
  if (raw && raw.data) raw = raw.data; // nested tensor case
    const queryEmbedding = Array.isArray(raw)
      ? raw.map(Number)
      : Array.from(raw as Float32Array);

    // Calculate similarity with each knowledge entry
    const scoredEntries = this.knowledgeBase.map((entry) => {
      // dot product since vectors are normalized
      const score = entry.embedding.reduce(
        (sum, val, i) => sum + val * queryEmbedding[i],
        0
      );
      return { entry, score };
    });
    // Sort by highest similarity score and return the top K entries
    scoredEntries.sort((a, b) => b.score - a.score);
    return scoredEntries.slice(0, topK).map(({ entry }) => entry);
  }

  // Generic ingestion & embedding
  private async buildKnowledgeBase<T>(
    data: T[],
    kind: string,
    toKnowledge: (item: T) => string
  ) {
    if (!this.embeddingPipeline) return;
    for (const dataItem of data) {
      const text = `${kind}: ${toKnowledge(dataItem)}`;
      const output: any = await (this.embeddingPipeline as any)(text, {
        pooling: "mean",
        normalize: true,
      });
      let raw: any = output?.embeddings ?? output;
      if (raw && raw.data) raw = raw.data; // tensor-like -> raw array
      const embedding = Array.isArray(raw)
        ? raw.map(Number)
        : Array.from(raw as Float32Array);
      this.knowledgeBase.push({ kind, text, embedding });
    }
  }
}
