# anima

**Anima Lab** — site pédagogique sur l'animation web. 25 leçons manipulables en trois
familles : socle natif, GSAP, shaders.

## Sources de vérité

| Fichier | Contenu |
|---|---|
| `design/spec-technique-anima-lab.md` | spécification fonctionnelle et technique — le comportement attendu, le plan en 8 lots, la définition du « terminé » |
| `design/handoff_anima_lab/` | maquettes — l'apparence |
| `.reap/genome/application.md` | identité, architecture, stack, conventions, contraintes (auto-importé) |
| `.reap/genome/invariants.md` | interdits absolus (auto-importé) |
| `.reap/environment/source-map.md` | rôle de chaque module — **à lire avant de toucher au code** |

## Le principe qui gouverne tout

**Une leçon est une donnée, pas un composant.** Le shell lit un descripteur et construit
l'écran. Le code spécifique à une leçon se limite à sa fonction d'animation. Si tu écris
du JSX sur mesure pour poser un contrôle, tu es en train de casser l'architecture.

> **À faire à l'issue du lot 1** (spec §0.3) : compléter ce fichier avec les conventions de
> nommage effectives, la structure de dossiers réelle, les commandes utiles et la
> **procédure exacte pour ajouter une leçon**. C'est ce qui évitera la dérive sur les 24
> leçons suivantes.

<!-- reap:start e20588a0 -->

## REAP

This project uses REAP (Recursive Evolutionary Autonomous Pipeline).
All work must follow genome principles.

### Knowledge Loading

REAP knowledge is loaded in two layers:

1. **Static knowledge** (genome, environment, vision, memory, reap-guide) is auto-loaded by Claude Code via the `@` import references below — no hook required.
2. **Dynamic context** (current generation state, strict mode, language directive) is injected by the SessionStart hook (`reap load-context`).

If dynamic context was lost (e.g. after a context compaction), re-run the hook:
```
/reap.knowledge reload
```

### Static Knowledge (auto-imported)

@~/.reap/reap-guide.md
@.reap/genome/application.md
@.reap/genome/evolution.md
@.reap/genome/invariants.md
@.reap/environment/summary.md
@.reap/vision/goals.md
@.reap/vision/memory/longterm.md
@.reap/vision/memory/midterm.md
@.reap/vision/memory/shortterm.md

### Termination Paths

Generation은 세 가지 방식으로 종료할 수 있다:
- `/reap.abort` — 실패/취소. life/ 삭제, lineage 미기록.
- `/reap.early-close` — 부분 완료. lineage에 보존(`status: partial`), 미완 task는 자동 backlog 승계. implementation/validation에서만 호출 가능.
- 정식 completion — validation 후 자연 흐름.

사용자가 "중단/포기/스코프 축소" 의도를 표명하면 agent는 위 세 선택지를 안내하고 사용자가 선택하게 한다.

### Agent

When delegating a generation to a subagent, use `subagent_type: "reap-evolve"`. Dynamic context (generation state, vision, memory) is passed via prompt parameters.
<!-- reap:end -->
