// Hand-maintained TS types mirroring shared/schemas/*.json.
// Keep these in sync manually when a schema changes -- see shared/schemas/
// for the source of truth and docs/architecture.md for the full contract.

export type ComponentState = {
  status: 'empty' | 'partial' | 'complete' | 'error' | 'n/a';
  details?: string;
  lastUpdated?: string;
};

export type ComponentRelationship = {
  targetComponentId: string;
  type: 'part-of' | 'depends-on' | 'precedes' | 'sibling-of';
  description?: string;
};

export type PageComponent = {
  componentId: string;
  semanticRole: string;
  label?: string;
  description: string;
  domSelector?: string;
  state: ComponentState;
  relationships: ComponentRelationship[];
};

export type PageModel = {
  modelId: string;
  url: string;
  capturedAt: string;
  pageTitle: string;
  pagePurpose: string;
  taskType: string;
  components: PageComponent[];
};

// Pruned, accessibility-tree-like DOM snapshot sent to POST /model-page.
export type DomSnapshotNode = {
  tag: string;
  role?: string;
  accessibleName?: string;
  text?: string;
  selector: string;
  visible: boolean;
  children: DomSnapshotNode[];
};

export type DomSnapshot = {
  nodeCount: number;
  root: DomSnapshotNode;
};

export type ModelPageRequest = {
  url: string;
  pageTitle: string;
  domSnapshot: DomSnapshot;
};
