# AccessCrafter: Authoring Transferable, Task-Aware Cognitive Support Strategies for Previously Unseen Web Interfaces

This is the original research proposal for AccessCrafter — the motivation and
related-work grounding behind the design decisions in
[`architecture.md`](architecture.md). It predates the implementation and is
kept here as the canonical rationale document; the condensed, code-facing
summary lives in the [README](../README.md).

## Abstract

People who experience the same cognitive difficulty may rely on different
strategies to complete a web task. Existing personalization systems can
support different cognitive strategies, but those strategies are often
anticipated by system designers or tied to interfaces known in advance. In
practice, users move across independently developed webpages that designers
cannot anticipate, and support created for one interface may not be reusable
elsewhere. We introduce AccessCrafter, a system that enables users to author
transferable, task-aware cognitive support while interacting with previously
unseen webpages. Users describe a task-specific difficulty, confirm the
system's interpretation, and select or describe a form of support that they
can further customize. AccessCrafter grounds the resulting strategy in the
webpage's semantic structure and task state while representing its underlying
intent and task dependencies separately from its webpage-specific
implementation. When users encounter an analogous interface, AccessCrafter
identifies corresponding semantic structures and task states and uses the
saved strategy representation to propose a reconstructed version, which users
can preview, refine, approve, or reject.

## Introduction

People frequently use web interfaces to complete cognitively demanding tasks
such as submitting applications, comparing products, managing information,
and completing multi-step forms. These tasks can require users to maintain
context, understand requirements, track progress, identify unresolved
information, and recover after interruptions. Although these demands can
affect anyone, they can create substantial barriers for people with cognitive
accessibility needs. Moreover, people who experience the same general
difficulty may rely on substantially different strategies. While completing
a long application, one person may prefer a persistent checklist of
unresolved requirements, while another may only want a progress indicator
showing how much of the application remains.

Current interface-personalization systems can help users by adjusting
presentation, reorganizing content, or providing accessibility support such
as highlighting important information. Some systems also allow users to
select or configure different cognitive support strategies. However, the
available strategies and the interfaces in which they operate are often
anticipated during system design. Developers determine which interfaces or
interface components the system supports, which properties can change, and
which behaviors it can provide.

This assumption is especially limiting because users move across a wide
variety of independently developed webpages, and developers cannot know in
advance which interfaces they will encounter or where accessibility barriers
may arise. A support strategy available in one application may therefore be
unavailable on the next. When support remains tied to the interface in which
it was created, users may need to repeatedly recreate strategies that already
work for them, introducing additional effort and disrupting continuity in
personalized support as they move across the web.

Recent generative systems broaden what can be changed by allowing interface
or accessibility modifications to be created from natural-language requests.
Some generate open-ended modifications to previously unseen interfaces, while
others support dynamic, task-aware behaviors within applications that the
system created or already understands. These approaches demonstrate that
generative models can expand both the range of available support and the
environments in which support can be created.

Nevertheless, existing approaches generally address only part of the problem.
Support created for a previously unseen interface is often static or remains
bound to the particular elements and context in which it was authored.
Conversely, systems that support dynamic, task-aware behaviors typically
operate within known or system-generated applications. Because the strategy's
underlying intent and task dependencies are not represented separately from
its webpage-specific implementation, the support cannot readily be
reconstructed when the user encounters an analogous interface. Consequently,
users lack a way to author a preferred cognitive support strategy on an
unseen webpage, have that strategy respond to changing task state, and reuse
it across newly encountered interfaces.

We introduce AccessCrafter, a system for authoring and transferring dynamic,
task-state-aware cognitive support strategies across previously unseen web
interfaces. While completing a web task, users describe a difficulty they
are experiencing. AccessCrafter interprets that difficulty in relation to the
webpage and task, asks the user to confirm or refine its interpretation, and
then suggests relevant strategies or allows the user to describe a preferred
form of support. Users can configure, preview, and refine the support before
approving it.

AccessCrafter grounds the approved support in the current webpage's semantic
structure and evolving task state while maintaining a separate representation
of the strategy's underlying intent and task dependencies. When the user
encounters an analogous interface, the system interprets the new webpage,
identifies corresponding elements and task structures, and proposes a
reconstructed version of the support using the new context. This separation
allows the strategy to be reused without directly copying its original
webpage-specific implementation, while still allowing the user to inspect,
revise, approve, or reject the proposed reconstruction.

The contributions of this work are:

- **End-user authoring of dynamic, task-state-aware support for previously
  unseen web interfaces.** AccessCrafter enables users to create support on
  independently developed webpages that were not known to or prepared by the
  system designer in advance, grounding user-authored strategies in the
  webpage's semantic structure and evolving task state.
- **Semantic separation, transfer, and reuse of user-authored support
  strategies across interfaces.** AccessCrafter separates a strategy's
  underlying intent and task dependencies from its webpage-specific
  implementation, allowing the support to be reconstructed using analogous
  elements and task structures in newly encountered interfaces.

## Related Work

AccessCrafter builds on research in interface personalization,
cognitive-accessibility support, generative interface modification, and
end-user authoring. Across these areas, prior work has expanded either the
adaptations that systems can provide or the environments in which
adaptations can be generated. Many systems support different strategies or
configurations, but those strategies are often anticipated during design or
tied to interfaces known in advance. AccessCrafter brings these directions
together by supporting user-authored, task-state-aware strategies whose
intent and task dependencies can be separated from their webpage-specific
implementations and reused across unseen interfaces.

### Interface Personalization and Accessibility Adaptation

Interface-personalization systems differ in how responsibility for
adaptation is divided among users, systems, and developers. User-driven
systems such as PageTailor, the Two-Interface Model, and UIFlex allow people
to modify properties such as the size, position, visibility, or organization
of interface elements. System-driven approaches instead use models of the
user, task, device, or interaction context to select an interface
configuration. MyUI, for example, adapts applications using information
about devices, tasks, preferences, application constraints, interaction
history, and context. Collaborative systems such as MICA and WiSel
distribute control through recommendations, user selections, and iterative
refinement.

Accessibility-oriented personalization extends these approaches by
incorporating users' abilities and accessibility requirements. SUPPLE and
SUPPLE++ formulate accessible interface generation as an optimization
problem over predefined interaction techniques and interface configurations.
These systems use information about the user and device, together with
estimates of interaction effort, to select an appropriate interface. ABD-MT
similarly models users' abilities at runtime and connects those models to
developer-authored adaptations, helping developers construct applications
that respond to changes in users' situated abilities over time.

Together, these systems demonstrate that personalization can account for
differences among users, abilities, tasks, devices, and interaction
contexts. They may also offer multiple adaptations or allow users to
configure how support is applied. However, their adaptation spaces and
supported interfaces are generally established by developers. Users cannot
necessarily author support for an independently developed interface outside
that predefined space. Because developers cannot anticipate every interface
users will encounter, this assumption limits where personalized support can
be created and used.

### Cognitive-Accessibility Support Strategies

Cognitive-accessibility systems often provide support beyond adjustments to
visual presentation by helping users regulate attention, understand
information, maintain context, or track progress. AttentionGuard estimates
learners' attention state from interaction behavior and applies interface
interventions intended to support attention regulation. EasyReading provides
configurable tools for modifying and annotating web content or presenting it
through alternative representations. DysWebxia explores reading support
through changes to wording and presentation, while AdaptForge enables
adaptations to be configured around particular accessibility needs.

This work demonstrates that cognitive accessibility may require different
strategies for how information is organized, presented, or surfaced during
interaction. Users may select or configure strategies that fit their needs,
but the available strategies and the interfaces in which they operate are
generally anticipated during system design. These systems therefore do not
necessarily support authoring a substantially different task-level strategy
on an independently developed webpage or reusing that strategy in another
interface.

### Generative Modification of Unseen Interfaces

Generative systems broaden both the range of possible adaptations and the
environments that can be modified. SituationAdapt uses contextual
information to adapt mixed-reality environments according to the user's
current situation, although the system determines which modifications to
apply. SonoCraftAR allows deaf and hard-of-hearing users to describe and
generate dynamic, sound-aware interfaces grounded in the surrounding
environment, expanding authoring beyond a fixed catalog of visualizations.

RAVEN and its predecessor, SceneGenA11y, use generative models to interpret
accessibility requests and modify previously unseen three-dimensional
environments at runtime. Related work by Wu et al. similarly allows users to
describe open-ended changes to previously unseen webpages, demonstrating
that natural-language requests can be grounded in interfaces that were not
explicitly prepared for personalization.

Collectively, these systems demonstrate how generative models can expand the
range of adaptations available to users and support context-specific
modifications that would be difficult to anticipate through a fixed catalog
of developer-authored adaptations. This is valuable because developers
cannot know in advance which websites or environments users will encounter.
However, the resulting modifications are typically bound to the semantic
structure, elements, and context of the environment in which they were
created. Because the underlying support strategy is not represented
separately from that environment-specific implementation, users may need to
recreate similar support in each new context.

### Authoring Task-Aware Interface Behaviors

Other systems support dynamic interface behavior within ongoing tasks. ReLay
explores intent-responsive adaptation during online browsing as users shift
between exploratory browsing and focused comparison. Its study identifies
design considerations for balancing adaptive automation with user awareness
and control. However, ReLay infers when and how to adapt the interface
rather than allowing users to author new support behaviors.

Sreedhar et al. instead use a conversationally customizable email system to
investigate how users author and refine functionality within an everyday
productivity tool. Users can restructure categories, introduce interface
elements, and create workflow behaviors through natural language. Their
design probe found that participants commonly adapted existing patterns to
fit their workflows and relied on ongoing oversight and refinement to manage
uncertain or mis-specified behavior. Jelly similarly supports the
natural-language construction and iterative revision of task-oriented
interfaces within a system-generated environment.

Together, these systems demonstrate the value of dynamic adaptation and
conversational authoring for task-aware interfaces. However, ReLay focuses
on intent-responsive adaptation within a predefined online-shopping context
and infers when and how the interface should change rather than allowing
users to author new support behaviors. Sreedhar et al. and Jelly support
end-user authoring, but within a known productivity application or a
system-generated interface. Across these approaches, none addresses how a
user-authored cognitive support strategy can be separated from its initial
interface-specific implementation and reconstructed across independently
developed webpages.

AccessCrafter builds on these directions by allowing users to author dynamic
cognitive support on independently developed webpages that were not known to
the system in advance. It further separates each strategy's underlying
intent and task dependencies from its webpage-specific implementation,
allowing the support to be reused and reconstructed across newly encountered
interfaces rather than remaining tied to the context in which it was first
authored.
